package com.aistudio.alpha1

import android.app.Activity
import android.app.ActivityManager
import android.app.DownloadManager
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.StatFs
import android.provider.OpenableColumns
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import com.tensai.llamakt.ChatMessage
import com.tensai.llamakt.LlamaEngine
import com.tensai.llamakt.LoadProgressCallback
import com.tensai.llamakt.SamplingParams
import com.tensai.llamakt.chat
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.Executors
import java.util.concurrent.CancellationException
import java.util.concurrent.atomic.AtomicBoolean

/** Private, on-device GGUF storage and llama.kt inference bridge. */
@CapacitorPlugin(name = "LocalLlm")
class LocalLlmPlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()
    @Volatile private var engine: LlamaEngine? = null
    @Volatile private var loadedFileName: String = ""
    private val activeImportFileNames = ConcurrentHashMap.newKeySet<String>()
    private val activeImportRequests = ConcurrentHashMap<String, AtomicBoolean>()
    private val maxImportedModelBytes = 8L * 1024L * 1024L * 1024L

    private fun modelDirectory(): File {
        val base = context.getExternalFilesDir(null) ?: context.filesDir
        return File(base, "models").apply { if (!exists()) mkdirs() }
    }

    private fun safeModelFile(name: String): File {
        require(name.matches(Regex("^[A-Za-z0-9._-]+[.]gguf$"))) { "Model dosya adı geçersiz." }
        val root = modelDirectory().canonicalFile
        val target = File(root, name).canonicalFile
        require(target.parentFile == root) { "Model yolu geçersiz." }
        return target
    }

    private fun partialModelFile(name: String): File {
        val target = safeModelFile(name)
        val partial = File(target.parentFile, target.name + ".part").canonicalFile
        require(partial.parentFile == target.parentFile) { "Model yolu geçersiz." }
        return partial
    }

    private fun downloadPreferences() =
        context.getSharedPreferences("aistudio_local_llm_downloads", Context.MODE_PRIVATE)

    private fun finalizeDownloadedModel(fileName: String) {
        val partial = partialModelFile(fileName)
        val destination = safeModelFile(fileName)
        if (destination.exists()) {
            partial.delete()
            return
        }
        if (!partial.isFile || partial.length() < 1024 * 1024) {
            throw IllegalStateException("İndirilen model dosyası eksik.")
        }
        RandomAccessFile(partial, "r").use { input ->
            val magic = ByteArray(4)
            input.readFully(magic)
            if (String(magic, Charsets.US_ASCII) != "GGUF") {
                throw IllegalStateException("İndirilen dosyanın GGUF başlığı geçersiz.")
            }
        }
        if (!partial.renameTo(destination)) {
            throw IllegalStateException("Model dosyası tamamlanmış konuma taşınamadı.")
        }
    }

    /** Reconcile downloads after app restart; only completed files get the .gguf extension. */
    private fun reconcileDownloads() {
        val preferences = downloadPreferences()
        val entries = preferences.all.toList()
        if (entries.isEmpty()) return
        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        for ((fileName, rawId) in entries) {
            val id = rawId as? Long ?: continue
            var cursor: Cursor? = null
            try {
                cursor = manager.query(DownloadManager.Query().setFilterById(id))
                if (cursor == null || !cursor.moveToFirst()) {
                    partialModelFile(fileName).delete()
                    preferences.edit().remove(fileName).apply()
                    continue
                }
                val index = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                if (index < 0) continue
                when (cursor.getInt(index)) {
                    DownloadManager.STATUS_SUCCESSFUL -> {
                        try { finalizeDownloadedModel(fileName) }
                        catch (_: Exception) { partialModelFile(fileName).delete() }
                        preferences.edit().remove(fileName).apply()
                    }
                    DownloadManager.STATUS_FAILED -> {
                        partialModelFile(fileName).delete()
                        preferences.edit().remove(fileName).apply()
                    }
                }
            } catch (_: Exception) {
                // Keep an active/paused download tracked; the next refresh can reconcile it.
            } finally {
                cursor?.close()
            }
        }
        val trackedNames = preferences.all.filterValues { it is Long }.keys
        modelDirectory().listFiles { file -> file.isFile && file.name.endsWith(".gguf.part", ignoreCase = true) }
            ?.forEach { partial ->
                val modelName = partial.name.removeSuffix(".part")
                if (modelName !in trackedNames && !activeImportFileNames.contains(modelName)) {
                    partial.delete()
                }
            }
    }

    private fun importModelFromUri(uri: Uri, cancelFlag: AtomicBoolean): JSObject {
        val resolver = context.contentResolver
        var displayName = ""
        var declaredSize = -1L
        resolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE), null, null, null)?.use { cursor ->
            if (cursor.moveToFirst()) {
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (nameIndex >= 0) displayName = cursor.getString(nameIndex) ?: ""
                if (sizeIndex >= 0 && !cursor.isNull(sizeIndex)) declaredSize = cursor.getLong(sizeIndex)
            }
        }
        val leafName = displayName.substringAfterLast('/').substringAfterLast('\\').trim()
        if (!leafName.endsWith(".gguf", ignoreCase = true)) {
            throw IllegalArgumentException("Yalnızca .gguf model dosyaları içe aktarılabilir.")
        }
        val safeStem = leafName.dropLast(5)
            .replace(Regex("[^A-Za-z0-9._-]"), "_")
            .trim('_', '.', '-')
            .take(100)
        if (safeStem.isBlank()) throw IllegalArgumentException("Model dosyasının adı geçersiz.")
        val fileName = "$safeStem.gguf"
        val destination = safeModelFile(fileName)
        val preferences = downloadPreferences()
        if (preferences.contains(fileName)) throw IllegalStateException("Bu model şu anda indiriliyor.")
        if (destination.exists()) throw IllegalStateException("Bu model zaten telefonda bulunuyor.")
        if (!activeImportFileNames.add(fileName)) throw IllegalStateException("Bu model zaten içe aktarılıyor.")

        val partial = partialModelFile(fileName)
        try {
            if (partial.exists() && !partial.delete()) {
                throw IllegalStateException("Önceki yarım model dosyası temizlenemedi.")
            }
            if (declaredSize > maxImportedModelBytes) {
                throw IllegalArgumentException("Model dosyası 8 GB sınırını aşıyor.")
            }
            val reserveBytes = 32L * 1024L * 1024L
            val requiredBytes = if (declaredSize > 0) declaredSize + reserveBytes else reserveBytes
            val freeBytes = StatFs(modelDirectory().absolutePath).availableBytes
            if (freeBytes < requiredBytes) {
                throw IllegalStateException("Modeli içe aktarmak için telefonda yeterli boş alan yok.")
            }
            var copiedBytes = 0L
            var lastStorageCheckBytes = 0L
            var lastProgressBytes = 0L
            val storageCheckInterval = 16L * 1024L * 1024L
            val progressInterval = 8L * 1024L * 1024L
            if (cancelFlag.get()) throw CancellationException("GGUF içe aktarma iptal edildi.")
            val source = resolver.openInputStream(uri)
                ?: throw IllegalStateException("Seçilen dosya okunamadı.")
            source.use { input ->
                FileOutputStream(partial).use { output ->
                    val buffer = ByteArray(1024 * 1024)
                    while (true) {
                        if (cancelFlag.get()) throw CancellationException("GGUF içe aktarma iptal edildi.")
                        val count = input.read(buffer)
                        if (count < 0) break
                        if (cancelFlag.get()) throw CancellationException("GGUF içe aktarma iptal edildi.")
                        if (count == 0) continue
                        copiedBytes += count.toLong()
                        if (copiedBytes > maxImportedModelBytes) {
                            throw IllegalArgumentException("Model dosyası 8 GB sınırını aşıyor.")
                        }
                        output.write(buffer, 0, count)

                        if (copiedBytes - lastStorageCheckBytes >= storageCheckInterval) {
                            val remainingBytes = if (declaredSize > 0) {
                                (declaredSize - copiedBytes).coerceAtLeast(0L) + reserveBytes
                            } else reserveBytes
                            val availableNow = StatFs(modelDirectory().absolutePath).availableBytes
                            if (availableNow < remainingBytes) {
                                throw IllegalStateException("İçe aktarma sırasında boş depolama alanı azaldı; işlem durduruldu.")
                            }
                            lastStorageCheckBytes = copiedBytes
                        }
                        if (copiedBytes - lastProgressBytes >= progressInterval) {
                            val progress = if (declaredSize > 0) {
                                ((copiedBytes * 100L) / declaredSize).toInt().coerceIn(0, 99)
                            } else -1
                            notifyListeners("localModelImportProgress", JSObject().apply {
                                put("fileName", fileName)
                                put("copiedBytes", copiedBytes)
                                put("totalBytes", declaredSize)
                                put("progress", progress)
                                put("complete", false)
                            })
                            lastProgressBytes = copiedBytes
                        }
                    }
                    output.fd.sync()
                }
            }
            if (declaredSize > 0 && copiedBytes != declaredSize) {
                throw IllegalStateException("Model dosyası tam kopyalanamadı; kaynak ve hedef boyutları eşleşmiyor.")
            }
            if (cancelFlag.get()) throw CancellationException("GGUF içe aktarma iptal edildi.")
            val finalFreeBytes = StatFs(modelDirectory().absolutePath).availableBytes
            if (finalFreeBytes < reserveBytes) {
                throw IllegalStateException("GGUF dosyası için gereken boş alan kalmadı; işlem tamamlanamadı.")
            }
            if (cancelFlag.get()) throw CancellationException("GGUF içe aktarma iptal edildi.")
            finalizeDownloadedModel(fileName)
            notifyListeners("localModelImportProgress", JSObject().apply {
                put("fileName", fileName)
                put("copiedBytes", copiedBytes)
                put("totalBytes", if (declaredSize > 0) declaredSize else copiedBytes)
                put("progress", 100)
                put("complete", true)
            })
            return JSObject().apply {
                put("imported", true)
                put("fileName", fileName)
                put("sizeBytes", copiedBytes)
            }
        } catch (error: Exception) {
            if (partial.exists() && !partial.delete()) {
                error.addSuppressed(IllegalStateException("Yarım içe aktarma dosyası temizlenemedi."))
            }
            throw error
        } finally {
            activeImportFileNames.remove(fileName)
        }
    }

    @PluginMethod
    fun importModel(call: PluginCall) {
        val importId = call.getString("importId")
            ?: run { call.reject("İçe aktarma kimliği eksik."); return }
        if (!importId.matches(Regex("^[A-Za-z0-9_-]{1,80}$"))) {
            call.reject("İçe aktarma kimliği geçersiz.")
            return
        }
        val cancelFlag = AtomicBoolean(false)
        if (activeImportRequests.putIfAbsent(importId, cancelFlag) != null) {
            call.reject("Bu GGUF aktarımı zaten etkin.")
            return
        }
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "*/*"
        }
        try {
            startActivityForResult(call, intent, "importModelResult")
        } catch (error: Exception) {
            activeImportRequests.remove(importId, cancelFlag)
            call.reject("Dosya seçici açılamadı: ${error.message}", error)
        }
    }

    @PluginMethod
    fun cancelImport(call: PluginCall) {
        val importId = call.getString("importId")
            ?: run { call.reject("İçe aktarma kimliği eksik."); return }
        val cancelFlag = activeImportRequests[importId]
        if (cancelFlag == null) {
            call.resolve(JSObject().apply { put("cancelRequested", false) })
            return
        }
        cancelFlag.set(true)
        call.resolve(JSObject().apply { put("cancelRequested", true) })
    }

    @ActivityCallback
    private fun importModelResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val importId = call.getString("importId")
        val cancelFlag = importId?.let { activeImportRequests[it] }
        if (importId == null || cancelFlag == null) {
            call.reject("İçe aktarma işleminin durumu bulunamadı.")
            return
        }
        if (result.resultCode != Activity.RESULT_OK) {
            activeImportRequests.remove(importId, cancelFlag)
            call.resolve(JSObject().apply { put("cancelled", true) })
            return
        }
        val uri = result.data?.data
        if (uri == null) {
            activeImportRequests.remove(importId, cancelFlag)
            call.reject("Dosya seçilemedi.")
            return
        }
        try {
            executor.execute {
                try {
                    if (cancelFlag.get()) {
                        call.resolve(JSObject().apply { put("cancelled", true) })
                    } else {
                        call.resolve(importModelFromUri(uri, cancelFlag))
                    }
                } catch (error: Exception) {
                    if (cancelFlag.get() || error is CancellationException) {
                        call.resolve(JSObject().apply { put("cancelled", true) })
                    } else {
                        call.reject("GGUF modeli içe aktarılamadı: ${error.message}", error)
                    }
                } finally {
                    activeImportRequests.remove(importId, cancelFlag)
                }
            }
        } catch (error: Exception) {
            activeImportRequests.remove(importId, cancelFlag)
            call.reject("Model içe aktarma başlatılamadı: ${error.message}", error)
        }
    }

    @PluginMethod
    fun getDeviceInfo(call: PluginCall) {
        try {
            val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memory = ActivityManager.MemoryInfo()
            manager.getMemoryInfo(memory)
            val stat = StatFs(modelDirectory().absolutePath)
            val arm64 = Build.SUPPORTED_ABIS.any { it.equals("arm64-v8a", true) }
            val result = JSObject()
            result.put("supported", arm64 && Build.VERSION.SDK_INT >= 29)
            result.put("manufacturer", Build.MANUFACTURER ?: "unknown")
            result.put("deviceModel", Build.MODEL ?: "unknown")
            result.put("hardware", Build.HARDWARE ?: "unknown")
            result.put("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown")
            result.put("supportedAbis", Build.SUPPORTED_ABIS.joinToString(","))
            result.put("androidSdk", Build.VERSION.SDK_INT)
            result.put("processorCount", Runtime.getRuntime().availableProcessors())
            result.put("totalMemoryBytes", memory.totalMem)
            result.put("availableMemoryBytes", memory.availMem)
            result.put("lowMemory", memory.lowMemory)
            result.put("freeStorageBytes", stat.availableBytes)
            result.put("loadedFileName", loadedFileName)
            call.resolve(result)
        } catch (error: Exception) { call.reject("Telefon bilgileri okunamadı: ${error.message}", error) }
    }

    @PluginMethod
    fun listModels(call: PluginCall) {
        try {
            reconcileDownloads()
            val result = JSArray()
            modelDirectory().listFiles { file -> file.isFile && file.extension.equals("gguf", true) }
                ?.sortedBy { it.name }?.forEach { file ->
                    val item = JSObject()
                    item.put("fileName", file.name)
                    item.put("sizeBytes", file.length())
                    item.put("loaded", file.name == loadedFileName)
                    try {
                        val metadata = LlamaEngine.readMetadata(file.absolutePath)
                        if (metadata != null) {
                            item.put("modelName", metadata.name)
                            item.put("architecture", metadata.architecture)
                            item.put("quantLabel", metadata.quantLabel)
                            item.put("parameterCount", metadata.paramCount)
                            item.put("contextLength", metadata.contextLength)
                        }
                    } catch (_: Exception) { /* Keep unsupported metadata visible. */ }
                    result.put(item)
                }
            call.resolve(JSObject().apply { put("models", result) })
        } catch (error: Exception) { call.reject("Model listesi okunamadı: ${error.message}", error) }
    }

    @PluginMethod
    fun downloadModel(call: PluginCall) {
        try {
            val url = call.getString("url") ?: throw IllegalArgumentException("İndirme adresi eksik.")
            val fileName = call.getString("fileName") ?: throw IllegalArgumentException("Model dosya adı eksik.")
            val destination = safeModelFile(fileName)
            reconcileDownloads()
            if (activeImportFileNames.contains(fileName)) {
                throw IllegalStateException("Bu model şu anda içe aktarılıyor.")
            }
            if (downloadPreferences().contains(fileName)) {
                throw IllegalStateException("Bu model zaten indiriliyor.")
            }
            if (destination.exists()) throw IllegalStateException("Model zaten telefonda bulunuyor.")
            val partial = partialModelFile(fileName)
            if (partial.exists() && !partial.delete()) throw IllegalStateException("Önceki eksik indirme temizlenemedi.")
            val uri = Uri.parse(url)
            if (uri.scheme != "https" || uri.host !in setOf("huggingface.co", "hf.co")) {
                throw IllegalArgumentException("Yalnızca HTTPS Hugging Face model adresleri kabul edilir.")
            }
            val request = DownloadManager.Request(uri)
                .setTitle("AI Studio · $fileName")
                .setDescription("Yerel GGUF model indiriliyor")
                .setAllowedOverMetered(call.getBoolean("allowMetered") ?: false)
                .setAllowedOverRoaming(false)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(context, "models", partial.name)
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val downloadId = manager.enqueue(request)
            downloadPreferences().edit().putLong(fileName, downloadId).apply()
            call.resolve(JSObject().apply { put("downloadId", downloadId) })
        } catch (error: Exception) { call.reject("Model indirilemedi: ${error.message}", error) }
    }

    @PluginMethod
    fun cancelDownload(call: PluginCall) {
        try {
            val id = call.getLong("downloadId") ?: throw IllegalArgumentException("İndirme kimliği eksik.")
            val fileName = call.getString("fileName") ?: throw IllegalArgumentException("Model dosya adı eksik.")
            val destination = safeModelFile(fileName)
            val partial = partialModelFile(fileName)
            val preferences = downloadPreferences()
            if (preferences.getLong(fileName, -1L) != id) {
                if (destination.isFile) {
                    call.resolve(JSObject().apply { put("cancelled", false); put("completed", true) })
                    return
                }
                throw IllegalStateException("İndirme kaydı bulunamadı.")
            }
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val removed = manager.remove(id)
            if (removed > 0) {
                if (partial.exists() && !partial.delete()) {
                    throw IllegalStateException("Yarım kalan model dosyası temizlenemedi.")
                }
                preferences.edit().remove(fileName).apply()
                call.resolve(JSObject().apply { put("cancelled", true); put("completed", false) })
            } else if (destination.isFile) {
                if (partial.exists() && !partial.delete()) {
                    throw IllegalStateException("Yarım kalan model dosyası temizlenemedi.")
                }
                preferences.edit().remove(fileName).apply()
                call.resolve(JSObject().apply { put("cancelled", false); put("completed", true) })
            } else {
                if (partial.exists() && !partial.delete()) {
                    throw IllegalStateException("Yarım kalan model dosyası temizlenemedi.")
                }
                preferences.edit().remove(fileName).apply()
                call.resolve(JSObject().apply { put("cancelled", false); put("completed", false) })
            }
        } catch (error: Exception) {
            call.reject("Model indirmesi iptal edilemedi: ${error.message}", error)
        }
    }

    @PluginMethod
    fun downloadStatus(call: PluginCall) {
        var cursor: Cursor? = null
        try {
            val id = call.getLong("downloadId") ?: throw IllegalArgumentException("İndirme kimliği eksik.")
            val fileName = call.getString("fileName") ?: throw IllegalArgumentException("Model dosya adı eksik.")
            val preferences = downloadPreferences()
            val tracked = preferences.getLong(fileName, -1L) == id
            val destination = safeModelFile(fileName)
            if (!tracked && destination.isFile) {
                call.resolve(JSObject().apply {
                    put("status", "complete"); put("progress", 100); put("downloadedBytes", destination.length())
                    put("totalBytes", destination.length()); put("reason", "")
                })
                return
            }
            if (!tracked) throw IllegalStateException("İndirme kaydı bulunamadı.")
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            cursor = manager.query(DownloadManager.Query().setFilterById(id))
            if (cursor == null || !cursor.moveToFirst()) {
                partialModelFile(fileName).delete()
                preferences.edit().remove(fileName).apply()
                call.resolve(JSObject().apply { put("status", "failed"); put("reason", "İndirme görevi bulunamadı.") })
                return
            }
            val statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
            val reasonIndex = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)
            val downloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
            val totalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
            if (statusIndex < 0) throw IllegalStateException("İndirme durumu okunamadı.")
            val statusCode = cursor.getInt(statusIndex)
            val downloaded = if (downloadedIndex >= 0) cursor.getLong(downloadedIndex) else 0L
            val total = if (totalIndex >= 0) cursor.getLong(totalIndex) else -1L
            var reason = if (reasonIndex >= 0) cursor.getInt(reasonIndex).toString() else ""
            var status = when (statusCode) {
                DownloadManager.STATUS_SUCCESSFUL -> "complete"
                DownloadManager.STATUS_FAILED -> "failed"
                else -> "running"
            }
            if (statusCode == DownloadManager.STATUS_SUCCESSFUL) {
                try {
                    finalizeDownloadedModel(fileName)
                    preferences.edit().remove(fileName).apply()
                } catch (error: Exception) {
                    partialModelFile(fileName).delete()
                    preferences.edit().remove(fileName).apply()
                    status = "failed"
                    reason = error.message ?: "İndirilen model doğrulanamadı."
                }
            } else if (statusCode == DownloadManager.STATUS_FAILED) {
                partialModelFile(fileName).delete()
                preferences.edit().remove(fileName).apply()
            }
            val progress = if (status == "complete") 100 else if (total > 0) {
                (downloaded * 100.0 / total).toInt().coerceIn(0, 100)
            } else 0
            call.resolve(JSObject().apply {
                put("status", status); put("progress", progress); put("downloadedBytes", downloaded)
                put("totalBytes", total); put("reason", reason)
            })
        } catch (error: Exception) { call.reject("İndirme durumu okunamadı: ${error.message}", error) }
        finally { cursor?.close() }
    }

    @PluginMethod
    fun loadModel(call: PluginCall) {
        val fileName = call.getString("fileName") ?: run { call.reject("Model dosyası seçilmedi."); return }
        val contextSize = (call.getInt("contextSize") ?: 2048).coerceIn(1024, 4096)
        executor.execute {
            var nextEngine: LlamaEngine? = null
            try {
                if (!Build.SUPPORTED_ABIS.any { it.equals("arm64-v8a", true) } || Build.VERSION.SDK_INT < 29) {
                    throw IllegalStateException("Yerel motor Android 10+ ve arm64-v8a gerektirir.")
                }
                val file = safeModelFile(fileName)
                if (!file.isFile || file.length() < 1024 * 1024) throw IllegalStateException("GGUF dosyası eksik veya bozuk.")
                RandomAccessFile(file, "r").use { input ->
                    val magic = ByteArray(4); input.readFully(magic)
                    if (String(magic, Charsets.US_ASCII) != "GGUF") throw IllegalStateException("GGUF başlığı geçersiz.")
                }
                val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
                val memoryInfo = ActivityManager.MemoryInfo()
                activityManager.getMemoryInfo(memoryInfo)
                if (memoryInfo.lowMemory) {
                    throw IllegalStateException("Android düşük bellek baskısı bildiriyor; daha küçük model seçip tekrar dene.")
                }
                val baselineFreeRam = 1536L * 1024L * 1024L
                val estimatedFreeRam = file.length() * 14L / 10L + 750L * 1024L * 1024L
                val minimumFreeRam = maxOf(baselineFreeRam, estimatedFreeRam)
                if (memoryInfo.availMem < minimumFreeRam) {
                    throw IllegalStateException("Yetersiz boş RAM; daha küçük bir GGUF modeli seç veya diğer uygulamaları kapat.")
                }
                val previous = engine; engine = null; loadedFileName = ""; previous?.free()
                nextEngine = LlamaEngine()
                nextEngine.load(path = file.absolutePath, nGpuLayers = 0, nCtx = contextSize, nThreads = 0,
                    onProgress = LoadProgressCallback { progress ->
                        notifyListeners("localModelLoadProgress", JSObject().put("progress", (progress * 100).toInt())); true
                    })
                engine = nextEngine; loadedFileName = file.name
                call.resolve(JSObject().apply { put("loaded", true); put("fileName", file.name); put("contextSize", contextSize) })
            } catch (error: Exception) {
                try { nextEngine?.free() } catch (_: Exception) { }
                call.reject("Model belleğe yüklenemedi: ${error.message}", error)
            }
        }
    }

    @PluginMethod
    fun chat(call: PluginCall) {
        try {
            val input = call.getArray("messages") ?: throw IllegalArgumentException("Sohbet mesajları eksik.")
            val messages = ArrayList<ChatMessage>()
            for (i in 0 until input.length()) {
                val item = input.getJSONObject(i)
                val role = item.optString("role", "user")
                val content = item.optString("content", "")
                if (content.isNotBlank() && role in setOf("system", "user", "assistant")) messages.add(ChatMessage(role, content))
            }
            if (messages.isEmpty()) throw IllegalArgumentException("Sohbet mesajı boş.")
            val maxTokens = (call.getInt("maxTokens") ?: 700).coerceIn(64, 1800)
            val temperature = (call.getDouble("temperature") ?: 0.25).toFloat().coerceIn(0f, 1.2f)
            executor.execute {
                try {
                    val current = engine ?: throw IllegalStateException("Önce bir yerel model yükle.")
                    val output = StringBuilder()
                    runBlocking {
                        current.chat(messages, SamplingParams(nPredict = maxTokens, temperature = temperature), enableThinking = false)
                            .collect { token -> output.append(token) }
                    }
                    call.resolve(JSObject().apply { put("text", output.toString()); put("fileName", loadedFileName) })
                } catch (error: Exception) { call.reject("Yerel model yanıt üretemedi: ${error.message}", error) }
            }
        } catch (error: Exception) { call.reject("Yerel sohbet başlatılamadı: ${error.message}", error) }
    }

    @PluginMethod
    fun unloadModel(call: PluginCall) {
        executor.execute {
            try { val previous = engine; engine = null; loadedFileName = ""; previous?.free(); call.resolve(JSObject().apply { put("loaded", false) }) }
            catch (error: Exception) { call.reject("Model kapatılamadı: ${error.message}", error) }
        }
    }

    @PluginMethod
    fun deleteModel(call: PluginCall) {
        val name = call.getString("fileName") ?: run { call.reject("Dosya adı eksik."); return }
        executor.execute {
            try {
                if (name == loadedFileName) throw IllegalStateException("Önce yüklü modeli kapat.")
                val file = safeModelFile(name)
                if (file.exists() && !file.delete()) throw IllegalStateException("Model dosyası silinemedi.")
                call.resolve(JSObject().apply { put("deleted", true) })
            } catch (error: Exception) { call.reject("Model silinemedi: ${error.message}", error) }
        }
    }

    override fun handleOnDestroy() {
        super.handleOnDestroy()
        try {
            executor.execute { val previous = engine; engine = null; loadedFileName = ""; try { previous?.free() } catch (_: Exception) { } }
            executor.shutdown()
        } catch (_: java.util.concurrent.RejectedExecutionException) { executor.shutdownNow() }
    }
}

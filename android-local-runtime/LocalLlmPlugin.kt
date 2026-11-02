package com.aistudio.alpha1

import android.app.ActivityManager
import android.app.DownloadManager
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Build
import android.os.StatFs
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.tensai.llamakt.ChatMessage
import com.tensai.llamakt.LlamaEngine
import com.tensai.llamakt.LoadProgressCallback
import com.tensai.llamakt.SamplingParams
import com.tensai.llamakt.chat
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.runBlocking
import java.io.File
import java.io.RandomAccessFile
import java.util.concurrent.Executors

/** Private, on-device GGUF storage and llama.kt inference bridge. */
@CapacitorPlugin(name = "LocalLlm")
class LocalLlmPlugin : Plugin() {
    private val executor = Executors.newSingleThreadExecutor()
    @Volatile private var engine: LlamaEngine? = null
    @Volatile private var loadedFileName: String = ""

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
            if (destination.exists()) throw IllegalStateException("Model zaten telefonda bulunuyor.")
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
                .setDestinationInExternalFilesDir(context, "models", fileName)
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            call.resolve(JSObject().apply { put("downloadId", manager.enqueue(request)) })
        } catch (error: Exception) { call.reject("Model indirilemedi: ${error.message}", error) }
    }

    @PluginMethod
    fun downloadStatus(call: PluginCall) {
        var cursor: Cursor? = null
        try {
            val id = call.getLong("downloadId") ?: throw IllegalArgumentException("İndirme kimliği eksik.")
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            cursor = manager.query(DownloadManager.Query().setFilterById(id))
            if (cursor == null || !cursor.moveToFirst()) {
                call.resolve(JSObject().apply { put("status", "failed"); put("reason", "İndirme görevi bulunamadı.") }); return
            }
            val statusIndex = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
            val reasonIndex = cursor.getColumnIndex(DownloadManager.COLUMN_REASON)
            val downloadedIndex = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
            val totalIndex = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
            if (statusIndex < 0) throw IllegalStateException("İndirme durumu okunamadı.")
            val statusCode = cursor.getInt(statusIndex)
            val downloaded = if (downloadedIndex >= 0) cursor.getLong(downloadedIndex) else 0L
            val total = if (totalIndex >= 0) cursor.getLong(totalIndex) else -1L
            val reason = if (reasonIndex >= 0) cursor.getInt(reasonIndex).toString() else ""
            val progress = if (total > 0) (downloaded * 100.0 / total).toInt().coerceIn(0, 100) else 0
            val status = when (statusCode) {
                DownloadManager.STATUS_SUCCESSFUL -> "complete"
                DownloadManager.STATUS_FAILED -> "failed"
                else -> "running"
            }
            call.resolve(JSObject().apply { put("status", status); put("progress", progress); put("downloadedBytes", downloaded); put("totalBytes", total); put("reason", reason) })
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

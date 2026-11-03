import { registerPlugin } from '@capacitor/core';

// Model weights are downloaded by the user after install; no multi-GB weight is bundled in the APK.
export const DEVICE_MODEL_CATALOG = Object.freeze([
  {
    id: 'qwen25-coder-05', name: 'Qwen2.5-Coder 0.5B · Q4_K_M',
    licenseName: 'Apache-2.0',
    licenseUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/blob/main/LICENSE',
    fileName: 'qwen2.5-coder-0.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-0.5b-instruct-q4_k_m.gguf',
    sizeBytes: 491 * 1024 * 1024, minRamGb: 4, minCpuCores: 4, requiredFreeRamBytes: 1500 * 1024 ** 2,
    contextSize: 2048, summary: 'En küçük başlangıç modeli. 4–7 GB RAM sınıfında önce bunu dene.'
  },
  {
    id: 'qwen25-coder-15', name: 'Qwen2.5-Coder 1.5B · Q4_K_M',
    licenseName: 'Apache-2.0',
    licenseUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/blob/main/LICENSE',
    fileName: 'qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    sizeBytes: 1120 * 1024 ** 2, minRamGb: 8, minCpuCores: 6, requiredFreeRamBytes: 2300 * 1024 ** 2,
    contextSize: 2048, summary: 'Daha güçlü kodlama seçeneği. 8–11 GB RAM sınıfında değerlendir.'
  },
  {
    id: 'qwen25-coder-3', name: 'Qwen2.5-Coder 3B · Q4_K_M',
    licenseName: 'Qwen Research License',
    licenseNotice: 'Yalnızca ticari olmayan araştırma/değerlendirme için; ticari kullanım için ayrı lisans gerekir.',
    licenseUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/blob/main/LICENSE',
    fileName: 'qwen2.5-coder-3b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf',
    sizeBytes: 2100 * 1024 ** 2, minRamGb: 12, minCpuCores: 8, requiredFreeRamBytes: 3800 * 1024 ** 2,
    contextSize: 2048, summary: 'Büyük model. 12 GB ve üzeri RAM sınıfında; boş bellek yine de önemlidir.'
  }
]);

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

export function assessDeviceModel(model, deviceInfo = {}) {
  const total = Number(deviceInfo.totalMemoryBytes || 0);
  const available = Number(deviceInfo.availableMemoryBytes || 0);
  const freeStorage = Number(deviceInfo.freeStorageBytes || 0);
  const cores = Number(deviceInfo.processorCount || 0);
  const memoryKnown = total > 0 && available > 0;
  const lowMemory = Boolean(deviceInfo.lowMemory);
  const storageKnown = freeStorage > 0;
  const supported = deviceInfo.supported !== false;
  const totalRamOk = total > 0 && total >= Number(model.minRamGb || 0) * GIB;
  const availableRamOk = available > 0 && available >= Number(model.requiredFreeRamBytes || 0);
  const cpuOk = cores <= 0 || cores >= Number(model.minCpuCores || 0);
  const storageOk = storageKnown && freeStorage >= Number(model.sizeBytes || 0) * 1.15;
  const memoryOk = memoryKnown && totalRamOk && availableRamOk && !lowMemory;
  const warnings = [];
  if (lowMemory) warnings.push('Android şu anda düşük bellek baskısı bildiriyor');
  if (!supported) warnings.push('Android sürümü veya arm64 mimarisi desteklenmiyor');
  if (!memoryKnown) warnings.push('RAM bilgisi okunamadı');
  else {
    if (!totalRamOk) warnings.push(`Toplam RAM için en az ${model.minRamGb} GB öneriliyor`);
    if (!availableRamOk) warnings.push(`Yaklaşık ${formatModelBytes(model.requiredFreeRamBytes)} boş RAM gerekiyor`);
  }
  if (!storageKnown) warnings.push('Boş depolama bilgisi okunamadı');
  else if (!storageOk) warnings.push(`İndirme için yaklaşık ${formatModelBytes(model.sizeBytes * 1.15)} boş alan gerekiyor`);
  if (!cpuOk) warnings.push(`${model.minCpuCores} veya daha fazla CPU çekirdeği öneriliyor`);
  return {
    supported, memoryKnown, storageKnown, totalRamOk, availableRamOk, memoryOk, lowMemory,
    cpuOk, storageOk, canLoad: supported && memoryOk,
    canDownload: supported && storageOk,
    fitsRecommended: supported && memoryOk && cpuOk && storageOk,
    warnings
  };
}

export function chooseRecommendedDeviceModel(deviceInfo = {}) {
  const total = Number(deviceInfo.totalMemoryBytes || 0);
  const available = Number(deviceInfo.availableMemoryBytes || 0);
  const freeStorage = Number(deviceInfo.freeStorageBytes || 0);
  const cores = Number(deviceInfo.processorCount || 0);
  const assessments = DEVICE_MODEL_CATALOG.map(model => ({ model, assessment: assessDeviceModel(model, deviceInfo) }));
  const suitable = assessments.filter(item => item.assessment.fitsRecommended);
  const selected = suitable.length ? suitable[suitable.length - 1] : assessments[0];
  const model = selected.model;
  const assessment = selected.assessment;
  const isUnderpowered = suitable.length === 0;
  const tier = isUnderpowered ? 'Sınırlı / veri eksik'
    : model.id === 'qwen25-coder-3' ? 'Yüksek'
    : model.id === 'qwen25-coder-15' ? 'Orta'
    : 'Başlangıç';
  let recommendationReason = 'RAM, CPU çekirdeği ve boş depolama eşiklerine göre yapılan yaklaşık donanım tahmini; gerçek hız testi değildir.';
  if (deviceInfo.supported === false) recommendationReason = 'Bu cihaz Android 10+ ve arm64-v8a gereksinimini karşılamıyor.';
  else if (!assessment.memoryKnown) recommendationReason = 'Telefonun RAM bilgisi doğrulanamadı; öneri kesin değil.';
  else if (isUnderpowered) recommendationReason = 'En küçük model için bile gereken bellek, CPU veya depolama koşulları doğrulanamadı.';
  return {
    ...model,
    ramGb: Number((total / GIB).toFixed(1)),
    availableGb: Number((available / GIB).toFixed(1)),
    storageGb: Number((freeStorage / GIB).toFixed(1)),
    cpuCores: cores,
    lowAvailableMemory: available > 0 && available < DEVICE_MODEL_CATALOG[0].requiredFreeRamBytes,
    capabilityTier: tier,
    isUnderpowered,
    canLoad: assessment.canLoad,
    canDownload: assessment.canDownload,
    recommendationReason,
    modelAssessments: assessments.map(item => ({ id: item.model.id, ...item.assessment }))
  };
}

export function formatModelBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value >= GIB) return `${(value / GIB).toFixed(2)} GB`;
  if (value >= MIB) return `${Math.round(value / MIB)} MB`;
  return `${value} B`;
}

export class DeviceLocalCoder {
  constructor(isNativePlatform, pluginOverride = null) {
    this.native = Boolean(isNativePlatform);
    this.plugin = this.native ? (pluginOverride || registerPlugin('LocalLlm')) : null;
    this.device = null;
    this.models = [];
    this.loadedFileName = '';
    this.activeDownloadId = null;
    this.activeDownloadFileName = '';
    this.cancelRequested = false;
    this.downloadStarting = false;
    this.downloadLoopActive = false;
    this.importStarting = false;
  }

  async refresh() {
    if (!this.native || !this.plugin) return { device: null, models: [], supported: false, reason: 'Telefon içi model motoru Android APK gerektirir.' };
    this.device = await this.plugin.getDeviceInfo();
    const listed = await this.plugin.listModels();
    this.models = Array.isArray(listed?.models) ? listed.models : [];
    this.loadedFileName = this.device?.loadedFileName || this.models.find(item => item.loaded)?.fileName || '';
    return { device: this.device, models: this.models, recommendation: chooseRecommendedDeviceModel(this.device) };
  }

  async download(model, onProgress = () => {}, options = {}) {
    if (!this.native) throw new Error('Model indirme yalnızca Android uygulamasında kullanılabilir.');
    if (this.importStarting || this.downloadStarting || this.activeDownloadId !== null) {
      throw new Error('Başka bir model aktarımı sürüyor. Önce onu tamamla.');
    }

    this.downloadStarting = true;
    let downloadId = null;
    let terminalStatus = false;
    let preserveDownloadState = false;
    let completed = false;
    try {
      await this.refresh();
      if (!this.device?.supported) throw new Error('Bu telefon Android 10+ ve 64-bit ARM gereksinimini karşılamıyor.');
      if (!model?.url || !model?.fileName) throw new Error('Model kataloğu girdisi geçersiz.');
      if (this.models.some(item => item.fileName === model.fileName)) throw new Error('Bu model zaten telefonda bulunuyor. Listeden yükleyebilirsin.');
      const free = Number(this.device?.freeStorageBytes || 0);
      if (free && free < model.sizeBytes * 1.15) throw new Error(`Yeterli boş depolama yok. Yaklaşık ${formatModelBytes(model.sizeBytes * 1.15)} gerekiyor.`);

      const started = await this.plugin.downloadModel({
        url: model.url,
        fileName: model.fileName,
        allowMetered: Boolean(options.allowMetered)
      });
      downloadId = Number(started.downloadId);
      if (!Number.isSafeInteger(downloadId) || downloadId < 0) {
        throw new Error('Android indirme görevi başlatılamadı.');
      }
      this.activeDownloadId = downloadId;
      this.activeDownloadFileName = model.fileName;
      this.cancelRequested = false;
      this.downloadStarting = false;
      this.downloadLoopActive = true;

      const startedAt = Date.now();
      const timeoutMs = Math.max(1, Number(options.timeoutMs) || 6 * 60 * 60 * 1000);
      const pollIntervalMs = Math.max(0, Number(options.pollIntervalMs) || 1000);
      while (true) {
        if (this.cancelRequested) throw new Error('İndirme kullanıcı tarafından iptal edildi.');
        if (Date.now() - startedAt > timeoutMs) {
          const timeoutError = new Error('İndirme zaman aşımına uğradı; görev iptal edildi. Bağlantıyı kontrol et.');
          try {
            await this.cancelDownload();
          } catch (cancelError) {
            preserveDownloadState = this.activeDownloadId === downloadId;
            if (preserveDownloadState) timeoutError.cancelError = cancelError.message;
          }
          throw timeoutError;
        }

        const status = await this.plugin.downloadStatus({ downloadId, fileName: model.fileName });
        onProgress(status);
        if (this.cancelRequested) throw new Error('İndirme kullanıcı tarafından iptal edildi.');
        if (status.status === 'complete') {
          terminalStatus = true;
          completed = true;
          break;
        }
        if (status.status === 'failed') {
          terminalStatus = true;
          throw new Error(status.reason || 'Model indirmesi başarısız oldu.');
        }
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      }
    } catch (error) {
      if (
        downloadId !== null &&
        !terminalStatus &&
        !this.cancelRequested &&
        !preserveDownloadState &&
        this.activeDownloadId === downloadId
      ) {
        try {
          await this.cancelDownload();
        } catch (cancelError) {
          // The native task may still be running. Keep its id so the user can retry cancellation.
          preserveDownloadState = this.activeDownloadId === downloadId;
          if (preserveDownloadState) error.cancelError = cancelError.message;
        }
      }
      throw error;
    } finally {
      this.downloadStarting = false;
      this.downloadLoopActive = false;
      if (!preserveDownloadState) {
        if (this.activeDownloadId === downloadId || downloadId === null) {
          this.activeDownloadId = null;
          this.activeDownloadFileName = '';
        }
        this.cancelRequested = false;
      }
    }

    if (completed) {
      await this.refresh();
      return this.models;
    }
    return this.models;
  }
  async importModel(onProgress = () => {}) {
    if (!this.native || !this.plugin) {
      throw new Error('GGUF dosyası içe aktarma Android APK gerektirir.');
    }
    if (this.importStarting || this.downloadStarting || this.activeDownloadId !== null) {
      throw new Error('Başka bir model aktarımı sürüyor. Önce onu tamamla.');
    }
    this.importStarting = true;
    let listener = null;
    try {
      if (typeof this.plugin.addListener === 'function') {
        listener = await this.plugin.addListener('localModelImportProgress', event => onProgress(event));
      }
      const result = await this.plugin.importModel();
      if (result?.imported) await this.refresh();
      return result || { cancelled: true };
    } finally {
      if (listener?.remove) await listener.remove();
      this.importStarting = false;
    }
  }

  async cancelDownload() {
    if (!this.native || !this.plugin || this.activeDownloadId === null || !this.activeDownloadFileName) {
      return { cancelled: false, completed: false };
    }
    const downloadId = this.activeDownloadId;
    const fileName = this.activeDownloadFileName;
    this.cancelRequested = true;
    try {
      const result = await this.plugin.cancelDownload({ downloadId, fileName });
      if (result?.completed) {
        this.cancelRequested = false;
        if (!this.downloadLoopActive) {
          this.activeDownloadId = null;
          this.activeDownloadFileName = '';
        }
        return result;
      }
      if (result?.cancelled) {
        if (!this.downloadLoopActive) {
          this.activeDownloadId = null;
          this.activeDownloadFileName = '';
          this.cancelRequested = false;
        }
        return result;
      }
      this.cancelRequested = false;
      throw new Error('Android indirme görevi iptal edilemedi veya bulunamadı.');
    } catch (error) {
      this.cancelRequested = false;
      // Keep the active id so the user can retry when native cancellation fails.
      throw error;
    }
  }

  async load(fileName, contextSize = 2048, onProgress = () => {}) {
    if (!this.native) throw new Error('Cihaz içi model motoru Android gerektirir.');
    await this.refresh();
    const model = DEVICE_MODEL_CATALOG.find(item => item.fileName === fileName);
    if (!this.models.some(item => item.fileName === fileName)) throw new Error('GGUF dosyası telefonda bulunamadı. Önce indir.');
    const total = Number(this.device?.totalMemoryBytes || 0);
    const available = Number(this.device?.availableMemoryBytes || 0);
    if (this.device?.lowMemory) throw new Error('Android şu anda düşük bellek bildiriyor. Diğer uygulamaları kapatıp yeniden dene.');
    if (model && total && total < model.minRamGb * GIB) throw new Error(`Bu model için yaklaşık ${model.minRamGb} GB toplam RAM öneriliyor; telefonda ${formatModelBytes(total)} var.`);
    if (model && available && available < model.requiredFreeRamBytes) throw new Error(`Yetersiz boş RAM. Bu model için yaklaşık ${formatModelBytes(model.requiredFreeRamBytes)} boş bellek öneriliyor.`);
    const listener = await this.plugin.addListener('localModelLoadProgress', event => onProgress(event));
    try {
      const result = await this.plugin.loadModel({ fileName, contextSize: Math.max(1024, Math.min(Number(contextSize || 2048), 4096)) });
      this.loadedFileName = fileName;
      return result;
    } finally {
      await listener.remove();
    }
  }

  async unload() {
    if (!this.native) return;
    await this.plugin.unloadModel();
    this.loadedFileName = '';
  }

  async generate(messages, options = {}) {
    if (!this.native || !this.loadedFileName) throw new Error('Önce telefondaki bir GGUF modelini belleğe yükle.');
    return this.plugin.chat({
      messages,
      maxTokens: Math.max(64, Math.min(Number(options.maxTokens || 700), 1800)),
      temperature: Math.max(0, Math.min(Number(options.temperature ?? 0.25), 1.2))
    });
  }

  async delete(fileName) {
    if (!this.native) return;
    if (this.loadedFileName === fileName) await this.unload();
    await this.plugin.deleteModel({ fileName });
    await this.refresh();
  }
}

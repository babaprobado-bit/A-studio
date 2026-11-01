import { registerPlugin } from '@capacitor/core';

// Model weights are downloaded by the user after install; no multi-GB weight is bundled in the APK.
export const DEVICE_MODEL_CATALOG = Object.freeze([
  {
    id: 'qwen25-coder-05', name: 'Qwen2.5-Coder 0.5B · Q4_K_M',
    fileName: 'qwen2.5-coder-0.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-0.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-0.5b-instruct-q4_k_m.gguf',
    sizeBytes: 491 * 1024 * 1024, minRamGb: 4, requiredFreeRamBytes: 1500 * 1024 ** 2,
    contextSize: 2048, summary: 'En küçük başlangıç modeli. 4–7 GB RAM sınıfında önce bunu dene.'
  },
  {
    id: 'qwen25-coder-15', name: 'Qwen2.5-Coder 1.5B · Q4_K_M',
    fileName: 'qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
    sizeBytes: 1120 * 1024 ** 2, minRamGb: 8, requiredFreeRamBytes: 2300 * 1024 ** 2,
    contextSize: 2048, summary: 'Daha güçlü kodlama seçeneği. 8–11 GB RAM sınıfında değerlendir.'
  },
  {
    id: 'qwen25-coder-3', name: 'Qwen2.5-Coder 3B · Q4_K_M',
    fileName: 'qwen2.5-coder-3b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-3B-Instruct-GGUF/resolve/main/qwen2.5-coder-3b-instruct-q4_k_m.gguf',
    sizeBytes: 2100 * 1024 ** 2, minRamGb: 12, requiredFreeRamBytes: 3800 * 1024 ** 2,
    contextSize: 2048, summary: 'Büyük model. 12 GB ve üzeri RAM sınıfında; boş bellek yine de önemlidir.'
  }
]);

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

export function chooseRecommendedDeviceModel(deviceInfo = {}) {
  const total = Number(deviceInfo.totalMemoryBytes || 0);
  const available = Number(deviceInfo.availableMemoryBytes || 0);
  let model = DEVICE_MODEL_CATALOG[0];
  if (total >= 12 * GIB && available >= DEVICE_MODEL_CATALOG[2].requiredFreeRamBytes) model = DEVICE_MODEL_CATALOG[2];
  else if (total >= 8 * GIB && available >= DEVICE_MODEL_CATALOG[1].requiredFreeRamBytes) model = DEVICE_MODEL_CATALOG[1];
  return {
    ...model,
    ramGb: Number((total / GIB).toFixed(1)),
    availableGb: Number((available / GIB).toFixed(1)),
    lowAvailableMemory: available > 0 && available < DEVICE_MODEL_CATALOG[0].requiredFreeRamBytes
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
    if (!this.device) await this.refresh();
    if (!this.device?.supported) throw new Error('Bu telefon Android 10+ ve 64-bit ARM gereksinimini karşılamıyor.');
    if (!model?.url || !model?.fileName) throw new Error('Model kataloğu girdisi geçersiz.');
    if (this.models.some(item => item.fileName === model.fileName)) throw new Error('Bu model zaten telefonda bulunuyor. Listeden yükleyebilirsin.');
    const free = Number(this.device?.freeStorageBytes || 0);
    if (free && free < model.sizeBytes * 1.15) throw new Error(`Yeterli boş depolama yok. Yaklaşık ${formatModelBytes(model.sizeBytes * 1.15)} gerekiyor.`);
    const started = await this.plugin.downloadModel({ url: model.url, fileName: model.fileName, allowMetered: Boolean(options.allowMetered) });
    const downloadId = Number(started.downloadId);
    if (!Number.isFinite(downloadId)) throw new Error('Android indirme görevi başlatılamadı.');
    this.activeDownloadId = downloadId;
    const startedAt = Date.now();
    while (true) {
      if (Date.now() - startedAt > 6 * 60 * 60 * 1000) throw new Error('İndirme zaman aşımına uğradı; bağlantıyı kontrol et.');
      const status = await this.plugin.downloadStatus({ downloadId });
      onProgress(status);
      if (status.status === 'complete') break;
      if (status.status === 'failed') throw new Error(status.reason || 'Model indirmesi başarısız oldu.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    this.activeDownloadId = null;
    await this.refresh();
    return this.models;
  }

  async load(fileName, contextSize = 2048, onProgress = () => {}) {
    if (!this.native) throw new Error('Cihaz içi model motoru Android gerektirir.');
    if (!this.models.some(item => item.fileName === fileName)) await this.refresh();
    const model = DEVICE_MODEL_CATALOG.find(item => item.fileName === fileName);
    if (!this.models.some(item => item.fileName === fileName)) throw new Error('GGUF dosyası telefonda bulunamadı. Önce indir.');
    const available = Number(this.device?.availableMemoryBytes || 0);
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

export const reuseCatalog = [
  { id: 'babylonjs', name: 'Babylon.js', group: '3D web motoru', license: 'Apache-2.0 · dosyanın lisansını doğrula', description: 'Web tabanlı 3D sahne, kamera, ışık, GLB modeller ve etkileşimli ortamlar.', url: 'https://github.com/BabylonJS/Babylon.js', licenseUrl: 'https://github.com/BabylonJS/Babylon.js/blob/master/license.md', tags: ['3D', 'Web', 'GLB', 'oyun'] },
  { id: 'threejs', name: 'three.js', group: '3D web kütüphanesi', license: 'MIT · eklenti ve varlıkları ayrıca kontrol et', description: 'WebGL/WebGPU ile 3D sahne ve görselleştirme için modüler JavaScript kütüphanesi.', url: 'https://github.com/mrdoob/three.js', licenseUrl: 'https://github.com/mrdoob/three.js/blob/dev/LICENSE', tags: ['3D', 'Web', 'JavaScript'] },
  { id: 'phaser', name: 'Phaser', group: '2D web oyun motoru', license: 'MIT · eklenti ve varlıkları ayrıca kontrol et', description: 'Tarayıcı ve mobil web için 2D oyun framework’ü; prototip ve küçük oyunlarda kullanışlı.', url: 'https://github.com/phaserjs/phaser', licenseUrl: 'https://github.com/phaserjs/phaser/blob/master/LICENSE.md', tags: ['2D', 'Web', 'JavaScript'] },
  { id: 'godot', name: 'Godot Engine', group: 'Oyun motoru', license: 'MIT · kullandığın sürümün lisansını doğrula', description: 'Açık kaynak 2D/3D oyun motoru; kaynak kod ve örnek projeler üzerinden öğrenme.', url: 'https://github.com/godotengine/godot', licenseUrl: 'https://github.com/godotengine/godot/blob/master/LICENSE.txt', tags: ['2D', '3D', 'masaüstü'] },
  { id: 'kenney', name: 'Kenney Assets', group: 'Oyun varlıkları', license: 'CC0 · indirilen paketteki lisansı da kontrol et', description: 'Prototipler için karakter, çevre, arayüz ve ses varlıkları.', url: 'https://kenney.nl/assets', licenseUrl: 'https://kenney.nl/support', tags: ['model', 'doku', 'ses', 'UI'] },
  { id: 'polyhaven', name: 'Poly Haven', group: '3D varlıklar', license: 'CC0 · kaynak sayfası', description: 'HDRI aydınlatma ortamları, dokular ve 3D modeller.', url: 'https://polyhaven.com/', licenseUrl: 'https://polyhaven.com/license', tags: ['HDRI', 'doku', 'model'] },
  { id: 'opengameart', name: 'OpenGameArt', group: 'Topluluk varlıkları', license: 'Varlık başına değişir · lisansı ve atıf şartını kontrol et', description: 'Topluluğun paylaştığı 2D/3D görseller, müzik ve oyun varlıkları.', url: 'https://opengameart.org/', licenseUrl: 'https://opengameart.org/content/faq', tags: ['2D', '3D', 'müzik', 'ses'] },
  { id: 'freesound', name: 'Freesound', group: 'Ses varlıkları', license: 'Kayıt başına değişir · lisans ve atıf şartını kontrol et', description: 'Ortam, hareket ve arayüz sesleri için topluluk ses arşivi.', url: 'https://freesound.org/', licenseUrl: 'https://freesound.org/help/faq/', tags: ['ses', 'ambiyans', 'efekt'] }
];

export function buildLocalCoderStages(input) {
  const task = String(input && input.task || '').trim().slice(0, 3000);
  const language = String(input && input.language || 'javascript').slice(0, 40);
  const sourceCode = String(input && input.sourceCode || '').slice(0, 10000);
  const sourceContext = sourceCode ? 'Mevcut kaynak dosyası (' + language + '):\n' + sourceCode + '\n' : 'Mevcut kaynak kod verilmedi. Varsayımlarını açıkça yaz.\n';
  const common = 'Sen AI Studio içindeki yerel Local Coder ajanısın. Türkçe yanıt ver. Bilmediğin API veya dosyaları uydurma. Kod çalıştırma yeteneğin yok; testleri çalıştırdığını asla iddia etme. İşi küçük ve bakımı kolay tut.\n\nKullanıcı görevi:\n' + task + '\n\n' + sourceContext;
  return [
    { id: 'plan', title: '1/3 · Planlayıcı', prompt: common + '\nEn küçük uygulanabilir çözümü, riskleri ve test edilebilir kabul ölçütlerini sırala. Henüz kod yazma.' },
    { id: 'code', title: '2/3 · Kodlayıcı', makePrompt: previous => common + '\nPlanlama ajanının çıktısı:\n' + String(previous || '').slice(0, 2500) + '\n\nİstenen dosyanın eksiksiz taslağını üret. Yalnızca tek bir ' + language + ' kod bloğu kullan; içinde dosyanın tamamı olsun. Var olan kod verilmişse işe yarayan davranışı koru. Kodu çalıştırdığını iddia etme.' },
    { id: 'review', title: '3/3 · İnceleyici ve test planı', makePrompt: previous => common + '\nKodlayıcı taslağı:\n' + String(previous || '').slice(0, 10000) + '\n\nTaslağı bağımsız incele; hata ve kenar durumlarını belirt, düzeltme öner ve manuel/otomatik test listesi yaz. Testleri çalıştırmadığını açıkça söyle.' }
  ];
}

export function extractCodeArtifact(answer) {
  const source = String(answer || '').trim();
  const fence = String.fromCharCode(96, 96, 96);
  const start = source.indexOf(fence);
  if (start < 0) return source;
  const lineEnd = source.indexOf('\n', start + 3);
  if (lineEnd < 0) return source;
  const end = source.indexOf(fence, lineEnd + 1);
  return end < 0 ? source : source.slice(lineEnd + 1, end).trim();
}

export function normalizeSnippet(raw) {
  if (!raw || typeof raw.name !== 'string' || typeof raw.code !== 'string') return null;
  const name = raw.name.trim().slice(0, 100);
  const code = raw.code.slice(0, 50000);
  if (!name || !code.trim()) return null;
  let sourceUrl = typeof raw.sourceUrl === 'string' ? raw.sourceUrl.trim().slice(0, 500) : '';
  if (sourceUrl) {
    try { if (new URL(sourceUrl).protocol !== 'https:') sourceUrl = ''; }
    catch { sourceUrl = ''; }
  }
  return {
    id: typeof raw.id === 'string' ? raw.id.slice(0, 100) : '',
    name,
    language: typeof raw.language === 'string' ? raw.language.slice(0, 40) : 'text',
    sourceUrl,
    license: typeof raw.license === 'string' ? raw.license.trim().slice(0, 180) : 'Lisans belirtilmedi',
    code,
    updated: typeof raw.updated === 'string' ? raw.updated.slice(0, 50) : new Date().toISOString()
  };
}

const P=(id,name,icon,category,desc,prompt)=>({id,name,icon,category,desc,prompt});
export const PROMPT_PLUGIN_CATALOG=Object.freeze([
P('plan','Görev Planlayıcı','✳','Planlama','Büyük işleri aşamalara böler.','Görevi hedef, MVP, bağımlılık, risk ve kabul ölçütlerine göre adımlara böl.\n\nGörev: {{gorev}}'),
P('debug','Hata Dedektifi','⌁','Kod','Belirti, kanıt ve en küçük düzeltme.','Hata belirtisini, kanıtlanan olguları ve varsayımları ayır. Olası nedenleri sırala ve regresyon testi öner.\n\nGörev/kod: {{gorev}}'),
P('review','Kod İnceleme','✓','Kod','Doğruluk, güvenlik ve bakım.','Kodu doğruluk, güvenlik, performans ve bakım açısından incele. Yalnızca kanıtlı bulguları kesin ifade et.\n\nKod: {{gorev}}'),
P('explain','Kod Öğretmeni','≋','Kod','Kodu adım adım açıklar.','Bu kodu yeni başlayan geliştiriciye anlat. Veri akışı, girdiler, çıktılar ve hata durumlarını açıkla.\n\nKod: {{gorev}}'),
P('tests','Test Tasarımcısı','⊞','Test','Normal, sınır ve hata senaryoları.','Normal akış, sınır değer, bozuk girdi, çevrimdışı, yeniden deneme ve regresyon testleri oluştur.\n\nÖzellik: {{gorev}}'),
P('refactor','Refactor Yardımcısı','⤧','Kod','Davranışı koruyarak sadeleştirme.','Davranışı değiştirmeden küçük ve geri alınabilir refactor adımları öner. Önce mevcut davranışı güvenceye alacak testleri belirle.\n\nKod: {{gorev}}'),
P('performance','Performans Analisti','⚡','Kod','CPU, RAM, ağ ve render maliyeti.','Ölçülen verilerle varsayımları ayır. CPU, RAM, pil, ağ ve render darboğazları için ölçüm ve düşük riskli optimizasyon öner.\n\nSistem: {{gorev}}'),
P('security','Savunmacı Güvenlik Denetimi','盾','Güvenlik','Güvenli tasarım ve risk azaltma.','Gizli anahtarlar, yetki, giriş doğrulama, veri saklama, ağ ve bağımlılık risklerini savunmacı açıdan incele. İstismar adımları değil düzeltmeler ver.\n\nKod/tasarım: {{gorev}}'),
P('api-design','API Tasarımcısı','⇄','API','Endpoint, şema, hata ve sürüm.','Endpoint, HTTP metodu, istek/yanıt şeması, kimlik doğrulama, hata kodları, rate limit ve sürümlemeyi tasarla.\n\nİhtiyaç: {{gorev}}'),
P('reverse-api','Reverse API Engineer','⌘','API','İzinli API belgelerinden şema çıkarır.','Yalnızca inceleme iznin olan OpenAPI, resmi belgeler veya örnek istek/yanıtlardan API haritası çıkar. Auth aşma, sır çıkarma veya izinsiz erişim önerme.\n\nİzinli materyal: {{gorev}}'),
P('api-client','API İstemci Üreticisi','⇆','API','Fetch, timeout ve hata yönetimi.','API sözleşmesine göre küçük istemci taslağı üret. Timeout, iptal, JSON doğrulama ve hata yönetimi ekle; anahtarı kaynak koda gömme.\n\nAPI: {{gorev}}'),
P('database','SQL ve Veri Modeli','▦','Veri','Tablo, ilişki ve migration.','Primary/foreign key, unique kuralı, indeks, migration/rollback ve örnek sorguları tasarla. Veri kaybı riskini belirt.\n\nİhtiyaç: {{gorev}}'),
P('json','JSON Dönüştürücü','{}','Veri','JSON Schema ve doğrulama.','Geçerli JSON örneği, JSON Schema, zorunlu/isteğe bağlı alanlar ve doğrulama hataları üret.\n\nVeri: {{gorev}}'),
P('regex','Regex Yardımcısı','.*','Veri','Regex ve pozitif/negatif test.','Regex üret; hangi girdileri kabul/red ettiğini açıkla ve olumlu/olumsuz test örnekleri ver.\n\nİhtiyaç: {{gorev}}'),
P('docs','Dokümantasyon Yazarı','▤','Dokümantasyon','README, kurulum ve kullanım.','Gerçek özelliklere bağlı kurulum, yapılandırma, kullanım, hata giderme, sınırlama ve güvenlik belgeleri yaz. Komut uydurma.\n\nProje: {{gorev}}'),
P('changelog','Changelog Hazırlayıcı','◷','Dokümantasyon','Added, Changed, Fixed, Security.','Değişiklikleri Added, Changed, Fixed, Security başlıklarına ayır. Doğrulanmamış işleri tamamlandı diye gösterme.\n\nDeğişiklikler: {{gorev}}'),
P('release','Sürüm Kontrol Listesi','☑','Dokümantasyon','Build, test, lisans ve teslim.','Build, test, gerçek cihaz doğrulaması, izin, gizli anahtar, lisans, yedek, rollback ve release notlarını denetle. Kanıtsız adımı tamamlandı işaretleme.\n\nSürüm: {{gorev}}'),
P('github-review','GitHub PR İnceleyici','⑂','Geliştirme','Diff ve geriye uyumluluk.','Paylaşılan diff/PR içeriğini kırılma, test kapsamı, geriye uyumluluk ve güvenlik açısından incele. Merge kararı verme.\n\nPR/diff: {{gorev}}'),
P('notion','Notion Bilgi Düzenleyici','▣','Üretkenlik','Notları wiki ve karara dönüştürür.','Notları başlık, özet, kararlar, açık sorular, görevler ve kaynaklar olarak düzenle. Sahip/tarih uydurma.\n\nNotlar: {{gorev}}'),
P('game-architecture','Oyun Sistem Mimarı','◇','Oyun Geliştirme','Modüler oyun sistemi planı.','Oyun özelliğini modüllere ayır. Veri akışı, olaylar, performans bütçesi, MVP ve test planı yaz.\n\nÖzellik: {{gorev}}'),
P('babylon','Babylon.js Uzmanı','⬡','Oyun Geliştirme','Sahne, kamera, fizik ve optimizasyon.','Babylon.js özelliğini tasarla. Sahne yaşam döngüsü, kaynak temizliği, input, kamera, fizik ve düşük donanım performansını ele al.\n\nÖzellik: {{gorev}}'),
P('unity','Unity Oyun Yardımcısı','◈','Oyun Geliştirme','Unity C# bileşenleri.','Unity C# bileşenlerini tasarla. Serialized alanlar, lifecycle, event temizliği, sahne geçişleri ve test edilebilirliği belirt.\n\nÖzellik: {{gorev}}'),
P('blender','Blender Varlık Planlayıcısı','◉','Oyun Geliştirme','Model, UV ve GLB export.','Oyun varlığı için ölçek, origin, topology, UV, materyal, LOD, collision ve GLB export planı hazırla.\n\nVarlık: {{gorev}}'),
P('npc','NPC Diyalog Tasarımcısı','☷','Oyun Geliştirme','Tutarlı dallanan diyalog.','NPC için dallanan diyalog oluştur. Karakter sesi, oyuncu seçimleri, koşullar ve lokalizasyon anahtarlarını ayır.\n\nSahne: {{gorev}}'),
P('level-design','Level Design Tasarımcısı','⌖','Oyun Geliştirme','Akış, keşif ve bulmaca.','Oyuncu akışı, görüş hatları, yönlendirme, keşif, ipuçları, zorluk eğrisi ve erişilebilirlik için bölüm tasarla.\n\nBölüm: {{gorev}}'),
P('uiux','UI / UX Gözden Geçirici','▣','Tasarım','Mobil arayüz ve etkileşim.','Bilgi hiyerarşisi, dokunma hedefleri, okunabilirlik, durum geri bildirimi ve ekran boyutlarını incele. Küçük uygulanabilir düzeltmeler öner.\n\nArayüz: {{gorev}}'),
P('accessibility','Erişilebilirlik Kontrolü','◎','Tasarım','Semantik, odak ve kontrast.','Semantik HTML, etiketler, klavye, odak sırası, kontrast, hareket azaltma ve ekran okuyucu adlarını denetle.\n\nArayüz: {{gorev}}'),
P('research','Araştırma Sentezleyici','⌕','Araştırma','Kaynak ve kanıt karşılaştırması.','Kaynakları karşılaştır. Her kaynağın desteklediği iddiayı, çelişkileri, tarih farkını ve eksik kanıtı göster.\n\nKaynak/soru: {{gorev}}'),
P('prompt','Prompt Mühendisi','✧','AI Ajanları','Rol, bağlam ve çıktı şeması.','İhtiyacı rol, bağlam, girdiler, kısıtlar, adımlar, çıktı formatı ve başarısızlık durumları içeren isteme dönüştür.\n\nİhtiyaç: {{gorev}}'),
P('agent-team','AI Team Koordinatörü','♧','AI Ajanları','Ajan görevleri ve sentez.','İşi uzman ajanlara böl. Her ajana tek sorumluluk, girdi, çıktı ve kabul ölçütü ver. Bağımlılıkları ve birleştirme adımını yaz.\n\nİş: {{gorev}}'),
P('mobile-opt','Android / Mobil Optimizasyon','▣','Mobil','RAM, depolama, pil ve offline.','Android özelliğini RAM, depolama, pil, ağ kopması, yaşam döngüsü, izinler ve küçük ekran açısından incele. Cihazda doğrulanması gerekenleri ayır.\n\nÖzellik: {{gorev}}'),
P('bug-report','Hata Raporu Yazarı','⚑','Test','Tekrarlanabilir bug raporu.','Başlık, ortam, ön koşullar, tekrar adımları, beklenen/gerçek sonuç, sıklık, kanıt ve etki içeren hata raporu oluştur.\n\nSorun: {{gorev}}'),
P('translate','Teknik Çevirmen','文','Üretkenlik','Kod ve teknik terimleri korur.','Metni hedef dile çevir. Kod bloklarını, değişken/API isimlerini ve komutları koru. Terimleri tutarlı kullan.\n\nMetin/hedef dil: {{gorev}}'),
P('summary','Uzun Metin Özetleyici','≡','Üretkenlik','Karar, risk ve görev çıkarımı.','Metni ana fikir, kararlar, riskler, açık sorular ve yapılacak işler olarak özetle. İçerikte olmayan tarih/sorumlu ekleme.\n\nMetin: {{gorev}}')
]);
export const EXTERNAL_CONNECTOR_CATALOG=Object.freeze([
{id:'openrouter',name:'OpenRouter',category:'AI modelleri',status:'integrated',desc:'Sohbet ve ücretsiz model çoklu çağrısı.'},
{id:'apinex',name:'APInex',category:'AI modelleri',status:'integrated',desc:'İsteğe bağlı OpenAI uyumlu API geçidi; yalnızca free/* model kimlikleri kabul edilir. İstek ve istemler APInex üzerinden üst sağlayıcıya iletilir.'},
{id:'ollama',name:'Ollama (PC)',category:'Yerel AI',status:'integrated',desc:'Aynı güvenilir ağdaki bilgisayarda yerel model.'},
{id:'gguf',name:'Android GGUF',category:'Yerel AI',status:'integrated',desc:'Native llama.cpp ile telefonda yerel model.'},
{id:'openshorts',name:'OpenShorts MCP',category:'Video',status:'integrated',desc:'Video iş akışı; API anahtarı/kota gerekir.'},
{id:'openmausbot',name:'OpenMausBot',category:'Harici ajan',status:'external',url:'https://github.com/rj-liukaiwen/OpenMausBot',desc:'Ayrı masaüstü uygulaması, AI Studio içinde bağlı değil.'},
{id:'github',name:'GitHub',category:'Geliştirme',status:'planned',url:'https://github.com/',desc:'Repo ve PR işlemleri ayrı yetkilendirme gerektirir.'},
{id:'notion',name:'Notion',category:'Üretkenlik',status:'planned',url:'https://www.notion.so/',desc:'Sayfa/veritabanı API entegrasyonu henüz yok.'},
{id:'figma',name:'Figma',category:'Tasarım',status:'planned',url:'https://www.figma.com/',desc:'Dosya/tasarım verisi API entegrasyonu henüz yok.'},
{id:'mcp-generic',name:'Özel MCP',category:'MCP',status:'planned',desc:'İzin listesi ve kullanıcı onayıyla eklenebilir.'},
{id:'rea-companion',name:'REA Companion',category:'Yerel ajan',status:'contract',desc:'Mock sözleşmesi mevcut; canlı köprü etkin değil.'}
]);
export function normalizeEnabledPluginIds(values){
  const valid=new Set(PROMPT_PLUGIN_CATALOG.map(item=>item.id));
  if(!Array.isArray(values))return PROMPT_PLUGIN_CATALOG.map(item=>item.id);
  return [...new Set(values.filter(id=>typeof id==='string'&&valid.has(id)))];
}
export function filterPromptPlugins({enabledIds,query='',category='all'}={}){
  const enabled=new Set(normalizeEnabledPluginIds(enabledIds)),needle=String(query||'').trim().toLocaleLowerCase('tr-TR');
  return PROMPT_PLUGIN_CATALOG.filter(item=>(category==='all'||item.category===category)&&(!needle||[item.name,item.desc,item.category].join(' ').toLocaleLowerCase('tr-TR').includes(needle))).map(item=>({...item,enabled:enabled.has(item.id)}));
}

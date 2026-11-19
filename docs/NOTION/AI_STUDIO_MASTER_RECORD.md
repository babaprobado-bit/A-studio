## Proje özeti

AI Studio, web çalışma alanı ve Android/Capacitor uygulaması olarak geliştirilen; birden fazla yapay zekâ sağlayıcısını tek AI Team altında birleştiren, Skills Library ve ortak proje bağlamı sunan, PC Ollama / bulut API / Android GGUF Local Coder yollarını destekleyen bir yardımcı geliştirme ortamıdır.

- Resmî ürün adı: <b>AI Studio</b>. “Alpha 1” ürün adı değildir; yalnızca eski iç milestone adıdır.
- GitHub deposu: [babaprobado-bit/A-studio](https://github.com/babaprobado-bit/A-studio)
- Aktif geliştirme dalı: <code>feature/android-offline-skills-v1</code>
- PR: [#2 — AI Studio 1.1: Offline Local Coder + Skill Library](https://github.com/babaprobado-bit/A-studio/pull/2)

## Geliştirdiğimiz ana parçalar

### 1. AI Team ve sağlayıcı bağlantıları

AI Team toplam <b>10 motoru</b> destekleyecek şekilde genişletildi:

1. OpenAI
2. Anthropic / Claude
3. Google Gemini
4. DeepSeek
5. Groq
6. OpenRouter
7. Hugging Face Inference
8. Özel OpenAI uyumlu API
9. PC Ollama
10. Android cihaz içi GGUF

Dört sağlayıcı sınırı kaldırıldı; paralel ekip çalışması, sıralı pipeline, model karşılaştırma, kayıtlı ekip seçimi ve yedekten geri yükleme akışları tüm seçili motorları kapsayacak şekilde ele alındı. Android GGUF motoru tek sohbet, paralel ekip, sıralı pipeline ve model karşılaştırma yollarına bağlandı; canlı çağrıda yalnızca yerel Android ortamında model belleğe yüklenmişse kullanılmalı.

### 2. Ortak proje bağlamı ve Skills Library

- Aktif proje notları, isteğe bağlı proje dosyaları/snippet'leri ve seçilen genel Skills, sağlayıcı çağrılarına bağlandı.
- Shared Vault içinden görevle eşleşen referanslar kullanılabiliyor.
- Kod paylaşımı etkin olduğunda kaydedilmemiş editör tamponu da bağlam anlık görüntüsüne alınabiliyor.
- Local Coder'ın Plan / Code / Review aşamaları kendi aşama Skill'lerini kullanıyor.
- İçe aktarılan <code>SKILL.md</code> metin olarak ele alınıyor; otomatik çalıştırılmıyor.
- AI Team, Skills ve ortak bağlam kaynaklarını korumak temel proje kuralıdır; yeni işlerde bunlar budanmamalı.

### 3. Local Coder ve GGUF

- Üç yol birlikte ele alındı: bulut API sağlayıcıları, PC Ollama ve Android yerel GGUF.
- Onaylanan Local Coder taslağını uygulamak mevcut çalışma alanı dosyasına kaydeder; otomatik çalıştırmaz.
- Android tarafında Qwen2.5-Coder GGUF için 0.5B, 1.5B ve 3B Q4\_K\_M katalog girdileri kullanılıyor.
- İndirme köprüsünde dosya adı, HTTPS URL ve SHA-256 sabit katalogla eşleştiriliyor; yerel depolama kontrolü katalog boyutuna göre yapılıyor.
- Eksik / sıfır / geçersiz boş depolama ölçümü güvenli biçimde başarısız oluyor; bilinmeyen depolama ile indirme başlatılmıyor.
- İçe aktarma akışında boyut sınırı, kopyalama sırasında gerçek byte kontrolü, depolama rezervi, iptal kontrol noktaları ve kısmi dosya temizliği bulunuyor.
- Native model yükleme/boşaltma hatalarında JS tarafı gerçek native yüklenmiş model durumunu yeniliyor; model değiştirmede eski motor serbest bırakıldıktan sonra RAM ön kontrolü yapılıyor.
- Android DownloadManager için kalıcı pending kaydı, süreç kapanması sonrası görev ID'sini kurtarma, uygulama yeniden açıldığında aynı indirmeyi sürdürme ve yinelenen enqueue'yu önleme eklendi.
- Activity kapanırken aktif SAF import işlemleri iptal ediliyor; aktif import/indirme dosyaları temizlik sırasında korunuyor.

### 4. Android native runtime ve APK

Native GGUF Android derlemesi için Capacitor, Kotlin köprüsü, llama.kt / llama.cpp Android native hazırlığı ve Gradle assembleDebug hattı kuruldu.

<b>2026-11-08 doğrulanmış CI sonuçları (kaynak/test SHA: </b><b><code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code></b><b>):</b>

| Çıktı | Workflow | Sonuç | Artifact |
| --- | --- | --- | --- |
| Demo APK | [42472155238](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238) | Başarılı | [13613679600](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238/artifacts/13613679600) |
| Native GGUF APK | [42472155008](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008) | Başarılı | [13614626123](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008/artifacts/13614626123) |

- Demo artifact ZIP: 3,776,220 byte; SHA-256 <code>c49230bbcc6a98922d6056d7daacb34a944cf288837c7f65b89b537212ef4f77</code>.
- Demo APK: 4,134,919 byte; SHA-256 <code>9933e6bad111f2bce75f071d54c9016f2525ed04ccb919c07aa300328c02d2</code>.
- Native artifact ZIP: 18,158,764 byte; SHA-256 <code>b1f7421d9b8d7f10a8d38301b9abda2597daa073657d5ecc8fa6871123304c4f</code>.
- Native APK: 54,497,680 byte; SHA-256 <code>cb1ce07516acca97033630cd7d3004b85a9125823045f11274888e729a1e8d8e</code>.
- Native APK içinde <code>arm64-v8a/libllamakt.so</code>, <code>libOpenCL.so</code> ve <code>libc++_shared.so</code> var; GGUF ağırlıkları APK içine gömülü değil.
- Manifest: package <code>com.aistudio.alpha1</code>, versionName <code>1.1.0</code>, versionCode <code>2</code>, minSdk <code>29</code>, targetSdk / compileSdk <code>35</code>.
- Gradle 8.11.1 dağıtımı SHA-256 sabitlenerek, 120 saniye ağ zaman aşımı ve yalnızca geçici ağ/DNS hatalarına sınırlı retry ile kullanıldı. İlk Kotlin compiler indirme denemesi HTTP 502 ile başarısız oldu; ikinci deneme tamamlandı ve Gradle <code>BUILD SUCCESSFUL</code> verdi.

<b>Önemli sınır:</b> Bu iki çıktı debug APK'dır; Native APK <code>debuggable=true</code>. İmzalı production release değildir.

### 5. Testler ve CI

CI'da şu alanları kapsayan otomatik kontroller çalıştırıldı:

- Local Coder API
- AI Team
- Skills
- Device Local Coder / GGUF köprüsü
- Workshop
- Site/login özel kontrolü
- REA contract mock testleri
- Vite build
- Capacitor Android proje üretimi ve sync
- Gradle debug APK derlemesi ve artifact yükleme

Session 5'te yeni regresyon testleri; indirme pending-marker kurtarma, DownloadManager ID eşleştirme, yeniden başlatma sonrası görev geri yükleme, aynı indirmeyi sürdürme, duplicate enqueue olmaması, farklı model seçilince eski görevin korunması, import teardown iptali ve katalog/depolama denetimlerini kapsadı.

### 6. REA / MCP sınırı

REA Companion için yalnızca izole, salt-okunur sözleşme doğrulayıcı ve mock testleri eklendi. Üç izinli işlem şeması, kullanıcı tarafından seçilen göreli dosya yolları, istek/sonuç sınırları, açık bildirim, sağlayıcılara otomatik veri aktarılmaması, hata temizleme ve loopback origin/Host kontrolleri ele alındı.

<b>Gerçek REA bağlantısı kurulmadı:</b> paket yüklenmedi, süreç/listener başlatılmadı, eşleştirme yapılmadı ve gerçek MCP bağlantısı açılmadı. Bu sınır açık onay olmadan değiştirilmeyecek.

### 7. Güvenlik incelemesi

- Native sağlayıcı API anahtarları ve native Shared Vault token'ı SecureStoragePlugin üzerinden tutuluyor.
- Web preview sağlayıcı anahtarlarını yalnızca bellekte tutuyor.
- Genel workspace snapshot allowlist'i sağlayıcı anahtarlarını ve native vault token'ını dışarıda bırakıyor.
- İsteğe bağlı dışa aktarılan şifreli yedek: PBKDF2-SHA-256, 250.000 iterasyon, AES-256-GCM.
- Sunucu Shared Vault tarafında AES-256-GCM ve en az 32 karakter şifreleme sırrı kontrolü bulunuyor.
- Android manifest'te <code>allowBackup=true</code> ve uygulama genelinde <code>usesCleartextTraffic=true</code> saptandı. İkincisi mevcut güvenilir LAN Ollama HTTP yolunu koruyor ancak tüm uygulama kapsamındadır.
- Production release öncesi Android yedekleme / restore / secret exclusion ve LAN Ollama'yı bozmayan daha dar cleartext ağ politikası incelenmeli.
- Bu debug checkpoint'te bu bayraklar sessizce değiştirilmemeli.

## Proje kararları ve değişmez kurallar

- <code>main</code> dalına doğrudan değişiklik yok.
- PR #2 açık, Draft ve merge edilmemiş kalmalı; merge veya Ready for review için ayrıca açık onay gerekir.
- En son kontrol edilen branch HEAD: <code>269beafc466c4d4dd13d46bd8a23574ed019c412</code>.
- <code>main</code> SHA: <code>aab010319b6500002844bd24b11da85dd9ca3b00</code>.
- AI Team'in 10 motoru, tüm sağlayıcı bağlantıları, Skills Library, ortak proje/vault bağlamı ve Local Coder API/Ollama/GGUF yolları korunmalı.
- Gerçek cihaz kurulumu, model indirme/içe aktarma, GGUF inference, RAM ölçümü veya uçak modu testi yapılmadı. CI bunları kanıtlamaz; kullanıcıdan şu anda telefon veya bilgisayar testi istenmemeli.
- REA mock-only kalmalı.

## Açık işler / sonraki aşama

- [ ] Android auto-backup ve SecureStoragePlugin restore davranışını kaynak kod üzerinden incele; secret/session dışlama politikasını belirle.
- [ ] LAN Ollama'yı bozmadan cleartext trafik kapsamını daraltma tasarımını çıkar ve regresyon testleri ekle.
- [ ] Local Coder model yükleme/boşaltma, RAM ölçümü ve lifecycle davranışını kaynak seviyesinde denetle.
- [ ] Değişiklikleri CI ile doğrula; gerçek cihaz testi yapılmış gibi raporlama.
- [ ] Production release için debuggable=false, imzalama ve yedekleme/ağ politikası gereksinimlerini tamamla.

## Önemli bağlantılar

- [GitHub deposu](https://github.com/babaprobado-bit/A-studio)
- [PR #2](https://github.com/babaprobado-bit/A-studio/pull/2)
- [Session 5 kaynak/test commit'i](https://github.com/babaprobado-bit/A-studio/commit/90e5da287cc8d50859402cdbf99ccdb533e3360a)
- [Son handoff commit'i](https://github.com/babaprobado-bit/A-studio/commit/269beafc466c4d4dd13d46bd8a23574ed019c412)
- [Demo Actions](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238)
- [Native Actions](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008)
- [Handoff klasörü](https://github.com/babaprobado-bit/A-studio/tree/feature/android-offline-skills-v1/docs/HANDOFF)

## Kaynak notları

Bu Notion sayfası GitHub deposundaki handoff kayıtları, PR #2 açıklaması ve 2026-11-08 doğrulanmış Actions/artifact sonuçlarından derlenmiştir. Daha eski Session 1–4 CI kayıtları tarihsel ilerleme olarak depodaki handoff belgelerinde korunur; yukarıdaki en son checkpoint onların yerini alır.

---

# Master Plan — AI Studio yol haritası ve çoklu yapay zekâ ekibi

<quote color="blue_bg">
Ana hedef: AI Studio'yu 10 mevcut motorunu ve bütün mevcut özelliklerini koruyan; bulut, yerel modeller, GitHub, Notion ve diğer geliştirme araçlarını kontrollü şekilde aynı çalışma alanında buluşturan çoklu-AI geliştirme platformuna dönüştürmek.
</quote>

<b>Planın durumu:</b> Bu bölüm, 2026-11-09 tarihinde eklenen ana yol haritasıdır. "Tamamlandı" olarak işaretlenenler önceki kaynak/CI kayıtlarıyla desteklenen işlerdir. "Planlandı" veya "Öneri" olarak işaretlenenler henüz uygulanmış sayılmaz.

## A. Değişmez proje kuralları

1. Geliştirme yalnızca <code>feature/android-offline-skills-v1</code> dalında yürütülür. <code>main</code> dalına doğrudan commit/push yapılmaz.
2. PR #2 açık, Draft ve merge edilmemiş kalır. Kullanıcı açıkça onaylamadan merge veya Ready for review yapılmaz.
3. Her görevden önce GitHub'daki canlı branch HEAD, PR durumu ve hedef dosyalar yeniden okunur. Eski Notion/handoff SHA'ları güncel gerçek kabul edilmez.
4. On AI Team motoru, sağlayıcı bağlantıları, Skills Library, proje/vault bağlamı, API/Ollama/GGUF Local Coder ve mevcut ekranlar korunur. Yeni özellikler bunların üzerine eklenir.
5. Telefon/bilgisayar testi istenmez. Kaynak kod, test ve GitHub Actions kanıtı kullanılır; CI sonucu gerçek cihaz kabulü gibi gösterilmez.
6. API anahtarı, token, şifre, özel env değeri veya kişisel erişim anahtarı GitHub commit'ine ya da Notion sayfasına yazılmaz.
7. GitHub/Notion gibi dış sistemlerde varsayılan erişim salt-okunur olur. Yazma işlemleri ayrı yetki, dar kapsam ve kullanıcı onayıyla açılır.
8. REA Companion mock-only kalır. Gerçek süreç, listener, pairing, dosya erişimi veya MCP bağlantısı için ayrıca açık kullanıcı onayı gerekir.

## B. Ürün mimarisi — hedef yapı

### 1. AI Team katmanı

- Mevcut 10 motor korunur: OpenAI, Claude, Gemini, DeepSeek, Groq, OpenRouter, Hugging Face, özel OpenAI uyumlu API, PC Ollama ve Android GGUF.
- Her motor için tek tip provider adapter sözleşmesi kullanılır: model seçimi, yetenekler, mesaj/bağlam formatı, tool/function calling, timeout, hata sınıfları ve maliyet/limit metadatası.
- Provider'ın desteklemediği tool-calling özelliği varmış gibi davranılmaz. Model yalnızca metin döndürebiliyorsa ilgili araçlar o çağrıda kapatılır veya güvenli biçimde orchestrator tarafından yürütülür.
- Paralel Team, sıralı pipeline, model karşılaştırma, tekil sohbet ve kayıtlı ekip seçimi aynı provider registry üzerinden çalışır.
- Her motor için bağlantı testi, kullanılabilir model listesi, zaman aşımı, rate-limit yönetimi ve açık hata mesajı hedeflenir.

### 2. Ortak Connector / MCP katmanı — yeni ana geliştirme

<b>GitHub ve Notion, AI modelleri değil; AI Studio'nun bağlanacağı dış araç/veri kaynaklarıdır.</b> Hedef, bu bağlantıları tek bir Connector Manager üzerinden yönetmek ve uygun izinlerle seçilen AI motorlarına araç olarak sunmaktır.

Önerilen mimari:

- Connector Registry: kurulu bağlantılar, sağlayıcı türü, kapsam, bağlantı durumu ve yetki seviyesi.
- MCP/REST adapters: mümkün olduğunda resmî MCP sunucusu; gerekirse sağlayıcının resmî API'sine özel adapter.
- Tool Router: modelin talep ettiği aracı doğrular, izinleri denetler ve çağrıyı yürütür.
- Approval Gate: dosya yazma, commit, PR güncelleme, Notion düzenleme ve benzeri değişikliklerden önce kullanıcı onayı.
- Audit Log: hangi modelin hangi aracı, hangi proje ve izin kapsamıyla çağırdığı; sonuç ve hata özeti. Gizli içerikler loglanmaz.
- Context Bridge: yalnızca seçilmiş dosya, sayfa ve kayıtlar modele aktarılır; tüm çalışma alanı varsayılan olarak paylaşılmaz.
- Offline davranış: bağlantı yoksa araç devre dışı/çevrimdışı görünür; modelin var olmayan GitHub/Notion verisini uydurmasına izin verilmez.

### 3. İlk connector kapsamı

<b>GitHub — ilk sürümde salt-okunur:</b>

- Repository ve dizin ağacı görüntüleme.
- Seçilmiş dosyaları ve commit farklarını okuma.
- Branch, commit, PR, issue ve review durumlarını inceleme.
- GitHub Actions run, job ve artifact durumlarını görüntüleme.
- Sonraki aşamada, yalnızca feature dalına dosya commit etme ve PR açıklaması güncelleme gibi kontrollü yazma işlemleri.
- <code>main</code> için yazma, force-push, merge ve branch silme araçları kapalı/izin dışı olacak.

<b>Notion — ilk sürümde seçilmiş AI Studio proje sayfası:</b>

- İzin verilmiş proje sayfalarını arama ve okuma.
- Master plan, görev, handoff ve karar kayıtlarını güncelleme.
- Notion'a yalnızca kullanıcı tarafından onaylanan teknik özetler aktarılır.
- Token, API anahtarı, ham özel env veya gereksiz kişisel veri Notion'a gönderilmez.

<b>Aktif connector listesi — kullanıcı kararı, 2026-11-14:</b>

1. GitHub — repository, branch, commit, PR ve Actions/CI. GitHub Actions ayrı connector değildir.
2. Notion — AI Studio master planı, teknik kayıtlar, handoff ve kararlar.
3. OpenShorts — video kesme/klip iş akışı için mevcut MCP entegrasyonu.
4. OpenMausBot — bilgisayarda çalışan ayrı MausBot ajan ekibine yerel MCP bağlantısı.
5. REA Companion — açık eşleştirme ile, yalnızca seçilmiş proje/dosyalara erişen yerel salt-okunur analiz bağlantısı.
6. Reverse API Engineer — izinli API dokümanı, şema ve kullanıcı tarafından sağlanan trafik çıktılarından API yüzeyini inceleme; tipli istemci ve test taslağı üretme. Yetkisiz erişim, kimlik doğrulama atlatma veya sır/anahtar çıkarma kapsam dışıdır.

<b>Aktif kapsamdan çıkarıldı / şimdilik yapılmayacak:</b>

- Google Drive / Docs
- Slack / Discord
- Linear / Jira
- Figma
- Ayrı GitHub Actions connector'ı (GitHub bağlantısının içinde kalır)
- Cursor ve VS Code Copilot için yerel AI Studio plugin'i. Bunlar harici geliştirme istemcileri olarak kalır; AI Studio'ya ikinci bir connector katmanı eklenmez.

Bu karar yeni entegrasyon sayısını altı temel bağlantıyla sınırlar. Kullanıcı yeni bir ihtiyaç belirtmedikçe başka plugin eklenmez.

## C. Geliştirme aşamaları ve teslim ölçütleri

### Aşama 0 — Canlı başlangıç kontrolü

- [x] Repo, aktif dal, PR ve eski handoff kaynakları belirlendi.
- [x] En son kayıtlı checkpoint'te PR #2 açık/Draft/unmerged; <code>main</code> değişmemiş.
- [ ] Her yeni oturumda canlı HEAD, PR head/base, son workflow ve artifact listesi yeniden kontrol edilecek.
- [ ] Eski CI SHA'ları ile yeni source SHA'ları ayrı tutulacak; hangi APK'nın hangi kaynak commit'inden üretildiği açık yazılacak.

### Aşama 1 — Android güvenlik ve yayın hazırlığı

<b>Öncelik: yüksek; Session 6'nın ilk işi.</b>

- [ ] Android auto-backup ve Data Extraction Rules davranışını incele.
- [ ] SecureStoragePlugin anahtarlarının Android yedekleme/geri yükleme ve cihaz değişimi davranışını kaynak koddan doğrula.
- [ ] Provider anahtarları, session token ve vault token için yedek dışlama/geri yükleme politikasını tasarla.
- [ ] <code>usesCleartextTraffic=true</code> kapsamını daraltma tasarımı çıkar; güvenilir LAN Ollama HTTP akışını bozma.
- [ ] Manifest, network security config ve backup kuralları için statik/otomatik testler ekle.
- [ ] Debug APK ile signed release ayrımını koru; production için <code>debuggable=false</code>, imzalama ve sürüm yükseltme şartlarını yazılı hale getir.

<b>Çıkış kapısı:</b> Gizli veriler yedeklere sızmıyor; LAN Ollama davranışı korunuyor; testler ve CI geçiyor.

### Aşama 2 — Local Coder RAM, model lifecycle ve import

- [ ] Model boyutu, mimari, quantization ve gerçek cihazın kullanılabilir RAM/storage bilgisi üzerinden güvenli model uygunluk kontrolünü geliştir.
- [ ] RAM verisi bilinmiyorsa güvenli şekilde model yüklemeyi durdur; tahmini değerleri gerçek ölçüm gibi gösterme.
- [ ] Model load/unload, model değiştirme, uygulamanın arka plana alınması ve Activity teardown senaryolarını gözden geçir.
- [ ] Bellek bırakıldıktan sonra RAM preflight yapılmasını ve eski model referanslarının temizlenmesini test et.
- [ ] İndirme devam ettirme, checksum, yarım dosya temizliği, iptal ve import limitlerini regresyon testlerinde koru.
- [ ] GGUF model seçimini desteklenen ABI/uyumluluk ve cihaz kapasitesine göre açıkça raporla.

<b>Çıkış kapısı:</b> Mock/regresyon testleri tüm hata yollarını kapsıyor; yerel cihaz testi olmadan gerçek inference doğrulandı denmiyor.

### Aşama 3 — Connector Manager: GitHub + Notion

- [ ] Connector arayüzünü ve veri modellerini tasarla.
- [ ] GitHub ve Notion için salt-okunur ilk adapter'ları ekle.
- [ ] OAuth/token'ları Android SecureStoragePlugin veya uygun güvenli runtime storage ile sakla; uygulama loglarına yazma.
- [ ] Connector izin ekranı: hangi repo/branch, hangi Notion sayfası, hangi araçlar erişilebilir gösterilsin.
- [ ] Tool Router, JSON schema doğrulama, timeout, rate limit, hata temizleme ve audit log ekle.
- [ ] Seçilen sayfa/dosyaların kaynak bağlantısı ve SHA/tarih bilgisi context'e iliştirilsin.
- [ ] İlk aşamada dış sistemlere yazma kapalı olsun.
- [ ] OpenMausBot için isteğe bağlı yerel stdio MCP adaptörü tasarla; ilk sürüm bot/kanal listesi, görev durumu ve seçilmiş konuşma kayıtlarını okumayla başlasın. Bot oluşturma, iş gönderme, model değiştirme ve kesme gibi değişiklikler ayrı onay ister.
- [ ] Salt-okunur akış testleri tamamlandıktan sonra feature-branch commit ve belirli Notion sayfası güncellemesi gibi kontrollü yazma araçları ayrı ayrı açılsın.

<b>Çıkış kapısı:</b> Her AI motoru yalnızca izin verilen kaynakları görür; yazma işlemi varsayılan olarak kapalıdır; kullanıcı onayı ve testler çalışır.

### Aşama 4 — AI Team'e ortak araç kullanımı

- [ ] Tool calling destekleyen sağlayıcılarda ortak araç şeması sun.
- [ ] Her sağlayıcıya aynı araçların güvenli provider-adapter dönüşümünü uygula.
- [ ] Paralel Team çağrılarında aynı yazma aracının iki kez çalışmasını önle; idempotency ve görev kilidi kullan.
- [ ] Pipeline adımlarında araç sonuçlarını kontrollü biçimde sonraki aşamaya aktar.
- [ ] Model/araç eşleşmesini ve başarısız connector çağrılarını görünür kıl.
- [ ] Tool kullanamayan modellerde açık fallback davranışı göster; sahte araç başarısı üretme.

<b>Çıkış kapısı:</b> İki veya daha fazla AI motoru aynı connector'ı aynı izin sistemi üzerinden çağırabilir; testler veri sızıntısı ve yinelenen yazmayı engeller.

### Aşama 5 — İlave AI modelleri ve harici reviewer'lar

- [ ] Gemini mevcut 10 motordan biridir; Gemini CLI'nin MCP desteği ayrı bir geliştirici aracı entegrasyonu olarak değerlendirilsin.
- [ ] xAI Grok, 11. AI Team motoru adayıdır. Resmî xAI API / Responses API ve function calling üzerinden adapter tasarla; API anahtarı ekleme, model seçimi ve ücret uyarıları ayrı izinle yapılmalı.
- [ ] Grok'un kendi GitHub/Notion connector'ları ile AI Studio içindeki xAI model provider'ı birbirinden ayrı kavramlar olarak ele alınmalı.
- [ ] Cursor ve VS Code GitHub Copilot, IDE tabanlı kod inceleme/uygulama araçları olarak desteklenen MCP istemcileri listesine alınsın; AI Team provider sayısına dahil edilmesin.
- [ ] Her yeni motor için model adı, API endpoint, tool-calling uyumu, multimodal yetenek, rate limits ve fiyat güncel resmî dokümandan doğrulansın.

<b>Çıkış kapısı:</b> Yeni motor mevcut 10 motoru değiştirmeden eklenir; sağlayıcı testleri ve model karşılaştırma testleri geçer.

### Aşama 6 — Skills Library ve ortak bağlamın tamamlanması

- [ ] Skill metadata, isim, açıklama, etiket, sürüm, lisans ve uyumluluk görüntülemesini tamamla.
- [ ] Import/preview akışında içeriği metin olarak analiz et; kullanıcı onayı olmadan komut/script çalıştırma.
- [ ] Global Skills ile görev/proje özel Skills önceliğini ve çakışma çözümünü belgele.
- [ ] Shared Vault referanslarının yalnızca ilgili görevde ve seçilen izinle kullanılmasını test et.
- [ ] Yedek dışa/içe aktarmada gizli anahtarların dışarıda kalmasını doğrula.

### Aşama 7 — REA Companion / MCP (opsiyonel ve izinli)

- [x] Salt-okunur REA contract validator ve mock testleri mevcut.
- [ ] Tehdit modeli, threat boundary ve pairing protokolünü ayrıca gözden geçir.
- [ ] Gerçek REA bağlantı geliştirmesi kullanıcı onayıyla başlatılacak. Kullanıcının açık talebi: 2026-11-14. Bu onay geliştirmeye başlama iznidir; canlı bağlantı henüz uygulanmış veya test edilmiş değildir.
- [ ] Kullanıcı seçimi olmadan proje dosyası tarama, araç çalıştırma, model sağlayıcısına veri iletme veya otomatik pairing yok.
- [ ] İzin iptali, oturum sonlandırma, loopback origin, Host doğrulama ve path sınırı testlerini tamamla.

### Aşama 8 — UI/UX, performans ve release

- [ ] Connector bağlantı durumu, izin kapsamı, son senkron ve bağlantı hataları için sade ekran.
- [ ] AI Team panelinde 10 mevcut motor ve varsa yeni motorlar; model kapasitesi ve connector araç kullanımı görünür olsun.
- [ ] Offline/online durumları ve yerel model hazır/değil durumları doğru gösterilsin.
- [ ] Uzun işlemlerde iptal, devam ettirme, ilerleme ve hata kurtarma sağlansın.
- [ ] Tüm regresyon, build, Android paketleme, secret scan, dependency ve lisans kontrolleri CI'da çalışsın.
- [ ] Signed production release, sürümleme, changelog, yedekleme/geri yükleme ve geri dönüş planı hazırla.

<b>Nihai kabul:</b> Tüm önceki özellikler korunmuş; tüm otomatik testler geçiyor; production güvenlik kapıları tamam; fiziksel cihazda doğrulanmamış davranışlar ayrıca "cihaz testi bekliyor" olarak işaretlenmiş.

## D. Claude + ChatGPT + diğer AI'larla ortak çalışma protokolü

<b>Amaç:</b> Her modelin aynı proje gerçeğine bakması; farklı AI'ların birbirinin değişikliklerini bozmasını ve birbirinden habersiz aynı dosyaya yazmasını engellemek.

### Roller

- <b>ChatGPT / proje koordinatörü:</b> Notion master planını ve handoff'u güncel tutar; canlı GitHub durumunu kontrol eder; görevleri küçük parçalara böler; CI sonuçlarını ve kanıtları doğrular; PR/main kurallarını korur.
- <b>Claude / ikinci mühendis ve kod denetçisi:</b> Aynı GitHub reposunu ve bu Notion planını bağladıktan sonra hedef dosyaları inceler; alternatif çözüm, risk analizi ve kod review hazırlar; değişiklik yapacaksa önce görev/branch/HEAD bilgisiyle çalışır.
- <b>Gemini / bağımsız test ve mimari inceleme:</b> Alternatif tasarım, edge-case, Android/JavaScript uyumluluğu ve test kapsamı için ikinci görüş verir.
- <b>Grok / dış kaynak ve ikinci kod incelemesi:</b> Güncel teknik doküman, sağlayıcı yenilikleri, GitHub/Notion bağlantıları ve alternatif çözüm değerlendirmesinde yardımcı olabilir.
- <b>Cursor / VS Code Copilot:</b> Gerekirse yerel editörde dosya bazlı uygulama ve hızlı iterasyon için kullanılır; ana karar ve kanıt Notion/GitHub'a yazılır.

### Birlikte çalışma kuralları

1. Her görev için bir <b>yazma sahibi</b> seçilir. Claude ve ChatGPT aynı dosyaları aynı anda değiştirmez.
2. Diğer AI'lar önce salt-okunur review yapar; dosyayı yazacak agent görevi üstlenmeden değişiklik yapmaz.
3. Her handoff şu alanları taşır: görev adı, amaç, repo, branch, başlangıç SHA, dokunulan dosyalar, yapılan değişiklik, test komutları/sonuçları, bilinen riskler ve sonraki adım.
4. Bir AI'nın önerisi otomatik kabul edilmez; diğer AI bağımsız olarak diff ve test kanıtını inceler.
5. GitHub'da değişiklik yalnızca feature branch'e gider. PR #2 merge edilmez; <code>main</code> değiştirilmez.
6. Notion, plan/karar/handoff için ortak kayıt yeridir; GitHub ise gerçek kaynak kod ve CI kanıtının kaynağıdır.
7. Her yeni oturum başında Claude veya diğer AI'ya bu Notion sayfası ile ilgili handoff belgeleri okutulur; ayrıca GitHub'daki canlı HEAD kontrol ettirilir.
8. Gizli anahtarlar Notion'a veya AI sohbetine yapıştırılmaz. OAuth/connector izinleri en az yetkiyle verilir; her AI uygulamasına ayrı erişim tanımlanır.

### Görev handoff şablonu

```txt
AI STUDIO — TASK HANDOFF
Task:
Repo: babaprobado-bit/A-studio
Branch: feature/android-offline-skills-v1
Start SHA:
PR: #2 (Draft; do not merge)
Scope:
Allowed files:
Forbidden changes: main branch, unrelated providers, existing AI Team/Skills/context features
Work performed:
Tests and exact results:
CI run / artifact:
Open risks:
Next step:
Reviewer notes:
```

## E. Hangi AI'lar GitHub ve Notion'a bağlanabilir?

Bu, <b>AI Studio içindeki model sağlayıcısı</b> olmak ile <b>harici GitHub/Notion bağlantısını kullanabilen ayrı bir AI uygulaması</b> olmak arasındaki farktır. İkisi aynı şey değildir.

| AI / araç | GitHub | Notion | Bağlantı yöntemi / not |
| --- | --- | --- | --- |
| ChatGPT | Evet | Evet | Bu çalışma alanında GitHub ve Notion araçları zaten kullanıldı; bağlı izin kapsamı geçerlidir. |
| Claude | Evet | Evet | Claude'un GitHub repository bağlantısı ve resmî Notion MCP connector'ı var. Repo ve Notion erişimi Claude hesabında ayrıca yetkilendirilir. |
| Grok | Evet | Evet | Grok connector kataloğunda ikisi de listeleniyor; custom MCP de destekleniyor. Hesap/plan/kurum ayarlarına göre erişim değişebilir. |
| Gemini CLI | Evet | Evet | MCP sunucuları <code>settings.json</code> içinden bağlanabilir. Bu, standart Gemini web sohbetiyle aynı değildir; CLI geliştirici aracıdır. |
| Cursor | Evet | Evet | GitHub MCP ve Notion MCP ile IDE içinden çalışabilir. |
| VS Code + GitHub Copilot | Evet | MCP ile mümkün | GitHub'ın resmî MCP server'ı Copilot Chat/IDE ile kullanılabilir; Notion için Notion MCP uyumlu istemci gerekir. |

<b>AI Studio için notlar:</b>

- Gemini zaten mevcut 10 AI Team motorundan biridir.
- Claude da mevcut 10 motor içindedir; Claude uygulamasının GitHub/Notion connector'larını bağlamak, Anthropic API üzerinden AI Studio'da Claude modelini çağırmaktan farklıdır.
- Grok şu an mevcut 10 motor listesinde değildir. xAI API, function calling ve Remote MCP desteklediğinden, Grok'u 11. AI Team motoru yapmak teknik olarak değerlendirilebilir; henüz eklenmiş veya test edilmiş değildir.
- AI Studio'nun kendi GitHub/Notion Connector Manager'ı henüz bu plan kapsamında öneridir; yukarıdaki harici uygulama connector'larının çalışması, AI Studio uygulamasının içinden otomatik çalıştığı anlamına gelmez.

### Claude bağlantı kurulumu — kullanıcı hesabında yapılacak adımlar

1. Claude'da <b>Settings / Connectors</b> veya sohbet içindeki connector ekleme alanını aç.
2. GitHub connector'ını seç; yalnızca <code>babaprobado-bit/A-studio</code> deposuna erişim ver. Gerekli dosya/dizinleri seçip senkronize et.
3. Notion connector'ını ekle. Resmî Notion MCP adresi: <code>https://mcp.notion.com/mcp</code>.
4. Notion erişiminde bu AI Studio master plan sayfası ve ilgili handoff sayfalarıyla sınırlı kal.
5. Claude'dan ilk olarak yalnızca planı ve kaynakları okumasını, henüz hiçbir commit/merge veya Notion düzenlemesi yapmamasını iste.
6. İlk karşılaştırmalı görev: Session 6 güvenlik kontrol listesine bağımsız review; ChatGPT'nin bulgularıyla farklar Notion'a karar kaydı olarak girilir.

<b>Önemli:</b> Buradan Claude hesabına giriş yapıldığı veya Claude bağlantısının kurulduğu iddia edilmiyor. GitHub ve Notion erişimi Claude arayüzünde hesap sahibinin OAuth onayıyla tamamlanmalı.

## F. Güncel resmî entegrasyon kaynakları

- [Notion MCP — desteklenen AI uygulamaları ve güvenlik](https://www.notion.com/help/notion-mcp)
- [Notion connector for Claude](https://claude.com/connectors/notion)
- [Claude GitHub integration](https://support.claude.com/en/articles/10167454-use-the-github-integration)
- [Grok connectors — GitHub, Notion ve custom MCP](https://docs.x.ai/grok/connectors)
- [Gemini CLI MCP server configuration](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- [GitHub's official MCP Server in IDEs](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/copilot-for-common-tasks/use-the-github-mcp-server)
- [xAI function calling](https://docs.x.ai/developers/tools/function-calling)
- [xAI remote MCP tools](https://docs.x.ai/developers/tools/remote-mcp)

## G. Bu güncellemeden sonra öncelikli sıra

1. <b>Şimdi:</b> Claude'u aynı GitHub deposuna ve Notion master planına bağla; önce read-only review.
2. <b>Session 6:</b> Android backup/secret restore, cleartext/LAN Ollama ve Local Coder lifecycle/RAM denetimi.
3. <b>Session 7:</b> GitHub + Notion Connector Manager tasarımı ve salt-okunur adapter'lar.
4. <b>Session 8:</b> Connector araçlarını AI Team motorlarına ortak Tool Router ile sunma.
5. <b>Session 9:</b> Grok'u 11. motor olarak değerlendirme ve Gemini/Claude tool routing testleri.
6. <b>Session 10:</b> Skills/Shared Vault/REA izin sınırları, UI/UX ve release güvenlik kapıları.
7. Her aşama: küçük görev → tek yazma sahibi → bağımsız AI review → regresyon testleri → GitHub Actions → Notion handoff.

---

<b>Plan güncelleme notu — 2026-11-09:</b> AI Studio geçmişi ile önerilen gelecek mimarisi açıkça ayrıldı. Claude, Grok, Gemini CLI, Cursor ve Copilot bağlantıları dış AI uygulamalarının desteklediği entegrasyon biçimleri olarak listelendi; hiçbir harici hesap bağlantısının bu sayfadan otomatik kurulduğu iddia edilmiyor.

---

# H. Claude ve Grok için kesin erişim / çalışma kuralları

<b>Kullanıcı kararı — 2026-11-09:</b> Grok ve Claude çalışma için hazır. Claude'un şu anki bağlantısı yalnızca Notion; Claude'a GitHub erişimi verilmiş değildir. Bu ayrım bilinçli olarak korunacaktır.

## H.1 Claude — Notion-only rolü

Claude, AI Studio için <b>Notion proje sekreteri ve bağımsız plan/teknik doküman denetçisi</b> olarak çalışır. GitHub ajanı değildir.

### İzin verilenler

- Bu AI Studio master plan sayfasını ve kullanıcı tarafından ayrıca açıkça paylaşılan AI Studio Notion sayfalarını okumak.
- Planın tutarsızlıklarını, eksik gereksinimleri, çelişkili görevleri ve riskleri işaretlemek.
- Teknik alternatif, test senaryosu ve güvenlik kontrol listesi önermek.
- Yalnızca kendisine ayrılmış “Claude Review Notes” bölümüne tarihli inceleme notu eklemek.
- Her notta “doğrulanmış gerçek”, “öneri”, “soru” ve “henüz doğrulanmadı” ayrımını göstermek.
- Görev tamamlandığında kısa bir handoff hazırlamak: bulgu, kaynak sayfa, etkilenen bölüm, risk, öneri, test ihtiyacı ve ChatGPT/Grok için inceleme notu.

### Yasak / yetki dışında olanlar

- GitHub'a erişimi varmış gibi davranmak veya canlı branch, commit, PR, Actions, artifact ya da dosya durumunu doğruladığını söylemek.
- GitHub connector istemek, GitHub OAuth bağlantısı başlatmak, repo ayarı değiştirmek veya kullanıcı adına GitHub'da işlem yapmak.
- Kodun commit edildiğini, test edildiğini, CI'dan geçtiğini ya da APK üretildiğini kanıtsız iddia etmek.
- Master planın ana kararlarını, güvenlik kurallarını, geçmiş doğrulama kayıtlarını veya başka AI'ların notlarını izinsiz silmek / yeniden yazmak.
- Notion sayfasını taşımak, paylaşmak, herkese açmak, kullanıcı davet etmek, erişim yetkisini değiştirmek veya başka çalışma alanlarına kopyalamak.
- Yeni Notion database, entegrasyon, otomasyon veya dış bağlantıyı kendiliğinden oluşturmak.
- Kaynak kodu, secret, API key, token, parola, özel .env içeriği veya kişisel veriyi Notion'a yapıştırmak.
- Kullanıcı onayı olmadan dışarı veri göndermek veya bir Notion bağlantısını herkese açık hale getirmek.

### Claude'un her oturum başında uygulayacağı sıra

1. Önce bu master planın tamamını ve kendisine açık olan AI Studio handoff sayfalarını oku.
2. Bağlantısının yalnızca Notion olduğunu kabul et. GitHub'a bakmış gibi konuşma.
3. Sayfadaki son doğrulama tarihini kontrol et. Tarihi geçmiş her SHA / Actions / PR bilgisini <b>“eski checkpoint — canlı doğrulama gerekli”</b> olarak etiketle.
4. İstenen görev için öneri ve risk analizi hazırla. Kaynak dosya içeriği yoksa dosyanın içeriğini tahmin etme.
5. Bulguları sadece “Claude Review Notes” bölümüne ekle. Ana planı tek taraflı değiştirme.
6. ChatGPT/Grok'un GitHub'dan getirdiği yeni kanıtlarla karşılaştırılmayı bekle.
7. Çelişki varsa iki sürümü de koru; kanıt olmadan birini doğru ilan etme.

## H.2 Grok — bağımsız GitHub/Notion denetçisi

Kullanıcının Grok bağlantısı hazır olarak bildirilmiştir; ancak bu belge tek başına Grok hesabının gerçek OAuth kapsamını veya bağlantı durumunu doğrulamaz.

Grok için hedef rol: <b>bağımsız araştırmacı ve salt-okunur kod/CI denetçisi.</b>

- GitHub bağlantısı verildiyse sadece AI Studio deposuna ve gerekli branch/PR/Actions kapsamına erişim kullan.
- İlk aşamada GitHub'da read-only çalış. Push, commit, branch silme, PR değiştirme/merge, repo görünürlüğü veya ayar değişikliği yapma.
- Notion'a erişimi varsa yalnızca bu AI Studio sayfası ve açıkça seçilen proje sayfalarıyla sınırla.
- Notion'a yalnızca ayrı bir “Grok Review Notes” bölümüne tarihli bulgu ekle. Ana planı silme veya yeniden düzenleme.
- Kaynak, commit SHA, dosya yolu, workflow run ID ve kanıt olmadan “başarılı” deme.
- Claude'un Notion notlarını bağımsız gerçek olarak kabul etme; ChatGPT'nin GitHub kanıtıyla karşılaştır.
- Grok'un connector yetkisi salt-okunur değilse, yazma işlemlerini kullanma; kullanıcıdan önce yetki kapsamını daraltmasını iste.

## H.3 ChatGPT — proje koordinatörü ve GitHub çalışma sahibi

- Canlı GitHub kaynağını kontrol eder, branch/PR/CI/artifact kanıtını doğrular ve Notion ana planının teknik doğruluğunu korur.
- Kod görevi verildiğinde yalnızca açıkça belirtilen feature branch ve dosyalarda çalışır.
- <code>main</code> dalına commit/push yapmaz; force-push, merge, PR'ı Draft'tan çıkarma, branch silme veya repo ayarı değiştirme yapmaz.
- Repo görünürlüğü, collaborator, Actions secret, OAuth scope ve güvenlik ayarı gibi hesap düzeyi değişiklikleri ayrı, açık onay olmadan yapmaz.
- Claude'un Notion notlarını ve Grok'un salt-okunur review'larını değerlendirir; doğrulamadan öneriyi uygulamaz.
- Her kod değişikliğinde başlangıç SHA, diff, test ve CI kanıtını kaydeder.

## H.4 Üçlü çalışma ve anlaşmazlık çözümü

1. Tek bir görevde bir yazma sahibi olur. Diğer AI'lar inceleme yapar.
2. Claude'un yetkisi Notion ile sınırlı kalır; GitHub kodunu değiştiremez.
3. Grok'un hedefi salt-okunur GitHub/Notion review'dur.
4. ChatGPT, kod işi için tek yazma koordinatörüdür; kullanıcı yeni düzen belirlemedikçe bu kural değişmez.
5. Aynı dosyaya aynı anda iki AI yazmaz.
6. Her öneri önce diff ve test kanıtıyla doğrulanır.
7. İki AI anlaşamazsa otomatik karar verilmez. Bulgular, dayanakları ve eksik kanıt Notion'da ayrı ayrı yazılır.
8. İnsan/kullanıcı onayı gerektiren güvenlik veya dış sistem işlemleri AI'ların kendi aralarında aldığı kararla yürütülmez.

## H.5 Claude'a verilecek başlangıç talimatı

Aşağıdaki talimatı Claude'a Notion sohbetinde ver:

```txt
AI STUDIO — CLAUDE NOTION-ONLY REVIEW MODE

You are the Notion documentation reviewer for AI Studio.
Your only connected source of truth is the AI Studio Notion master plan and the explicitly shared AI Studio Notion pages.

IMPORTANT ACCESS LIMIT:
- You have Notion access only.
- You do NOT have GitHub access.
- Do not request GitHub access or start a GitHub OAuth flow.
- Never claim that you checked live repository files, branches, commits, pull requests, GitHub Actions, APK artifacts, or CI.
- Any GitHub status recorded in Notion is a dated snapshot, not live proof.

PROJECT RULES:
- Product name: AI Studio (not AI Studio Alpha 1).
- Preserve all 10 existing AI Team engines and their provider connections.
- Preserve Skills Library, shared project/vault context, Local Coder API/Ollama/GGUF, and all existing features.
- PR #2 stays open, Draft, and unmerged.
- The main branch must not be changed.
- Do not invent completed work, test results, commits, artifacts, or device validation.
- No phone/PC tests are to be requested.
- REA Companion remains mock-only. No real process, listener, pairing, file access, or MCP connection.
- Never ask the user to paste API keys, passwords, tokens, private environment variables, or secrets into Notion or chat.

YOUR TASK:
1. Read the full AI Studio master plan and relevant shared handoff pages.
2. Review for contradictions, missing requirements, unsafe assumptions, unclear acceptance criteria, and incomplete test coverage.
3. Separate confirmed facts from recommendations and unknowns.
4. Add dated findings only to the “Claude Review Notes” section of the existing master plan.
5. Do not delete, rewrite, move, share, publish, or change permissions on any page.
6. Do not create new databases, integrations, automations, or public links.
7. If source code is needed, state exactly which file and evidence is missing; do not guess.
8. Finish with a review report containing: findings, severity, affected plan section, rationale, proposed fix, and required verification by ChatGPT/Grok using GitHub.

You are a reviewer, not the GitHub code writer. Wait for the user to assign a specific review task.
```

## H.6 Notion güvenlik uyarısı — talimat ile gerçek erişim aynı şey değildir

Yukarıdaki kurallar Claude'a verilen çalışma talimatlarıdır; teknik izin duvarı değildir. Notion connector'ın gerçek erişim kapsamı ayrıca kontrol edilmelidir:

- Mümkünse Claude'a tüm workspace yerine yalnızca AI Studio master planı ve gerekli handoff sayfaları paylaşılmalı.
- Claude'un Notion bağlantısı bütün workspace'i okuyabiliyorsa, yalnızca prompt'a güvenilmemeli; Notion bağlantı/ paylaşım ayarlarından kapsam daraltılmalı.
- Claude'un yazma izni gerekmiyorsa read-only tercih edilmeli. Yazma gerekiyorsa sadece review notu ekleyeceği sayfa kapsamıyla sınırlı tutulmalı.
- Herhangi bir AI bağlantısı için parola veya API key sohbet içinde paylaşılmamalı.

---

# I. GitHub gizlilik kontrolü — mevcut engel ve güvenli taşıma planı

<b>Canlı doğrulama tarihi: 2026-11-09.</b>

- Repo: <code>babaprobado-bit/A-studio</code>
- Mevcut görünürlük: <b>PUBLIC</b>
- Repo metadata'sında <code>fork=true</code>.
- Parent repo: <code>benbam-commits/A-studio</code>, o da public.
- Bu nedenle GitHub, bu public fork'un görünürlüğünü tek başına private yapmaya izin vermiyor. GitHub'ın kuralı: public fork, upstream repo ağına bağlı olduğu sürece public kalır; fork'un görünürlüğü tek başına değiştirilemez.

### Neden şimdi ayarı değiştirmedik?

GitHub API/entegrasyonunda private görünürlüğü ayarlamak mümkün görünse bile bu public fork kısıtını aşmaz. Denemek başarısız olur ve sorunu çözmez. Mevcut PR #2, branch ve Actions akışını bozmamak için fork ağından ayrılma veya mevcut depoyu silme işlemi yapılmadı.

### Güvenli çözüm önerisi: ayrı, yeni bir private repo

Önerilen yol, mevcut public fork'a dokunmadan bağımsız bir private repo hazırlamaktır. Örnek ad: <code>AI-Studio-Private</code>.

Taşıma kontrol listesi:

- [ ] Önce yeni private repo boş olarak oluşturulur; henüz eski public repo silinmez.
- [ ] Tüm Git commit geçmişi ve gerekli branch'ler (özellikle <code>main</code> ve <code>feature/android-offline-skills-v1</code>) private kopyaya taşınır.
- [ ] Branch HEAD SHA'ları kaynak repo ile karşılaştırılarak birebir doğrulanır.
- [ ] Handoff dokümanları, GitHub Actions workflow dosyaları ve proje kaynak ağacı kontrol edilir.
- [ ] Yeni private repo'da Actions izinleri, secrets, variables, environments, artifact saklama, workflow çalıştırma ve gerekiyorsa branch protection yeniden kurulur. Bunlar normal Git mirror ile otomatik taşınmaz.
- [ ] PR #2'nin GitHub PR kaydı yeni repo'ya otomatik taşınmaz; aynı branch farkı üzerinden yeni PR açılması gerekebilir. Eski PR kaydı eski public repo'da kalır.
- [ ] Grok'a yeni private repo için gereken en düşük GitHub erişimi verilir; Claude Notion-only kalır.
- [ ] Yeni private repo baştan sona doğrulanana kadar eski public repo silinmez, detach edilmez veya değiştirilmez.
- [ ] Taşıma tamamlandıktan sonra eski public repo hakkında ayrıca karar verilir. Silme/detach işlemi ayrı ve geri dönüşü zor olduğu için otomatik yapılmaz.

### Public kalmış eski içerik konusunda dürüst uyarı

Yeni bir private repo açmak, daha önce public olmuş kaynak kodun internetteki kopyalarını, klonlarını veya başka fork'larını geri alamaz. GitHub'ın belgelerine göre ana public repo private yapılınca mevcut public fork'lar public kalıp ayrı ağa ayrılır. Bu nedenle “private kopyaya geçiş” gelecekteki geliştirmeyi korur; geçmişteki tüm görünürlüğü geriye dönük yok etmez.

### Kaynaklar

- [GitHub — Visibility of forks](https://docs.github.com/en/pull-requests/reference/forks)
- [GitHub — Setting repository visibility](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility)
- [GitHub — Detaching a fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/detaching-a-fork)

<b>Şu anki güvenli durum:</b> Eski public fork'a dokunulmadı. Yeni private repo henüz oluşturulmadı. Bir sonraki adım, mevcut PR/branch/CI kayıtlarını kaybetmeden özel bir kopyaya taşımak için ayrı onaylı geçiştir.

---

<b>Güvenlik planı güncelleme notu — 2026-11-09:</b> Claude'un Notion-only erişimi, Grok'un hedeflenen salt-okunur inceleme rolü ve ChatGPT'nin GitHub çalışma sahipliği ayrı ayrı tanımlandı. Canlı GitHub kontrolü, public fork kısıtı nedeniyle mevcut deponun doğrudan private yapılamayacağını doğruladı.

---

# J. İlk onaylı güvenlik kararı — A-studio-private geçişi

<b>Kullanıcı onayı alındı: 2026-11-09.</b> Yeni bağımsız private GitHub deposu <code>babaprobado-bit/A-studio-private</code> oluşturulması ve mevcut public fork'taki proje kodu ile Git geçmişinin bu özel depoya taşınması onaylandı.

## Onaylanan kapsam

- Yeni hedef: <code>babaprobado-bit/A-studio-private</code>
- Görünürlük: <b>Private</b>
- Kaynak: <code>babaprobado-bit/A-studio</code> (public fork)
- Taşınacaklar: tüm Git commit geçmişi, <code>main</code>, <code>feature/android-offline-skills-v1</code> ve mevcut diğer branch/tag referansları.
- Handoff belgeleri ve GitHub Actions workflow dosyaları korunacak.
- Yeni private depo doğrulanana kadar mevcut public depo, PR #2 ve Actions geçmişi silinmeyecek veya değiştirilmeden korunacak.
- Yeni depo oluşturulduktan sonra branch SHA'ları ve dosya ağacı kaynak depoyla karşılaştırılacak.
- GitHub Actions secrets/variables, environment secrets, deploy keys, webhook'lar ve repo permission ayarları normal Git mirror ile taşınmaz; bunlar ayrı ayrı ve gizli değerleri kopyalamadan yeniden kurulacak.
- Eski public depodaki PR #2 yeni depoya otomatik taşınmaz. Yeni depoda gerekirse aynı feature branch üzerinden yeni bir PR açılması ayrı adımdır.
- Claude yalnızca Notion erişiminde kalır. Grok'un yeni private depoya erişimi en az yetkiyle ve ayrı izinle verilir.
- Bu onay private repo oluşturma ve kopyalama içindir; eski public kaynağı silme, fork'u detach etme, geçmişteki public klonları silmeye çalışma, PR merge etme veya <code>main</code> dalını değiştirme yetkisi vermez.

## Uygulama kontrol listesi

- [ ] Yeni private <code>A-studio-private</code> deposunu oluştur.
- [ ] Kaynak depodaki tüm branch ve tag referanslarını listele.
- [ ] Bütün Git geçmişini private depoya mirror et.
- [ ] Her branch/tag SHA'sını kaynakla karşılaştır.
- [ ] Recursive dosya ağacını ve handoff / workflow dosyalarını karşılaştır.
- [ ] Yeni private depoda Actions izinlerini ve gerekli workflow ayarlarını kontrol et.
- [ ] Gerekli Actions secrets/variables değerlerini kullanıcı kendi GitHub Secrets alanına güvenli biçimde yeniden girsin; sohbet/Notion üzerinden kopyalama yapma.
- [ ] GitHub Actions'ı private depoda çalıştırıp sonuçları doğrula.
- [ ] Grok'un private depoya read-only erişimini doğrula; Claude Notion-only kalır.
- [ ] Yeni private hedef tamamen doğrulanana kadar eski public repo ve PR #2'yi koru.
- [ ] Sonraki aşamada eski public depoyu nasıl ele alacağına kullanıcıyla ayrıca karar ver.

<b>Durum:</b> Taşıma onaylandı; teknik uygulama ve SHA karşılaştırmaları tamamlanmadan "taşındı" olarak işaretlenmeyecek.

---

# I.1 Kullanıcı onayı — A-studio-private geçişi

<b>Tarih:</b> 2026-11-09<br /><b>Durum:</b> <span color="green">Kullanıcı tarafından açıkça onaylandı</span>

Kullanıcı, mevcut public fork'u değiştirmeden yeni bağımsız bir private GitHub deposu oluşturulmasını onayladı.

- Yeni depo adı: <code>A-studio-private</code>
- Hedef hesap: <code>babaprobado-bit</code>
- Hedef görünürlük: <b>Private</b>
- Kaynak: <code>babaprobado-bit/A-studio</code> (mevcut public fork)
- Taşınacak içerik: commit geçmişi ve gerekli branch'ler; özellikle <code>main</code> ve <code>feature/android-offline-skills-v1</code>.
- Kaynak public depo: taşıma doğrulanana kadar korunacak; silinmeyecek, yeniden adlandırılmayacak ve fork ayarı değiştirilmeyecek.
- Yeni private depo: doğrulama tamamlanmadan eski deponun yerine geçtiği ilan edilmeyecek.
- PR #2: eski public depodaki PR kaydı otomatik taşınmaz. Yeni private depoda aynı branch farkı doğrulandıktan sonra ayrı bir PR açılması gerekebilir.
- GitHub Actions secrets, variables, environments, artifact history, branch protection ve repository settings Git mirror ile otomatik taşınmaz; ayrıca yeniden oluşturulup doğrulanmalıdır.
- Eski public içeriğin daha önce alınmış kopyaları, arşivleri ve fork'ları geriye dönük gizlenemez.
- Kaynakta bulunan lisans ve üçüncü taraf atıfları korunmalıdır. Kaynak repository Apache-2.0 lisanslı göründüğünden LICENSE/NOTICE ve upstream atıfları taşınmalıdır; lisans koşulları değiştirilmeden korunur.

## Taşıma sırası

- [x] Kullanıcı onayı kaydedildi.
- [ ] Private hedef repo oluştur.
- [ ] Kaynak branch ve commit listesini canlı kaynaktan al.
- [ ] Git geçmişini ve gerekli branch'leri hedefe aktar.
- [ ] Kaynak ve hedef branch SHA'larını karşılaştır.
- [ ] LICENSE/NOTICE, handoff docs ve workflow dosyalarını doğrula.
- [ ] GitHub Actions ayarları/secrets/environments için yeniden kurulum kontrol listesi oluştur.
- [ ] PR #2 için yeni private repo PR planı çıkar; otomatik merge yapma.
- [ ] Claude Notion-only kalır; Grok ve ChatGPT için yeni private repo erişimi en az yetkiyle ayrıca denetlenir.
- [ ] Eski public repo üzerinde silme, detach veya görünürlük değişikliği için ayrıca karar alınır.

<b>Güvenlik ilkesi:</b> Yeni private hedef repo oluşturulması, kaynak public fork'un içeriğini geriye dönük özel hale getirmez. Hedef doğrulanmadan kaynak repo değiştirilmeyecek.

---

# J. Kullanıcı onayı — private repo geçişi başlatıldı (2026-11-09)

<callout icon="🔒" color="green_bg">
<b>Kullanıcı açıkça onayladı:</b> Yeni özel deponun adı <code>A-studio-private</code> olacak. AI Studio kaynak kodu, commit geçmişi ve gerekli branch'ler yeni bağımsız private depoya taşınacak.
</callout>

## Onaylanan kapsam

- Hedef repo: <code>babaprobado-bit/A-studio-private</code>
- Görünürlük: <b>Private</b>
- Kaynak repo: <code>babaprobado-bit/A-studio</code> (mevcut public fork)
- Korunacak geliştirme dalı: <code>feature/android-offline-skills-v1</code>
- Korunacak mevcut ana dal: <code>main</code> (kaynak SHA: <code>aab010319b6500002844bd24b11da85dd9ca3b00</code>, canlı taşıma öncesi tekrar doğrulanacak)
- Korunacak geliştirme PR kaydı: eski depodaki PR #2; yeni depoya PR kaydı otomatik taşınmaz. Yeni depoda karşılaştırma ve PR açılması gerekirse ayrı adım olarak yapılır.
- Taşıma hedefi: tüm gerekli branch'ler, commit geçmişi, proje kaynakları, dokümantasyon ve GitHub Actions workflow dosyaları.

## Kesin güvenlik sınırları

1. Kaynak public repo <b>silinmeyecek, private yapılmaya çalışılmayacak, detach edilmeyecek ve değiştirilmeden bırakılacak</b>.
2. Yeni private repo oluşturulmadan veya taşıma yapılmadan önce repo adı ve mevcut repo çakışması kontrol edilir.
3. Commit geçmişi ve branch SHA'ları korunarak taşınması hedeflenir. GitHub API ile birebir mirror mümkün değilse, bu sınırlama açıkça raporlanır; geçmişi kaybettiren dosya-kopyalama yöntemi “tam taşıma” diye sunulmaz.
4. <code>main</code> dalında yeni commit, force-push veya merge yapılmaz. Yeni depoda da <code>main</code> yalnızca kaynakta doğrulanan mevcut geçmişin kopyası olarak korunur.
5. Önce private repo ve branch'ler doğrulanır; Actions workflow'ları, secrets, variables, environments, branch protections ve PR kayıtları ayrıca ele alınır. Secrets ve environment değerleri otomatik taşındı varsayılmaz.
6. Yeni private repo, bağımsız doğrulama tamamlanana kadar Grok/Claude veya başka bir AI'ya yazma yetkisiyle paylaşılmaz. Claude'un mevcut Notion-only rolü korunur.
7. Grok'a yeni depoda yalnızca gerekli minimum GitHub erişimi verilir; ilk inceleme salt-okunur olur.
8. Eski public repo hakkında silme/arşivleme/detach kararı bu geçişin parçası değildir ve ayrıca değerlendirilir.

## Taşıma sırası ve doğrulama kapıları

- [ ] Kaynak repo, varsayılan branch, tüm branch'ler, tag'ler, son SHA'lar ve repo boyutu canlı olarak kaydedilir.
- [ ] <code>A-studio-private</code> adının boşta olduğu doğrulanır.
- [ ] Bağımsız private repo oluşturulur.
- [ ] Git mirror/import yöntemiyle tüm branch, tag ve commit geçmişi aktarılır.
- [ ] Kaynak ve hedef branch/tag SHA'ları karşılaştırılır; commit grafiği doğrulanır.
- [ ] Proje dosyaları ve handoff dokümanları hedefte kontrol edilir.
- [ ] GitHub Actions workflow dosyaları kontrol edilir; gerekli secrets/variables/environments hedef repoda güvenli biçimde tekrar tanımlanır.
- [ ] Yeni private repo Actions CI çalıştırması tamamlanır; artifact ve workflow kanıtları kaydedilir.
- [ ] Gerekirse yeni PR oluşturulur; eski PR #2 kaynak depoda tarihsel kayıt olarak kalır.
- [ ] Notion'daki repo bağlantıları ve gelecek oturum starter'ı yeni private repo adresine göre güncellenir.
- [ ] Taşıma doğrulandıktan sonra eski public repo için ayrıca güvenlik ve görünürlük kararı alınır.

## Gerçekleşme durumu

<b>Bu bölüm onayı kaydeder; tek başına repo oluşturulduğu veya dosyaların taşındığı anlamına gelmez.</b> Her aşama ancak GitHub sonucu doğrulandıktan sonra tamamlandı olarak işaretlenir.

### Public içerik hakkında uyarı

Mevcut kaynak depo public olduğundan, daha önce klonlanan veya fork edilen kopyalar geri alınamaz. Private kopyaya geçiş gelecekteki geliştirmeyi korur fakat geçmişteki public erişimi geriye dönük yok etmez.

## I.2 Taşıma uygulama günlüğü — 2026-11-09

<b>Private hedef oluşturuldu.</b>

### Doğrulanan ilerleme

- [x] Kullanıcı onayı Notion'a kaydedildi.
- [x] [A-studio-private](https://github.com/babaprobado-bit/A-studio-private) oluşturulmuş/tespit edilmiş ve canlı GitHub API ile <code>private=true</code>, <code>fork=false</code> olarak doğrulandı.
- [x] Hedef depo açıklaması, taşımanın henüz tamamlanmadığını doğru gösterecek şekilde güncellendi.
- [x] Kaynak <code>A-studio</code> branch referansları canlı olarak kaydedildi:
  - <code>main</code> → <code>aab010319b6500002844bd24b11da85dd9ca3b00</code>
  - <code>feature/android-offline-skills-v1</code> → <code>269beafc466c4d4dd13d46bd8a23574ed019c412</code>
  - <code>feature/local-coder-reuse-0-5</code> → <code>4cfa859ea179c04e9967a8ed891c9ac01553770a</code>
- [x] Kaynakta tag olmadığı doğrulandı.
- [x] Özel hedefe tek seferlik mirror workflow eklendi ve GitHub tarafından workflow olarak tanındı.
- [x] Workflow yalnızca <code>refs/heads/*</code> ve <code>refs/tags/*</code> aktaracak; GitHub'ın gizli <code>refs/pull/*</code> referanslarına dokunmayacak.
- [x] Workflow sonunda kaynak ve hedef branch/tag SHA listelerini birebir karşılaştıracak.
- [x] GitHub Actions token izin kısıtını aşmak için hedef repo ile sınırlı <code>MIRROR_TOKEN</code> secret'ı bekleyecek; token değeri hiçbir yere yazılmayacak.

<b>Son mirror workflow commit'i:</b> [5edf64b25ede754bd470586177d85ad9c3ab31be](https://github.com/babaprobado-bit/A-studio-private/commit/5edf64b25ede754bd470586177d85ad9c3ab31be)

<b>Taşıma henüz tamamlanmadı.</b> Hedef depoda şu an yalnızca <code>main</code> ve tek seferlik taşıma workflow'u bulunuyor; kaynak kod, kaynak commit geçmişi ve feature branch'ler henüz aktarılmış değil.

### Gerekli kullanıcı işlemi — MIRROR\_TOKEN

Hedef depoda şu anda GitHub Actions secret listesi boş; <code>MIRROR_TOKEN</code> henüz yok. Workflow'u çalıştırmadan önce şu tek seferlik yetki hazırlanmalı:

1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
2. Token name: <code>AI-Studio-One-Time-Mirror</code>.
3. Resource owner: <code>babaprobado-bit</code>.
4. Repository access: <b>Only select repositories</b> → yalnızca <code>A-studio-private</code>.
5. Repository permissions:
   - <b>Contents: Read and write</b>
   - <b>Workflows: Read and write</b>
   - Diğer izinleri verme; varsayılan metadata okuma yeterli.
6. Kısa süreli expiration seç (ör. 1 gün veya 7 gün).
7. Token değerini GitHub'da hedef repo → Settings → Secrets and variables → Actions → New repository secret alanına ekle:
   - Name: <code>MIRROR_TOKEN</code>
   - Secret: az önce oluşturulan token
8. Token'ı sohbete, Notion'a veya başka AI'ya gönderme. Kullanıcı tarafından secret eklendikten sonra workflow'u çalıştırmak için geri dön.

Taşıma başarıyla tamamlanıp doğrulandıktan sonra <code>MIRROR_TOKEN</code> Actions secret'ını sil ve fine-grained token'ı revoke et. Token sadece bu taşıma için kullanılmalı.

### Sonraki doğrulama kapıları

- [ ] <code>MIRROR_TOKEN</code> hedef depoya eklendi.
- [ ] <code>One-time migration mirror</code> workflow'u <code>main</code> üzerinden çalıştırıldı ve başarılı bitti.
- [ ] Hedefteki üç branch adı ve SHA kaynakla birebir eşleşti.
- [ ] Kaynak/target tag referansları karşılaştırıldı (şu an kaynakta tag yok).
- [ ] Hedef tree'de kaynak dosyaları, <code>LICENSE</code>, handoff belgeleri ve GitHub Actions workflow'ları bulunduğu doğrulandı.
- [ ] Hedef repo size / commit history dolu olduğu kontrol edildi.
- [ ] GitHub Actions secrets, variables, environments, artifact history ve branch protection ayrıca yapılandırıldı.
- [ ] Grok'un yeni private hedefe erişimi ve Claude'un Notion-only sınırı yeniden kontrol edildi.
- [ ] Eski public kaynak repo bu adımların tamamı doğrulanana kadar korunacak.

### Başarısız denemelerin notu

Önceki iki geçici deneme başarısız oldu ve gerçek kaynak branch'lerini taşımadı:

- Run [42631753136](https://github.com/babaprobado-bit/A-studio-private/actions/runs/42631753136): workflow-token'ı workflow dosyalarını yazmaya yetmedi; ayrıca <code>refs/pull/*</code> gizli referansları reddedildi.
- Run [42631939907](https://github.com/babaprobado-bit/A-studio-private/actions/runs/42631939907): geçersiz GitHub Actions permission anahtarı yüzünden job başlamadı.

Bu iki deneme başarısız olarak kaydedildi; başarılı taşıma kanıtı değildir.

<b>Kaynak koruma:</b> <code>babaprobado-bit/A-studio</code> public fork'una hiçbir değişiklik yapılmadı. Eski PR #2, <code>main</code> ve feature branch'ler kaynakta korunuyor. Yeni private repo doğrulanmadan eski kaynak silinmeyecek veya değiştirilmeyecek.

---

## İlk görev onayı — Private GitHub deposuna geçiş

<b>Kullanıcı onayı: 2026-11-09</b>

Kullanıcı, AI Studio için yeni ve bağımsız bir private GitHub deposu oluşturulmasını ve mevcut kodun tam Git geçmişiyle taşınmasını onayladı.

- Yeni depo adı: <code>A-studio-private</code>
- Hedef sahip: <code>babaprobado-bit</code> GitHub hesabı
- Kaynak depo: [babaprobado-bit/A-studio](https://github.com/babaprobado-bit/A-studio)
- Kaynak depo canlı kontrolde public ve <code>fork=true</code>; parent depo <code>benbam-commits/A-studio</code>.
- Public fork doğrudan private yapılamadığı için eski repo üzerinde visibility değiştirme, detach veya silme denenmeyecek.
- Öncelik: yeni private repo oluşturmak ve <code>main</code> ile <code>feature/android-offline-skills-v1</code> başta olmak üzere gerekli branch/ref geçmişini eksiksiz taşımak.
- Taşıma tamamlanmadan kaynak public repo silinmeyecek, detach edilmeyecek veya değiştirilmeyecek.
- Kaynak branch HEAD son kontrolde <code>269beafc466c4d4dd13d46bd8a23574ed019c412</code>; <code>main</code> SHA <code>aab010319b6500002844bd24b11da85dd9ca3b00</code>. Taşıma başlamadan canlı değerler yeniden kontrol edilmeli.
- GitHub Actions secrets/variables, environments, permissions, branch protection ve artifact ayarlarının Git geçmişiyle otomatik taşınmadığı kabul edilmeli; eksik ayarlar ayrıca envanterlenmeli ve güvenli şekilde yeniden kurulmalı.
- PR #2 eski repoda açık, Draft ve unmerged kalacak; hiçbir merge yapılmayacak. Yeni private depoda PR yeniden oluşturulacaksa ayrıca durumu ve farkları kaydedilecek.
- API key, token, parola ve .env sırları taşınmayacak veya Notion'a yazılmayacak. Public geçmişte sır bulunduğuna dair bulgu çıkarsa ilgili secret iptali/rotasyonu önerilecek.
- Yeni private repo doğrulanmadan eski repo üzerinde geri dönüşü zor işlem yapılmayacak.
- Bu onay yalnızca private repo oluşturma ve kopyalama/migrasyon içindir; merge, eski repoyu silme veya public fork ağından koparma onayı değildir.

<b>Durum:</b> Onay verildi; migrasyon henüz gerçekleştirilmedi. İlk sonraki oturum görevi, canlı GitHub durumunu kontrol ederek yeni private repo oluşturmak ve tüm gerekli Git refs/geçmişini doğrulanabilir biçimde taşımaktır.

---

# Claude Review Notes

<b>Tarih:</b> 2026-11-09 · <b>Rol:</b> Notion-only plan/doküman denetçisi (GitHub erişimi yok) · Bu bölüm sayfanın sonuna eklendi; mevcut hiçbir bölüm silinmedi veya değiştirilmedi.

Etiketler: <b>\[Gerçek\]</b> sayfadan okunan, <b>\[Bulgu\]</b> Claude'un çıkarımı, <b>\[Öneri\]</b>, <b>\[Doğrulanmadı\]</b> GitHub gerektiren, Claude'un göremediği.

## Bulgular (öncelik sırasıyla)

### 1. Yüksek — Mirror hedefinde <code>main</code> zaten dolu

- \[Gerçek\] I.2'ye göre <code>A-studio-private</code> içinde şu an yalnızca <code>main</code> (mirror workflow commit'i 5edf64b) var. Kaynak <code>main</code> ise <code>aab0103</code>.
- \[Bulgu\] Kaynak <code>main</code>'i hedefe birebir aktarmak hedefteki <code>main</code>'in üzerine yazılmasını gerektirir ve mirror workflow dosyasını <code>main</code>'den siler. "main'e force-push yok" kuralı kaynak repo için yazılmış; hedef için açık istisna yok.
- \[Öneri\] Karar kaydı düşülsün: "Hedef <code>main</code> yalnızca kaynak <code>main</code>'in birebir kopyası olarak, kullanıcı onayıyla güncellenebilir." Alternatif: workflow ayrı bir tooling branch'inde tutulur.
- \[Doğrulanmadı\] Workflow dosyasının içeriği görülmedi.

### 2. Yüksek — MIRROR\_TOKEN geniş yetkili

- \[Gerçek\] Token'a Contents ve Workflows için read/write isteniyor.
- \[Öneri\] Süre 1 gün, yalnızca <code>A-studio-private</code>; iş bitince Secret silinsin ve token revoke edilsin. Workflow çalışmadan önce Grok veya ChatGPT dosyayı okusun: token log'a basılmıyor mu, üçüncü taraf action varsa commit SHA'sına sabitli mi.

### 3. Orta — Demo APK SHA-256 değeri hatalı görünüyor

- \[Gerçek\] "Android native runtime ve APK" bölümünde Demo APK hash'i 62 hex karakter; SHA-256 64 olmalı. Diğer üç hash 64 karakter.
- \[Bulgu\] Büyük ihtimalle kopyalama hatası; kayıt şu haliyle doğrulama kanıtı sayılamaz.
- \[Öneri\] Artifact'tan yeniden hesaplanıp düzeltilene kadar "doğrulanmadı" sayılsın.

### 4. Orta — Public geçmiş için secret taraması görevi yok

- \[Gerçek\] Plan "sır bulunursa rotasyon önerilecek" diyor ama taramayı görev olarak tanımlamıyor.
- \[Öneri\] Aşama 1'e görev eklensin: tüm branch'lerde tam geçmiş secret taraması. Bulunan her anahtar taşımadan bağımsız iptal/rotate edilsin; public geçmiş zaten dışarıda.

### 5. Orta — Güvenlik düzeltmeleri hangi repoda yapılacak?

- \[Gerçek\] Android <code>allowBackup=true</code> ve <code>usesCleartextTraffic=true</code> bulguları public sayfada ve public repodaki handoff'larda belgeli.
- \[Bulgu\] Session 6 düzeltmeleri public fork'a gitmesi zayıflık ve düzeltme planını herkese açık bırakır.
- \[Öneri\] Session 6 yazma işleri yalnızca <code>A-studio-private</code> doğrulandıktan sonra, orada yapılsın.

### 6. Orta — Session 6 için kaynak dosyalar Claude'da yok

- \[Bulgu\] Backup, cleartext ve Local Coder yaşam döngüsü incelemesi kaynak kod gerektiriyor; Claude görmeden tahmin etmez.
- \[Öneri\] Secret içermeyen şu dosyaların içeriği Notion handoff'a ya da kullanıcı üzerinden Claude'a verilsin: Android manifest, backup/data-extraction kuralları, network security config, SecureStoragePlugin kullanım yerleri, Local Coder Kotlin köprüsü. Gerçek yollar \[Doğrulanmadı\].

### 7. Düşük — Sayfa yapısı üç AI için karışık

- \[Gerçek\] İki ayrı "J" bölümü, hem "I" hem "I.1/I.2" ve tekrarlanan "İlk görev onayı" kayıtları var.
- \[Öneri\] Konsolidasyonu yalnızca ChatGPT (koordinatör) yapsın; her AI yalnızca kendi Review Notes bölümüne yazsın. Sayfa başına "Aktif yazma sahibi" satırı eklenebilir.

### 8. Düşük — Bölüm E ile H arasında okuma karışıklığı

- \[Gerçek\] E tablosunda Claude için GitHub "Evet", H'de bu projede Notion-only.
- \[Öneri\] E'ye not: "Tablo teknik yeteneği gösterir; proje yetki kararı bölüm H'dir."

## Claude için sonraki adım (handoff)

- Task: Session 6 plan/güvenlik kontrol listesinin bağımsız review'u
- Repo: babaprobado-bit/A-studio, taşıma sonrası A-studio-private
- Start SHA: \[Doğrulanmadı\] canlı HEAD ChatGPT/Grok'tan alınacak
- Gereken kanıt: madde 6'daki dosyalar ve madde 3'teki doğru hash
- Beklenen çıktı: backup/cleartext/lifecycle için bulgu, şiddet, önerilen düzeltme, gerekli test
- Claude kod yazmaz, commit/merge yapmaz; yazma sahibi ChatGPT.

<b>Karşılaştırma isteği:</b> ChatGPT madde 1, 2 ve 5'i canlı GitHub'dan doğrulasın; Grok madde 3 ve 4'ü salt-okunur kontrol etsin. Çelişen sonuçlar bu bölüme ayrı satır olarak eklensin, mevcut notlar silinmesin.

## Grok Review Notes — 2026-11-12

Salt-okunur GitHub kontrolü. Yazma bu notla sınırlı: feature branch dokümanı. <code>main</code> değişmedi. PR #2 merge edilmedi.

<b>Doğrulanmış gerçek</b>

- Kaynak repo: <code>babaprobado-bit/A-studio</code>
- Dal: <code>feature/android-offline-skills-v1</code>
- HEAD (10 ve 12 Kasım kontrolleri): <code>269beafc466c4d4dd13d46bd8a23574ed019c412</code> — 2026-11-08, <code>docs: record secret storage and Android backup review</code>
- PR #2 açık, Draft, unmerged. Son PR güncellemesi 2026-11-08.
- <code>android/</code> klasörü kaynak ağacında yok. Manifest bayrakları (<code>allowBackup</code>, <code>usesCleartextTraffic</code>, <code>debuggable</code>) handoff dokümanında kayıtlı; CI üretimi.

<b>Henüz doğrulanmadı</b>

- <code>babaprobado-bit/A-studio-private</code> bu GitHub bağlantısından 404. Mirror workflow, <code>MIRROR_TOKEN</code> ve hedef SHA eşleşmesi buradan kanıtlanmadı.
- Notion I.2 bölümü private repo oluştu diyor; sayfa sonu hâlâ migrasyon yapılmadı diyor. İkisi çelişiyor.

<b>Öneri</b>

- Private repo için bu hesaba en az Contents: Read verilsin, sonra üç branch SHA kaynakla karşılaştırılsın.
- Token sohbete veya Notion'a yazılmasın.

## OpenShorts entegrasyonu — 2026-11-12

<b>GitHub kaydı:</b> [feat: add OpenShorts video clipping MCP plugin](https://github.com/babaprobado-bit/A-studio/commit/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c)

- Repository: [babaprobado-bit/A-studio](https://github.com/babaprobado-bit/A-studio)
- Dal: <code>feature/android-offline-skills-v1</code>
- Commit / HEAD: <code>44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c</code>
- PR: [#2](https://github.com/babaprobado-bit/A-studio/pull/2) — OPEN, Draft, merged=false.
- <code>main</code> değişmedi. Commit yalnızca feature dalına yazıldı.

### GitHub'a eklenen 8 dosya

1. <code>src/openshorts-mcp.js</code> — Streamable HTTP MCP JSON-RPC istemcisi, API anahtarı/video URL doğrulaması ve izinli araç çağrıları.
2. <code>scripts/test-openshorts.mjs</code> — anahtar/URL doğrulama, MCP handshake, araç çağrısı ve gizli anahtar temizleme için mock regresyon testleri.
3. <code>src/main.js</code> — Araçlar ekranı bağlantısı, durum, kota, iş başlatma ve klip sonuçları.
4. <code>index.html</code> — OpenShorts paneli.
5. <code>src/style.css</code> — panel stilleri.
6. <code>server/server.js</code> — CSP içinde <code>https://mcp.openshorts.app</code> bağlantı izni.
7. <code>package.json</code> — <code>npm run test:openshorts</code> komutu.
8. <code>docs/INTEGRATIONS/OPENSHORTS.md</code> — kurulum ve güvenlik notları.

### Kaynak dosyalar ve indirilebilir tam patch

Bu ekler aynı GitHub commit'inden okunarak Notion'a yüklendi. Tam patch, mevcut dosyalara yapılan bütün değişiklikleri içerir; ayrı kaynak ekleri ana MCP modülü, mock test ve entegrasyon rehberini içerir.

<file source="notion-file-block://b0c02e1d-f0c5-4854-81e5-0fac630d21a8/0065e736-1610-4037-a317-51ad306f0587?space_id=b437b0fa-543b-817e-9c13-00037829b339&name=A-Studio-OpenShorts-Complete-Patch.txt" />

<file source="notion-file-block://473d498a-6576-4356-9662-014261cd4d17/f9556040-f3e6-4940-8901-c2dbd9363f47?space_id=b437b0fa-543b-817e-9c13-00037829b339&name=openshorts-mcp-source.txt" />

<file source="notion-file-block://34eaa5b7-9141-4413-b70f-422a375c7925/0b81603f-048e-4c14-ada9-3f4cc5d7a824?space_id=b437b0fa-543b-817e-9c13-00037829b339&name=test-openshorts-source.txt" />

<file source="notion-file-block://f42ecb7c-41b5-4ee9-b75b-6ad48966ba80/4061c8bf-a1a0-4d31-8f08-5490ce87f22d?space_id=b437b0fa-543b-817e-9c13-00037829b339&name=OPENSHORTS-integration-guide.txt" />

### İşlevler

- Video bağlantısından dikey kısa klip işi başlatma (<code>process_video</code>).
- İş durumunu kontrol etme (<code>get_job_status</code>).
- Tamamlanan işin kliplerini listeleme (<code>list_clips</code>).
- Kullanım kotasını görüntüleme (<code>get_quota</code>).
- Anahtar Android'de mevcut SecureStoragePlugin yardımcılarıyla saklanır; web önizlemesinde oturum belleğinde kalır.
- Videoyu işleme hakkı/izni kullanıcı tarafından onaylanmadan iş başlatılmaz.
- <code>publish_clip</code> entegrasyon içinde bilerek devre dışıdır; otomatik sosyal medya paylaşımı yoktur.

### Doğrulama ve açık sınırlar

- GitHub commit'i, dosya listesi, PR durumu ve branch HEAD tekrar okundu.
- PR #2 hâlâ OPEN + Draft + unmerged=false.
- Yeni HEAD <code>44326c8...</code> için şu anda PR-triggered workflow run veya commit status kaydı yok. Test komutu eklendi; testin çalıştırıldığı veya gerçek OpenShorts bağlantısının başarılı olduğu iddia edilmiyor.
- Tarayıcıdan hosted MCP bağlantısında CORS/Streamable HTTP uyumluluğu ayrıca doğrulanmalı.
- OpenShorts Cloud işleme dakikaları hesabın ortak kotasından düşebilir; işlem başlatmadan önce kota kontrol edilmeli.
- JavaScript mock testleri fiziksel Android kabulü değildir. Kurulum, ilk açılış, model import/inference, RAM/performance ve uçak modu testleri yapılmadı.
- Kaynak: [OpenShorts MCP resmi rehberi](https://www.openshorts.app/mcp).

---

## GitHub CI Günlük Raporu — 2026-11-13

<b>Kontrol zamanı:</b> 13 Kasım 2026, 23:03 TRT (20:03 UTC)<br /><b>Kontrol kapsamı:</b> GitHub API üzerinden salt-okunur PR, branch, commit, workflow, job/check ve artifact kontrolü.

### 1. PR #2 ve branch

- PR: [#2 — AI Studio 1.1: Offline Local Coder + Skill Library](https://github.com/babaprobado-bit/A-studio/pull/2)
- State: <b>open</b> · Draft: <b>true</b> · Merged: <b>false</b>
- Base: <code>main</code> — <code>aab010319b6500002844bd24b11da85dd9ca3b00</code>
- Head branch: <code>feature/android-offline-skills-v1</code>
- PR metadata head SHA: <code>44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c</code>
- Branch listesinde beklenen branch bulundu; branch tip SHA'sı PR head SHA ile aynı.
- PR <code>updated_at</code>: <code>2026-11-12T16:31:36Z</code> (19:31:36 TRT)
- Mergeability alanı GitHub'da <code>null / unknown</code>; bu bir merge izni veya başarılı merge kontrolü değildir.

### 2. Güncel PR HEAD için CI

<b>Güncel HEAD:</b> [44326c8 — feat: add OpenShorts video clipping MCP plugin](https://github.com/babaprobado-bit/A-studio/commit/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c)

- Commit zamanı: <code>2026-11-12T16:31:35Z</code>
- Değişiklik: 8 dosya; 373 ekleme, 3 silme.
- Workflow run sorgusu tam bu SHA ile yapıldı: <b>0 run</b>.
- Check-run sorgusu: <b>0 check</b>.
- Combined commit status: <code>pending</code>, <code>total_count=0</code>, status kayıtları boş.
- <b>Sonuç:</b> Bu tam HEAD SHA için şu anda kaydedilmiş bir PR-triggered workflow run/check yok. <code>pending + 0 kayıt</code> başarılı CI anlamına gelmez.
- Commit mesajı/diff'i kendi başına bir CI run ID içermiyor. PR açıklamasındaki eski CI referansları ayrıca doğrulandı ve aşağıda eski kaynak SHA'larıyla ayrıldı.

Bu HEAD için yeni başarısız job yok; başarısız job bulunmadığından log çekilmedi. Önceki günlük raporun karşılaştırma baseline'ı mevcut değil; bu nedenle önceki rapora göre yeni hata/değişiklik karşılaştırması yapılamıyor.

### 3. En yeni doğrulanmış önceki Android build'leri — 2026-11-08

Aşağıdaki iki run, güncel HEAD'den farklı olan <code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code> kaynak SHA'sında çalıştı. Bunlar güncel <code>44326c8...</code> HEAD'inin CI kanıtı değildir.

<b>Demo APK</b>

- Workflow: <b>Build Android Demo APK</b>
- Run: [#42472155238](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238)
- Event: <code>workflow_dispatch</code>
- Oluşturulma: <code>2026-11-08T10:36:36Z</code>
- Branch / source SHA: <code>feature/android-offline-skills-v1</code> / <code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code>
- Job: [Build debug APK — #128705231542](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155238/job/128705231542) — <b>success</b>; 22/22 adım başarılı.
- Adımların tamamı başarılı: Set up job; Checkout source; Set up Node.js; Set up Java; Install dependencies; Check website scripts and manifest; Build web assets; Test Local Coder and reuse workspace; Test Skill Library; Test device Local Coder bridge; Test optional REA Companion contract (mock only); Test private website login gate; Create Android project; Prepare a smaller Gradle distribution; Allow local Ollama HTTP on trusted networks; Sync Android project; Build debug APK (retry transient repository failures); Upload APK artifact; Post Set up Java; Post Set up Node.js; Post Checkout source; Complete job.

Artifact:

- Ad: <code>AI-Studio-Demo-APK</code>
- Artifact ID: <code>13613679600</code>
- [Artifact ZIP](https://api.github.com/repos/babaprobado-bit/A-studio/actions/artifacts/13613679600/zip)
- Boyut: 3,776,220 byte
- Digest: <code>sha256:c49230bbcc6a98922d6056d7daacb34a944cf288837c7f65b89b537212ef4f77</code>
- Süre sonu: <code>2026-11-22T10:39:43Z</code>
- Kaynak SHA: <code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code>

<b>Native Android / GGUF APK</b>

- Workflow: <b>Build Android APK with on-device Local Coder</b>
- Run: [#42472155008](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008)
- Event: <code>workflow_dispatch</code>
- Oluşturulma: <code>2026-11-08T10:36:35Z</code>
- Branch / source SHA: <code>feature/android-offline-skills-v1</code> / <code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code>
- Job: [Build AI Studio 1.1 Android APK (GGUF / llama.cpp) — #128705231121](https://github.com/babaprobado-bit/A-studio/actions/runs/42472155008/job/128705231121) — <b>success</b>; 21/21 adım başarılı.
- Adımların tamamı başarılı: Set up job; Checkout source; Set up Node.js; Set up Java; Configure preinstalled Android SDK; Install native build tools; Fetch pinned llama.kt engine; Prepare llama.cpp Android sources; Install AI Studio dependencies; Build web assets; Run existing and new regression checks; Generate Capacitor Android project; Prepare a smaller Gradle distribution; Preserve trusted-LAN Ollama HTTP and set native bridge; Sync Capacitor Android project; Build debug APK (retry transient repository failures); Upload APK; Post Set up Java; Post Set up Node.js; Post Checkout source; Complete job.

Artifact:

- Ad: <code>AI-Studio-1.1-OnDevice-LocalCoder-APK</code>
- Artifact ID: <code>13614626123</code>
- [Artifact ZIP](https://api.github.com/repos/babaprobado-bit/A-studio/actions/artifacts/13614626123/zip)
- Boyut: 18,158,764 byte
- Digest: <code>sha256:b1f7421d9b8d7f10a8d38301b9abda2597daa073657d5ecc8fa6871123304c4f</code>
- Süre sonu: <code>2026-11-22T10:56:19Z</code>
- Kaynak SHA: <code>90e5da287cc8d50859402cdbf99ccdb533e3360a</code>

### 4. PR açıklamasında anılan 2026-11-05 run'larının sonradan doğrulanması

PR açıklamasındaki <code>ff34a69578ea1fa332ac3d2e73414059566398b4</code> kaynak SHA'sına bağlı eski run ID'leri ayrıca kontrol edildi. İkisi de artık tamamlanmış ve başarılıdır:

- [Demo #42078734918](https://github.com/babaprobado-bit/A-studio/actions/runs/42078734918) — event <code>workflow_dispatch</code>, job <b>Build debug APK</b> (#127425828280), <b>success</b>, 20/20 adım başarılı. Artifact #13438094755 mevcut; 3,775,289 byte; digest <code>sha256:e444077574209a1a6fba6e0e665482594370f8d6fa14358cb26dcbb44ad47fbb</code>; süre sonu <code>2026-11-19T17:53:50Z</code>.
- [Native GGUF #42078734707](https://github.com/babaprobado-bit/A-studio/actions/runs/42078734707) — event <code>workflow_dispatch</code>, job <b>Build AI Studio 1.1 Android APK (GGUF / llama.cpp)</b> (#127425827343), <b>success</b>, 20/20 adım başarılı. Önceki nottaki “in progress / artifact yok” durumu artık güncel değildir. Artifact #13441610298 mevcut; [Artifact ZIP](https://api.github.com/repos/babaprobado-bit/A-studio/actions/artifacts/13441610298/zip); 18,157,298 byte; digest <code>sha256:99f762808ccee5427ed88999364466c999e3e57583906e84a48f9e5f2a0f888d</code>; süre sonu <code>2026-11-19T18:06:51Z</code>.

Bu 5 Kasım run'ları da <code>ff34a695...</code> kaynak SHA'sına, 8 Kasım run'ları ise <code>90e5da287...</code> kaynak SHA'sına aittir. Hiçbiri güncel <code>44326c8...</code> HEAD'inin CI sonucu değildir.

### 5. Üç ayrı build/ci değerlendirmesi

1. <b>Demo APK:</b> 8 Kasım run #42472155238 başarılı; Demo APK artifact yüklendi.
2. <b>Native APK:</b> 8 Kasım run #42472155008 başarılı; Native APK artifact yüklendi.
3. <b>Android offline / local GGUF native derleme ve paketleme:</b> llama.kt ve llama.cpp Android hazırlığı, regresyon kontrolleri ve debug APK paketleme adımları CI'da başarılı. Bu, cihazda GGUF modelinin gerçekten açıldığı/inference yaptığı anlamına gelmez.

### 6. Fiziksel cihaz doğrulama sınırı

Aşağıdakiler doğrulanmış değildir: APK kurulumu, ilk açılış, GGUF model import, gerçek cihazda inference, RAM kullanımı/performance ve uçak modu davranışı. CI/derleme başarısı fiziksel Android cihaz kabulü değildir.

REA Companion mock-only sınırında kaldı; gerçek Companion kurulumu/başlatılması, pairing veya gerçek REA/MCP bağlantısı yapılmadı.

### 7. Günlük koruma ve değişiklik kaydı

- PR #2 <b>open + Draft + unmerged</b> kaldı.
- <code>main</code> dalına yazılmadı; base SHA <code>aab010319b6500002844bd24b11da85dd9ca3b00</code> olarak kaydedildi.
- GitHub üzerinde commit, push, PR güncellemesi, merge/close/ready-for-review veya workflow rerun yapılmadı.
- Fiziksel Android testi ve gerçek REA bağlantısı başlatılmadı.
- Bu rapordaki önceki başarılı Actions sonuçları yalnızca kendi kaynak SHA'ları için kanıttır; güncel HEAD için CI sonucu hâlâ kayıtsızdır.

## Grok — GitHub yazma denemesi 2026-11-13

Aynı inceleme notunu <code>feature/android-offline-skills-v1</code> üzerinde <code>docs/HANDOFF/GROK_REVIEW_2026-11-12.md</code> olarak yazmayı denedim.

<b>Sonuç:</b> GitHub API 403. Bağlantı repoyu okuyor, dosya oluşturamıyor. <code>main</code> değişmedi. PR #2 merge edilmedi.

Yazma izni açılınca not feature dalına konacak. Token veya secret yok.

---

# OpenShorts — Kodların Notion içine doğrudan kaydı

<b>Kaynak commit:</b> [44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c](https://github.com/babaprobado-bit/A-studio/commit/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c)<br /><b>Branch:</b> \`feature/android-offline-skills-v1\`<br /><b>Kayıt türü:</b> GitHub commit'inden alınan kod; aşağıdaki bloklar doğrudan Notion içeriğidir.<br /><b>Not:</b> Yeni dosyaların kodu tamdır. Mevcut büyük dosyalarda yalnızca bu commit'in eklediği OpenShorts bölümleri kaydedilmiştir; tüm uygulama dosyaları baştan kopyalanmamıştır.

## 1. src/openshorts-mcp.js — Yeni dosyanın tam kodu

```javascript
const DEFAULT_ENDPOINT='https://mcp.openshorts.app/mcp';
const PROTOCOL_VERSION='2025-06-18';
const REQUIRED_TOOLS=['process_video','get_job_status','list_clips','get_quota'];
const ALLOWED_TOOLS=new Set([...REQUIRED_TOOLS,'add_subtitles']);
let requestSequence=0;

function redactError(value,key){
  let message=String(value||'OpenShorts isteği başarısız oldu.');
  if(key)message=message.split(key).join('[API anahtarı gizlendi]');
  return message.slice(0,500);
}

export function validateOpenShortsApiKey(value){
  const key=String(value||'').trim();
  if(!/^osk_[A-Za-z0-9_-]{12,240}$/.test(key))throw new Error('OpenShorts API anahtarı osk_ ile başlamalı ve geçerli biçimde olmalı.');
  return key;
}

export function validateOpenShortsSourceUrl(value){
  const raw=String(value||'').trim();
  if(!raw||raw.length>2048)throw new Error('Video bağlantısı boş veya çok uzun.');
  let url;
  try{url=new URL(raw);}catch{throw new Error('Geçerli bir video bağlantısı gir.');}
  if(url.protocol!=='https:'||url.username||url.password||url.port)throw new Error('Yalnızca kullanıcı bilgisi içermeyen HTTPS video bağlantıları kabul edilir.');
  const host=url.hostname.toLowerCase().replace(/\.$/,'');
  const local=host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local');
  const ipLiteral=/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)||host.includes(':');
  if(local||ipLiteral)throw new Error('Yerel ağ veya IP adresi video kaynağı olarak kabul edilmez.');
  const youtube=host==='youtu.be'||host==='youtube.com'||host.endsWith('.youtube.com');
  const direct=/\.(mp4|mov|m4v|webm|mkv)$/i.test(url.pathname);
  if(!youtube&&!direct)throw new Error('YouTube bağlantısı veya doğrudan MP4, MOV, M4V, WebM ya da MKV dosya bağlantısı kullan.');
  url.hash='';
  return url.toString();
}

async function postRpc({apiKey,endpoint,fetchImpl,method,params,id}){
  const key=validateOpenShortsApiKey(apiKey);
  const url=endpoint||DEFAULT_ENDPOINT;
  if(!String(url).startsWith('https://'))throw new Error('OpenShorts MCP adresi HTTPS olmalı.');
  let response;
  try{
    response=await fetchImpl(url,{
      method:'POST',
      headers:{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify({jsonrpc:'2.0',id,method,params:params||{}})
    });
  }catch{
    throw new Error('OpenShorts sunucusuna ulaşılamadı. İnternet, CORS veya bağlantı ayarını kontrol et.');
  }
  const raw=await response.text();
  if(!response.ok){
    let message='HTTP '+response.status;
    try{const payload=JSON.parse(raw);message=payload.error?.message||payload.detail||payload.message||payload.error||message;}catch{}
    throw new Error(redactError(message,key));
  }
  let payload;
  try{payload=JSON.parse(raw);}catch{throw new Error('OpenShorts sunucusu geçerli JSON-RPC yanıtı döndürmedi.');}
  if(payload?.jsonrpc!=='2.0')throw new Error('OpenShorts yanıtı JSON-RPC 2.0 biçiminde değil.');
  if(payload.error)throw new Error(redactError(payload.error.message||'OpenShorts MCP hatası.',key));
  if(payload.id!==id)throw new Error('OpenShorts yanıt kimliği eşleşmedi.');
  return payload.result;
}

async function sendInitialized({apiKey,endpoint,fetchImpl}){
  const key=validateOpenShortsApiKey(apiKey);
  try{
    const response=await fetchImpl(endpoint||DEFAULT_ENDPOINT,{
      method:'POST',
      headers:{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+key},
      body:JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})
    });
    if(!response.ok)throw new Error('HTTP '+response.status);
  }catch{throw new Error('OpenShorts ilk bağlantı bildirimi gönderilemedi.');}
}

function unwrapToolResult(result,key){
  if(result?.isError){
    const detail=result.structuredContent?.error||result.content?.find(item=>item.type==='text')?.text||'OpenShorts aracı işlemi tamamlayamadı.';
    throw new Error(redactError(detail,key));
  }
  if(result?.structuredContent&&typeof result.structuredContent==='object')return result.structuredContent;
  const textBlock=result?.content?.find(item=>item.type==='text')?.text;
  if(typeof textBlock==='string'){try{return JSON.parse(textBlock);}catch{return{message:textBlock};}}
  return result||{};
}

export async function connectOpenShorts({apiKey,endpoint=DEFAULT_ENDPOINT,fetchImpl=fetch}){
  const key=validateOpenShortsApiKey(apiKey);
  const initialized=await postRpc({
    apiKey:key,endpoint,fetchImpl,id:++requestSequence,method:'initialize',
    params:{protocolVersion:PROTOCOL_VERSION,capabilities:{},clientInfo:{name:'AI Studio',version:'1.1.0'}}
  });
  if(!initialized?.serverInfo?.name)throw new Error('OpenShorts MCP sunucu kimliği doğrulanamadı.');
  await sendInitialized({apiKey:key,endpoint,fetchImpl});
  const listing=await postRpc({apiKey:key,endpoint,fetchImpl,id:++requestSequence,method:'tools/list',params:{}});
  const tools=Array.isArray(listing?.tools)?listing.tools:[];
  const names=new Set(tools.map(tool=>tool?.name).filter(Boolean));
  const missing=REQUIRED_TOOLS.filter(name=>!names.has(name));
  if(missing.length)throw new Error('OpenShorts gerekli araçları sunmuyor: '+missing.join(', '));
  return{serverInfo:initialized.serverInfo,tools};
}

export async function callOpenShortsTool({apiKey,name,arguments:args={},endpoint=DEFAULT_ENDPOINT,fetchImpl=fetch}){
  if(!ALLOWED_TOOLS.has(name))throw new Error('Bu OpenShorts aracı AI Studio içinde etkin değil.');
  const result=await postRpc({apiKey,endpoint,fetchImpl,id:++requestSequence,method:'tools/call',params:{name,arguments:args}});
  return unwrapToolResult(result,apiKey);
}

export const OPENSHORTS_MCP_ENDPOINT=DEFAULT_ENDPOINT;
export const OPENSHORTS_ENABLED_TOOLS=[...ALLOWED_TOOLS];
```

## 2. scripts/test-openshorts.mjs — Yeni test dosyasının tam kodu

```javascript
import assert from 'node:assert/strict';
import {
  connectOpenShorts,callOpenShortsTool,validateOpenShortsApiKey,
  validateOpenShortsSourceUrl,OPENSHORTS_MCP_ENDPOINT
} from '../src/openshorts-mcp.js';

const key='osk_0123456789abcdefghijklmnop';
assert.equal(validateOpenShortsApiKey(key),key);
assert.throws(()=>validateOpenShortsApiKey('not-a-key'),/osk_/);
assert.equal(validateOpenShortsSourceUrl('https://youtu.be/abc123'),'https://youtu.be/abc123');
assert.equal(validateOpenShortsSourceUrl('https://cdn.example/video.mp4'),'https://cdn.example/video.mp4');
assert.throws(()=>validateOpenShortsSourceUrl('http://youtube.com/watch?v=abc'),/HTTPS/);
assert.throws(()=>validateOpenShortsSourceUrl('https://localhost/video.mp4'),/Yerel ağ/);
assert.throws(()=>validateOpenShortsSourceUrl('https://example.local/video.mp4'),/Yerel ağ/);
assert.throws(()=>validateOpenShortsSourceUrl('https://example.com/page'),/YouTube bağlantısı/);

const calls=[];
function response(value,status=200){return{ok:status>=200&&status<300,status,text:async()=>value===null?'':JSON.stringify(value)};}
const fakeFetch=async(_url,options)=>{
  const body=JSON.parse(options.body);
  calls.push({body,authorization:options.headers.Authorization});
  if(body.method==='initialize')return response({jsonrpc:'2.0',id:body.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{}},serverInfo:{name:'openshorts',version:'1.0.0'}}});
  if(body.method==='notifications/initialized')return response(null,202);
  if(body.method==='tools/list')return response({jsonrpc:'2.0',id:body.id,result:{tools:['process_video','get_job_status','list_clips','get_quota','add_subtitles','publish_clip'].map(name=>({name}))}});
  if(body.method==='tools/call')return response({jsonrpc:'2.0',id:body.id,result:{structuredContent:{job_id:'job-test-1',status:'queued'},content:[],isError:false}});
  throw new Error('Unexpected MCP method: '+body.method);
};
const connected=await connectOpenShorts({apiKey:key,fetchImpl:fakeFetch});
assert.equal(connected.serverInfo.name,'openshorts');
assert.ok(connected.tools.some(tool=>tool.name==='process_video'));
assert.equal(OPENSHORTS_MCP_ENDPOINT,'https://mcp.openshorts.app/mcp');

const processed=await callOpenShortsTool({
  apiKey:key,name:'process_video',
  arguments:{source_url:'https://youtu.be/abc123',confirm_rights:true,output_format:'vertical',layouts:['auto']},
  fetchImpl:fakeFetch
});
assert.equal(processed.job_id,'job-test-1');
const processCall=calls.find(call=>call.body.method==='tools/call');
assert.equal(processCall.authorization,'Bearer '+key);
assert.equal(processCall.body.params.name,'process_video');
assert.equal(processCall.body.params.arguments.confirm_rights,true);
assert.throws(()=>callOpenShortsTool({apiKey:key,name:'publish_clip',fetchImpl:fakeFetch}),/etkin değil/);

const failedFetch=async()=>response({jsonrpc:'2.0',id:1,error:{code:-32000,message:'bad token '+key}});
await assert.rejects(callOpenShortsTool({apiKey:key,name:'get_quota',fetchImpl:failedFetch}),error=>!error.message.includes(key)&&/API anahtarı gizlendi/.test(error.message));
console.log('OpenShorts MCP tests passed: key validation, HTTPS source validation, MCP handshake, tool calls, publish exclusion and secret redaction.');
```

## 3. src/main.js — Bu commit'in eklediği OpenShorts kodu

### Import ve durum değişkenleri

```javascript
import { connectOpenShorts, callOpenShortsTool, validateOpenShortsSourceUrl } from './openshorts-mcp.js';

let openShortsToolNames = new Set();
let openShortsJobId = '';
let openShortsPendingSource = '';
let openShortsBusy = false;
```

### Key, durum paneli ve araç çağrısı

```javascript
async function initOpenShortsKey(){runtimeKeys.openshorts=nativeApp?await getSecret('openshorts'):'';}
function setOpenShortsStatus(message,tone='info'){
  const node=$('openshortsStatus');if(!node)return;
  node.textContent=String(message||'');node.dataset.tone=tone;
}
function renderOpenShortsPanel(){
  const connected=Boolean(runtimeKeys.openshorts);
  $('openshortsConnectionBadge').textContent=connected?'Anahtar kayıtlı':'Bağlı değil';
  $('openshortsConnectionBadge').className='pill '+(connected?'safe':'');
  $('openshortsProcess').disabled=!openShortsToolNames.has('process_video')||openShortsBusy;
  $('openshortsQuotaRefresh').disabled=!openShortsToolNames.has('get_quota')||openShortsBusy;
  $('openshortsCheckStatus').disabled=!openShortsJobId||!openShortsToolNames.has('get_job_status')||openShortsBusy;
  $('openshortsJobId').textContent=openShortsJobId||'Henüz iş yok';
  if(!connected)setOpenShortsStatus('Bağlanmak için API anahtarını gir.','info');
  else if(!openShortsToolNames.size)setOpenShortsStatus('Anahtar bu cihazda kayıtlı. OpenShorts bağlantısını doğrula.','info');
}
async function requireOpenShortsTool(name,args={}){
  const key=runtimeKeys.openshorts||'';
  if(!key)throw new Error('Önce OpenShorts API anahtarını kaydedip bağlan.');
  if(!openShortsToolNames.has(name))throw new Error('OpenShorts bağlantısını doğrula; gerekli araç henüz hazır değil.');
  return callOpenShortsTool({apiKey:key,name,arguments:args});
}
function renderOpenShortsClips(clips){
  const out=$('openshortsClips');
  if(!Array.isArray(clips)||!clips.length){out.innerHTML='<p class="fineprint">Henüz klip bağlantısı dönmedi.</p>';return;}
  out.innerHTML=clips.map((clip,index)=>{
    const title=esc(clip?.title||clip?.youtube_title||('Klip '+(index+1)));
    const duration=Number.isFinite(Number(clip?.duration_seconds))?Math.max(0,Number(clip.duration_seconds))+' sn':'Süre bilgisi yok';
    let link='';
    try{const url=new URL(String(clip?.video_url||''));if(url.protocol==='https:')link='<a class="btn secondary small" href="'+esc(url.toString())+'" target="_blank" rel="noopener noreferrer">Klibi aç / indir ↗</a>';}catch(_){}
    return '<article class="openshorts-clip"><div><strong>'+title+'</strong><small>'+esc(duration)+'</small></div>'+link+'</article>';
  }).join('');
}
```

### Bağlantı, anahtar silme ve kota

```javascript
async function connectOpenShortsUi(){
  if(openShortsBusy)return;
  openShortsBusy=true;renderOpenShortsPanel();setOpenShortsStatus('OpenShorts MCP bağlantısı ve araç listesi doğrulanıyor…');
  try{
    const entered=$('openshortsApiKey').value.trim();
    if(entered){await saveSecret('openshorts',entered);runtimeKeys.openshorts=entered;}
    const key=runtimeKeys.openshorts||'';
    if(!key)throw new Error('OpenShorts API anahtarını gir.');
    const result=await connectOpenShorts({apiKey:key});
    openShortsToolNames=new Set(result.tools.map(tool=>tool.name));
    const ready=['process_video','get_job_status','list_clips','get_quota','add_subtitles'].filter(name=>openShortsToolNames.has(name));
    $('openshortsApiKey').value='';
    setOpenShortsStatus('Bağlandı: '+(result.serverInfo.title||result.serverInfo.name)+' · '+ready.length+' araç doğrulandı.','success');
    showToast('OpenShorts bağlantısı doğrulandı.');
    await refreshOpenShortsQuota(true);
  }catch(error){openShortsToolNames.clear();setOpenShortsStatus(error.message||'OpenShorts bağlantısı doğrulanamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}
async function disconnectOpenShortsUi(){
  if(openShortsBusy)return;
  try{
    await deleteSecret('openshorts');openShortsToolNames.clear();openShortsPendingSource='';openShortsJobId='';
    $('openshortsApiKey').value='';$('openshortsClips').innerHTML='';$('openshortsQuota').textContent='Kota henüz kontrol edilmedi.';
    setOpenShortsStatus('Anahtar bu cihazdan silindi. OpenShorts hesabındaki anahtarı ayrıca iptal etmek için OpenShorts hesap ayarlarını kullan.','info');
    renderOpenShortsPanel();
  }catch(error){setOpenShortsStatus('Anahtar silinemedi: '+(error.message||'Güvenli depolama hatası.'),'error');}
}
async function refreshOpenShortsQuota(quiet=false){
  try{
    const data=await requireOpenShortsTool('get_quota');
    const minutes=data.minutes,plan=data.plan||'OpenShorts hesabı';
    $('openshortsQuota').textContent=minutes&&typeof minutes==='object'
      ?plan+' · '+(minutes.remaining??minutes.left??'Kalan dakika bilgisi yok')+' dakika'
      :plan+' · '+(minutes==null?'Kota bilgisi dönmedi':String(minutes)+' dakika');
    if(!quiet)showToast('OpenShorts kotası güncellendi.');
  }catch(error){
    $('openshortsQuota').textContent=error.message||'Kota alınamadı.';
    if(!quiet)setOpenShortsStatus('Kota kontrolü başarısız: '+(error.message||'Bilinmeyen hata.'),'error');
  }
}
```

### Video işi, düşük kalite onayı ve iş durumu

```javascript
async function startOpenShortsJob(forceLowQuality=false){
  if(openShortsBusy)return;
  try{
    const source=validateOpenShortsSourceUrl(forceLowQuality?openShortsPendingSource:$('openshortsVideoUrl').value);
    if(!$('openshortsConfirmRights').checked)throw new Error('Devam etmek için videonun sahibi olduğunu veya işleme iznin bulunduğunu onayla.');
    openShortsBusy=true;renderOpenShortsPanel();
    setOpenShortsStatus('Video OpenShorts kuyruğuna gönderiliyor. Bu işlem hesabının dakika kotasını kullanabilir…');
    const data=await requireOpenShortsTool('process_video',{
      source_url:source,confirm_rights:true,output_format:'vertical',layouts:['auto'],
      ...(forceLowQuality?{force_low_quality:true}:{})
    });
    if(data.needs_confirmation){
      openShortsPendingSource=source;
      $('openshortsForceLowQuality').hidden=false;$('openshortsForceLowQuality').disabled=false;
      setOpenShortsStatus(data.hint||'Kaynak çözünürlüğü düşük. Devam etmek için ayrı onay gerekiyor.','warning');
      return;
    }
    const jobId=String(data.job_id||data.id||'').trim();
    if(!jobId)throw new Error(data.error||'OpenShorts yanıtında iş kimliği bulunamadı.');
    openShortsJobId=jobId;openShortsPendingSource='';
    $('openshortsForceLowQuality').hidden=true;$('openshortsForceLowQuality').disabled=true;
    $('openshortsJobId').textContent=jobId;
    setOpenShortsStatus('İş oluşturuldu. İşleme birkaç dakika sürebilir; durumu düğmeyle kontrol et.','success');
    showToast('OpenShorts video işini başlattı.');
    await refreshOpenShortsQuota(true);
  }catch(error){setOpenShortsStatus(error.message||'Video işi başlatılamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}
async function checkOpenShortsJob(){
  if(openShortsBusy||!openShortsJobId)return;
  openShortsBusy=true;renderOpenShortsPanel();
  try{
    const status=await requireOpenShortsTool('get_job_status',{job_id:openShortsJobId});
    if(status.status==='completed'){
      const clips=await requireOpenShortsTool('list_clips',{job_id:openShortsJobId});
      renderOpenShortsClips(clips.clips||status.clips||[]);
      setOpenShortsStatus('İş tamamlandı. Klipleri inceleyebilir ve bağlantılarından açabilirsin.','success');
    }else if(status.status==='failed'){
      const logs=Array.isArray(status.recent_logs)?status.recent_logs.join('\\n'):'';
      setOpenShortsStatus('Video işleme başarısız oldu. '+logs.slice(-900),'error');
    }else setOpenShortsStatus('İş durumu: '+(status.status||'bilinmiyor')+'. Biraz sonra yeniden kontrol et.','info');
  }catch(error){setOpenShortsStatus(error.message||'İş durumu alınamadı.','error');}
  finally{openShortsBusy=false;renderOpenShortsPanel();}
}
```

### Olay dinleyicileri ve başlangıç bağlantısı

```javascript
$('openshortsConnect').addEventListener('click',connectOpenShortsUi);
$('openshortsDisconnect').addEventListener('click',disconnectOpenShortsUi);
$('openshortsQuotaRefresh').addEventListener('click',()=>refreshOpenShortsQuota());
$('openshortsProcess').addEventListener('click',()=>startOpenShortsJob(false));
$('openshortsForceLowQuality').addEventListener('click',()=>startOpenShortsJob(true));
$('openshortsCheckStatus').addEventListener('click',checkOpenShortsJob);

// init() içinde:
await initKeys();await initOpenShortsKey();
// Panel çizimi:
renderProviderCards();renderProjects();renderChat();renderBuiltinTools();renderPlugins();renderOpenShortsPanel();renderSkillLibrary();renderReuseCatalog();renderSnippetVault();renderAgentActivity();loadActiveCodeFile();syncModeUI();updateDashboard();$('compareSelectionCount').textContent=settings.team.length+' ajan seçili';
```

## 4. index.html — OpenShorts paneli

```html
<section class="panel openshorts-panel" id="openShortsPanel">
  <div class="section-head">
    <div><div class="eyebrow">VIDEO WORKFLOW / MCP PLUGIN</div><h2>OpenShorts · Shorts üreticisi</h2></div>
    <span class="pill" id="openshortsConnectionBadge">Bağlı değil</span>
  </div>
  <p class="muted">YouTube bağlantısından veya herkese açık video dosyasından dikey kısa klipler üret. AI Studio, OpenShorts'un resmi MCP sunucusunu kullanır.</p>
  <label class="field-label" for="openshortsApiKey">OpenShorts API anahtarı</label>
  <input id="openshortsApiKey" class="input" type="password" maxlength="256" autocomplete="new-password" autocapitalize="off" spellcheck="false" placeholder="osk_…">
  <p class="fineprint">Anahtarını OpenShorts hesabından oluştur. Android'de güvenli depoya kaydedilir; web önizlemesinde yalnızca açık oturum belleğinde tutulur. Anahtar AI Team modellerine gönderilmez.</p>
  <div class="row-actions">
    <button id="openshortsConnect" class="btn secondary" type="button">Bağlan / araçları doğrula</button>
    <button id="openshortsDisconnect" class="btn ghost small danger-text" type="button">Bu cihazdan anahtarı sil</button>
    <a class="fineprint" href="https://www.openshorts.app/mcp" target="_blank" rel="noopener noreferrer">Resmî kurulum bilgisi ↗</a>
  </div>
  <div id="openshortsStatus" class="openshorts-status" role="status" aria-live="polite">Bağlanmak için API anahtarını gir.</div>
  <div class="openshorts-quota-row">
    <span id="openshortsQuota" class="fineprint">Kota henüz kontrol edilmedi.</span>
    <button id="openshortsQuotaRefresh" class="btn ghost small" type="button" disabled>Kotayı kontrol et</button>
  </div>
  <label class="field-label" for="openshortsVideoUrl">Video bağlantısı</label>
  <input id="openshortsVideoUrl" class="input" type="url" maxlength="2048" inputmode="url" placeholder="https://youtu.be/… veya doğrudan .mp4 bağlantısı">
  <label class="openshorts-rights">
    <input id="openshortsConfirmRights" type="checkbox">
    <span>Bu videonun sahibiyim veya videoyu işleme ve klip oluşturma iznim var.</span>
  </label>
  <p class="fineprint">Video işleme hesabındaki OpenShorts dakika kotasını kullanabilir. Başlamadan önce kotayı kontrol et. Yalnızca işleme hakkına sahip olduğun videoları gönder.</p>
  <div class="row-actions">
    <button id="openshortsProcess" class="btn primary" type="button" disabled>9:16 klip üret</button>
    <button id="openshortsForceLowQuality" class="btn ghost small" type="button" hidden disabled>Düşük çözünürlüğü kabul edip devam et</button>
  </div>
  <div class="openshorts-job-row">
    <strong>Son iş</strong><code id="openshortsJobId">Henüz iş yok</code>
    <button id="openshortsCheckStatus" class="btn ghost small" type="button" disabled>Durumu kontrol et</button>
  </div>
  <div id="openshortsClips" class="openshorts-clips" aria-live="polite"></div>
  <p class="fineprint">Bu entegrasyon klip oluşturur ve indirme bağlantılarını gösterir. Sosyal medya hesaplarına otomatik gönderim yapmaz. Klipleri paylaşmadan önce kendin incele.</p>
</section>
```

## 5. src/style.css — Eklenen OpenShorts stilleri

```css
/* OpenShorts remote MCP integration */
.openshorts-panel{border-color:#3c4969;background:linear-gradient(145deg,#18243b,#101829)}
.openshorts-status{margin-top:12px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:#0b1323;color:var(--muted);font-size:11px;overflow-wrap:anywhere}
.openshorts-status[data-tone="success"]{color:var(--green);border-color:#2b5d55}
.openshorts-status[data-tone="warning"]{color:#ffe0a2;border-color:#77602f}
.openshorts-status[data-tone="error"]{color:#ffbac7;border-color:#74394a}
.openshorts-quota-row,.openshorts-job-row{display:flex;align-items:center;gap:9px;justify-content:space-between;flex-wrap:wrap;margin-top:10px}
.openshorts-quota-row .fineprint{margin:0}
.openshorts-rights{display:flex;align-items:flex-start;gap:9px;margin-top:13px;padding:11px;border:1px solid var(--line);border-radius:10px;background:#0b1323;color:#dce4f7;font-size:11px}
.openshorts-rights input{margin-top:3px;accent-color:var(--violet);flex-shrink:0}
.openshorts-job-row{justify-content:flex-start;padding-top:12px;border-top:1px solid var(--line);font-size:11px}
.openshorts-job-row code{max-width:100%;overflow-wrap:anywhere;color:var(--cyan);font-size:10px}
.openshorts-clips{display:grid;gap:8px;margin-top:12px}
.openshorts-clip{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:11px;border:1px solid var(--line);border-radius:11px;background:#0b1323}
.openshorts-clip strong,.openshorts-clip small{display:block;overflow-wrap:anywhere}
.openshorts-clip strong{font-size:12px}
.openshorts-clip small{color:var(--muted);font-size:10px;margin-top:3px}
.openshorts-panel a.fineprint{color:var(--cyan)}
.openshorts-panel .row-actions{align-items:center}
```

## 6. server/server.js — CSP bağlantı izni

Mevcut \`connect-src\` listesine eklenen satır:

```javascript
'https://mcp.openshorts.app',
```

## 7. package.json — Test komutu

\`scripts\` nesnesine eklenen satır:

```json
"test:openshorts": "node scripts/test-openshorts.mjs"
```

## 8. GitHub kaynak bağlantıları

- [Commit — 44326c8](https://github.com/babaprobado-bit/A-studio/commit/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c)
- [src/openshorts-mcp.js](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/src/openshorts-mcp.js)
- [scripts/test-openshorts.mjs](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/scripts/test-openshorts.mjs)
- [src/main.js](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/src/main.js)
- [index.html](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/index.html)
- [src/style.css](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/src/style.css)
- [server/server.js](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/server/server.js)
- [package.json](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/package.json)
- [docs/INTEGRATIONS/OPENSHORTS.md](https://github.com/babaprobado-bit/A-studio/blob/44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c/docs/INTEGRATIONS/OPENSHORTS.md)

---

## Claude — Kod review için gereken girdi (2026-11-14)

\[Gerçek\] Claude bu sayfadaki ek dosyaların (.txt) içeriğini açamıyor: dosyalar Notion MCP'nin create-attachment aracıyla yüklenmemiş, indirme bağlantıları Claude'un araçlarına kapalı, sandbox'ta ağ yok, GitHub'a erişim yok. Kod okunamadığı için şu an hata tespiti veya düzeltme yapılamıyor.

<b>Yazma sahibi (ChatGPT/Grok), lütfen:</b> aşağıdaki başlıkların altına dosya içeriğini <b>düz metin kod bloğu</b> olarak yapıştırın. Ek dosya olarak değil. API anahtarı, token ve diğer secret'lar çıkarılsın.

- [ ] <code>src/openshorts-mcp.js</code> (tam içerik)
- [ ] <code>test-openshorts</code> test dosyası (tam içerik)
- [ ] OpenShorts commit <code>44326c8</code> diff'i (değişen diğer dosyalar: CSP, ayar ekranı, app.js entegrasyonu, sürüm)
- [ ] Android CI workflow dosyaları (<code>.github/workflows/*.yml</code>): manifest'in üretildiği ve cleartext/backup ayarlarının yapıldığı adımlar

<b>Claude'un yapacağı:</b> kod blokları bu sayfada görünür olduğunda API anahtarı saklama/loglama, CSP izni, video URL doğrulaması, hata mesajı temizliği, test kapsamı ve Session 6 (backup, cleartext, Local Coder yaşam döngüsü) kontrollerini yapıp bulguları ve düzeltilmiş kod parçalarını bu bölüme yazacak. Claude commit/merge yapmaz.

---

# K. Plugin sadeleştirme ve OpenMausBot / REA kararı — 2026-11-14

<b>Kullanıcı kararı:</b> Önceki çok geniş plugin öneri listesi sadeleştirilecek. Aktif planda yalnızca GitHub, Notion, OpenShorts, OpenMausBot ve REA Companion kalacak. Kullanıcı yeni bir ihtiyaç belirtmedikçe ek plugin önerilmeyecek.

## K.1 OpenMausBot entegrasyonu

OpenMausBot / MausBot, AI Studio'ya gömülecek küçük bir JavaScript plugin'i değil; kendi masaüstü uygulaması, harness sunucusu ve yerel AI ajanları olan ayrı bir projedir. AI Studio entegrasyonu uygulamayı yeniden dağıtmak yerine onun resmi MCP kontrol arayüzüne bağlanır.

- Resmî proje: [OpenMausBot GitHub](https://github.com/milind-soni/OpenMausBot)
- Belgeler: [MausBot docs](https://docs.openmausbot.com/docs)
- MCP sunucusu: [OpenMausBot MCP server guide](https://github.com/milind-soni/OpenMausBot/blob/main/docs/mcp-server.md)
- MCP taşıması stdio'dur; sunucunun çalışması için MausBot masaüstü uygulaması ve harness çalışıyor olmalıdır.
- Bu nedenle ilk bağlantı yalnızca AI Studio'nun bilgisayardaki Node/server tarafında çalışır. Android WebView/telefon doğrudan yerel stdio komutu başlatamaz. Android için daha sonra güvenli ve kullanıcı tarafından açılan uzak köprü tasarlanırsa ayrıca güvenlik incelemesi gerekir.
- İlk izin listesi: bot/kanal listesi ve durum okuma, sınırlı transcript arama/okuma. Bot oluşturma/düzenleme, kanal/görev oluşturma, bir bota iş gönderme, model değiştirme ve çalışan işi kesme ayrı kullanıcı onayına tabidir.
- MCP v1'in yetki sınırı korunur: onay verme, izinleri kalıcı olarak açma, silme, kimlik bilgisi değiştirme ve bilgisayar/VM yaşam döngüsü kontrolü AI Studio üzerinden sunulmaz.
- OpenMausBot ayrı kurulu değilse entegrasyon "bağlı değil / masaüstü uygulaması bulunamadı" durumunda kalır; otomatik indirme veya arka planda kurulum yapılmaz.
- Güncel resmi kurulum belgeleri masaüstü destek platformlarını, agent CLI gereksinimlerini ve kaynak kod için Node/pnpm sürümlerini açıklar. Kurulum/test başarıyla doğrulanmış gibi raporlanmayacak.

## K.2 REA Companion entegrasyonu

Kullanıcı REA'nın da gerçek entegrasyon olarak geliştirilmesini açıkça istedi. Var olan kaynakta yalnızca contract validator ve fake/mock testleri bulunuyor; gerçek companion süreci, listener veya canlı pairing bağlantısı henüz yok.

Geliştirme sınırları:

- Scope yalnızca <code>rea.read</code> olarak kalır.
- İzinli işlemler: <code>project.overview</code>, <code>files.inspect</code>, <code>symbols.search</code>.
- Yalnızca AI Studio projesine kayıtlı ve kullanıcı tarafından açıkça seçilmiş göreli dosya yolları erişilebilir.
- Local loopback origin/Host doğrulaması, tek kullanımlık pairing kodu, istemciye bağlama, kısa ömürlü oturum, revoke, deneme sınırı, istek/yanıt boyut sınırı ve timeout korunur.
- REA içeriği güvenilmeyen veri sayılır; içindeki talimatlar çalıştırılmaz.
- Shell/command execution, dosya yazma, install, arbitrary MCP tool call, delete, process launch ve otomatik AI provider'a veri gönderme yoktur.
- Gerçek companion endpoint/protokolü kaynak kodda tanımlı ve doğrulanmış olana kadar canlı entegrasyon tamamlandı sayılmaz.

## K.3 Plugin olarak tutulmayacaklar

Google Drive/Docs, Slack/Discord, Linear/Jira ve Figma aktif plugin yol haritasından çıkarıldı. Cursor ve VS Code Copilot harici geliştirme istemcileri olarak kalır; AI Studio içinde ikinci bir connector ürünü yapılmaz. GitHub Actions, ayrı connector değildir; GitHub bağlantısı içinde kullanılır.

Bu sadeleştirme AI Studio'nun çekirdek AI Team motorlarını veya mevcut özelliklerini kaldırmaz:

- Mevcut 10 AI Team motoru korunur.
- Skills Library ve ortak proje bağlamı korunur.
- Local Coder, PC Ollama ve Android GGUF korunur.
- OpenShorts entegrasyonu korunur.
- GitHub ve Notion proje bağlantıları korunur.

## K.4 GitHub kodlama ön koşulu — private repo migration

2026-11-14 canlı GitHub kontrolünde <code>babaprobado-bit/A-studio-private</code> private depoda yalnızca <code>main</code> branch ve <code>.github/workflows/mirror-source.yml</code> bulundu. Kaynak kodun ve feature branch'in tam mirror işlemi tamamlanmamış.

- Private repo görünürlüğü <code>private=true</code>; mevcut main SHA: <code>fa7701c25c20ae1fd05bf18f316824eee46b16c3</code>.
- Mirror run [42753747536](https://github.com/babaprobado-bit/A-studio-private/actions/runs/42753747536) başarısız. Clone adımı geçti; kaynak branch/tag push adımı başarısız; ref doğrulaması çalışmadı.
- GitHub Actions repository secret listesi boş. Mevcut <code>mirror-source.yml</code>, <code>MIRROR_TOKEN</code> yerine <code>GH_TOKEN: ${{ github.token }}</code> kullanıyor; job'a <code>contents: write</code> verilmiş olmasına rağmen run 42753747536 kaynak branch/tag push aşamasında başarısız olmuş. Dolayısıyla önceki notlarda anlatılan <code>MIRROR_TOKEN</code> bu workflow sürümüne henüz bağlanmış değil. Sonraki migration düzeltmesi, ayrı bir migration branch'inde workflow'u bu secret'ı okuyacak şekilde güncellemek ve sonra secret metadata ile mirror SHA karşılaştırmasını doğrulamak olmalı. Secret değeri Notion/chat'e yazılmaz.
- Kaynak <code>A-studio</code> public branch <code>feature/android-offline-skills-v1</code> son görülen SHA <code>44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c</code>.
- Mevcut güvenlik kararı korunur: kaynak public repo'ya yeni kod yazılmaz; private repo'nun eksiksiz branch/geçmiş mirror işlemi doğrulanmadan AI Studio kod değişikliği başlatılmaz. <code>main</code> üzerinde yeni uygulama kodu, merge veya force-push yapılmaz.
- Gerekli kullanıcı adımı: GitHub <code>A-studio-private</code> → Settings → Secrets and variables → Actions alanında yalnızca bu repository için sınırlı, kısa ömürlü <code>MIRROR_TOKEN</code> secret'ını tanımlamak. Token değeri chat veya Notion'a yazılmaz. Gerekli izinler ve kullanım süresi, önceki private migration kaydındaki yönergeye göre uygulanır.
- Mirror işlemi tamamlanıp kaynak/hedef branch SHA'ları eşleştiğinde OpenMausBot ve gerçek REA entegrasyonu özel feature branch üzerinden uygulanır; test/CI kanıtı ayrı kaydedilir.

<b>Durum:</b> Plugin listesi sadeleştirildi ve mimari kararlar kaydedildi. OpenMausBot/REA kod değişikliği henüz yapılmadı; private source migration engeli açık.

## OpenShorts ZIP karşılaştırması ve inceleme — 2026-11-14

Kullanıcının yüklediği [AI-Studio-OpenShorts-Source-Bundle.zip](http://AI-Studio-OpenShorts-Source-Bundle.zip), aktif kaynak dalı ve bu sayfadaki tam 8 dosyalık patch ile karşılaştırıldı.

### Karşılaştırma sonucu

- Kaynak dalı: feature/android-offline-skills-v1
- Kontrol edilen HEAD: 44326c8b8513b3e3b7b91e9b99a327c1ad46cf1c
- src/openshorts-mcp.js: yüklenen ZIP ile birebir aynı.
- scripts/test-openshorts.mjs: yüklenen ZIP ile birebir aynı.
- docs/INTEGRATIONS/[OPENSHORTS.md](http://OPENSHORTS.md): yüklenen sürümde ek Repository record bölümü bulunuyor; branch sürümü korunuyor, ek kayıt ayrı sürüm olarak arşivlendi.
- Notion'daki tam OpenShorts patch metnindeki main.js, index.html, style.css, server.js ve package.json değişiklikleri mevcut HEAD'de zaten yer alıyor.
- Bu karşılaştırmada GitHub'a yeni kod commit edilmedi. Private source migration engeli devam ettiği için public kaynağa ek kod yazılmadı; main ve PR #2 değiştirilmedi.

### Kod inceleme notları — henüz düzeltilmedi

1. connectOpenShortsUi() yeni girilen API anahtarını önce saveSecret() ile saklıyor, biçim doğrulaması connectOpenShorts() içinde sonra yapılıyor. Geçersiz anahtar başarısız bağlantıdan önce kaydedilebilir.
2. disconnectOpenShortsUi() deleteSecret() çağrısından sonra runtimeKeys.openshorts değerini sıfırlamıyor. Anahtar UI belleğinde kalabilir. Silme başarılı olduktan sonra bellek değerinin de temizlenmesi gerekiyor.
3. test-openshorts.mjs fakeFetch kullanıyor. Gerçek OpenShorts sunucusu, CORS, gerçek API anahtarı, gerçek klip işi ve Android SecureStorage test edilmedi. README, testin henüz çalıştırılmadığını açıkça belirtiyor.
4. MCP Streamable HTTP uyumluluğu ayrıca incelenmeli: adapter yalnızca application/json Accept gönderiyor, SSE cevaplarını işleyemiyor ve initialize sonrasında MCP-Protocol-Version header'ını göndermiyor. Gerçek servis testi olmadan canlı bağlantı doğrulanmış sayılmaz.
5. publish\_clip izin listesinde yok; otomatik sosyal medya yayınlama etkin değil ve bu sınır korunmalı.

### Birleştirilmiş arşiv

[AI Studio tam kaynak + OpenShorts ekleri](https://backend.composio.dev/api/v3/sl/kwD0L2mb0e)

Bu indirme, doğrulanmış kaynak çalışma ağacını ve SOURCE-BUNDLE-REVIEW klasöründe yüklenen README sürümünü, ek rehber sürümünü, Notion'daki tam patch metnini ve inceleme notlarını içerir. .git geçmişi ve APK içermez.

### Yol haritası düzeltmesi

Reverse API Engineer, kullanıcının önceki talebine uygun olarak aktif entegrasyon listesine eklendi. Kapsam: izinli API dokümanı/şeması/sağlanan trafik çıktısı incelemesi ve tipli istemci/test taslağı. Yetkisiz erişim, kimlik doğrulama atlatma ve sır/anahtar çıkarma kapsam dışıdır.

---

## Claude — Kod review sonucu (2026-11-14, zip üzerinden)

Kaynak: kullanıcının sohbete yüklediği repo zip'i (HEAD <code>44326c8</code>, OpenShorts commit'i). Hiçbir secret görülmedi veya kopyalanmadı. GitHub'a push yapılmadı.

<b>Çalıştırılan testler (Node 22, ağsız sandbox):</b>

- Geçti: <code>test:skills</code>, <code>test:ai-team</code>, <code>test:api-local-coder</code>, <code>test:rea-companion-contract</code>
- Başarısız → düzeltildi: <code>test:openshorts</code>
- Çalışmadı (kod hatası değil): <code>test:device-local-coder</code>, <code>@capacitor/core</code> bağımlılığı kurulu değil, <code>npm install</code> ağ olmadığı için yapılamadı

<b>Bulgular</b>

1. \[Bulgu · düzeltildi\] <code>scripts/test-openshorts.mjs</code>: izin verilmeyen araç çağrısı senkron <code>assert.throws</code> ile bekleniyordu; <code>callOpenShortsTool</code> <code>async</code> olduğu için hata Promise reddi olarak dönüyor. Uygulama kodu doğru (<code>main.js</code> await ediyor), hata testteydi. Düzeltme: <code>await assert.rejects(...)</code>. Test geçiyor.
2. \[Bulgu · düzeltildi\] Her iki Android workflow (<code>build-android-demo.yml</code>, <code>build-android-local-coder.yml</code>) manifest'e yalnızca <code>usesCleartextTraffic="true"</code> ekliyor; Capacitor varsayılanı <code>allowBackup="true"</code> kalıyor. Düzeltme: her iki workflow'a <code>allowBackup="false"</code> ayarlayan 5 satır eklendi (örnek manifest'lerde simüle edildi, YAML geçerli). Gerçek Gradle derlemesi bu ortamda koşturulamadı: \[Doğrulanmadı\] ilk Actions çalışmasında doğrulanmalı.
3. \[Bulgu · düzeltilmedi\] <code>main.js</code> <code>connectOpenShortsUi</code>: API anahtarı, MCP bağlantısı doğrulanmadan önce <code>saveSecret</code> ile kaydediliyor; geçersiz anahtar da cihazda kalıyor. Öneri: kaydı <code>connectOpenShorts</code> başarılı olduktan sonra yap.
4. \[Gerçek · kapsam dışı bırakıldı\] <code>usesCleartextTraffic="true"</code> LAN Ollama düz HTTP uyumluluğu için bilerek korundu; Android network security config IP aralığı kabul etmediği için daraltma yapılmadı. README'deki güvenilir ağ uyarısı geçerli.
5. \[Gerçek\] OpenShorts endpoint'i sabit (<code>https://mcp.openshorts.app/mcp</code>), kullanıcıdan alınmıyor; anahtarın başka sunucuya gitme riski yok. Hata mesajlarında anahtar <code>[API anahtarı gizlendi]</code> ile temizleniyor ve test bunu doğruluyor.

<b>Teslim:</b> düzeltilmiş 3 dosya (<code>build-android-demo.yml</code>, <code>build-android-local-coder.yml</code>, <code>test-openshorts.mjs</code>) kullanıcıya sohbette verildi; kullanıcı <code>feature/android-offline-skills-v1</code> dalına GitHub arayüzünden yükleyecek. Yazma sahibi: kullanıcı/ChatGPT. <code>main</code>'e doğrudan değişiklik yok, merge yok.

<b>Sıradaki:</b> ChatGPT/Grok madde 3'ü gerekirse uygulasın ve değişiklik sonrası Demo workflow'unu çalıştırıp APK/CI sonucunu (hash dahil) bu sayfaya yazsın.

---

# GitHub canlı aktarımı — 2026-11-19

Bu bölüm, GitHub deposunun canlı durumundan alınan yeni kayıttır. Önceki bölümlerdeki tarihsel SHA ve APK kayıtları silinmemiştir; güncel durum aşağıda ayrıca belirtilmiştir.

## Kaynak ve dal durumu

- Depo: [babaprobado-bit/A-studio](https://github.com/babaprobado-bit/A-studio)
- Depo görünürlüğü: <b>Public</b> (2026-11-19 canlı GitHub API kontrolü). Gizliye alınmış değildir.
- Aktif dal: <code>feature/android-offline-skills-v1</code>
- Güncel branch HEAD: <code>5c05c641af7889f73f7ab4c237ddc3d96442ec86</code>
- <code>main</code> SHA: <code>aab010319b6500002844bd24b11da85dd9ca3b00</code> (değişmemiş)
- PR [#2](https://github.com/babaprobado-bit/A-studio/pull/2): <b>open</b>, <b>Draft</b>, <b>unmerged</b>. Bu durum korunacak; merge veya Ready for review yapılmayacak.

## Son commit kayıtları

| Commit | Açıklama |
| --- | --- |
| <code>5c05c641</code> | Enforce free-only model preflight and Local Coder protection |
| <code>5deac56c</code> | Add Requesty free-only models and refresh NVIDIA NIM free endpoints |
| <code>eb0ae47e</code> | Fix provider model picker template syntax |
| <code>3655f06d</code> | Filter provider directory to verified free access and connect NVIDIA NIM, [Z.ai](http://Z.ai) and Merkium |
| <code>1d79f16a</code> | Remove remaining Demo copy and align AI Team tests |
| <code>a78e6425</code> | Update workshop pipeline test for real-model-only execution |

Commit listesi: [feature branch commits](https://github.com/babaprobado-bit/A-studio/commits/feature/android-offline-skills-v1).

## Son kaynak değişiklikleri

- Ücretsiz API modelleri için sağlayıcı/model bazlı izin listesi ve çağrı öncesi kontrol eklendi.
- OpenRouter için <code>openrouter/free</code> veya <code>:free</code> model kimlikleri kabul ediliyor.
- APInex için yalnızca <code>free/*</code> model kimlikleri kabul ediliyor.
- Gemini ve Groq varsayılan model kimlikleri ücretsiz listede bulunan seçeneklere çekildi.
- Local Coder API yoluna ücretli/izin listesinde olmayan bulut modellerini ağ isteğinden önce engelleyen kontrol eklendi.
- Local Coder testleri bu engelleme davranışını doğrulayacak şekilde güncellendi.
- Bu commit, tüm talep edilen sağlayıcıların ve modellerin tamamlandığı anlamına gelmez. Henüz doğrulanmamış sağlayıcılar/model kimlikleri ücretsizmiş gibi gösterilmemelidir.

## Son Android Native GGUF CI sonucu

- Workflow: [44608900404](https://github.com/babaprobado-bit/A-studio/actions/runs/44608900404)
- Kaynak SHA: <code>5c05c641af7889f73f7ab4c237ddc3d96442ec86</code>
- Sonuç: <b>failure</b>
- Başarısız adım: <code>npm run build</code> / Vite build.
- Hata: <code>src/free-api-providers.js:73:51</code> satırında APInex regex literal'ında kaçış karakteri hatası. Derleyici <code>A numeric separator is only allowed between two digits</code> hatasını verdi.
- Native regression testleri, Capacitor sync, Gradle APK derlemesi ve artifact yükleme adımları bu hata nedeniyle çalışmadı.
- Bu SHA için yeni APK artifact'i <b>üretilmedi</b>. Önceki başarılı APK kayıtları tarihsel çıktılardır; bu yeni kaynak kodunu temsil etmez.
- CI kaydı: [Native build run 44608900404](https://github.com/babaprobado-bit/A-studio/actions/runs/44608900404).

## Güncel takip listesi

- [ ] <code>src/free-api-providers.js</code> APInex regex kaçışını düzelt ve syntax/build kontrolü yap.
- [ ] <code>scripts/test-api-local-coder.mjs</code> testlerini çalıştır; ücretsiz model kabulü ve ücretli modelin ağ isteğinden önce reddedilmesini doğrula.
- [ ] Native GGUF workflow'u aynı feature branch'de yeniden çalıştır.
- [ ] Yeni kaynak SHA, CI sonucu ve APK artifact/hash bilgisini yalnızca başarıdan sonra bu kayda ekle.
- [ ] Ücretsiz sağlayıcı/model kataloğunu resmi kaynaklarla tamamla; deneme kredisi veya geçici trial olanları ücretsiz kalıcı seçeneklerle karıştırma.
- [ ] Local Coder kurulum/bağlantı testini ve Ollama model keşfini iyileştir; mevcut Ollama/GGUF yollarını bozma.

## Değişmez sınırlar

- Yalnızca <code>feature/android-offline-skills-v1</code> dalında çalış.
- <code>main</code> dalına yazma; PR #2 açık ve Draft kalmalı.
- Demo APK workflow'unu kullanma; yalnızca Native GGUF APK hedefleniyor.
- API anahtarları, token'lar ve özel sırlar GitHub/Notion'a aktarılmaz.
- CI başarısı gerçek telefonda kurulum, GGUF inference veya uçak modu testi yapıldığı anlamına gelmez.

---

# AI Studio ana proje hafızası ve devam yönergesi — 2026-11-19

Bu bölüm, farklı sohbetlerde verilmiş ve proje devam ederken kaybolmaması gereken ürün hedeflerini, kullanıcı kararlarını, teknik sınırları ve açık işleri tek yerde toplar. Önceki tarihli kayıtlar silinmemiştir; çelişki halinde en yeni açık kullanıcı kararı ve canlı GitHub durumu esas alınır.

## 1. Ürünün amacı ve genel deneyim

AI Studio; birden fazla AI sağlayıcısını ve yerel modeli tek çalışma alanında birleştiren, AI Team motorları, Skills/ortak bağlam, Local Coder ve üretim otomasyonları içeren Android ve web tabanlı bir AI çalışma ortamıdır.

- Ürün adı yalnızca <b>AI Studio</b>. Eski “Alpha 1” adı güncel ürün adı değildir.
- Kullanıcı ana sohbet alanını sıradan, temiz ve alışılmış bir AI sohbet arayüzü gibi görmek istiyor. Proje sohbeti gereksiz özel panellerle veya alışılmadık bir arayüzle karmaşıklaştırılmamalı.
- Özellik eklerken mevcut çalışan özellikler, tüm AI Team motorları, bağlantılar, Skills aktarımı ve ortak bağlam korunmalı.
- Kullanıcı “devam” dediğinde aynı aktif proje ve açık işler üzerinden ilerlenmeli; daha önce kararlaştırılmış gereksinimler tekrar sorulmamalı.
- Kullanıcı özellikle APK istediğinde demo/sunum sürümü değil, çalışan ana Native GGUF Android uygulaması hedeflenmeli.

## 2. AI Team, bağlantılar ve ortak bağlam

<b>10 AI Team motoru</b> proje çekirdeğidir ve eksiksiz korunmalıdır:

1. OpenAI
2. Anthropic / Claude
3. Google Gemini
4. DeepSeek
5. Groq
6. OpenRouter
7. Hugging Face Inference
8. Özel OpenAI uyumlu API
9. PC Ollama
10. Android cihaz içi GGUF

- Kullanıcı tüm motorların kullanılmasını istiyor; sağlayıcı/ekip akışları sebepsiz yere dört motorla sınırlandırılmamalı.
- Tekli sohbet, paralel ekip, sıralı pipeline, model karşılaştırma ve kayıtlı ekip akışları mevcut kapsamın parçasıdır.
- Skills Library, Shared Vault, aktif proje bağlamı, proje dosyaları/snippet'leri ve seçilen genel Skills korunmalı; sağlayıcı çağrılarına uygun bağlam aktarılmalı.
- İçe alınan Skill dosyaları güvenilmeyen metin olarak ele alınmalı; otomatik kod/komut çalıştırmamalı.
- GitHub ve Notion proje bağlantıları korunmalı. OpenShorts, OpenMausBot ve REA Companion entegrasyon kararları bu sayfanın önceki plugin bölümlerindeki sınırlarıyla birlikte ele alınmalı. Reverse API Engineer da izinli API dokümanı/şema/sağlanan trafik çıktısı inceleme ve istemci/test taslağı kapsamında değerlendirilmiştir.
- APInex ayrıca araştırılacak/isteğe bağlı OpenAI uyumlu sağlayıcı adayıdır; varsayılan AI Team motoru olduğu veya entegrasyonunun tamamlandığı varsayılmamalı.

## 3. Ücretsiz model ve sağlayıcı politikası

<b>Kesin kullanıcı kararı: uygulamada ücretli modeller, ücretli deneme sürümleri, yalnızca deneme kredisiyle çalışan modeller veya geçici promosyon erişimleri ücretsiz seçenek olarak sunulmayacak.</b>

- Yalnızca sürekli/kalıcı ücretsiz erişim koşulu resmi sağlayıcı kaynaklarından doğrulanan modeller ücretsiz katalogda yer almalı. Ücretsiz katman kota veya hız limiti içerebilir; bu, ücretli modele dönüşmeyi veya trial kredisi kullanmayı gerektirmemeli.
- Sağlayıcı adı tek başına ücretsiz olduğu anlamına gelmez. Her model kimliği ve erişim koşulu ayrıca doğrulanmalı.
- Kullanıcının araştırılmasını istediği aday sağlayıcılar/kataloglar: Google Gemini (AI Studio), Groq, OpenRouter ücretsiz modeller, Cloudflare Workers AI, SambaNova Cloud, NVIDIA NIM, [Z.ai/Zhipu](http://Z.ai/Zhipu) GLM Flash, LLM7, SiliconFlow, Cohere, Mistral ücretsiz erişimi, OVHcloud AI Endpoints, Gonka, ModelScope, Typhoon, Arli, Aion, OpenCode Zen, Kilo Code, Agnes, SEA-LION, Chutes, Glhf, Experiential Labs, Token Harbor, Requesty, UnoRouter, Novita, IteraCompute, Merkium, SimpleLLM, HelixMind, InternAI, BeatAPI, Zro ve [cheapllm.shop](http://cheapllm.shop).
- Bu liste <b>araştırılacak aday envanteridir</b>, hepsinin ücretsiz erişiminin doğrulandığı anlamına gelmez. Resmî fiyatlandırma/erişim belgesi doğrulanmayanlar etkin seçenek yapılmamalı.
- Özellikle NVIDIA NIM desteği kullanıcı için önemli bir gereksinimdir. [Build.NVIDIA.com](http://Build.NVIDIA.com) üzerindeki gerçek Free Endpoint modelleri güncel resmi katalogdan kontrol edilmeli; ücretli/partner/download-only uç noktalar ücretsiz API modeli gibi gösterilmemeli.
- Gemini, Groq ve diğer sağlayıcılardaki varsayılan model kimlikleri de aynı doğrulama kuralına tabi.
- OpenRouter'da yalnızca ücretsiz model kimlikleri (openrouter/free veya doğrulanmış :free biçimleri) kabul edilmeli. APInex için yalnızca doğrulanmış free/\* biçimindeki model kimlikleri kabul edilmesi planlandı; gerçek sağlayıcı koşulları ayrıca doğrulanmalı.
- Ücretsiz model denetimi yalnızca arayüzde liste filtrelemekle kalmamalı; gerçek API isteğinden önce provider/model allowlist kontrolü yapmalı. Ücretli veya doğrulanmamış model seçilirse istek gönderilmemeli.
- Sağlayıcıların ücretsiz planları değişebileceğinden model kataloğu belirli aralıklarla resmi belgelerden tekrar kontrol edilmeli; değişen koşullar Notion/GitHub kaydına işlenmeli.

## 4. Local Coder, cihaz içi modeller ve kaynak koruması

- Local Coder tek bir anlaşılır akış olmalı; mevcut Local Coder bağlantısı kolaylaştırılmalı, aynı işi yapan ikinci/çakışan bir sistem oluşturulmamalı.
- PC Ollama, OpenAI uyumlu yerel API ve Android GGUF yolları korunmalı.
- Android'de model içe aktarma, dosya seçme, model listesi, model seçme/değiştirme, indirme ve gerçek native inference akışları birlikte çalışmalı.
- Cihaz RAM/boş kaynak ve güç koşulları algılanarak çalıştırılabilecek model boyutu seçimine yardımcı olunmalı. RAM koruması, model yükleme öncesi kontrol, bellek temizliği ve başarısız yükleme sonrası gerçek native durumun yenilenmesi korunmalı.
- Model boyutu cihazın kullanılabilir belleği için uygun değilse kullanıcıya güvenli alternatif sunulmalı; uygulama cihazı kilitleyecek şekilde zorlamamalı.
- Native GGUF yolu gerçek yerel inference yapmalı; sadece web arayüzünde model varmış gibi gösterilmemeli.
- Android offline hedefi nedeniyle internet veya bilgisayar erişimi olmayan oturumlarda ilerleme, yerel cihaz testi yapılmış gibi gösterilmeden kaynak kodu/CI ve statik kontrollerle sürdürülebilir. Gerçek cihaz testi yapılmadıysa bu açıkça belirtilmeli.

## 5. Creator Studio / sosyal medya üretimi

Kullanıcı içerik üretim alanı istedi. Buradaki içerik türleri birbirinden ayrı modlar olmalı; tek bir karma üretim akışına dönüştürülmemeli:

- <b>What If</b>: “What if ...” türündeki varsayımsal senaryo içerikleri.
- <b>In My Town</b>: “In my town ...” türündeki yerel/şehir temalı içerikler.
- <b>Clips</b>: Mevcut videolardan klip seçme/oluşturma akışı; OpenShorts entegrasyonu bu işle bağlantılıdır.

Bu üç içerik türü ayrı seçimler ve ayrı üretim akışları olarak tutulmalı. “What If” ve “In My Town” klip modu değildir. OpenShorts klip işleme entegrasyonudur; tek başına gerçek metinden tam AI video üretim motoru olduğu varsayılmamalı. Gerçek AI video üretimi için ayrıca uygun servis/model araştırması yapılmalı.

- Creator Studio alanı ana AI sohbetini bozmamalı; kendi amacına uygun, açık ve sade arayüzü olmalı.
- Video seçimi ve klip üretimi otomatikleştirilebilir; ancak sosyal medya hesabına herkese açık gönderi/yayınlama gibi dış dünyada sonuç doğuran işlem kullanıcı onayı olmadan yapılmamalı.
- YouTube, TikTok, Instagram gibi hesaplarda içerik silme, profil değiştirme veya yayınlama işlemleri ayrıca açık kullanıcı onayı gerektirir. Önceki sohbetlerdeki kanal düzenleme denemeleri genel ve sürekli yetki sayılmaz.

## 6. Fikir Üreticisi ve zamanlanmış geliştirme döngüsü

Kullanıcının tarif ettiği fikir otomasyonu, AI Studio içinde ayrı bir fikir motoru/otomasyon özelliği olarak ele alınmalıdır. İstenen zaman çizelgesi Türkiye saatine göredir:

- <b>00:00</b> — Fikir üreticisi yeni proje/ürün fikirleri üretir ve fikirleri GitHub deposuna kayıt eder.
- <b>01:00</b> — Ayrı fikir motoru kaydedilen fikirleri gözden geçirir, değerlendirir ve kendi ek katkılarını/iyileştirmelerini ekler.
- <b>02:00</b> — Fikirler birbirinden ayrı işler olarak ele alınır ve uygulanmaları başlatılır; bağımsız fikirler birleştirilerek tek bir belirsiz işe dönüştürülmemeli.

Bu, kullanıcı tarafından istenen ürün davranışıdır; mevcut otomasyonun çalıştığı veya bu saatlerde GitHub'a gerçekten yazdığı doğrulanmış değildir. Uygulamadan önce izinler, çalışma dalı, commit stratejisi, çakışma kontrolü, başarısız işlerin kaydı ve kullanıcı onayı gerektiren dış işlemler tanımlanmalıdır. Bu otomasyon da AI Studio'nun GitHub güvenlik kurallarını aşamaz.

## 7. Android APK teslim standardı

- Kullanıcının istediği APK, <b>Native GGUF tam uygulama APK'sıdır</b>. Demo APK oluşturma veya demo sürümünü ana ürün gibi sunma.
- Yalnızca Native GGUF Android workflow'u kullanılmalı; demo workflow'u çalıştırılmamalı.
- APK ancak güncel feature branch SHA'sından başarıyla üretildiyse hazır olarak raporlanmalı.
- Teslimde mümkün olduğunda GitHub Actions artifact'inin doğrudan indirilebilir bağlantısı verilmeli; yalnızca workflow sayfası linki indirme bağlantısı yerine sunulmamalı.
- APK'nin hangi commit SHA'sından üretildiği, workflow sonucu ve artifact'in gerçekten oluştuğu doğrulanmalı. Eski APK, yeni kaynak kodu derlenmiş gibi sunulmamalı.
- Başarısız CI sonrası APK varmış gibi link veya başarı beyanı verilmemeli. Hata çözülüp native workflow yeniden çalıştırılmalı.
- Uygulama içinde yalnızca doğrulanmış ücretsiz API modelleri bulunmalı; ücretli ve trial seçenekler listeden ve çağrı yolundan engellenmeli.

## 8. GitHub çalışma kuralları ve mevcut anlık durum

<b>Kesin depo sınırları:</b>

- Depo: [babaprobado-bit/A-studio](https://github.com/babaprobado-bit/A-studio)
- Yalnızca feature/android-offline-skills-v1 dalında çalış.
- main dalına doğrudan commit/push yapma; merge veya force-push yapma.
- PR [#2](https://github.com/babaprobado-bit/A-studio/pull/2) açık ve Draft kalmalı. Merge etme, kapatma veya Ready for review yapma.
- Bir dosyaya yazmadan önce güncel branch HEAD, PR head SHA ve main SHA'yı tekrar kontrol et. Eski bir handoff SHA'sına güvenme.
- API key, token, şifre veya diğer secret değerlerini GitHub commit'ine, log'a, APK'ye, Notion'a veya sohbete koyma.
- Depo görünürlüğünü kullanıcı izni olmadan değiştirme. 2026-11-19 kontrolünde kaynak depo Public görünüyordu; gizli depoya taşınmış sayılmamalı.

<b>2026-11-19 canlı kontrol özeti:</b>

- Branch HEAD: 5c05c641af7889f73f7ab4c237ddc3d96442ec86
- main SHA: aab010319b6500002844bd24b11da85dd9ca3b00
- PR #2: open / Draft / unmerged.
- Son Native GGUF workflow: [44608900404](https://github.com/babaprobado-bit/A-studio/actions/runs/44608900404), kaynak SHA 5c05c641af7889f73f7ab4c237ddc3d96442ec86.
- Bu workflow Vite build aşamasında src/free-api-providers.js:73:51 APInex regex kaçış hatası yüzünden başarısız oldu. Native regression test, Capacitor sync, Gradle assemble ve artifact yükleme aşamaları çalışmadı; bu SHA için APK üretilmedi.
- Hata düzeltme önerisi kaynak satırını yeniden inceleyip regex'i doğru JavaScript literal'ına çevirmek; tahmini değişikliği kaynak kontrolü yapmadan uygulama.

## 9. Öncelikli açık işler

1. Canlı GitHub SHA/PR/main sınırlarını yeniden doğrula.
2. src/free-api-providers.js içindeki APInex regex hatasını gerçek dosya içeriğini kontrol ederek düzelt.
3. scripts/test-api-local-coder.mjs ve ücretsiz model guard testlerini çalıştır; ücretli/izin listesi dışı modellerin ağ isteğinden önce engellendiğini doğrula.
4. İlgili JS syntax, test ve web build kontrollerini geçir.
5. Sadece Native GGUF APK workflow'unu çalıştır; hata loglarını incele, başarılı artifact ve SHA'yı doğrula.
6. Kullanıcının aday sağlayıcı listesini resmi dokümanlara göre tek tek incele; kalıcı ücretsiz erişimi doğrulanmayanları etkin katalogdan çıkar veya aday olarak işaretle.
7. Özellikle NVIDIA NIM Free Endpoint kataloğunu güncelle; sohbet modelleri ile embedding/rerank/diğer görev modellerini doğru kategorilere ayır.
8. Local Coder bağlantı/kurulum akışını sadeleştir ve mevcut Ollama, yerel API, GGUF özelliklerini koru.
9. What If, In My Town ve Clips modlarının birbirinden ayrı Creator Studio akışlarını kaynak ve UI düzeyinde doğrula.
10. Fikir Üreticisi için 00:00/01:00/02:00 döngüsünü güvenli GitHub yetkileri ve kayıt/izleme ile tasarla; henüz uygulanmış gibi raporlama.
11. Her anlamlı ilerlemeden sonra bu Notion sayfasına tarih, commit SHA, test sonucu, CI sonucu ve gerçek engelleri ekle.

## 10. Çalışma raporu standardı

Her devam oturumunda aşağıdaki ayrım açık olmalı:

- <b>Tamamlandı:</b> Kaynak değişikliği/işlem gerçekten yapıldı ve doğrulandı.
- <b>Test edildi:</b> Hangi komut veya CI adımı çalıştı ve sonucu ne oldu.
- <b>CI/APK:</b> Hangi SHA derlendi; workflow başarılı mı; artifact gerçekten var mı.
- <b>Bekliyor:</b> Henüz yapılmamış veya dış erişim/izin gerektiren iş.
- <b>Doğrulanmadı:</b> Gerçek Android cihaz, çevrimdışı inference, API limiti veya harici servis testi yapılmadıysa bu şekilde belirtilmeli.

Bu kayıt, proje hafızası ve devam başlangıç noktasıdır; bir özelliğin kaynak kodda tamamlandığını tek başına kanıtlamaz.

---

# Ücretsiz model kataloğu — 2026-11-20

<b>Kullanıcı kararı (2026-11-20):</b> Aşağıdaki 36 sağlayıcı iyiden kötüye sıralanmıştır; sıra korunur. Kota yenilenen (günlük/aylık sıfırlanan) ücretsiz erişim kabul edilir. Sadece ücretsiz modeller kataloğa girer, ücretli modeller atılır.

<b>Doğrulama sınırı:</b> Aşağıdaki bilgiler üçüncü taraf ücretsiz-API dizinlerinden (Mart–Kasım 2026 denetimleri) ve SambaNova resmî dokümanından derlendi. Anahtarla canlı çağrı yapılmadı. Model listeleri sık değişir; kod tarafında allowlist'e almadan önce her sağlayıcının resmî sayfasından yeniden doğrulanmalı. Doğrulanamayanlar "Aday — etkin değil" olarak işaretlendi ve mevcut kural gereği ücretsizmiş gibi gösterilmeyecek.

## A. Ücretsiz modeli doğrulanan sağlayıcılar (kullanıcının sırasıyla)

| # | Sağlayıcı | Ücretsiz modeller (kaynaklarda görülen) | Limit / not |
| --- | --- | --- | --- |
| 1 | Google Gemini (AI Studio) | Gemini 3.5 Flash (15 RPM / 1.500 RPD, Ekim dizini; başka bir dizin Gemini 3 Flash için 5 RPM / 20 RPD yazıyor, resmî tablodan doğrula). 2.5 Flash ve 2.5 Pro yalnızca mevcut kullanıcılara açık ve 2026-12-01'de kapanıyor, yeni kayıt için kullanma. DÜZELTME 2026-11-20: Gemini 2.0 Flash 2026-06-01'de kapandı, 2.5 Pro Nisan 2026'da ücretsiz katmandan çıktı; ilk yazdığım bu iki model hatalıydı. 3.1 Pro Preview kaynaklar arasında çelişkili, etkin değil. | Modele göre RPM/RPD; günlük kota Pasifik saatiyle gece yarısı sıfırlanır. AB/Birleşik Krallık/İsviçre'de ücretsiz katman yok. Eski Gemini 1.5 modelleri kullanımdan kalktı. |
| 2 | Groq | Llama 3.3 70B, Llama 4 Scout, Llama 4 Maverick, Kimi K2, Qwen QwQ 32B ve diğerleri | \~30 RPM; günlük 1K–14.4K istek (modele göre) |
| 3 | OpenRouter | Yalnızca <code>:free</code> / <code>openrouter/free</code>: DeepSeek R1, Llama 3.3 70B, GPT-OSS-120B, Qwen3 Coder 480B | \~20 RPM; günlük 50–200 istek (kaynaklar farklı). MiniMax M2.7/M3 ücretsiz varyantları ücretli oldu, listeden çıkar. |
| 4 | Cloudflare Workers AI | Llama 3.3 70B, Llama 4 Scout, Qwen, Gemma, Mistral | 10.000 neuron/gün. 2026-07-28'den beri yeni amiral modeller yalnızca Workers Paid; onlar dışarıda. |
| 5 | SambaNova Cloud | gpt-oss-120b, DeepSeek-V3.2, gemma-4-31B-it, Llama 3.3 70B | Kart bağlanmadan ücretsiz katman. Üçüncü taraf kaynağa göre \~20 RPM ve \~200K token/gün; resmî tablodan doğrula. Kart bağlanınca Developer katmana geçer. |
| 6 | NVIDIA NIM ([build.nvidia.com](http://build.nvidia.com)) | Llama 3.3 70B, Qwen3 235B, Qwen3-Coder-480B, DeepSeek, GLM-5.3-Flash, MiniMax M2.7 | \~40 RPM, telefon doğrulaması. Sohbet modelleri; embedding/rerank/görsel modeller ayrı kategoride tutulmalı. |
| 7 | [LLM7.io](http://LLM7.io) | DeepSeek R1, Gemini Flash-Lite, Qwen2.5 Coder | 15 RPM (ücretsiz token ile 30). gpt-oss kataloğdan kaldırıldı. |
| 8 | SiliconFlow | Küçük açık modeller: Qwen3-8B, DeepSeek-R1-Distill-Qwen-7B, DeepSeek-OCR | Kimlik doğrulaması gerekir; ücretsiz liste rotasyonlu, konsoldan doğrula. Büyük modeller ücretli, atılır. |
| 9 | Cohere | Command A, Command R+, Command R, Aya Expanse 32B/8B | \~20 RPM, ayda \~1.000 istek. Ticari kullanım koşulunu resmî sayfadan doğrula. |
| 10 | Mistral AI (ücretsiz mod) | Mistral Small 3.1, Mistral Large 3, Ministral 8B, Codestral | \~1 istek/sn, ayda \~1B token. Magistral Medium sürümleri için deprecation kaydı var; güncel listeyi doğrula. |
| 11 | OVHcloud AI Endpoints | Qwen3.8-27B ve diğer açık modeller | Anahtarsız sandbox: IP başına \~2 istek/dk. bge-multilingual-gemma2 2027-01-21'de kapanıyor. |
| 12 | ModelScope | Kayıtla erişilen \~56 ücretsiz model (Ağustos dizini) | Kayıt gerekir; uç nokta [api-inference.modelscope.cn/v1](http://api-inference.modelscope.cn/v1) |
| 13 | OpenCode Zen | Hesapla ücretsiz modeller (ör. flint-40b-free, pulse-alpha-free) | Slotlar sık değişiyor; Kasım denetiminde 4 model ölmüştü. pulse-alpha-free ABD/müttefik bölgeler dışında kısıtlı. |
| 14 | Kilo Code | Ücretsiz otomatik yönlendirici ve <code>:free</code> modeller (ör. inkling, gemma-4-31b-it) | Anahtarsız çalışabilir, sıkı paylaşımlı limit. Ücretli olanlar (ör. ling-3.1-flash) atılır. |
| 15 | UnoRouter | Yalnızca <code>:free</code> sonekli modeller (DeepSeek V4 Flash/Pro, GLM 5.2, Qwen3.5 397B, Nemotron 3 Ultra, Kimi vb.) | Model başına \~1 RPM; 429 gelirse modeller arasında dönmek gerekir. |
| 16 | Novita AI | Yalnızca 2 sıfır fiyatlı model kaldı (ör. Apodex 1.1 Mini) | Diğer modeller ücretli, atılır. |

## B. Çelişkili — şimdilik etkin değil

- [<b>Z.ai</b>](http://Z.ai)<b> / Zhipu AI (GLM Flash):</b> Mart dizinlerinde GLM-4.7-Flash, GLM-4.5-Flash, GLM-4.6V-Flash ücretsiz görünüyordu. Ekim 2026 denetiminde [Z.ai](http://Z.ai)'nin GLM Coding Plan ücretsiz penceresi 2026-10-07'de bitmiş ve sağlayıcı sıfır ücretsiz model ile katalogdan çıkarılmış. Resmî doğrulama gelene kadar etkin değil. GLM-5.3-Flash'a NVIDIA NIM veya OpenRouter üzerinden ücretsiz ulaşılabiliyor.

## C. Doğrulanamayan adaylar — etkin değil

Resmî ücretsiz erişim koşulları bu araştırmada doğrulanamadı. Doğrulanana kadar uygulama içinde ücretsiz seçenek olarak gösterilmeyecek ve istek yolundan engellenecek:

Gonka Broker (aylık \~1M token iddiası), Typhoon (SCB 10X), Arli AI, Aion Labs, Agnes AI, SEA-LION, [Chutes.ai](http://Chutes.ai) (Nisan listesinde 4 topluluk GPU modeli vardı, güncel değil), [Glhf.chat](http://Glhf.chat), Experiential Labs, Token Harbor, Requesty (Eylül denetiminde değişiklik yok denmiş, model listesi alınamadı), IteraCompute, Merkium, SimpleLLM, HelixMind, InternAI, BeatAPI, Zro, [cheapllm.shop](http://cheapllm.shop).

## C.1 Atılanlar

- [<b>Chutes.ai</b>](http://Chutes.ai)<b>:</b> Haziran 2026 denetiminde ücretsiz katmanın 2026-03'te bittiği kaydedilmiş; Şubat 2026'dan beri güçlü modeller Standard ve üstü abonelik gerektiriyor. Bazı dizinler hâlâ 2 ücretsiz model gösteriyor ama bu çelişkili ve doğrulanmadı. Katalogdan çıkarıldı.

## D. Uygulama kuralları

1. Allowlist yalnızca A tablosundaki sağlayıcı + model kimliklerinden oluşur. Listede olmayan model, API isteği gitmeden engellenir (mevcut ücretsiz-model guard'ı ile aynı kural).
2. B ve C bölümündeki sağlayıcılar aday olarak kalır; resmî kaynak doğrulanınca A'ya taşınır.
3. Her sağlayıcı için ücretsiz katman koşulları (kota yenilenmesi, kart/telefon/kimlik gereksinimi, bölge kısıtı) katalogda ayrı alan olarak tutulur.
4. Katalog düzenli aralıklarla resmî belgelerden yeniden denetlenir; kaldırılan modeller allowlist'ten çıkarılır.
5. Deneme kredisiyle veya geçici promosyonla ücretsiz görünen modeller bu kataloğa alınmaz.
6. Bu kayıt kaynak koda henüz uygulanmadı; <code>src/free-api-providers.js</code> güncellemesi ayrı görevdir ve önce APInex regex hatası giderilmelidir.

Kaynaklar: [awesome-free-llm-apis](https://github.com/amardeeplakshkar/awesome-free-llm-apis) (Mart 2026), [awesome-freellm-apis](https://github.com/open-free-llm-api/awesome-freellm-apis) (Ağustos 2026), [free-coding-models denetimleri](https://github.com/vava-nessa/free-coding-models/releases/tag/v0.6.1) (Eylül–Kasım 2026), [SambaNova rate limits](https://docs.sambanova.ai/docs/en/models/rate-limits).

---

# Ücretsiz model kataloğu — ek araştırma ve görev dağılımı (2026-11-20, 2. tur)

<b>Not:</b> Yukarıdaki C bölümündeki aday listesi bu bölümle güncellenmiştir. C'deki Gonka, Typhoon, Arli AI, Aion Labs, Agnes AI, SEA-LION, IteraCompute, Requesty ve [Glhf.chat](http://Glhf.chat) artık aşağıdaki A.2 tablosundadır. Bu bölüm eski C satırından önceliklidir. Bilgiler yine üçüncü taraf dizinler ve sağlayıcı sayfalarından; anahtarla canlı test yapılmadı.

## A.2 Yeni doğrulananlar (kullanıcının sırasıyla)

| Sağlayıcı | Ücretsiz modeller | Limit / not | Güven |
| --- | --- | --- | --- |
| Gonka Broker | GLM-5.3 Flash, DeepSeek V4 Flash, MiniMax M2.7 | Telefon SMS doğrulamasıyla her takvim ayı yenilenen token hibesi (birikmez). Telefon başına bir hibe, VoIP numara reddedilir. Kart yok. | Tek dizin |
| Typhoon (SCB 10X) | typhoon-v2.5-30b-a3b-instruct, typhoon-ocr-v1.5 | Araştırma projesi olarak ücretsiz (resmî SSS). Metin 200 RPM, OCR 20 RPM. Tay diline odaklı. Kullanım verisi toplanıyor. | Resmî SSS + dizin |
| Arli AI | Yalnızca Qwen3.5-27B-Derestricted | Aynı anda 1 istek, 12K bağlam, çok düşük istek hakkı (dizine göre \~2 günde 5). Pratikte yalnızca yedek. | Dizin |
| Aion Labs | aion-labs/aion-3.0 ve aion-2.0 (rol yapma / hikâye odaklı) | 15 RPM, 20K token/dk, günlük 20K token. Kart yok. Ticari şartlar net değil. | İki dizin |
| Agnes AI | 5 model (metin, görsel, video, vision), 256K bağlam | Kayıt gerekir. Model adları ve limit alınamadı; kullanmadan önce doğrula. | Tek dizin, kısmi |
| SEA-LION (AI Singapore) | Qwen-SEA-LION-v4.5-27B-IT, Llama-SEA-LION-v3.5-70B-R, SEA-Guard, ModernBERT embedding | Deneme anahtarı (Google ile giriş), kullanıcı başına 10 RPM. Anahtar bir kez gösterilir. Şartlar değişebilir. | Dizin |
| Requesty | 13 sıfır fiyatlı model (Gemma, Nemotron, DeepSeek, Llama varyantları) | Resmî: yalnızca ücretsiz modeller, günde 200 istek, kart yok, günlük sıfırlanır. Ücretsiz model kimliklerinin son kullanma tarihi var; canlı listeden kontrol et. | Resmî sayfa |
| IteraCompute | qwen/qwen3.8-27b | Ayda 30M token yenilenen hibe, istek başına 8.192 çıktı, 160K token/dk, kart yok. | Tek dizin |
| [Glhf.chat](http://Glhf.chat) | 2 model (adlar alınamadı) | Kayıt gerekir. Doğrulanana kadar etkin değil. | Tek dizin, kısmi |

<b>Hâlâ doğrulanamayanlar (etkin değil):</b> Experiential Labs, Token Harbor, Merkium, SimpleLLM, HelixMind, InternAI, BeatAPI, Zro, [cheapllm.shop](http://cheapllm.shop). Güvenilir bir ücretsiz erişim kaydı bulunamadı.

<b>Gemini düzeltmesi (2. tur):</b> Gemini 2.5 Flash ve 2.5 Pro yalnızca mevcut kullanıcılara açık ve 2026-12-01'de kapanıyor. Yeni projede Gemini 3.5 Flash kullanılmalı.

## E. Görev dağılımı (öneri — henüz uygulanmadı)

Amaç: Her sağlayıcıyı güçlü olduğu işe koymak, hız/kota sınırlarını korumak ve bir sağlayıcı dolunca otomatik yedeğe geçmek. Dağılım, mevcut Local Coder Plan / Code / Review aşamalarıyla uyumludur.

### E.1 Rol grupları ve yedek zinciri

| Rol | Birincil | Yedek zinciri |
| --- | --- | --- |
| Hızlı sohbet ve sınıflandırma | Groq (Llama 3.3 70B) | Cloudflare → LLM7 → Kilo otomatik yönlendirici |
| Uzun bağlam ve özet | Gemini 3.5 Flash | NVIDIA NIM → OpenRouter :free |
| Plan (mimari, adım listesi) | SambaNova (gpt-oss-120b / DeepSeek-V3.2) | NVIDIA NIM (Qwen3 235B) → OpenRouter (DeepSeek R1 :free) |
| Kod yazma | NVIDIA NIM (Qwen3-Coder-480B) | OpenRouter (Qwen3 Coder 480B :free) → OpenCode Zen → Kilo |
| Kod inceleme (Review) | OpenCode Zen | Mistral (Codestral) → Cohere Command A |
| Oyun metni, NPC, hikâye | Aion Labs | IteraCompute (Qwen3.8 27B) → Gonka |
| Yüksek hacimli toplu iş | IteraCompute (30M/ay) | Gonka → Mistral (1B/ay) |
| Çok dilli çeviri | Mistral | Typhoon (Tayca) / SEA-LION (Güneydoğu Asya dilleri) / ModelScope (Çince) |
| Küçük araç çağırma, JSON | SiliconFlow (Qwen3-8B) | Groq → LLM7 |
| Güvenlik sınıflandırma | SEA-Guard | Cohere |
| Yönlendirici yedeği | Requesty (200/gün) | UnoRouter (:free, modeller arası dön) → Novita |
| Anahtarsız sağlık kontrolü | OVHcloud sandbox | Kilo (anahtarsız) |

### E.2 Mini AI görevleri (her sağlayıcıya bir tane)

Her görev kısa ve sonucu elle kontrol edilebilir. Amaç, sağlayıcının canlı çalıştığını ve rolüne uyduğunu doğrulamaktır. Başarı ölçütü sağlanmazsa sağlayıcı allowlist'ten geçici olarak çıkarılır.

| # | Sağlayıcı / model | Mini görev | Başarı ölçütü |
| --- | --- | --- | --- |
| 1 | Gemini 3.5 Flash | 3 paragraflık bir metni 3 maddede özetle | 3 madde, orijinale sadık |
| 2 | Groq Llama 3.3 70B | 10 oyun fikrini türe ayır, JSON döndür | Geçerli JSON, 10 kayıt |
| 3 | OpenRouter openrouter/free | "Merhaba" de, kullanılan model kimliğini logla | Yanıt var, model <code>:free</code> |
| 4 | Cloudflare Llama 3.3 70B | 5 cümleyi TR→EN çevir | 5 çeviri, anlam doğru |
| 5 | SambaNova gpt-oss-120b | Basit mantık bulmacasını adım adım çöz | Doğru sonuç |
| 6 | NVIDIA NIM Qwen3-Coder-480B | URL doğrulayan JS regex ve 5 test yaz | Testler Node'da geçer |
| 7 | LLM7 | Tek cümlelik Türkçe selamlama | Yanıt \< 5 sn |
| 8 | SiliconFlow Qwen3-8B | Bir araç çağrısı şeması üret (hava durumu) | Şemaya uygun JSON |
| 9 | Cohere Command A | Verilen 3 cümlelik belgeden soruyu yanıtla | Yanıt belgeye dayalı |
| 10 | Mistral Small | Hatalı bir Türkçe paragrafı düzelt | Yazım hataları giderilmiş |
| 11 | OVHcloud sandbox | "ping" yanıtı al | Anahtarsız yanıt gelir |
| 12 | ModelScope Qwen | Bir Çince cümleyi İngilizceye çevir | Anlam doğru |
| 13 | OpenCode Zen | 10 satırlık fonksiyondaki hatayı bul | Hata doğru satırda |
| 14 | Kilo otomatik yönlendirici | Bir diff için commit mesajı yaz | Tek satır, anlamlı |
| 15 | UnoRouter :free | İlk model 429 verirse ikinci modele geç | Geçiş çalışır |
| 16 | Novita ücretsiz model | Tek cümlelik özet | Yanıt var |
| 17 | Gonka GLM-5.3 Flash | Tek cümlelik haber başlığı üret (aylık kotayı korumak için kısa) | Yanıt var, kota düştü |
| 18 | Typhoon | "Merhaba" cümlesini Tayca çevir | Tayca yanıt |
| 19 | SEA-LION | Endonezyaca bir cümleyi Türkçeye çevir; SEA-Guard ile güvenlik sınıfı al | Çeviri + sınıf etiketi |
| 20 | Aion Labs aion-3.0 | 3 cümlelik oyun NPC diyaloğu yaz | 3 cümle, karakter tutarlı; günlük 20K token'ı aşma |
| 21 | Requesty ücretsiz model | Canlı model listesinden bir ücretsiz modele "merhaba" de | Yanıt var, sayaç düştü |
| 22 | IteraCompute Qwen3.8 27B | 200 kelimelik oyun görev metni yaz | \~200 kelime, çıktı limiti 8.192 token altında |
| 23 | Arli AI (yedek) | Tek soruya tek cümle yanıt | Yanıt var (çok düşük kota, tekrar deneme) |

Agnes AI ve [Glhf.chat](http://Glhf.chat) için model adları doğrulanana kadar mini görev atanmadı.

### E.3 İşletme kuralları

1. Her sağlayıcı için günlük/aylık kota sayacı tutulur; kota %90'a gelince yedek zincire geçilir.
2. Mini görevler kurulum sırasında bir kez ve sonra haftalık sağlık kontrolü olarak çalışır; başarısız olan sağlayıcı geçici devre dışı kalır.
3. Allowlist dışı ve ücretli model, isteğe gitmeden engellenir (mevcut guard kuralı).
4. Veri toplayan sağlayıcılara (ör. Typhoon, bazı OpenRouter ücretsiz modelleri) gizli kod, anahtar veya kişisel veri gönderilmez.
5. Bu dağılım bir öneridir. Koda uygulanması ayrı görevdir; önce APInex regex hatası giderilmeli, <code>src/free-api-providers.js</code> gerçek içeriği kontrol edilmeli.

<page url="https://app.notion.com/p/41d7b0fa543b81628993d9b7f53b7c83">
Ücretsiz Model Kataloğu ve Görev Dağılımı (düzenli, 2026-11-20)
</page>

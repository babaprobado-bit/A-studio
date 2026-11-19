Bu sayfa, ana AI Studio sayfasındaki dağınık ücretsiz model bölümlerinin (A, A.2, B, C, C.1, E) tek ve düzenli halidir. Çelişki olursa bu sayfa geçerlidir.

<b>Kurallar:</b> Sıra kullanıcının verdiği iyiden kötüye sıradır. Yalnızca kota yenilenen ücretsiz erişim kabul edilir; ücretli model, deneme kredisi ve geçici promosyon alınmaz. Allowlist dışı model isteğe gitmeden engellenir. Bilgiler üçüncü taraf dizinler ve sağlayıcı sayfalarından derlendi, anahtarla canlı test yapılmadı; kodlamadan önce resmî sayfadan doğrula.

<b>Durum etiketleri:</b> Etkin = allowlist'e alınabilir · Zayıf = etkin ama çok düşük kota · Çelişkili / Kısmi / Doğrulanamadı = etkin değil · Atıldı = katalogdan çıkarıldı.

## 1. Katalog (36 sağlayıcı)

| # | Sağlayıcı | Durum | Ücretsiz modeller | Limit / not |
| --- | --- | --- | --- | --- |
| 1 | Google Gemini (AI Studio) | Etkin | Gemini 3.5 Flash (Flash ailesi + Gemma). 2.5 Flash/Pro yalnızca mevcut kullanıcılara açık, 2026-12-01'de kapanıyor | Kaynaklar arası limit çelişkisi (15 RPM / 1.500 RPD veya 5 RPM / 20 RPD), resmî tablodan doğrula. AB/UK/İsviçre'de ücretsiz katman yok |
| 2 | Groq | Etkin | Llama 3.3 70B, Llama 4 Scout/Maverick, Kimi K2, Qwen QwQ 32B | \~30 RPM, günlük 1K–14.4K istek |
| 3 | OpenRouter | Etkin | Yalnızca :free ve openrouter/free (DeepSeek R1, Llama 3.3 70B, GPT-OSS-120B, Qwen3 Coder 480B) | Günlük 50–200 istek. MiniMax M2.7/M3 ücretsiz varyantları ücretli oldu |
| 4 | Cloudflare Workers AI | Etkin | Llama 3.3 70B, Llama 4 Scout, Qwen, Gemma | 10.000 neuron/gün. Yeni amiral modeller 2026-07-28'den beri ücretli plan |
| 5 | SambaNova Cloud | Etkin | gpt-oss-120b, DeepSeek-V3.2, gemma-4-31B-it, Llama 3.3 70B | Kartsız ücretsiz katman, \~20 RPM ve \~200K token/gün (resmî tablodan doğrula) |
| 6 | NVIDIA NIM | Etkin | Llama 3.3 70B, Qwen3 235B, Qwen3-Coder-480B, DeepSeek, GLM-5.3-Flash | \~40 RPM, telefon doğrulaması. Sohbet ve embedding/rerank ayrı tutulur |
| 7 | [Z.ai](http://Z.ai) / Zhipu (GLM Flash) | Çelişkili | GLM-4.x-Flash (Mart/Haziran dizinleri) | Ekim denetimi ücretsiz pencerenin 2026-10-07'de bittiğini söylüyor. GLM-5.3-Flash NIM/OpenRouter üzerinden ücretsiz |
| 8 | [LLM7.io](http://LLM7.io) | Etkin | DeepSeek R1, Gemini Flash-Lite, Qwen2.5 Coder | 15 RPM (token ile 30). gpt-oss kaldırıldı |
| 9 | SiliconFlow | Etkin | Qwen3-8B, DeepSeek-R1-Distill-Qwen-7B, DeepSeek-OCR | Kimlik doğrulaması gerekir, liste rotasyonlu |
| 10 | Cohere | Etkin | Command A, Command R+, Command R, Aya Expanse | \~20 RPM, ayda \~1.000 istek. Ticari kullanım koşulunu doğrula |
| 11 | Mistral AI (ücretsiz mod) | Etkin | Mistral Small 3.1, Mistral Large 3, Ministral 8B, Codestral | \~1 istek/sn, ayda \~1B token |
| 12 | OVHcloud AI Endpoints | Etkin | Qwen3.8-27B ve diğer açık modeller | Anahtarsız sandbox, IP başına \~2 istek/dk |
| 13 | Gonka Broker | Etkin | GLM-5.3 Flash, DeepSeek V4 Flash, MiniMax M2.7 | SMS doğrulamasıyla her ay yenilenen hibe, birikmez. Tek dizin kaynaklı |
| 14 | ModelScope | Etkin | \~56 ücretsiz model (kayıtla) | [api-inference.modelscope.cn/v1](http://api-inference.modelscope.cn/v1) |
| 15 | Typhoon (SCB 10X) | Etkin | typhoon-v2.5-30b-a3b-instruct, typhoon-ocr-v1.5 | 200 RPM, Tay odaklı, kullanım verisi toplanıyor |
| 16 | Arli AI | Zayıf | Qwen3.5-27B-Derestricted | 1 eşzamanlı istek, 12K bağlam, çok düşük kota. Yalnızca yedek |
| 17 | Aion Labs | Etkin | aion-3.0, aion-2.0 (hikâye/rol yapma) | 15 RPM, günlük 20K token |
| 18 | OpenCode Zen | Etkin | Hesapla ücretsiz rotasyonlu modeller (ör. flint-40b-free) | Slotlar sık değişir, listeyi canlı kontrol et |
| 19 | Kilo Code | Etkin | Ücretsiz otomatik yönlendirici ve :free modeller | Anahtarsız çalışabilir, sıkı paylaşımlı limit |
| 20 | Agnes AI | Kısmi | 5 model (adlar alınamadı) | Kayıt gerekir |
| 21 | SEA-LION | Etkin | Qwen-SEA-LION-v4.5-27B-IT, Llama-SEA-LION-v3.5-70B-R, SEA-Guard | Deneme anahtarı, 10 RPM |
| 22 | [Chutes.ai](http://Chutes.ai) | Atıldı | — | Ücretsiz katman 2026-03'te bitti, güçlü modeller ücretli aboneliğe taşındı |
| 23 | [Glhf.chat](http://Glhf.chat) | Kısmi | 2 model (adlar alınamadı) | Kayıt gerekir |
| 24 | Experiential Labs | Doğrulanamadı | — | Güvenilir kayıt yok |
| 25 | Token Harbor | Doğrulanamadı | — | Güvenilir kayıt yok |
| 26 | Requesty | Etkin | \~13 sıfır fiyatlı model (Gemma, Nemotron, DeepSeek, Llama) | Resmî: günde 200 istek, kart yok. Model kimliklerinin son kullanma tarihi var |
| 27 | UnoRouter | Etkin | Yalnızca :free sonekli modeller | Model başına \~1 RPM, 429'da modeller arası dön |
| 28 | Novita AI | Etkin | Yalnızca 2 sıfır fiyatlı model | Diğerleri ücretli, atıldı |
| 29 | IteraCompute | Etkin | qwen/qwen3.8-27b | Ayda 30M token, istek başına 8.192 çıktı, kart yok. Tek dizin kaynaklı |
| 30 | Merkium | Doğrulanamadı | — | Güvenilir kayıt yok |
| 31 | SimpleLLM | Doğrulanamadı | — | Güvenilir kayıt yok |
| 32 | HelixMind | Doğrulanamadı | — | Güvenilir kayıt yok |
| 33 | InternAI | Doğrulanamadı | — | Güvenilir kayıt yok |
| 34 | BeatAPI | Doğrulanamadı | — | Güvenilir kayıt yok |
| 35 | Zro | Doğrulanamadı | — | Güvenilir kayıt yok |
| 36 | [cheapllm.shop](http://cheapllm.shop) | Doğrulanamadı | — | Güvenilir kayıt yok |

## 2. Görev dağılımı (öneri, koda uygulanmadı)

| Rol | Birincil | Yedek zinciri |
| --- | --- | --- |
| Hızlı sohbet, sınıflandırma | Groq | Cloudflare → LLM7 → Kilo |
| Uzun bağlam, özet | Gemini 3.5 Flash | NVIDIA NIM → OpenRouter :free |
| Plan | SambaNova | NVIDIA NIM (Qwen3 235B) → OpenRouter (DeepSeek R1) |
| Kod yazma | NVIDIA NIM (Qwen3-Coder-480B) | OpenRouter (Qwen3 Coder) → OpenCode Zen → Kilo |
| Kod inceleme | OpenCode Zen | Mistral (Codestral) → Cohere |
| Oyun metni, NPC | Aion Labs | IteraCompute → Gonka |
| Yüksek hacimli iş | IteraCompute | Gonka → Mistral |
| Çeviri | Mistral | Typhoon (Tayca) / SEA-LION / ModelScope (Çince) |
| Küçük araç çağırma, JSON | SiliconFlow | Groq → LLM7 |
| Güvenlik sınıflandırma | SEA-Guard | Cohere |
| Yönlendirici yedeği | Requesty | UnoRouter → Novita |
| Anahtarsız sağlık kontrolü | OVHcloud | Kilo |

## 3. Mini AI görevleri (her sağlayıcıya bir tane)

| # | Sağlayıcı | Görev | Başarı ölçütü |
| --- | --- | --- | --- |
| 1 | Gemini 3.5 Flash | 3 paragrafı 3 maddede özetle | 3 madde, sadık |
| 2 | Groq | 10 oyun fikrini türe ayır, JSON ver | Geçerli JSON, 10 kayıt |
| 3 | OpenRouter free | "Merhaba" de, model kimliğini logla | Yanıt var, :free |
| 4 | Cloudflare | 5 cümleyi TR→EN çevir | Anlam doğru |
| 5 | SambaNova | Mantık bulmacasını adım adım çöz | Doğru sonuç |
| 6 | NVIDIA NIM | URL doğrulayan JS regex ve 5 test yaz | Testler geçer |
| 7 | LLM7 | Tek cümle Türkçe selamlama | \< 5 sn |
| 8 | SiliconFlow | Hava durumu araç şeması üret | Şemaya uygun JSON |
| 9 | Cohere | 3 cümlelik belgeden soruyu yanıtla | Belgeye dayalı |
| 10 | Mistral | Hatalı Türkçe paragrafı düzelt | Hatalar giderilmiş |
| 11 | OVHcloud | "ping" yanıtı al | Anahtarsız yanıt |
| 12 | ModelScope | Çince cümleyi İngilizceye çevir | Anlam doğru |
| 13 | OpenCode Zen | 10 satırlık fonksiyondaki hatayı bul | Doğru satır |
| 14 | Kilo | Diff için commit mesajı yaz | Tek satır, anlamlı |
| 15 | UnoRouter | İlk model 429 verirse ikinciye geç | Geçiş çalışır |
| 16 | Novita | Tek cümlelik özet | Yanıt var |
| 17 | Gonka GLM-5.3 Flash | Tek cümle haber başlığı (aylık kotayı korumak için kısa) | Yanıt var |
| 18 | Typhoon | "Merhaba"yı Tayca çevir | Tayca yanıt |
| 19 | SEA-LION | Endonezyaca cümleyi Türkçeye çevir, SEA-Guard sınıfı al | Çeviri + etiket |
| 20 | Aion Labs | 3 cümlelik NPC diyaloğu | Tutarlı, günlük 20K token aşılmaz |
| 21 | Requesty | Canlı listeden bir ücretsiz modele "merhaba" de | Yanıt var, sayaç düştü |
| 22 | IteraCompute | 200 kelimelik görev metni | \~200 kelime |
| 23 | Arli AI | Tek soruya tek cümle (yedek) | Yanıt var |

## 4. İşletme kuralları

1. Her sağlayıcı için günlük/aylık kota sayacı tutulur; %90'da yedek zincire geçilir.
2. Mini görevler kurulumda bir kez, sonra haftalık sağlık kontrolü olarak çalışır; başarısız sağlayıcı geçici devre dışı kalır.
3. Veri toplayan sağlayıcılara (ör. Typhoon) gizli kod, anahtar veya kişisel veri gönderilmez.
4. Katalog düzenli aralıklarla resmî belgelerden yeniden denetlenir.
5. Koda uygulama ayrı görevdir: önce APInex regex hatası giderilir, sonra <code>src/free-api-providers.js</code> gerçek içeriğe göre güncellenir.

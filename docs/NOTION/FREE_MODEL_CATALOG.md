# AI Studio — Ücretsiz API model kataloğu

Son doğrulama: 20 Kasım 2026. Bu belge uygulamanın gerçekten etkinleştirdiği sağlayıcıları ve model kimliklerini listeler. Eski araştırma notlarındaki “ücretsiz olabilir” seçenekleri otomatik olarak etkin sayılmaz.

## Kesin uygulama kuralı

Bulut API isteği gönderilmeden önce sağlayıcı + model kimliği allowlist ile kontrol edilir. Bir model listede değilse istek gönderilmez. OpenRouter için yalnızca `:free` son ekli kimlikler veya `openrouter/free`; APInex için yalnızca küçük harfli `free/*` kimlikleri kabul edilir. Yerel Ollama ve cihaz GGUF modelleri bulut API listelerinden ayrıdır. Hiçbir sağlayıcıya sınırsız kota garantisi verilmez.

## Etkin sağlayıcılar

| Sıra | Sağlayıcı | Etkin model kimlikleri / kural | Ücretsiz erişim notu |
|---:|---|---|---|
| 1 | Google Gemini (AI Studio) | `gemini-3.8-flash`, `gemini-3.1-flash-lite-preview`, `gemini-3-flash-preview`, `gemini-2.5-flash-lite` | Resmî Free Tier. Bölge ve istek limitleri geçerlidir. Ücretsiz katman girdileri Google ürünlerini geliştirmek için kullanılabilir. |
| 2 | Groq | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b` | Developer Free Plan. RPM/TPM/RPD limitleri modele göre değişir. |
| 3 | OpenRouter | `openrouter/free` veya `:free` ile biten kimlikler | Ücretsiz model kimlikleri dışında seçim engellenir. Gerçek fiyat ve havuz değişebilir. |
| 4 | Cloudflare Workers AI | `@cf/zai-org/glm-4.7-flash`, `@cf/google/gemma-4-26b-a4b-it` | Yalnızca Workers Free hesabının günlük 10.000 Neuron tahsisi içinde. Ücretli plana geçme veya ücretli aşım kullanılmaz. 20 Kasım 2026'da devreden çıkan Nemotron 3 120B listeden kaldırıldı. |
| 5 | NVIDIA NIM Developer | `nvidia/nemotron-3.5-super-vl-120b-a12b`, `nvidia/nemotron-3.5-lightning-30b-a3b`, `z-ai/glm-5.3-flash` | Yalnızca NVIDIA sayfasında ücretsiz Developer/Prototype endpoint olarak sunulan modeller. Üretim veya ücretli endpoint varsayılmaz. |
| 6 | Z.ai / Zhipu GLM Flash | `glm-4.7-flash`, `glm-4.5-flash`, `glm-4.6v-flash` | Z.AI resmî fiyat tablosunda bu üç modelin metin/görsel model API fiyatı Free olarak listelenir. |
| 7 | Merkium | `ganymede-1.1`, `pluto-1.2-flash`, `pluto-1.2-pro`, `ceres-1.0`, `ceres-1.0-pro`, `pluto-1.1-flash`, `pluto-1.1-pro` | Sağlayıcının kalıcı ücretsiz model listesi; hız sınırları geçerlidir. |
| 8 | Requesty Free Models | `i-ling-3.1-flash`, `nemotron-3.5-lightning-30b-a3b`, `muse-glimmer-30b`, `nemotron-3-nano-omni-30b-a3b-reasoning`, `nemotron-3-ultra-550b-a55b`, `leanstral-1-5`, `gemma-4-31b-it`, `nemotron-3-nano-30b-a3b` | Sağlayıcının $0 model sayfasında listelenen sekiz model; Free plan günlük 200 istek, kredi kartı gerektirmediğini belirtir. |
| 9 | APInex | Yalnızca küçük harfli `free/*` model kimlikleri | İsteğe bağlı üçüncü taraf ağ geçidi. Üst sağlayıcıya iletim ve kota APInex tarafından yönetilir; sınırsızlık veya sürekli kullanılabilirlik garantisi yoktur. |

## Etkin olmayan araştırma adayları

Aşağıdaki adlar önceki araştırma notlarında yer alıyordu; mevcut uygulama allowlist'ine alınmış değiller. Bu durum sağlayıcıların mutlaka ücretli olduğu anlamına gelmez. Model kimliği, resmî sıfır fiyat kanıtı, kota şartı ve çağrı öncesi ücret engeli doğrulanmadan uygulamada açılmazlar:

SambaNova Cloud, LLM7.io, SiliconFlow, Cohere, Mistral AI, OVHcloud AI Endpoints, Gonka Broker, ModelScope, Typhoon, Arli AI, Aion Labs, OpenCode Zen, Kilo Code, Agnes AI, SEA-LION, Chutes, Glhf.chat, Experiential Labs, Token Harbor, UnoRouter, Novita AI, IteraCompute, SimpleLLM, HelixMind, InternAI, BeatAPI, Zro ve cheapllm.shop.

## Resmî doğrulama kaynakları

- [Google Gemini API fiyatları](https://ai.google.dev/gemini-api/docs/pricing)
- [Groq model rate limits](https://console.groq.com/docs/rate-limits)
- [OpenRouter ücretsiz modeller](https://openrouter.ai/collections/free-models)
- [Cloudflare Workers AI fiyatları](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare 5 Kasım 2026 model geçişi](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/)
- [NVIDIA NIM model kataloğu](https://build.nvidia.com/models)
- [Z.AI resmî fiyat tablosu](https://docs.z.ai/guides/overview/pricing)
- [Merkium fiyatları](https://www.merkium.nl/docs/pricing)
- [Requesty ücretsiz modeller](https://www.requesty.ai/models/free)
- [APInex](https://apinex.bond/for-ai)

Not: Bu doğrulama resmî fiyat/model sayfalarına dayanır; canlı API çağrısı, anahtar testi, ücret tahakkuku veya fiziksel cihaz testi yapılmış değildir.

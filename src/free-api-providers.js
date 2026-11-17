export const FREE_API_PROVIDER_CATALOG=Object.freeze([
{id:'gemini',rank:1,name:'Google Gemini (AI Studio)',access:'free-tier',note:'Gemini API Free Tier; model, bölge ve hesap kotaları uygulanır.',url:'https://ai.google.dev/gemini-api/docs/pricing'},
{id:'groq',rank:2,name:'Groq',access:'free-tier',note:'Geliştirici ücretsiz kotası model bazlı hız ve günlük sınırlarla çalışır.',url:'https://console.groq.com/docs/rate-limits'},
{id:'openrouter',rank:3,name:'OpenRouter (:free)',access:'free-models',note:'AI Studio yalnızca openrouter/free veya :free ile biten ve fiyatı sıfır görünen modelleri seçer.',url:'https://openrouter.ai/models?max_price=0'},
{id:'cloudflare',rank:4,name:'Cloudflare Workers AI',access:'free-tier',note:'Workers Free için günlük 10.000 Neuron tahsisi. Ücretli planlarda kota aşımı ücret doğurabilir; ücretsiz plan şartlarını kontrol et.',url:'https://developers.cloudflare.com/workers-ai/platform/pricing/'},
{id:'sambanova',rank:5,name:'SambaNova Cloud',access:'conditional',note:'Geliştirici kotası ve ücretsiz erişim hesap/başvuru koşullarına bağlıdır; ücretsiz API garantisi değildir.',url:'https://cloud.sambanova.ai/'},
{id:'nvidia',rank:6,name:'NVIDIA NIM (build.nvidia.com)',access:'conditional',note:'Prototip erişimi model ve hesap bazında değişir; üretimde sınırsız ücretsiz API değildir.',url:'https://build.nvidia.com/'},
{id:'zai',rank:7,name:'Z.ai / Zhipu AI (GLM Flash)',access:'conditional',note:'GLM API ücretsiz erişimi ve deneme kotası hesap/model koşullarına bağlıdır.',url:'https://docs.z.ai/'},
{id:'llm7',rank:8,name:'LLM7.io',access:'unverified',note:'Güncel resmî ücretsiz API kotası ve şartları doğrulanmadı; canlı çağrı etkin değil.',url:'https://llm7.io/'},
{id:'siliconflow',rank:9,name:'SiliconFlow',access:'conditional',note:'Deneme kredileri hesap bazında olabilir; sıfır ücret garantili model listesi doğrulanmadı.',url:'https://docs.siliconflow.com/'},
{id:'cohere',rank:10,name:'Cohere Trial',access:'trial',note:'Trial anahtarları sınırlıdır; resmî belgelerde aylık 1.000 API çağrısı sınırı belirtilir.',url:'https://docs.cohere.com/docs/rate-limits'},
{id:'mistral',rank:11,name:'Mistral AI (Free mode)',access:'no-free-api',note:'Free mode, Developer API kullanımını içermez. API çağrısı için faturalandırma etkinleştirilmesi gerekir.',url:'https://docs.mistral.ai/admin/billing-usage/usage-limits'},
{id:'ovhcloud',rank:12,name:'OVHcloud AI Endpoints',access:'unverified',note:'Playground/katalog erişimi ücretsiz API kotası anlamına gelmez; bedelsiz kullanım doğrulanmadı.',url:'https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-responses-api'},
{id:'gonka',rank:13,name:'Gonka Broker',access:'conditional',note:'Ücretsiz tahsis telefon doğrulaması ve hesap koşullarına bağlıdır; ücretli bakiye/harcama riski olabilir.',url:'https://docs.gonkabroker.com/guides/billing-and-deposits/'}
]);
export const CLOUDFLARE_FREE_MODELS=Object.freeze([
'@cf/zai-org/glm-4.7-flash',
'@cf/google/gemma-4-26b-a4b-it',
'@cf/nvidia/nemotron-3-120b-a12b'
]);
export const EXTERNAL_CONNECTOR_CATALOG=Object.freeze([
{id:'gguf',name:'Android GGUF',status:'integrated',note:'Native llama.cpp motoruyla yerel model yükleme/çalıştırma.'},
{id:'ollama',name:'Ollama (PC)',status:'integrated',note:'Aynı güvenilir yerel ağdaki Ollama sunucusu.'},
{id:'openshorts',name:'OpenShorts MCP',status:'integrated',note:'Video iş akışı; kullanıcının kendi API anahtarı/kotası gerekir.'},
{id:'openmausbot',name:'OpenMausBot',status:'external',url:'https://github.com/rj-liukaiwen/OpenMausBot',note:'Ayrı masaüstü uygulaması; AI Studio içine gömülü bağlantı değildir.'},
{id:'github',name:'GitHub',status:'planned',url:'https://github.com/',note:'Repo/issue/PR işlemleri için ayrı yetkilendirme gerekir.'},
{id:'notion',name:'Notion',status:'planned',url:'https://www.notion.so/',note:'Sayfa ve veritabanı bağlantısı ayrı yetkilendirme gerektirir.'},
{id:'figma',name:'Figma',status:'planned',url:'https://www.figma.com/',note:'Dosya ve tasarım verisi API bağlantısı henüz yok.'},
{id:'rea',name:'REA Companion',status:'contract',note:'Mock sözleşme ve testler var; canlı masaüstü köprüsü etkin değil.'}
]);

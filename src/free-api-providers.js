export const FREE_API_PROVIDER_CATALOG=Object.freeze([
{id:'gemini',rank:1,name:'Google Gemini (AI Studio)',access:'free-tier',note:'Yalnızca resmî Free Tier fiyat tablosunda ücretsiz gösterilen modeller. Kota ve bölge sınırları vardır; ücretsiz katmandaki içerikler ürün iyileştirmede kullanılabilir.',url:'https://ai.google.dev/gemini-api/docs/pricing'},
{id:'groq',rank:2,name:'Groq',access:'free-tier',note:'Developer Free Plan. Model başına RPM/TPM/RPD sınırları değişir; ücretli Developer planı varsayılmaz.',url:'https://console.groq.com/docs/rate-limits'},
{id:'openrouter',rank:3,name:'OpenRouter (yalnızca :free)',access:'free-models',note:'Sadece openrouter/free ve :free kimlikleri. Ücretli model kimlikleri uygulama tarafından reddedilir; ücretsiz havuz ve limitler değişebilir.',url:'https://openrouter.ai/collections/free-models'},
{id:'cloudflare',rank:4,name:'Cloudflare Workers AI',access:'free-tier',note:'Yalnızca Workers Free hesabının günlük 10.000 Neuron tahsisi. Free hesapta aşım başarısız olur; Workers Paid hesabında aşım ücretli olabilir.',url:'https://developers.cloudflare.com/workers-ai/platform/pricing/'},
{id:'nvidia',rank:5,name:'NVIDIA NIM Developer Program',access:'developer-access',note:'Ücretsiz Developer Program erişimi, model kartında Free Endpoint olarak gösterilen NIM hosted uç noktalarında prototip ve geliştirme içindir. Üretim kullanımı ücretsiz değildir; deneme programları listeye dahil edilmez.',url:'https://build.nvidia.com/models'},
{id:'zai',rank:6,name:'Z.ai / Zhipu GLM Flash',access:'free-models',note:'Resmî fiyat tablosunda GLM-4.7-Flash, GLM-4.5-Flash ve GLM-4.6V-Flash ücretsizdir. Diğer GLM modelleri ücretli olabilir; sadece bu üç kimlik seçilebilir.',url:'https://docs.z.ai/guides/overview/pricing'},
{id:'merkium',rank:7,name:'Merkium',access:'permanent-free',note:'Listelenen yedi API modeli kalıcı olarak ücretsiz; kart ve faturalandırma gerekmez. 30 istek/dakika/API anahtarı.',url:'https://www.merkium.nl/docs/pricing'},
{id:'requesty',rank:8,name:'Requesty Free Models',access:'free-plan',note:'Ücretsiz plan: 8 yayımlanmış sıfır ücretli model, günde 200 istek ve kredi kartı gerektirmez. Ücretli modeller ve Pay-as-you-go kullanılmaz.',url:'https://www.requesty.ai/models/free'},
{id:'apinex',rank:9,name:'APInex (free/* ağ geçidi)',access:'free-models',note:'Yalnızca free/ model kimlikleri kabul edilir. Üçüncü taraf ağ geçididir; kota ve kullanılabilirlik APInex tarafından belirlenir, sınırsız kullanım garantisi yoktur.',url:'https://apinex.bond/for-ai'}
]);
export const CLOUDFLARE_FREE_MODELS=Object.freeze([
'@cf/zai-org/glm-4.7-flash',
'@cf/google/gemma-4-26b-a4b-it',
'@cf/nvidia/nemotron-3-120b-a12b'
]);
export const ZAI_FREE_MODELS=Object.freeze([
'glm-4.7-flash',
'glm-4.5-flash',
'glm-4.6v-flash'
]);
export const MERKIUM_FREE_MODELS=Object.freeze([
'ganymede-1.1',
'pluto-1.2-flash',
'pluto-1.2-pro',
'ceres-1.0',
'ceres-1.0-pro',
'pluto-1.1-flash',
'pluto-1.1-pro'
]);
export const NVIDIA_NIM_DEVELOPER_MODELS=Object.freeze([
'nvidia/nemotron-3.5-super-vl-120b-a12b',
'nvidia/nemotron-3.5-lightning-30b-a3b',
'z-ai/glm-5.3-flash'
]);
export const REQUESTY_FREE_MODELS=Object.freeze([
'i-ling-3.1-flash',
'nemotron-3.5-lightning-30b-a3b',
'muse-glimmer-30b',
'nemotron-3-nano-omni-30b-a3b-reasoning',
'nemotron-3-ultra-550b-a55b',
'leanstral-1-5',
'gemma-4-31b-it',
'nemotron-3-nano-30b-a3b'
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

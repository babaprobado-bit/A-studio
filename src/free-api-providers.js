export const FREE_API_PROVIDER_CATALOG=Object.freeze([
{id:'gemini',rank:1,name:'Google Gemini (AI Studio)',access:'free-tier',note:'Yalnızca resmî Free Tier fiyat tablosunda ücretsiz gösterilen modeller. Kota ve bölge sınırları vardır; ücretsiz katmandaki içerikler ürün iyileştirmede kullanılabilir.',url:'https://ai.google.dev/gemini-api/docs/pricing'},
{id:'groq',rank:2,name:'Groq',access:'free-tier',note:'Developer Free Plan. Model başına RPM/TPM/RPD sınırları değişir; ücretli Developer planı varsayılmaz.',url:'https://console.groq.com/docs/rate-limits'},
{id:'openrouter',rank:3,name:'OpenRouter (yalnızca :free)',access:'free-models',note:'Sadece openrouter/free ve :free kimlikleri. Ücretli model kimlikleri uygulama tarafından reddedilir; ücretsiz havuz ve limitler değişebilir.',url:'https://openrouter.ai/collections/free-models'},
{id:'cloudflare',rank:4,name:'Cloudflare Workers AI',access:'free-tier',note:'Yalnızca Workers Free hesabının günlük 10.000 Neuron tahsisi. Free hesapta aşım başarısız olur; Workers Paid hesabında aşım ücretli olabilir.',url:'https://developers.cloudflare.com/workers-ai/platform/pricing/'},
{id:'nvidia',rank:5,name:'NVIDIA NIM Developer Program',access:'developer-access',note:'Ücretsiz Developer Program üyeliğiyle hosted NIM API prototip, araştırma, geliştirme ve test için kullanılabilir. Üretim kullanımı ücretsiz değildir. 90 günlük AI Enterprise denemesi bu listeye dahil değildir.',url:'https://docs.api.nvidia.com/nim/docs/product'},
{id:'zai',rank:6,name:'Z.ai / Zhipu GLM Flash',access:'free-models',note:'Resmî fiyat tablosunda GLM-4.7-Flash, GLM-4.5-Flash ve GLM-4.6V-Flash ücretsizdir. GLM-5.3-Flash ücretsiz değildir; listeye alınmaz.',url:'https://docs.z.ai/'},
{id:'merkium',rank:7,name:'Merkium',access:'permanent-free',note:'Listelenen yedi API modeli kalıcı olarak ücretsiz; kart ve faturalandırma gerekmez. 30 istek/dakika/API anahtarı.',url:'https://www.merkium.nl/docs/pricing'},
{id:'requesty',rank:8,name:'Requesty Free Models',access:'free-plan',note:'Ücretsiz plan: yayımlanan sıfır ücretli modeller için günlük 200 istek, ödeme yöntemi gerekmiyor. Ücretsiz model havuzu değişebilir; ücretli model kimlikleri kullanılmamalı.',url:'https://www.requesty.ai/models/free'},
{id:'sambanova',rank:9,name:'SambaNova Cloud Free Tier',access:'free-plan',note:'Free Tier yalnızca hesaba ödeme yöntemi eklenmediği durumda geçerlidir. Hesap ve model uygunluğu panelde kontrol edilmeli; ücretli modele geçiş yapılmamalı.',url:'https://cloud.sambanova.ai/'},
{id:'apinex',rank:10,name:'APInex (free/* ağ geçidi)',access:'free-models',note:'Yalnızca free/ model kimlikleri kabul edilir. Üçüncü taraf ağ geçididir; kota ve kullanılabilirlik APInex tarafından belirlenir, sınırsız kullanım garantisi yoktur.',url:'https://apinex.bond/for-ai'}
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
'deepseek-ai/deepseek-v4-flash',
'meta/llama-3.1-8b-instruct'
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

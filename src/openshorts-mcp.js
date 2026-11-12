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

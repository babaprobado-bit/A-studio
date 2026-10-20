const CACHE_NAME='ai-studio-static-v04';
self.addEventListener('install',event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('ai-studio-static-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(url.pathname.startsWith('/api/')||url.pathname==='/login'||url.pathname==='/login.js'||url.pathname==='/login.css')return;
  if(url.pathname==='/'||url.pathname.endsWith('.html'))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok&&response.type==='basic'&& !response.headers.get('Content-Type')?.includes('text/html')){
        await cache.put(request,response.clone());
      }
      return response;
    }catch(error){
      if(cached)return cached;
      throw error;
    }
  })());
});

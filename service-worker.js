const CACHE_NAME="fidunio-shell-0.6.2";
const APP_SHELL=[
  "./","./index.html","./styles.css?v=0.6.2","./app.js?v=0.6.2","./firebase.js","./firebase-config.js","./manifest.json",
  "./favicon.png","./fidunio-logo.png","./icon-180.png","./icon-192.png","./icon-512.png"
];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  event.respondWith(
    caches.match(event.request).then(cached=>{
      const network=fetch(event.request).then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));
        }
        return response;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});

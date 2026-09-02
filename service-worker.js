/*
 * FIDUNIO 0.6.5 service worker
 *
 * Offline strategy adapted from the proven Scorecard pattern:
 * - FIDUNIO's own files are network-first so deployments are not trapped
 *   behind a stale cache.
 * - The versioned Firebase SDK modules from gstatic are cached and may be
 *   served offline after they have been fetched successfully.
 * - Firestore/Auth data transport is NEVER service-worker cached.
 */

const CACHE="fidunio-shell-v2";

const SHELL=[
  "./",
  "./index.html",
  "./styles.css?v=0.6.5",
  "./app.js?v=0.6.5",
  "./firebase.js",
  "./firebase-config.js",
  "./manifest.json",
  "./favicon.png",
  "./fidunio-logo.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png"
];

const FIREBASE_SDK=[
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js",
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js"
];

const NETWORK_TIMEOUT=4000;

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>Promise.allSettled(
        [...SHELL,...FIREBASE_SDK].map(url=>cache.add(url))
      ))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await Promise.race([
      fetch(request,{cache:"no-store"}),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("slow")),NETWORK_TIMEOUT))
    ]);
    if(response && response.ok){
      cache.put(request,response.clone());
    }
    return response;
  }catch{
    const hit=await cache.match(request);
    if(hit) return hit;

    if(request.mode==="navigate"){
      const shell=await cache.match("./index.html");
      if(shell) return shell;
    }

    throw new Error("offline and not cached");
  }
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  const url=new URL(event.request.url);

  /*
   * Firebase network/data traffic must remain under Firebase's control.
   * Do not cache Firestore/Auth API responses.
   */
  if(
    url.hostname.endsWith("googleapis.com") ||
    url.hostname.endsWith("firebaseio.com")
  ){
    return;
  }

  /*
   * Firebase SDK JavaScript is versioned in its URL. Cache-first is safe;
   * refresh it in the background whenever possible.
   */
  if(url.hostname==="www.gstatic.com"){
    event.respondWith(
      caches.open(CACHE).then(async cache=>{
        const hit=await cache.match(event.request);
        const fresh=fetch(event.request)
          .then(response=>{
            if(response && response.ok){
              cache.put(event.request,response.clone());
            }
            return response;
          })
          .catch(()=>hit);

        return hit || fresh;
      })
    );
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith(networkFirst(event.request));
  }
});

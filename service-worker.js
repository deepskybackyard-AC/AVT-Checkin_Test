const CACHE="avt-checkin-multi-0.3.0-test.6";
const FILES=["./","index.html","styles.css","manifest.webmanifest","js/config.js","js/backend.js","js/storage.js","js/scanner.js","js/app.js","js/jsQR.js","icons/icon-192.png","icons/icon-512.png"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});

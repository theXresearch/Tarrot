const V = "xdestiny-v5";
const CORE = ["./","index.html","app.js?v=4","saju_pro.js?v=1","saju_tx.js?v=2","tojeong.js?v=3","engine.js?v=2","cities.js?v=1","text_en.js?v=1","text_ko.js?v=1","vendor/lunar.js?v=1","vendor/astronomy.min.js?v=1","manifest.json","icon-192.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("xdestiny-") && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const same = new URL(r.url).origin === location.origin;
  e.respondWith(fetch(r, same ? {cache:"no-cache"} : undefined).then(res => { if (res.ok && (same || r.url.includes("fonts."))){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
    .catch(() => caches.match(r).then(m => m || caches.match("index.html"))));
});

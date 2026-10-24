// 離線快取：網站檔案先用網路、失敗才用快取；Google 字體用快取先顯示、背景更新（離線也有字體）
const CACHE = "meowtown-v12", FONTS = "meowtown-fonts";
const FILES = ["./", "index.html", "style.css", "app.js", "data.js", "trans.js", "icons.js", "mascot.js", "firebase.js", "firebase-config.js", "manifest.json", "icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = e.request.url;
  if (/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(url)) {
    e.respondWith(caches.open(FONTS).then(c => c.match(e.request).then(hit => {
      const net = fetch(e.request).then(r => { if (r.ok || r.type === "opaque") c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
    return;
  }
  if (!url.startsWith(self.location.origin)) return;
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
});

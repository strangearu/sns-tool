// My Hub Service Worker — オフラインでも開けるように主要ファイルをキャッシュ
const CACHE = "myhub-v57";
const ASSETS = [
  "./",
  "./index.html",
  "./paris.html",
  "./money.html",
  "./report.html",
  "./reports.enc.json",
  "./revenue.enc.json",
  "./crosspost.html",
  "./invoice.html",
  "./mail.html",
  "./video.html",
  "./post-studio.html",
  "./manifest.json",
  "./fonts/InterVariable.woff2",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ネットワーク優先・失敗したらキャッシュ（更新を取りこぼさず、オフラインでも開ける）
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  // きょうのブリーフ（数分おきに ?t=時刻 付きで取りに行く）は、保存を1件だけにする。
  // 下の共通処理に任せると、取りに行くたびに別名で保存されてキャッシュが増え続ける。
  const u = new URL(e.request.url);
  if (u.pathname.endsWith("/brief.enc.json")) {
    const key = u.origin + u.pathname;
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)).catch(() => {}); }
          return res;
        })
        .catch(() => caches.match(key).then(r => r || Response.error()))
    );
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});

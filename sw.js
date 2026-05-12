const CACHE = "machs-v4";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      "./",
      "./index.html",
      "./styles.css",
      "./app.js",
      "./manifest.webmanifest",
      "./192.png",
      "./512.png",
      "./Icon.png"
    ]))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

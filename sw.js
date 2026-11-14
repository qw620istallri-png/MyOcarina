// Cache hors-ligne : l'appli fonctionne sans réseau une fois ouverte une fois.
const CACHE = "ocarina-v6";
const FILES = ["./", "index.html", "css/style.css", "js/songs.js", "js/songs-ocwalk.js", "js/music.js", "js/themes.js", "js/scene.js", "js/app.js",
  "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png",
  "assets/bg/dusk-far.png","assets/bg/dusk-mountains.png","assets/bg/dusk-sky.png","assets/bg/dusk-trees.png","assets/bg/gold-back.png","assets/bg/gold-front.png","assets/bg/gold-lights.png","assets/bg/gold-middle.png","assets/bg/pass-1.png","assets/bg/pass-2.png","assets/bg/pass-3.png","assets/bg/road-forest.png","assets/bg/road-ground.png","assets/bg/road-sky.png","assets/bg/road-tree.png","assets/bg/sunny-sky.png","assets/bg/sunset-cloud1.png","assets/bg/sunset-cloud4.png","assets/bg/sunset-mount1.png","assets/bg/sunset-sky1.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // réseau d'abord (pour les mises à jour), cache en secours
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes("fonts.g"))) {
        const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

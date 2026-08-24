// Korsika Reiseplan — Service Worker
// Cacht alle Dateien beim ersten Laden für Offline-Nutzung

const CACHE_NAME = "korsika-2026-v1";

// Alle Dateien die gecacht werden sollen
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./foto_anleitung.html",
  // Fotos
  "./fotos/bastia.jpg",
  "./fotos/saint_florent.jpg",
  "./fotos/saleccia.jpg",
  "./fotos/erbalunga.jpg",
  "./fotos/nonza.jpg",
  "./fotos/centuri.jpg",
  "./fotos/corte.jpg",
  "./fotos/restonica.jpg",
  "./fotos/napoleon.jpg",
  "./fotos/calanques.jpg",
  "./fotos/sartene.jpg",
  "./fotos/bonifacio.jpg",
  "./fotos/palombaggia.jpg",
  "./fotos/bavella.jpg",
];

// Installation: alle Dateien cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Korsika App: Dateien werden gecacht...");
      // Fehler beim einzelnen Foto nicht den ganzen Cache blockieren
      return Promise.allSettled(
        FILES_TO_CACHE.map(url =>
          cache.add(url).catch(e => console.warn("Cache skip:", url, e.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Aktivierung: alten Cache löschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: zuerst Cache, dann Netzwerk (Offline-First)
self.addEventListener("fetch", (event) => {
  // Nur GET-Requests und gleiche Origin cachen
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Aus Cache laden (funktioniert offline!)
        return cachedResponse;
      }
      // Nicht im Cache: Netzwerk versuchen und dabei cachen
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        }
        return networkResponse;
      }).catch(() => {
        // Offline und nicht gecacht: Fallback
        if (event.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});

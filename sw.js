/**
 * Service Worker PWA per Ashen Midgard
 * - Codice, HTML e configurazioni (index.html, src/*.js, story.json): Network-First con revalidazione
 *   così ogni aggiornamento viene applicato subito senza restare bloccati su vecchie versioni.
 * - Immagini e media: Stale-While-Revalidate per caricamento istantaneo + aggiornamento in background.
 * - Librerie CDN versionate e Google Fonts: Cache-First con fallback offline completo.
 */

const CACHE_VERSION = 'v4-1';
const CACHE_NAME = `ashen-midgard-${CACHE_VERSION}`;
const FONT_CACHE = 'ashen-midgard-fonts-v1';

// Risorse essenziali da pre-caricare in installazione (bypassando la HTTP cache del browser)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './story.json',
  './icon.svg',
  './apple-touch-icon.png',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './pwa-maskable-512x512.png',
  './assets/story/intro.jpg',
  './assets/story/boss.jpg',
  './assets/story/victory.jpg',
  './assets/story/gameover.jpg',
  './assets/story/skadi_intro.jpg',
  './assets/story/skadi_victory.jpg',
  './assets/story/skadi_gameover.jpg',
  './assets/story/freya_intro.jpg',
  './assets/story/freya_victory.jpg',
  './assets/story/freya_gameover.jpg',
  './assets/sprites/manifest.json',
  './src/main.js',
  './src/heroes.js',
  './src/hdSprites.js',
  './src/audio.js',
  './src/storyManager.js',
  './src/gameScene.js',
  'https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        await Promise.allSettled(
          PRECACHE_ASSETS.map((url) =>
            fetch(url, {
              cache: 'reload',
              mode: url.startsWith('http') ? 'cors' : 'same-origin'
            })
              .then((res) => {
                if (res && (res.ok || res.type === 'opaque')) {
                  return cache.put(url, res);
                }
                return null;
              })
              .catch(() => null)
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== FONT_CACHE)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isCodeOrDocument(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (request.mode === 'navigate') return true;
  const p = url.pathname;
  return (
    p === '/' ||
    p.endsWith('/') ||
    p.endsWith('.html') ||
    p.endsWith('.js') ||
    p.endsWith('.mjs') ||
    p.endsWith('.css') ||
    p.endsWith('.json')
  );
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request.url, {
      cache: 'no-cache',
      credentials: 'same-origin'
    });
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    if (networkResponse && networkResponse.status < 500) {
      return networkResponse;
    }
  } catch {
    // Fallback su cache sotto
  }

  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  if (request.mode === 'navigate') {
    const fallback = await caches.match('./index.html');
    if (fallback) return fallback;
  }
  return new Response('', { status: 504, statusText: 'Offline' });
}

async function staleWhileRevalidate(request, url) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });

  const fetchPromise = fetch(request.url, {
    cache: 'no-cache',
    mode: url.origin === self.location.origin ? 'same-origin' : 'cors'
  })
    .then((networkResponse) => {
      if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await fetchPromise;
  return networkResponse || new Response('', { status: 504, statusText: 'Offline' });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.protocol.startsWith('http')) return;

  // Non intercettare mai sw.js né gli endpoint interni di Vite dev server
  if (
    url.origin === self.location.origin &&
    (url.pathname.endsWith('/sw.js') ||
      url.pathname.startsWith('/@vite/') ||
      url.pathname.startsWith('/@fs/') ||
      url.pathname.startsWith('/@id/') ||
      url.pathname.startsWith('/node_modules/'))
  ) {
    return;
  }

  // Cache a lungo termine per Google Fonts
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // Codice applicativo, HTML e JSON: Network-First per avere sempre l'ultima versione
  if (isCodeOrDocument(request, url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Immagini, icone e risorse statiche: Stale-While-Revalidate (veloce + aggiornamento automatico)
  event.respondWith(staleWhileRevalidate(request, url));
});

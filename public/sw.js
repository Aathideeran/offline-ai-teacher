const CACHE_NAME = 'offline-doubt-solver-shell-v3';
const PRESERVED_CACHES = new Set([CACHE_NAME, 'transformers-cache']);
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch(() => {
        // Ignore individual asset failure during dev mode
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !PRESERVED_CACHES.has(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never intercept or cache Vite dev client / internal module endpoints
  if (
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname.startsWith('/__aistudio') ||
    url.pathname.startsWith('/_aistudio')
  ) {
    return;
  }

  // Only cache same-origin requests and Google Fonts (Hugging Face ONNX weights are cached directly by @huggingface/transformers in 'transformers-cache')
  const isSameOrigin = url.origin === self.location.origin;
  const isFont =
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com';

  if (!isSameOrigin && !isFont) return;

  // Network-first with cache fallback so updates apply immediately while offline mode works seamlessly
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
        return Response.error();
      })
  );
});

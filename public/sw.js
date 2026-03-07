// Service Worker 占位文件
// 后续可在此实现缓存策略、离线支持、推送等
// 注册方式：在客户端或 _document 中调用 navigator.serviceWorker.register('/sw.js')

const CACHE_NAME = 'chat-pwa-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

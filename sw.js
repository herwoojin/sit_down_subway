// 앉아가요 서비스워커 v2
// 전략:
//  - HTML 문서(navigate): 네트워크 우선 → 실패 시 캐시(오프라인). 배포 후 최신 반영 보장.
//  - 정적 자산(아이콘/매니페스트 등): 캐시 우선 → 네트워크.
//  - API/서버리스 함수/외부 호출: 캐시하지 않고 그대로 네트워크.
const CACHE_NAME = 'sit-down-subway-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/screenshot-narrow.png',
  '/screenshot-wide.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // GET 외, 외부 도메인, API/함수 호출은 서비스워커가 관여하지 않음(항상 네트워크)
  if (req.method !== 'GET' ||
      url.origin !== self.location.origin ||
      url.pathname.startsWith('/.netlify/') ||
      url.pathname.startsWith('/api/')) {
    return; // 기본 네트워크 처리
  }

  // HTML 문서: 네트워크 우선
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // 그 외 정적 자산: 캐시 우선 → 네트워크(받으면 캐시에 저장)
  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
    )
  );
});

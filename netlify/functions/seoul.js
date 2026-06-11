// 서울시 실시간 지하철 API 프록시 (Netlify Function)
// - 브라우저(HTTPS) → 이 함수(HTTPS) → 서울시 API(HTTP) 로 중계.
// - API 키는 클라이언트에 노출하지 않고 환경변수로만 사용.
// - 일일 호출한도(1,000건/키)를 아끼기 위해 CDN + 메모리 캐시(30초)로 중복 호출을 합친다.
//
// 호출 예: /.netlify/functions/seoul?path=realtimePosition/1/100/2호선

const CACHE_MS = 30000;          // 성공 응답 30초 캐시(메모리)
const _cache = {};               // path -> { at, body }  (웜 인스턴스 재사용 시 호출 절감)

exports.handler = async (event) => {
  const raw = (event.queryStringParameters && event.queryStringParameters.path) || '';

  // 오픈 프록시 방지: 허용된 엔드포인트만 통과
  if (!/^(realtimePosition|realtimeStationArrival)\//.test(raw)) {
    return json(400, { error: 'invalid path' });
  }

  // 정상(현재 한도 여유) 공용 키 — 환경변수 SEOUL_SUBWAY_API_KEY 로 덮어쓸 수 있음.
  // (기존 SEOUL_API_KEY 는 한도 소진되어 기본 체인에서 제외)
  const DEFAULT_KEY = '515a4a47686865723130327650664576';
  // 사용자가 본인 발급 키를 보내면 그 키 사용(개인 한도), 아니면 공용 키
  const userKey = (event.queryStringParameters && event.queryStringParameters.key) || '';
  const valid = /^[A-Za-z0-9]{16,64}$/.test(userKey);
  const key = valid ? userKey : (process.env.SEOUL_SUBWAY_API_KEY || DEFAULT_KEY);

  // 메모리 캐시 히트 시 즉시 반환(서울 API 호출 안 함)
  const now = Date.now();
  const hit = _cache[raw];
  if (hit && now - hit.at < CACHE_MS) {
    return ok(hit.body, true);
  }

  const safePath = raw.split('/').map(encodeURIComponent).join('/');
  const url = `http://swopenapi.seoul.go.kr/api/subway/${key}/json/${safePath}`;

  try {
    const r = await fetch(url);                 // Netlify Node 18+ 전역 fetch
    const text = await r.text();
    // 정상(목록 포함) 응답만 캐시 — 한도초과/에러는 캐시하지 않아 복구 즉시 반영
    let cacheable = false;
    try { const j = JSON.parse(text); cacheable = !!(j.realtimePositionList || j.realtimeArrivalList); } catch (e) {}
    if (cacheable) _cache[raw] = { at: now, body: text };
    return ok(text, false);
  } catch (e) {
    return json(502, { error: '서울시 API 호출 실패', detail: String(e) });
  }
};

function ok(body, cached) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      // 브라우저 + Netlify CDN 캐시로 동일 요청을 30초간 합쳐 호출량 절감
      'Cache-Control': 'public, max-age=30',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      'X-Proxy-Cache': cached ? 'HIT' : 'MISS'
    },
    body
  };
}

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj)
  };
}

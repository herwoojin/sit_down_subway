// 서울시 실시간 지하철 API 프록시 (Netlify Function)
// - 브라우저(HTTPS) → 이 함수(HTTPS) → 서울시 API(HTTP) 로 중계.
//   서버-서버 호출이라 혼합콘텐츠(mixed content)·CORS 제약이 없다.
// - API 키는 클라이언트에 노출하지 않고 환경변수 SEOUL_API_KEY 로만 사용.
//
// 호출 예: /.netlify/functions/seoul?path=realtimePosition/1/100/2호선
exports.handler = async (event) => {
  const raw = (event.queryStringParameters && event.queryStringParameters.path) || '';

  // 오픈 프록시 방지: 허용된 엔드포인트만 통과
  if (!/^(realtimePosition|realtimeStationArrival)\//.test(raw)) {
    return json(400, { error: 'invalid path' });
  }

  const key = process.env.SEOUL_API_KEY;
  if (!key) {
    return json(500, { error: 'SEOUL_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  // 각 경로 세그먼트를 인코딩(한글 역명/노선명 대응)
  const safePath = raw.split('/').map(encodeURIComponent).join('/');
  const url = `http://swopenapi.seoul.go.kr/api/subway/${key}/json/${safePath}`;

  try {
    const r = await fetch(url);                 // Netlify Node 18+ 전역 fetch
    const text = await r.text();
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=10'   // 10초 캐시로 호출량 절감(일 1,000건 한도)
      },
      body: text
    };
  } catch (e) {
    return json(502, { error: '서울시 API 호출 실패', detail: String(e) });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(obj)
  };
}

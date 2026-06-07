

async function test() {
  for (const limit of [100, 150, 300, 1000]) {
    const url = `http://swopenapi.seoul.go.kr/api/subway/sample/json/realtimePosition/0/${limit}/%32%ED%98%B8%EC%84%A0`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.realtimePositionList) {
        console.log(`Limit ${limit} OK: ${data.realtimePositionList.length} trains`);
      } else {
        console.log(`Limit ${limit} FAILED:`, data.RESULT || data);
      }
    } catch (e) {
      console.log(`Limit ${limit} ERROR:`, e.message);
    }
  }
}
test();

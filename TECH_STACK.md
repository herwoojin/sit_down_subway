# Tech Stack - 앉아가요 (sit-down_subway)

이 프로젝트는 지하철 빈자리 정보를 실시간으로 공유하고 시각화하는 Progressive Web App(PWA)입니다.

## 프론트엔드 (Frontend)
- **HTML5 & Vanilla CSS**: UI 레이아웃 및 카카오 지하철 노선도 스타일의 SVG 타원 렌더링.
- **JavaScript (ES6)**: 웹 스피치 API, SVG 기반 초정밀 실시간 열차 위치 렌더링, 15초 단위 폴링 및 상태 관리.

## PWA & 배포 (PWA & Deployment)
- **Service Worker (`sw.js`)**: 오프라인 작동 캐싱 및 리소스 로드 속도 최적화.
- **Web App Manifest (`manifest.webmanifest`)**: 스토어 등록 규격 준수 (SVG 비호환 해결, PNG 전용 아이콘 및 다중 해상도 스크린샷).
- **Netlify**: 정적 웹 호스팅 및 `.webmanifest` MIME Type 헤더 설정 (`netlify.toml`).

## 백엔드 서비스 (Backend Services)
- **Firebase Auth**: 구글 간편 로그인.
- **Firebase Storage**: 사용자 데이터 저장.

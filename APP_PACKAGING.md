# 앉아가요 — 앱(설치형) 패키징 가이드

이 앱은 **PWA**라서 별도 빌드 없이도 휴대폰/태블릿에 "앱처럼" 설치됩니다.
**스토어 배포용 APK/AAB(안드로이드), iOS 패키지**는 배포된 HTTPS 주소를 기반으로 생성합니다.

> 전제: 먼저 Netlify(또는 Firebase Hosting)로 배포되어 **https 주소**가 있어야 합니다. (예: `https<your-site>.netlify.app`)

---

## A. 그냥 설치해서 쓰기 (스토어/APK 불필요, 즉시)

- **안드로이드(Chrome)**: 사이트 접속 → 주소창 "앱 설치"/"홈 화면에 추가", 또는 우리 앱 헤더의 **📲 버튼**.
- **아이폰(Safari)**: 공유 버튼 ⬆️ → **"홈 화면에 추가"**. (iOS는 APK가 없고 이 방식이 표준입니다.)

설치하면 전체화면 독립 앱으로 실행되고, 오프라인 캐시도 동작합니다.

---

## B. 안드로이드 APK / AAB 만들기

로컬에 JDK/Android SDK가 없어도 되는 **PWABuilder(권장)** 와, 직접 빌드하는 **Bubblewrap** 두 가지.

### B-1. PWABuilder (가장 쉬움, 설치 도구 불필요)
1. https://www.pwabuilder.com 접속 → 배포된 https 주소 입력 → **Start**.
2. 매니페스트/서비스워커/아이콘 점검 통과 확인(이미 충족하도록 구성됨).
3. **Package For Stores → Android** → **Generate**.
   - 결과물: 설치용 **APK** + 스토어용 **AAB** + **signing key** + **assetlinks.json** 내용.
4. PWABuilder가 알려주는 `assetlinks.json`의 `package_name` 과 `sha256_cert_fingerprints` 값을
   이 저장소의 [.well-known/assetlinks.json](.well-known/assetlinks.json) 에 **그대로 교체**하고 재배포.
   (이게 맞아야 앱 상단 주소줄이 사라진 '진짜 앱'처럼 보입니다 = TWA 검증)
5. APK를 안드로이드폰에 복사 → 설치(출처 불명 앱 허용). 스토어 출시는 AAB를 Play Console에 업로드.

### B-2. Bubblewrap CLI (직접 빌드 / CI용)
사전 요구: **JDK 17+**, **Android SDK**.
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://<your-site>/manifest.webmanifest
bubblewrap build          # → app-release-signed.apk / .aab 생성
bubblewrap fingerprint    # SHA256 지문 출력 → assetlinks.json 에 반영 후 재배포
```

---

## C. 아이폰(iOS) 패키지

- iOS는 사이드로딩 APK가 없습니다. 두 경로 중 택1:
  1. **무료/즉시**: 위 A의 "홈 화면에 추가"(권장, 대부분 충분).
  2. **App Store/TestFlight 정식 앱**: **PWABuilder → iOS 패키지** 생성 → Xcode로 열기 →
     **Apple Developer 계정($99/년)** 으로 서명 → App Store Connect 업로드.

---

## 체크리스트 (이미 충족하도록 구성됨)
- [x] `manifest.webmanifest`: name/short_name/start_url/scope/display(standalone)/orientation/theme_color/아이콘(192·512·maskable)/스크린샷
- [x] 서비스워커(`sw.js`): 오프라인 캐시 + HTML 네트워크 우선
- [x] head 메타: theme-color, apple-touch-icon, apple-mobile-web-app-*
- [x] 반응형: 모바일/태블릿 + 가로/세로 방향 대응
- [ ] (빌드 후) `.well-known/assetlinks.json` 에 실제 package_name·SHA256 반영

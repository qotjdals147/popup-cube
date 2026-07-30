# POP-UP CUBE Mobile (Expo)

일반 회원·스토어 관리자 **쇼핑·월드 앱** (AD-037). 점주 **매장·주문 관리는 PC 웹**만.

## 스택 (2026-07-27)

| | |
|---|---|
| **Expo SDK** | **52** (Expo Go 안정성 — SDK 57은 실기기 크래시 이슈) |
| **React** | 18.3.1 (웹 `apps/web` 과 동일 — monorepo 충돌 방지) |
| **expo-router** | ~4.x |

## 로컬 실행

```powershell
cd C:\Users\qotjd\Downloads\Cursor\popup_store
npm install --legacy-peer-deps
cd apps\mobile
npx expo start --tunnel --port 8082 --clear
```

> **Tunnel:** `@expo/ngrok` devDependency 필요. 원격(직장 폰 ↔ 집 PC)은 `--tunnel` 필수.

Expo Go **SDK 52** APK로 QR 스캔 → m01 랜딩 → 로그인 → 홈.

### Expo Go APK — **SDK 52** (중요)

**SDK 57 APK는 더 이상 쓰지 마세요.** 프로젝트를 SDK 52로 맞춰 두었습니다.

1. 기존 Expo Go **삭제** (또는 SDK 52 APK로 덮어쓰기)
2. **SDK 52** APK 설치:
   ```powershell
   cd apps/mobile
   npx expo-go url android 52
   ```
   → `https://github.com/expo/expo-go-releases/releases/download/Expo-Go-2.32.20/Expo-Go-2.32.20.apk`
3. 또는 https://expo.dev/go → **SDK 52** → Android
4. PC: `npx expo start --tunnel --port 8082 --clear` → QR

### 번들 후 앱이 **팅김** (크래시)

- **SDK 57 Expo Go** + **SDK 52 프로젝트** (또는 그 반대) → 거의 항상 크래시
- 위 **SDK 52 APK** + 캐시 삭제 + `--clear` 재시작
- PC Node는 **20 LTS** 권장 (Node 24는 Metro/Expo CLI 이슈 가능)

### 빨간 화면 (모듈 not found)

```powershell
cd C:\Users\qotjd\Downloads\Cursor\popup_store
npm install --legacy-peer-deps
cd apps\mobile
npx expo start --tunnel --port 8082 --clear
```

데모 계정: `demo@shopper.com` / `demo` · `demo@owner.com` / `demo`

## Sprint 4-1 — 매장 월드 (WebView + Phaser)

매장 입장(`app/store/[storeId].tsx`)은 **WebView**로 웹 `/play/:storeId` 를 엽니다.

| env | 기본값 | 설명 |
|---|---|---|
| `EXPO_PUBLIC_WEB_ORIGIN` | `https://popup-cube-web.vercel.app` | 플레이 월드 웹 오리진 |

- **프로덕션:** Vercel에 `/play/:storeId` 배포 + `VITE_SOCKET_SERVER_URL` = Railway URL 필수 (localhost면 월드 접속 불가)
- **로컬 웹 연동:** PC에서 `npm run dev`(web) 후 `EXPO_PUBLIC_WEB_ORIGIN=http://<PC_LAN_IP>:5173` 로 Expo 재시작
- 세션: 앱 Supabase `access_token`/`refresh_token` 을 URL 해시로 전달

## EAS

- Project ID: `49c42cb0-df70-47a8-b34d-22878a8e3529`
- 스토어 빌드: Sprint 4+

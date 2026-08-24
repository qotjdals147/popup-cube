# POP-UP CUBE Mobile (Expo)

일반 회원·스토어 관리자 **쇼핑·월드 앱** (AD-037). 점주 **매장·주문 관리는 PC 웹**만.

## 스택 (2026-07-27)

| | |
|---|---|
| **Expo SDK** | **52** (Expo Go 안정성 — SDK 57은 실기기 크래시 이슈) |
| **React** | 18.3.1 (웹 `apps/web` 과 동일 — monorepo 충돌 방지) |
| **expo-router** | ~4.x |

## 로컬 실행

### 어디서 테스트하나요?

| 상황 | 명령 | 이유 |
|---|---|---|
| **폰·PC 같은 Wi‑Fi** (집) | `start-lan.cmd` | QR = PC 내부 IP — 같은 Wi‑Fi만 됨 |
| **회사 폰 + 집 PC 원격(RDP)** | `start-remote.cmd` | 폰은 집 IP에 못 붙음 → **ngrok** 필요 |
| **`--tunnel` body 오류** | `start-remote.cmd` | Expo 공용 ngrok 장애 시 **본인 ngrok 계정** |

```powershell
cd C:\Users\qotjd\Downloads\Cursor\popup_store
npm install --legacy-peer-deps
cd apps\mobile
start-lan.cmd          # 같은 Wi‑Fi
# 또는
start-remote.cmd       # 원격·LTE (ngrok 1회 설정 필요)
```

> **`--tunnel`만 쓰면** ngrok `body` 오류가 자주 납니다. 원격 작업은 **`start-remote.cmd`** 권장.

### 원격 작업 — ngrok 1회 설정

1. https://dashboard.ngrok.com 가입 (무료)
2. **Authtoken** 복사 → cmd:
   ```
   ngrok config add-authtoken 여기_토큰
   ```
3. ngrok CLI 없으면: `winget install ngrok.ngrok`
4. `start-remote.cmd` 실행 → QR 스캔

### 장바구니 UI만 빠르게 (Expo 없이)

앱 껍데기·뱃지 동기화는 제외, **웹 레이아웃만** 보려면 폰 브라우저:

`https://popup-cube-web.vercel.app` → `demo@shopper.com` / `demo` → 장바구니

(Vercel 배포 반영 후 1~2분)

---

### (구) tunnel 한 줄

```powershell
npx expo start --tunnel --port 8082 --clear
```

> **Tunnel:** `@expo/ngrok` devDependency 필요. **2026-08 기준 Expo 공용 tunnel 불안정** — 원격은 `start-remote.cmd`.

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

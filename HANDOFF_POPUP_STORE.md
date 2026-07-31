# POP-UP CUBE — Agent Handoff Document

> **이 파일은 Cursor AI 세션 간 인수인계용 living document입니다.**  
> **규칙: 작업 시작 시 먼저 읽고, 작업하는 동안 실시간으로 갱신하고, 세션 종료 시 최종 정리하세요.**

---

## 0. Handoff Protocol (AI 에이전트 필수 준수)

### 매 작업 전 규칙 재확인 (절대 규칙 — 예외 없음)

**"이전에 읽었으니 기억하고 있다"는 근거로 §0을 건너뛰지 않는다.**

- **사용자가 지시했든, 에이전트가 스스로 다음 작업을 이어가든 — 새 작업(요청/할 일)을 시작할 때마다** 이 `## 0. Handoff Protocol`을 다시 읽고 따른다.
- 같은 세션 안에서 이미 한 번 읽었어도, 다음 작업으로 넘어갈 때 **다시** §0을 확인한다 `(대화가 길어지며 규칙을 놓치는 것을 방지)`.
- 특히 아래는 매번 재확인: **브리핑 형식(§0 하단)**, **모델 추천(§24)**, **HANDOFF 실시간 갱신(§0 아래 섹션)**, **한국어 대화 규칙**.
- 규칙을 지키지 못했다고 사용자가 지적하면, 즉시 인정하고 그 지점부터 규칙대로 다시 수행한다.

### 세션 시작 시
1. 이 `HANDOFF_POPUP_STORE.md` 파일을 **전체** 읽는다.
2. `## 8. Changelog`에서 최신 항목을 확인한다.
3. `## 6. Blockers & Known Issues`를 확인하고, 막힌 항목부터 처리할지 판단한다.
4. 사용자 요청 범위 밖의 대규모 리팩터는 하지 않는다 (MVP 우선).

### 작업 중 실시간 갱신 (필수 — 세션 종료만 기다리지 말 것)

**이 문서는 "나중에 한꺼번에 쓰는 메모"가 아니라, 에이전트가 다음 세션의 자신에게 인수인계하는 실시간 기록이다.**  
코드·설정·DB를 바꿀 때마다 **같은 작업 흐름 안에서** HANDOFF를 함께 맞춘다.

| 시점 | 반드시 갱신할 곳 |
|---|---|
| **아키텍처·방향 합의 직후** | `## 4. Architecture Decisions` (AD-0xx 추가) |
| **파일/폴더/API/환경변수/DB 변경 직후** | `## 5` 체크리스트, `## 9`~`## 13` 해당 섹션, `## 19` 파일 트리 |
| **막힘·해결·버그 발견** | `## 6. Blockers` (ISS-0xx 추가/Resolved) |
| **우선순위·다음 할 일이 바뀔 때** | `## 7. Next Steps` |
| **의미 있는 작업 단위 완료 시** | `## 8. Changelog`에 항목 추가 *(세션 끝까지 미루지 말 것)* |
| **새 UI 문구·i18n 규칙** | `## 25` + `apps/web/src/i18n/ko.ts` |
| **새 전문 용어·개념 도입** | `## 23. Glossary` |

**원칙**
1. **"세션 종료 때만 업데이트" 금지** — 중간에 컨텍스트가 잘리거나 새 채팅이 열려도 HANDOFF만 보면 이어갈 수 있어야 함.
2. **코드와 HANDOFF는 한 쌍** — PR/커밋처럼, 기능 변경 없이 HANDOFF만 오래된 상태로 두지 않음.
3. **짧게 자주** — Changelog 한 줄, §5 체크박스 하나, ISS 하나 추가하는 수준으로 즉시 반영.
4. **사용자에게 별도 보고 불필요** — HANDOFF 갱신은 에이전트 자기 인수인계용; 다만 큰 결정은 대화에서도 확인.

### 세션 종료 시 (반드시 — 실시간 갱신의 마무리 점검)
1. 작업 중 빠뜨린 HANDOFF 갱신이 없는지 확인
2. `## 5. Current State` — 완료/미완료 상태 최종 정리
3. `## 7. Next Steps` — 우선순위 재정렬
4. `## 8. Changelog` — 아직 없으면 **날짜 + 변경 요약** 추가 (역순, 최신이 위)
5. 새 파일/폴더/API/환경변수/DB 변경이 있으면 해당 섹션도 함께 갱신
6. 사용자와 합의된 아키텍처 결정은 `## 4. Architecture Decisions`에 기록

### 업데이트 형식 (Changelog)
```markdown
### YYYY-MM-DD — [한 줄 요약]
- **Author:** Cursor Agent / User
- **Changed:** 파일 또는 기능 목록
- **Notes:** 배포/테스트/주의사항
```

### 대화 규칙 (User Communication — 필수)

**대상:** 정통 개발자 출신이 아닌 사용자. 모든 Cursor 세션에서 동일하게 적용.

1. **전문 용어는 반드시 풀어서 설명** — 처음 쓰거나 중요한 개념일 때 `(쉬운 설명)` 붙이기
2. **비유·일상 예시** 우선 — "홈택스처럼", "쇼핑몰 건물 한 채에 가게 여러 개"
3. **한 번에 하나씩** — 긴 기술 목록보다 "지금 뭐 하는 단계인지" 먼저
4. **코드/파일명**은 필요할 때만; 가능하면 **하는 일** 중심으로 말하기
5. **HANDOFF_POPUP_STORE.md에도** 새 기술·구조 도입 시 §23 Glossary 또는 해당 섹션에 쉬운 설명 추가

**예시 (이 스타일로 대화):**
> Turborepo monorepo `(웹·서버·공통 코드를 한 프로젝트 폴더 안에 모아두는 방식)` 로 시작할게요.

**금지:** jargon만 나열, 영어 약어만 던지고 끝, "당연히 아시겠지만"

### 다음 작업 우선순위 판단 (User 요청, 2026-07-13)

**"다음 작업은?" 질문에 여러 옵션을 나열해서 사용자가 고르게 하지 말 것.**
대신 에이전트가 아래 기준으로 **객관적으로 우선순위를 판단**해서 **1개를 먼저 제안**한다 (그래도 착수 전 브리핑·승인 절차는 그대로 따름 — 아래 §0 하단 참고).

**판단 기준 (우선순위 순):**
1. **의존관계** — 다른 미구현 기능을 막고 있는 것 먼저 (예: PG 미정처럼 사용자 결정이 필요한 항목은 뒤로)
2. **투자자 데모 완성도** — §18 Demo Flow에 나오는 단계 중 아직 비어있는 것 우선 (로드맵 §2 Phase 순서 참고)
3. **최근 작업과의 연속성** — 방금 끝난 기능과 자연스럽게 이어지는 것 (컨텍스트 낭비 최소화)
4. **리스크/규모** — 한 세션에 끝낼 수 있는 범위인지
5. **"진짜 쇼핑몰" 포지셔닝 (AD-029)** — 투자자는 50대, 게임성보다 "실제 커머스 플랫폼"으로 보여야 함. 게임 요소(가챠·아바타·탐색)만 계속 쌓기보다, 주문 관리·매장 관리처럼 **사업적으로 신뢰를 주는 기능**을 균형 있게 우선

### 작업 시작 전 브리핑 (Work Start Briefing — 필수)

**사용자가 "시작해", "해줘" 등 지시를 해도, 코드·파일 변경에 들어가기 전에 반드시:**

1. **무엇을 할지** — 3~5줄 브리핑 `(쉬운 말로, 이번에 손대는 범위)`
2. **추천 Cursor 모델** — §24 기준으로 **1순위 + 대안** 명시
3. **예상 결과물** — 만들어질 폴더/기능 한눈에
4. **사용자 확인 요청** — 반드시 아래 형식으로 끝내기:

```
이 작업에는 [모델명]이 적합해요. (이유 한 줄)
[대안: ○○ — 더 빠르게 / 더 싼 등]
작업 시작할까요?
```

5. **사용자 "응/시작/ㅇㅇ" 등 승인 전에는** 파일 생성·수정·DB 마이그레이션·배포 **시작 금지**
6. 사용자가 다른 모델을 지정하면 그 모델 기준으로 진행 `(가능한 경우)`

**예외 (브리핑 생략 가능):** HANDOFF만 업데이트, 순수 질문 답변, 사용자가 "브리핑 없이 바로 해"라고 명시한 경우

### Expo Go 실기 테스트 안내 규칙 (필수 — 2026-07-30)

**User는 개발자가 아님.** 앱·모바일 관련 작업이 끝나면 (또는 User가 「테스트 어떻게 해?」라고 물으면) **매번** 아래를 **쉬운 말 + 복붙 가능한 명령**으로 설명해 준다.  
상세 기술 메모는 `apps/mobile/README.md` · 이 절이 **에이전트 행동 규칙**.

#### 에이전트가 반드시 지킬 것
1. **SDK 버전을 항상 명시** — 이 프로젝트는 **Expo SDK 52**. 「Expo Go만 설치하세요」만 쓰지 말고 **SDK 52 APK**라고 쓴다.  
   - Play 스토어 Expo Go = 보통 **최신**(현재 **54** 등) → QR 찍으면 *Project is incompatible* (우리 52 vs Go 54).  
   - **SDK 57** = 실기기 크래시 이력 (ISS-025) — 쓰지 말 것.  
   - 해결: Play 스토어 Expo Go **삭제** → **SDK 52 APK** 설치 → QR 다시.
2. **명령은 PowerShell 기준** · 워크스페이스 절대 경로부터 (`cd C:\Users\qotjd\Downloads\Cursor\popup_store\...`)
3. **Tunnel 기본** — 폰과 PC가 다른 네트워크일 수 있음 → `npx expo start --tunnel --port 8082 --clear`
4. **데모 계정**을 함께 적는다: `demo@shopper.com` / `demo` (손님) · `demo@owner.com` / `demo` (점주·월드 입장만, 관리는 PC)
5. **Sprint 4-1+ 월드 테스트**면 추가로 안내:
   - 웹 `/play` 가 **Vercel에 배포됐는지** (앱 WebView가 `EXPO_PUBLIC_WEB_ORIGIN` = `https://popup-cube-web.vercel.app` 를 염)
   - Vercel `VITE_SOCKET_SERVER_URL` = **Railway** URL (localhost면 월드 오프라인 안내만 보임)
   - **가로 회전:** 매장(WebView) 화면에서만 `expo-screen-orientation` 적용 — **홈·로그인은 세로**일 수 있음. 폰 **설정 → 디스플레이 → 자동 회전** 켜기. Expo Go에서 config만 바꿔도 안 돌아가면 **`--clear` 재시작** 후 **GUCCI 입장한 뒤** 가로 테스트.
6. 테스트 플로우를 **클릭 순서**로: 랜딩 → 일반 회원 로그인 → 홈 → 매장 카드 → 입장 → 월드(WebView)
7. 깨지면 **짧은 체크리스트**만: SDK 52인지 / `--clear` 재시작했는지 / `npm install --legacy-peer-deps` / Vercel·소켓

#### User에게 붙여 줄 표준 안내문 (복사용)

```
【Expo Go 테스트 — POP-UP CUBE】

1) 폰에 Expo Go **SDK 52** 설치 (Play 스토어 버전은 보통 54+라 **안 맞음**)
   - Play 스토어 Expo Go **삭제**
   - SDK 52 APK 설치:
     https://expo.dev/go?sdkVersion=52
     (Android device → Manual / APK)
   - 직접 APK 예:
     https://github.com/expo/expo-go-releases/releases/download/Expo-Go-2.32.20/Expo-Go-2.32.20.apk
   - 또는 PC: cd apps\mobile → npx expo-go url android 52

2) PC (PowerShell)
   cd C:\Users\qotjd\Downloads\Cursor\popup_store
   npm install --legacy-peer-deps
   cd apps\mobile
   npx expo start --tunnel --port 8082 --clear

3) 폰 **SDK 52** Expo Go로 QR 스캔

4) 로그인
   - 손님: demo@shopper.com / demo
   - 점주(월드만): demo@owner.com / demo

5) 홈 → 매장 카드 → 입장하기 → 픽셀 월드(WebView)
   - 월드가 안 열리면: Vercel에 최신 웹 배포·Railway 소켓 URL 확인

※ "Project is incompatible … Expo Go SDK 54 / project SDK 52"
   → Play 스토어 Go 삭제 후 SDK 52 APK 설치 (위 1번)
※ SDK 57 Expo Go + 이 프로젝트 = 거의 항상 팅김
※ 빨간 화면(모듈 없음) → 루트에서 npm install --legacy-peer-deps 후 --clear 재시작
```

#### HANDOFF / 대화에서의 위치
- 앱 기능 **완료·배포 직후** Changelog에 「실기 테스트: §0 Expo Go 안내」한 줄
- User가 테스트 중이면 §7 「사용자가 지금 해야 할 것」을 위 표준 안내와 맞게 유지

---

## 1. Project Overview

| Item | Value |
|---|---|
| **Project Name** | POP-UP CUBE |
| **Purpose** | 오프라인 팝업 스토어 한계를 넘는 2D 픽셀 아트 메타버스 커머스 플랫폼 |
| **Workspace** | `C:\Users\qotjd\Downloads\Cursor\popup_store` |
| **Launch status** | 대표님 마케팅비 전액 지원 확정 → **런칭 단계 진입** (2026-07-24) |
| **Current Phase** | **Phase 4** — Sprint **4-3 실기 OK**(알약·HUD) · **몰입(AD-050)= dev APK에서 최종 확인** · **다음 = Sprint 4-4 바로 구매 mock** (2026-07-31) |
| **Version** | `0.2.3` (4-3+ 몰입 코드 · 4-4 예정) |
| **Supabase Project** | `popup-platform` (`cvrtobxkvpcpcxrcspdp`) — ACTIVE, Seoul |
| **Live Demo (웹)** | https://popup-cube-web.vercel.app — Vercel `popup-cube-web` |
| **Vercel 팀** | `popup-cube` — **FC Zero** `fc-team-dashboard` · **FC Platform** `fc-team-platform` **동일 팀** (2026-07-29) · **`FC_Zero&FC_Platform/setup/VERCEL_MIGRATION.md`** |
| **GitHub Repo** | `qotjdals147/popup-cube` — push → Vercel 자동 배포 |
| **인프라 설계도** | **§46** (전체 호스팅 맵) · 배포 절차 `DEPLOY.md` · 요금 요약 **§28** |
| **Investor Demo Target** | ~~2~3주~~ → **2026-07-13(일) 저녁 긴급 미팅** (일정 앞당김, AD-032). 그 전까지 **「시각 프로토타입」** 우선, 이후 2~3주 안에 **전 기능 live** 보강 |
| **Demo Theme** | 패션/브랜드 팝업 (Gucci 스타일 레퍼런스) |

### Core Value Propositions
1. **점주용 샌드박스 에디터** — 드래그앤드롭으로 매장 꾸미기
2. **게이미피케이션 커머스** — 캐릭터 조작으로 팝업 탐색 + 실물 구매
3. **디지털-실물 연동** — 구매 시 마이룸/아바타 아이템 동시 지급 + 가챠
4. **채널 분산** — 스토어당 채널 40명 제한으로 트래픽 분산

> **⚠️ 포지셔닝 원칙 (AD-029, User 명시 — 2026-07-13):** 투자 대상 대표님은 50대. **본질은 온라인 팝업스토어(=쇼핑몰)**이고 게임 요소는 쇼핑을 재밌게 하는 장치일 뿐, 정체성의 **중심**이 아님. 기능 개발·데모 시연·UI 카피에서 "이건 실제 동작하는 **커머스** 플랫폼"이라는 인상이 먼저 오게 하고, 게임성(아바타·가챠·탐색)은 보조로 배치할 것.

> **⚠️ 실매장 유사도 (AD-041, User 2026-07-24):** **제네릭 게임 맵·똑같은 쇼룸 템플릿만 주면 안 됨.** 점주는 **자기 오프라인 팝업**과 최대한 닮은 온라인 공간을 원함 — 색·사진·존·진열·실물 상품. 「우리 브랜드 팝업에 왔다」가 보여야 입점·재방문이 남. 기술적으로는 **동작하는 fixture(레고)** + **점주 브랜딩(실사·팔레트·배치)** 조합 — §41.

### View Style
- 2D Isometric (Quarter-view) 또는 Top-down 픽셀 그래픽
- 참고 UI 목업: Attack on Titan 테마 팝업 (`TITAN GEAR BASE`, `SURVEY CORP`, 40명 온라인 표시)

### Reference Assets (User-provided + 시안 목업)
- 스토어 UI 목업(구): isometric + Explore/Shop Now — **폐기 방향** (AD-033)
- **현행 시안 목업 (2026-07-14 v4):** `docs/pdf-assets/`
  - **일반 회원(앱):** `m01`~`m10` — 홈·등각뷰 월드·진열·결제·마이페이지 전부 모바일
  - **스토어 관리(PC 웹):** `01-landing-web-owner`, `02-login-web-owner`, `owner-*.png`
  - **등각뷰 월드:** `m05-world-mobile.png` 등 (`pdf-assets-v2/world-mockup-complete.png` 스타일 기준)
  - 데스크톱 `world-mockup-complete.png`·`03-home-*.png` 등은 **시안 본문에서 제외**(데모/구버전 참고용)
  - `owner-display-slots-mockup.png` — 스토어 관리 진열 **2D 픽셀** (PC 웹, 3D 없음)
- 시안 INDEX(HTML): `docs/platform-sian.html`
- **시안 정본 (루트):** `Online_Popup.docx` (스크린 덱) · `온라인 팝업스토어 플랫폼.pptx` (투자 피치) — **에이전트 필독, §38 요약**
- **정식 채널 (AD-037):** PC 웹 = 스토어 관리만 · 일반 회원 쇼핑 = 앱만 — 시안 `web-app-split-sian.png`
- 픽셀 변환 예시 에셋: Cursor workspace `assets/` (기존 사용자 제공 PNG)

---

## 2. Full Product Roadmap

| Phase | Feature | Status | Target |
|---|---|---|---|
| **0** | Socket.io 채널링 서버 + DB 스키마 | ✅ Skeleton done | — |
| **0.5** | 기초 설계 (Web/App 분리, Demo plan, Monorepo) | ✅ In progress | 2026-07-13 |
| **1** | Monorepo + Supabase schema + Auth | ✅ Done (2026-07-13) | Week 1 |
| **1.5** | **홈 허브** — 매장 목록·검색·입장 모달 + 점주 **매장 만들기** | ⬜ Planned (AD-019) | Week 1–2 |
| **2** | Web: Phaser world + multiplayer (데모는 top-down, AD-022) | ✅ In progress (2026-07-13) | Week 1–2 |
| **3** | Commerce + Gacha + Try-on (simple live) | ⬜ | Week 2 |
| **4** | Store editor + **진열 조형물·슬롯 (AD-033)** + Pixel convert + **임시저장/출시 (AD-021)** | ⬜ | Week 2–3 |
| **5** | Mobile app shell (Expo + shared game-core) — **Android + iOS 한 코드베이스** (AD-038, §39) | ⬜ | Week 2–3 |
| **6** | Admin dashboard (web) | ⬜ | Week 3+ |
| **7** | Deploy demo (Vercel + Railway + Upstash) | ⬜ | Week 3 |
| **8** | Production hardening (RLS, PG, SD pipeline) | ⬜ Post-demo | — |

---

## 3. Tech Stack

### Confirmed / In Use (Phase 1 — 현재)
| Layer | Technology | Where |
|---|---|---|
| Monorepo | **Turborepo** `(한 상자 구조)` | root |
| Runtime | Node.js >= 18 | server, apps/web |
| HTTP | Express 4 | `server/` |
| Real-time | Socket.io 4 | `server/` |
| Cache / Session | Redis via `ioredis` | `server/` |
| **Database + Auth** | **Supabase** (`popup-platform`) | 클라우드 (연결됨) |
| Server ↔ Supabase | `@supabase/supabase-js` + **service_role key** `(DB 비밀번호 대신 안전한 키)` | `server/` |
| Web ↔ Supabase | `@supabase/supabase-js` + **anon/publishable key** | `apps/web/` |
| Frontend / Game | React + Vite (Phaser는 Phase 2에서 추가) | `apps/web/` |
| Mobile app | **Expo (React Native)** SDK 52 | `apps/mobile/` |
| Config | `dotenv` | 각 앱별 `.env` |

### 개발 환경 (User / 대표님·투자자에게 말할 때)
| 구분 | 도구 | 역할 |
|---|---|---|
| **코드 작성·AI 보조** | **Cursor** `(VS Code 기반 IDE + AI)` | 솔로 개발자가 설계·구현·디버그 (외주 팀 대신 1인 + AI) |
| **DB·로그인** | **Supabase** | PostgreSQL + Auth + Storage (클라우드) |
| **웹 배포** | **Vercel** | `popup-cube-web.vercel.app` |
| **실시간 서버** | **Node.js + Express + Socket.io** | 멀티플레이·채팅 (로컬/Railway 예정) |
| **캐시** | **Upstash Redis** | 채널 인원·플레이어 위치 |
| **모바일** | **Expo / Expo Go** | Android·iOS 한 코드베이스 (앱 스토어 출시는 EAS Build 예정) |
| **버전 관리** | **Git + GitHub** | `qotjdals147/popup-cube` |
| **Monorepo** | **Turborepo + npm workspaces** | web · mobile · server · packages 한 repo |

> **「개발툴 뭐 써?」** — **Cursor + Supabase + Vercel + Expo** 한 줄로 말해도 됨.  
> 「AI가 코드 짜주냐?」→ **Cursor AI로 1인 개발 속도를 올리고, 실제 서비스는 Supabase·Vercel 같은 업계 표준 SaaS에 올린다**고 설명하면 됨.

> **왜 `pg`(직접 DB 비밀번호 연결) 대신 `supabase-js`?** `(AD-015)`  
> DB 비밀번호를 직접 다루지 않아도 되고, Supabase가 제공하는 **service_role 키**만 있으면 서버가 모든 테이블에 접근 가능. 더 안전하고 관리가 쉬움.

### Planned (Not yet wired)
| Layer | Technology | Notes |
|---|---|---|
| Client Hosting | Vercel / Netlify | 데모 URL |
| Socket Server Hosting | Railway / Render / Fly.io | Supabase alone cannot host Socket.io |
| Redis (prod) | **Upstash Redis** | Free tier available |
| Payments | Toss / Stripe / 아임포트 | Phase 5 |
| Image AI | OpenCV + Stable Diffusion API | Phase 4 |

### Architecture Diagram (Current)
```
[apps/web: React + Vite]  ──(anon key)──→  [Supabase: Postgres + Auth]
        │                                          ▲
        │ Socket.io (game-core)                    │ (service_role key)
        ▼                                          │
[server/: Express + Socket.io]  ───────────────────┘
        │
        ▼
[Redis: 채널 인원, 좌표 — 로컬 or Upstash]
```

---

## 4. Architecture Decisions

| ID | Decision | Rationale | Date |
|---|---|---|---|
| AD-001 | 채널당 최대 40명, 초과 시 `channel_N+1` 자동 생성 | 트래픽 폭주 방지 (요구사항) | 2026-07-12 |
| AD-002 | ~~Redis `LLEN`(List)~~ → Redis `SCARD`(**Set**)으로 채널 인원 카운트 | 요구사항 명시 + O(1) 조회. List는 같은 유저 중복 입장 시 `LREM key 0`이 전부 지워버리는 버그(ISS-019)가 있어 Set으로 전환 | 2026-07-12 (2026-07-13 Set으로 변경) |
| AD-003 | 플레이어 좌표는 Redis Hash, 영구 저장 X | 실시간성 우선; disconnect 시 정리 | 2026-07-12 |
| AD-004 | 채널 메타는 PostgreSQL `channels` 테이블 | 채널 번호/room key 영구 기록 | 2026-07-12 |
| AD-005 | DB는 Supabase로 이전 예정 | User skill set | 2026-07-12 |
| AD-006 | Socket.io 서버는 Supabase 외부 호스팅 필수 | Realtime DB ≠ game tick sync | 2026-07-12 |
| AD-007 | **Turborepo monorepo** 채택 | Web+App 코드 공유, Cursor 단일 컨텍스트, 의존성 명확 | 2026-07-13 |
| AD-008 | 데모 2~3주 / **전 기능 live·단순** | 투자자 시연; mock 최소화 | 2026-07-13 |
| AD-009 | 데모 브랜드 = **GUCCI** (투자자 시연 전용) | User decision; 정식 출시 전 교체·삭제 | 2026-07-13 |
| AD-010 | **투자자 데모는 Web(반응형)으로 진행** — 정식 출시 채널은 **AD-037** | Expo 앱은 post-demo. 데모에서만 웹에 손님·월드가 같이 있음 | 2026-07-13 (정식 채널: AD-037로 갱신 2026-07-14) |
| AD-011 | 점주 **에디터·상품·주문·진열 등 관리 = PC 웹** | 마우스/대화면 UX. **정식:** 손님 쇼핑·월드는 웹이 아님 (AD-037) | 2026-07-13 (2026-07-14 AD-037과 정렬) |
| AD-012 | 픽셀 변환 데모 = **Canvas downscale + palette** (SD API는 post-demo) | 2~3주 내 live 가능 | 2026-07-13 |
| AD-013 | **역할 분리 로그인** — 소비자 / 점주 (홈택스 방식: 역할별 진입) | 동일 월드 UX + 점주 전용 기능(왕관·툴바). **정식:** **앱**에서만 손님·점주 로그인 둘 다 제공, **웹은 점주만** (AD-037) | 2026-07-13 (2026-07-14 AD-037) |
| AD-014 | 투자자 시연 = **기능 자연스럽게 시연** (스크립트 스피치 X) | 대화하며 클릭·체험 위주 | 2026-07-13 |
| AD-015 | 서버 DB 접근을 `pg`(직접 비밀번호 연결) → **`supabase-js` + service_role key**로 전환 | DB 비밀번호 불필요, MCP로 노출 안 되는 키는 사용자가 대시보드에서 직접 복사 | 2026-07-13 |
| AD-016 | Turborepo 실제 구조 적용 완료 (`apps/web`, `server/`, `packages/*`) | §19 계획 실행 | 2026-07-13 |
| AD-017 | **UI 기본 언어 = 한국어(ko)**; 문구는 `apps/web/src/i18n/`에 키로 분리 | 향후 다국어·자동번역 대비; 코드에 한글 하드코딩 금지 | 2026-07-13 |
| AD-018 | **HANDOFF_POPUP_STORE.md 실시간 갱신** — 작업 중 즉시 동기화, 세션 종료만 의존 금지 | 에이전트 자기 인수인계; 컨텍스트 단절·새 채팅에도 이어가기 | 2026-07-13 |
| AD-019 | **월드 허브(홈)** — 로그인 후 매장 목록·검색·입장 모달; 점주는 **매장 만들기**로 픽셀 월드 생성 | 로블록스·메이플스토리 월드식 탐색 UX; 팝업스토어 = 제작자가 만든 월드 단위 | 2026-07-13 |
| AD-020 | **아바타 아이템은 복사 가능한 코드가 아닌 서버 소유권(`user_inventory`)으로 장착 승인**; 픽셀 변환은 점주 전용 | 코드 공유·무단 장착·저작권 위험 차단, 소비자 편의와 AI API 비용 절감 | 2026-07-13 |
| AD-021 | 매장 **임시저장(draft)/출시(published)** 상태 관리는 데모에서 생략(생성 즉시 published), **정식 출시 시 에디터와 함께 반드시 재도입** — 점주가 편집 중인 매장은 "임시저장"으로 안전하게 보관, 언제든 이어서 편집, 준비되면 "출시하기"로 노출 | 데모는 에디터가 없어 draft 단계가 막다른 흐름(ISS-015)이었지만, 정식 출시에선 점주가 꾸미는 도중 실수로 미완성 매장이 손님에게 노출되면 안 됨 — User 명시적 요청 | 2026-07-13 |
| AD-022 | **Phase 2 데모 월드는 isometric 대신 top-down으로 구현** | User가 작업량 차이를 확인한 뒤 top-down 선택. 2~3주 일정에서 안정적으로 "실시간 이동+채팅+동시접속"을 먼저 완성하고, isometric 업그레이드는 post-demo 옵션으로 분리 | 2026-07-13 |
| AD-023 | **닉네임은 회원가입 시 필수 + 대소문자 무관 중복불가**; `auth.users.raw_user_meta_data`를 거쳐 `handle_new_user` 트리거가 `profiles.nickname`에 그대로 복사 (이메일 인증 필요 여부와 무관하게 가입 즉시 반영) | 인증 세션이 없어도(이메일 인증 대기 중이어도) 닉네임이 바로 저장되게 하려고 "가입 후 별도 업데이트"가 아니라 가입 payload 자체에 실어서 트리거가 처리하도록 설계 | 2026-07-13 |
| AD-024 | **장바구니 시스템은 상품 등록/목록 기능(Phase 4 에디터, AD-020)과 같은 작업에서 함께 구현** — 지금은 보류 | 담을 상품 자체가 없는 상태에서 장바구니만 먼저 만들면 실사용 불가; User 요청을 "당장 가능"/"나중에 같이" 로 분류한 결과 (§7 참고) | 2026-07-13 |
| AD-025 | (계획, 미구현) 매장을 **여러 "방(room)"**으로 구성하고, 방마다 위치를 지정해 **문/엘리베이터**로 다른 방(같은 층 옆방 또는 다른 층)으로 이동하게 만들 예정 — Phase 4 에디터 작업에 포함 | User가 참고 이미지(등각뷰 예시, 옆방이 살짝 보이는 구조)처럼 매장에 공간감을 주고 싶어함; 지도 하나를 무한히 넓히는 대신 "방 단위"로 나누고 문/엘리베이터로 순간이동시키면 각 방은 지금처럼 작게 유지되고 카메라 follow와도 잘 맞음 | 2026-07-13 |
| AD-026 | **Phaser 캔버스 크기를 지도 전체 크기가 아니라 "고정 뷰포트"(800x520)로 분리**하고 **카메라가 캐릭터를 따라다니게(`startFollow`)** 변경 + 타일 40→56px·이름표/말풍선 폰트 12→14px로 확대 | "캐릭터·글자가 작다"는 User 피드백 — 원인은 지도 전체를 작은 상자에 눌러 담아서였음. 뷰포트를 지도 크기와 분리하면 화면엔 일부만 보이고 걸어서 나머지를 확인하는 방식이 되어 자동으로 커 보임. `RESIZE` 모드 대신 고정 뷰포트+`FIT`을 써서 ISS-016(레이아웃 무한 확장) 재발 방지 | 2026-07-13 |
| AD-027 | **지금 만드는 코드베이스 = 정식 출시의 기반(throwaway 아님)**. 데모는 일부를 단순화했을 뿐(DB·서버·monorepo·game-core·인증 흐름은 그대로 이어감). 앱(Expo)은 **처음부터 0**이 아니라 **공통 패키지·서버·DB를 재사용**하고, 화면(UI)만 React Native로 새로 짜는 방식 | User 질문(2026-07-13): "데모 이어서 정식 만드는 거지? 앱은 웹 코드 참조해서 빠르게?" — §29 상세 |
| AD-028 | **구매 완료 시 "할인" vs "가챠 뽑기권" 중 하나를 소비자가 직접 선택**하는 프로모션 방식(상시 기능, 데모 초반부터 필수). **가챠 풀 = 그 매장 실제 상품 + 가챠 전용 아이템 혼합**, **풀 범위는 매장 공용 기본 + 상품별 풀은 확장 여지만** 열어둠 | User: "프로모션은 자주 할 거고 가챠 요소는 계속 가져갈 가능성 크니 영구 기능으로 봐도 됨. 초반엔 무조건 해야 하는 것" + 가챠 후보/풀 범위 확인 질문 답변 — §10 상세 스키마 | 2026-07-13 |
| AD-029 | **투자자(대표님)는 50대 — 게임 같은 느낌을 과하게 강조하면 안 됨.** 이 플랫폼은 **본질적으로 온라인 팝업스토어(=쇼핑몰)**이고, 게임 요소(아바타·가챠·채팅·탐색)는 **쇼핑을 재밌게 만드는 장치**일 뿐 정체성의 중심이 아님. **기능 우선순위·데모 시연·UI 카피 모두 "이건 진짜 쇼핑몰이다"가 먼저 느껴지게** 하고, 게임성은 보조로 배치 | User: "너무 게임 같은 느낌에만 강하게 힘을 실으면 안 돼, 사실상 온라인 팝업스토어(쇼핑몰)인 거잖아" | 2026-07-13 |
| AD-030 | ✅ 구현 완료(2026-07-13) — **소비자 배송지 관리(마이페이지) + 결제 시 배송지 선택** — 로그인 소비자는 **여러 배송지를 등록**하고 각각 **별명(라벨)**을 붙일 수 있음(예: "집", "회사"). **마이페이지 > 주소 관리** 탭에서 CRUD. **결제(장바구니) 단계**에서는 저장된 주소 목록에서 **바로 선택**해 사용. **저장된 주소가 없어도·있어도 항상 "신규 추가" 버튼**을 함께 노출(결제 중에도 새 주소 입력 가능). 실물 배송을 위해 `orders`와 연동 필수 | User: "소비자도 마이페이지에서 주소지 등록, 주소관리 탭에서 여러 개+별명, 결제 시 저장된 주소 선택, 없어도/있어도 신규추가 버튼 — 나중에 꼭 넣어야 하는 요소" — §10·§16 상세 | 2026-07-13 |
| AD-031 | **정식 개발 전환 시 데모 데이터는 한 번에 초기화 가능** — 테이블 구조·RLS·함수·코드는 유지하고 **행(데이터)만 전부 삭제**. 사용자가 "데모 관련 흔적 다 지워달라" 등 **명시적 요청** 시 §30 절차 수행. 실행 전 최종 확인 필수(비가역). Storage·Redis·브라우저 localStorage도 함께 정리 | User: "정식개발 들어가기 전에 디비에 있는 데모 테스트 것들 다 지워달라 하면 깔끔하게 지워줄 수 있어?" — §30 상세 | 2026-07-13 |
| AD-032 | **투자자 미팅 일정 긴급 앞당김 (2026-07-13 저녁)** — 원래 2~3주 「전 기능 live」 데모 대신, **「코드 기반 시각 프로토타입」** 우선. **보이는 화면·흐름·의도**가 먼저, 일부는 **실제 동작 없이(mock/정적)** 도 OK. 단 **PPT·Figma만 던지고 끝이 아님** — 지금 `apps/web`의 **실제 React 화면·라우트·컴포넌트**로 만들어 **정식 개발에 그대로 이어감**(AD-027). 상세 §18·§31 | User: "내일 저녁 대표님 미팅, 딱 보이는 것만·의도 파악용·정식에 이어지는 시각 자료" (2026-07-12) | 2026-07-12 |
| AD-033 | **진열 조형물(Display Fixture) + 슬롯 쇼핑 UX (2D 전용)** — 점주가 매장에 **2D 픽셀 조형물**(테이블 N칸, 옷걸이, 선반 등)을 배치하고 슬롯에 상품을 넣고/빼고/순서 변경. **3D 에디터·렌더는 계획에 없음** (AD-022). 소비자: 조형물 앞 **상호작용** → 진열 상품 팝업 → **상품 선택** → `장바구니 담기` / `바로 구매` / **그 아래** `착용해보기`(우측 아바타 프리뷰). HUD에서 **탐험하기·착용해보기 제거**; HUD는 `상호작용 · 채팅 · 장바구니 · 전체 상품`만. 시안 `docs/pdf-assets/` · §32 | User 2026-07-14 시안 수정 (3D 배제·착용해보기 위치·허브 직관성) | 2026-07-14 |
| AD-034 | **(계획, 미구현) 자동 로그인** — 로그인 화면에 **「자동 로그인」체크** 추가. 체크 시 이 기기에서 **세션/리프레시 토큰을 유지**해 앱·웹 재실행 시 비밀번호 재입력 없이 홈으로 진입. Supabase `persistSession` + secure storage(웹 localStorage/앱 SecureStore) 정책 확정 필요. 시안 `02-login-autologin-sian.png` · §33 | User 2026-07-14: 매번 로그인 불편 → 자동 로그인 예정, 시안 반영 | 2026-07-14 |
| AD-035 | **(계획, 미구현) 동네(지역)별 팝업 · 홈 필터** — **같은 브랜드도 동네마다 별도 팝업** (예: 성수 GUCCI ≠ 청담 GUCCI). 점주 **매장 개설 시 지역 지정** — **주소 API**(도로명/지번 검색, 카카오/다음 우편번호 API 등)로 시·구·동네 저장. **홈**은 동네 **필터 칩 + 구역별 섹션**(성수동 주루룩 → 청담 주루룩). `user_addresses`·결제 배송지 입력과 **같은 주소 컴포넌트/API 재사용**(AD-030). 시안 `03-home-neighborhood-sian.png`, `owner-store-region-sian.png` · §34 | User 2026-07-14: 동네 세분화·홈 필터·점주 지역 선택 | 2026-07-14 |
| AD-036 | **(계획) 모바일 앱 UI** — 일반 회원·스토어 관리자 **앱** 화면 시안 `m01`~`m10`. 관리(지역·진열·주문) UI는 **앱에 없음**(PC 웹). 정식 회원 체험은 **앱만**(AD-037). 데모 반응형 웹은 프로토타입용 | User 2026-07-14 시안 + AD-037 | 2026-07-14 |
| AD-037 | **정식 채널 분리 — PC 웹 = 스토어 관리 전용 / 모바일 앱 = 일반 회원·스토어 관리자** | 매장 관리(발주·상품·진열·주문)는 **PC 웹**. 일반 회원 쇼핑·월드는 **앱만**. 웹 로그인 카피 = **「스토어 관리자 로그인」만**. 앱 = **「일반 회원 로그인」/「스토어 관리자 로그인」** 별도(왕관 등 role 차). 데모 `apps/web` 혼재는 프로토타입용 | User 2026-07-14 + 로그인 카피 통일 | 2026-07-14 |
| AD-038 | **모바일 = Expo(React Native) 단일 코드베이스 → Android + iOS 동시 타깃** | Play Store·App Store 둘 다 등록하려면 **두 OS 모두 지원** 필요. **Kotlin/Swift를 각각 새로 짜지 않음** — `apps/mobile` 한 벌 + `packages/shared`·`server`·Supabase 재사용(AD-027). 빌드·스토어 심사·일부 네이티브 설정만 OS별. 상세 §39 | User 2026-07-24: APK/iOS 별도 개발 여부 질문 | 2026-07-24 |
| AD-039 | **앱 개발도 Cursor IDE + Agent로 진행** — 웹과 **같은 monorepo·HANDOFF·TypeScript/React** 워크플로우. 미리보기만 **브라우저 → Expo Go/에뮬레이터**로 바뀜. Phaser 월드 이식만 웹보다 한 단계 어려움(§39.12). Xcode/Android Studio는 Expo/EAS로 **최소화** | User 2026-07-24: "웹은 Cursor로 많이 해봤는데 앱도 Cursor로 가능?" | 2026-07-24 |
| AD-040 | **(계획) 점주 전용 내장 AI 에이전트** — 매장 만들기/수정 시 **실사 사진 첨부** 또는 **자연어**로 레이아웃·진열 가구(슬롯 수·옷걸이 용량 등 **실제 동작하는 fixture**)까지 제안. LLM→**구조화 JSON**→2D 미리보기→**점주 승인** 후 저장. 이미지 생성 API는 **보조·quota·캐시**. 단순 SD 일괄 변환(AD-012)보다 **에이전트+템플릿 카탈로그**가 현실적. 상세 §40 | User 2026-07-24: 점주 편의·API 사용량 내 에이전트 가능 여부 | 2026-07-24 |
| AD-041 | **실매장 유사도 = 제품 핵심** — 단순 게임 맵·제네릭 쇼룸 **아님**. 점주는 **본인 오프라인 팝업**과 최대한 비슷한 온라인 공간을 원함. **브랜드 색·사진·존 배치·실물 상품 픽셀**로 「우리 팝업」이 보여야 함. 기술=**레고(슬롯 fixture) + 점주 브랜딩(실사·팔레트·레이아웃)** — §41 | User 2026-07-24: 게임 아닌 실제 팝업 연계, 점주 실매장 닮기 | 2026-07-24 |
| AD-042 | **점주 온보딩 = 「팝업 사진으로 시작」3단 wizard** — (1) 실사 1~3장 (2) vision+LLM으로 palette·배치 **초안** (3) 2D 미리보기 **손 수정**→승인. **매장 전체 image gen 금지(v1)**. 비용·편의·유사도 실행 **§42** | User 2026-07-24: 비용 아끼면서 현실적으로 어떻게? | 2026-07-24 |
| AD-043 | **GUCCI 데모 등각 월드 = `generated` visualStyle** — PDF 시안과 **동일 AI 이미지 생성 파이프라인**으로 room/avatar PNG 생성 → Phaser 2:1 dimetric **타일 그리드**에 조립(목업 PNG 통째 붙이기·Graphics 사각형 placeholder **금지**). **지금:** CEO 데모용 하드코드 앵커·충돌·NPC (`generatedWorldAssets.ts`). **정식:** §44 Grid Occupancy + `display_fixtures`(AD-033). 상세 **§43·§44** | User 2026-07-24: 시안 품질대로 월드 + 정식 경로 질문 | 2026-07-24 |
| AD-044 | **Grid Occupancy 표준 (등각 타일 맵)** — 타일 그리드 `grid[x][y]` + fixture **다중 타일 점유**(`origin` + `width`×`depth`) + **Y-sort** `(tx+ty)` + 충돌=occupied·벽 + 문=transition(AD-025). **데모(GUCCI):** 이동·depth만 타일, 충돌은 PNG 픽셀 보정(§43). **정식:** occupied가 단일 진실 소스 — §44 | User 2026-07-24: Gemini 등각 도면 스펙 ↔ 우리 정식 방향 정리 요청 | 2026-07-24 |
| AD-045 | **점주 AI = 매장 전체 생성 ❌ → 리소스 추출 + 도면 에디터** — 실사 업로드 시 **타일·가구·소품·재고 픽셀**만 API로 분리 추출 → **점주 계정 귀속 라이브러리**. 꾸미기 전 **픽셀 도면(벽·문·구조)** 편집 → 바닥 **칠하기**·fixture **점유 배치**(§44). 전체 room gen 금지(GUCCI 충돌 이슈 회피). **§45** | User 2026-07-24: API 절약 + 좌표/충돌 문제 근본 해결 | 2026-07-24 |
| AD-046 | **인프라·호스팅 맵** — GitHub/Vercel/Railway/Supabase/Upstash 등 **역할·URL·env·비용·단계별 필요 서비스** 단일 설계도. §28 요약 보완. 상세 **§46** | User 2026-07-24: 호스팅 여러 개 정리·앞으로 필요한 것 미리 설계 | 2026-07-24 |
| AD-047 | **월드 모바일 HUD = 시안 하단 가로 바** — 픽셀 아이콘 4칸: `상호작용 · 채팅 · 장바구니 · 전체상품` (`Online_Popup.docx` · AD-033). **세로:** 하단 중앙(또는 풀폭 근처) 알약 바 + D-pad 왼쪽 아래. **가로:** 같은 바를 **늘리지 않음**(`max-width` 알약 유지) · D-pad 왼쪽 · 바는 하단 중앙/오른쪽. 지금 PlayWorld는 **임시 텍스트 버튼**(기능용) — **Sprint 4-3**에서 시안 바로 교체. 상세 **§32.1** | User 2026-07-30: 시안 HUD 확인·가로 늘림 금지 | 2026-07-30 |
| AD-048 | **앱 화면 회전 = config + 런타임 API** — 월드 WebView 가로 HUD(AD-047): `app.config` `orientation: 'default'` + 매장 화면 `expo-screen-orientation` **`ALL`**. **Expo Go는 app.config만으로 회전 안 되는 경우 많음.** 로그인·홈은 매장 퇴장 시 `PORTRAIT_UP` | User 2026-07-31: 가로 돌려도 화면 안 돌아감 | 2026-07-31 |
| AD-049 | **근접 상호작용 UI = 짧은 가운데 알약 (옵션 C)** — 진열: **긴 「탭해서 진열…」 바 제거** · `PlayProximityPill`(이름 + 「탭·상호작용」) · **탭 = HUD 상호작용과 동일** · D-pad 왼쪽 여백(`--play-dpad-clear`) · 가운데 정렬 · max-width. **엘리베이터 등 후속**도 같은 알약 패턴(행동 문구만 변경) | User 2026-07-31: 배너 겹침·HUD 중복 | 2026-07-31 |
| AD-050 | **월드 몰입 = 시스템 UI 숨김 + 엣지 스와이프 (Android)** — 매장 WebView에서 `StatusBar` hidden · Android `expo-navigation-bar` **hidden + `overlay-swipe`**. **루트 `_layout`에 전역 StatusBar 두지 않음**(매장 hidden과 충돌 · ISS-031). Stack `statusBarHidden` · `useWorldImmersiveChrome` · 홈 퇴장 시 복원. **인게임 HUD(알약·D-pad)는 유지** — 몰입 대상은 OS 바만 | User 2026-07-31: 인게임 느낌·게임식 UI | 2026-07-31 |
| AD-051 | **몰입 최종 검증 = EAS development APK** — Expo Go에서는 OS 바 숨김이 **기대하지 않음**(ISS-031 User 확인). 코드·manifest(`sticky-immersive`)는 유지 · **`eas build --profile development`** 로 dev client 설치 후 매장 WebView에서 재확인. Preview/Production 빌드 전 게이트 | User 2026-07-31: Expo Go 그대로 보임 → dev APK에서 확인 합의 | 2026-07-31 |

---

## 5. Current State

### ✅ Completed (2026-07-13 — Turborepo + Supabase 세션)
- [x] Turborepo monorepo 구조 전환 (`apps/web`, `packages/*`, `server/`)
- [x] Supabase MCP 연동 확인 (`popup-platform`, ACTIVE, Seoul)
- [x] Supabase 스키마 적용: `stores`, `channels`, `profiles` (role 포함) + RLS 정책
- [x] Supabase 자동 트리거: 신규 가입 시 `profiles` row 자동 생성 (`role='shopper'` 기본값)
- [x] GUCCI 데모 스토어 시드: `popup_gucci_01` (`GUCCI POP-UP CUBE`)
- [x] 서버를 `pg`(직접 DB 연결) → `supabase-js`(service_role key) 방식으로 전환 (AD-015)
- [x] Redis 채널 배정 서비스 (`assignChannel`, 40명 cap) — 로직 그대로 `server/`로 이동
- [x] Socket.io 핸들러 — `server/`로 이동, CORS를 `WEB_ORIGIN` 환경변수로 정리 (ISS-005 개선)
- [x] `apps/web` React+Vite 뼈대: 랜딩(쇼핑하기/매장 관리) → 로그인 → 스토어 화면
- [x] `AuthContext` — Supabase Auth 로그인 + `profiles.role` 읽기
- [x] 점주 전용 툴바 조건 렌더링 (role === 'owner') — §22 로직 실제 구현
- [x] `packages/shared` — 공통 타입, Supabase 클라이언트 팩토리, 소켓 이벤트 상수
- [x] `packages/game-core` — 소켓 연결 뼈대
- [x] **UI 한국어화 (AD-017)** — `apps/web/src/i18n/ko.ts`, §25
- [x] 로컬 실행 확인 — `npm run dev`, 소비자/점주 로그인·점주 툴바 동작 확인
- [x] Upstash Redis — `server/.env` REDIS_URL 설정
- [x] 데모 계정 — `demo@shopper.com` / `demo@owner.com` (비밀번호: `demo`)
- [x] **홈 허브 P0 (AD-019, §26)** — `/home` 매장 카드 그리드 + 이름 검색 + 입장 모달; 로그인 성공 후 `/store/:id` 직행 → `/home`으로 변경; `StorePage`에 홈 버튼 추가
- [x] `stores` 테이블에 `description`, `thumbnail_url`, `status`(`draft`\|`published`) 컬럼 추가 (Supabase migration `add_store_home_hub_fields`); GUCCI 시드에 값 채움
- [x] `packages/shared`에 `StoreSummary` 타입 추가; `apps/web/src/lib/stores.ts` — RLS(`stores_public_read`) 기반 직접 조회
- [x] **홈 허브 P1 (AD-019, §26)** — 점주 매장 만들기 실제 폼: `/store/create` (`CreateStorePage.tsx`) — 이름·대표이미지 업로드·설명 → `create_owner_store` DB 함수로 `stores` insert + `profiles.role/store_id` 원자적 갱신
- [x] Supabase Storage 버킷 `store-assets` 생성(public) + RLS(본인 uid 폴더만 upload/update, 목록 노출 방지); `stores` INSERT RLS 정책 추가
- [x] `authenticated` 역할에 `stores` INSERT/UPDATE 테이블 grant 추가 (RLS만으론 부족 — ISS 패턴과 동일 원인)
- [x] `AuthContext`에 `refreshProfile()` 추가 — 매장 생성 직후 role/store_id 즉시 반영
- [x] **Phase 2 시작 (AD-022)** — `packages/game-core/src/topDownGame.ts` 신규: Phaser 탑뷰 월드 렌더링 + Socket.io 동기화(`player:join/move/left`) + 실시간 채팅 이벤트 수신/송신
- [x] `apps/web/src/pages/StorePage.tsx` — placeholder 제거, 실제 월드 캔버스 마운트 + 채팅 패널 + 비로그인 접근 시 로그인 페이지로 리다이렉트
- [x] `apps/web/package.json` — `@popup-cube/game-core` 의존성 연결
- [x] GUCCI `map_config` snake_case(`store_id`, `map_size`)도 깨지지 않게 `normalizeMapConfig()`에서 camel/snake 모두 호환 처리 (ISS 예방)
- [x] **잠수(자리비움) 자동 퇴장** — 10분간 이동/채팅 없으면 `/home`으로 이동, 30초 전 경고 배너, 점주는 본인 매장에서 면제
- [x] **멀티 싱크 근본 수정(ISS-019)** — Redis List→Set 전환 + 소켓 즉시 disconnect로 채널 인원 0명 버그 재발 방지
- [x] **닉네임 회원가입 시스템(AD-023)** — `profiles.nickname`(유니크, 2~16자) + `is_nickname_available` RPC + `LoginPage` 회원가입 모드(중복확인 통과해야 가입 가능)
- [x] **캐릭터 이름표 개편** — 발밑 닉네임(검정 반투명+흰글자 통일), 점주는 왕관 표시, 채팅 시 머리 위 말풍선(5초 후 사라짐, 최신 메시지만)
- [x] **상품 등록/목록 + 장바구니 MVP (§10, AD-027 연속선)** — `products` 테이블+RLS, 점주 상품 등록/수정/숨기기 패널(`OwnerProductPanel`), 소비자 상품 보기 패널(`ShopPanel`, 수량 +/-), 장바구니(`CartContext` — client-only, `localStorage`)+장바구니 Drawer(`CartDrawer`, mock 결제)
- [x] **구매 완료 시 "할인 vs 가챠" 선택 (AD-028, §10)** — `store_promotions`(매장별 할인%), `gacha_pools`/`gacha_pool_entries`(실제 상품+가챠 전용 아이템 혼합, 매장 공용 풀)/`gacha_rolls` 테이블+RLS, `roll_gacha()` SECURITY DEFINER 함수(서버 측 가중치 랜덤, 클라이언트 조작 불가), GUCCI 데모 매장에 10% 할인 + 가챠 아이템 4종 시드, `CartDrawer`에 결제 완료 후 혜택 선택 단계 추가
- [x] **주문 저장 + 소비자 배송지 관리 (AD-030, §10)** — `user_addresses`(여러 배송지+별명+기본 지정) + `orders`/`order_items`(실제 주문 저장) 테이블+RLS, `place_order()`(서버가 가격·할인 재검증 후 원자적 저장) + `get_store_orders()`(점주가 본인 매장 주문+구매자 닉네임+배송지 조회) SECURITY DEFINER/INVOKER 함수, 마이페이지(`/mypage`) 배송지 관리 UI, `CartDrawer`에 배송지 선택 단계 추가, 점주 툴바 "📊 주문 관리" 연동(`OwnerOrdersPanel`)
- [x] **Phase 4 Sprint 0 — fixture DB + occupancy (2026-07-27)** — `fixture_templates`(§42.3 8종 시드) + `display_fixtures` + `display_slots` + RLS/GRANT; `packages/game-core/src/occupancyGrid.ts` (`buildOccupancyGrid`, `canWalk`, `canPlaceFixture`); `apps/web/src/lib/displayFixtures.ts` CRUD; `packages/shared` 타입; SQL `supabase/migrations/20260727_phase4_display_fixtures.sql`
- [x] **Phase 4 Sprint 1 — `apps/mobile` Expo shell (2026-07-27, AD-037/038)** — expo-router: m01 랜딩(이중 로그인) · 로그인/회원가입 · 홈(매장 목록·검색·입장 모달) · `/store/[storeId]` placeholder; Supabase Auth+AsyncStorage; EAS projectId `49c42cb0-...`; `eas.json` · `apps/mobile/README.md`

- [x] **Phase 4 Sprint 2 — 웹 AD-037 + 에디터 MVP (2026-07-27)** — `LandingPage`/`LoginPage` 점주 전용 · `HomePage`→점주 대시보드 · `/store/:storeId/edit` (`StoreEditPage`: 개요·상품·주문·꾸미기 탭) · `/app-only` · `/store/:storeId` 월드→에디터/앱 리다이렉트 · `OwnerProductPanel`/`OwnerOrdersPanel` embedded 모드 · `getMyStore()`

### ⬜ Not Done / Next (Phase 4 정식 런칭 — AD-037)
- [x] **Sprint 3 — OwnerDisplayPanel** — 조형물 배치 + 슬롯 상품 연결 UI + draft/출시
- [x] **Sprint 4-1 — 앱 Phaser 월드 뼈대** — WebView → `/play/:storeId` · `display_fixtures` 로드 · GUCCI 시드 1건 (2026-07-30)
- [x] **Sprint 4-2 — 손님 진열 상호작용** — 슬롯 상품 팝업 · 장바구니 · 착용 미리보기 (2026-07-30) · 바로구매·풀 TryOn ⬜
- [x] **Sprint 4-3 — 시안형 하단 HUD 바 (AD-047, §32.1)** — 픽셀 4칸 · 세로/가로 알약 · 채팅 · D-pad 겹침 방지 (2026-07-31)
- [x] **AD-049 근접 알약 · AD-048 회전** — User 실기 OK (2026-07-31)
- [x] **AD-050 몰입 코드** — Expo Go 검증 ❌ → **AD-051 dev APK 게이트** (2026-07-31)
- [x] **draft/출시 (AD-021)** — Sprint 3에서 `create_owner_store` → draft + 출시 버튼 (완료)
- [x] **Phase 2 후속 (일부)** — 카메라가 캐릭터를 따라다니는 고정 뷰포트 방식으로 전환 + 타일/캐릭터/글자 크기 확대(2026-07-13, AD-026)
- [ ] **Phase 2 후속 (남음)** — 충돌 정확도 개선, **방향별 스프라이트 애니메이션** (캐릭터 뼈대/파츠는 AD-020 — **쇼핑 루프·HUD 안정 후**)
- [ ] **점주 전용 픽셀 자산 파이프라인 (AD-020, §27)** — 표준 스프라이트·상품 연결·구매 소유권 기반 장착 (**의도적 후순위** — User 2026-07-30 확인: Sprint 순서 유지)
- [ ] **점주 AI 매장 에이전트 (AD-040, §40)** — 자연어/실사→진열 가구·슬롯 레이아웃 제안 (Phase 4+ / AD-033 이후)
- [x] **Vercel 배포** — `apps/web` → https://popup-cube-web.vercel.app (GitHub `main` 연동)
- [x] **Railway 배포** — `server/` Socket.io (URL은 Railway 대시보드 · `VITE_SOCKET_SERVER_URL`과 `WEB_ORIGIN` 쌍 맞출 것 — §46)
- [x] **Git push** — Sprint 4-1~4-2 · D-pad fix (`main` · 2026-07-30)

### File Tree (as of 2026-07-13)
```
popup_store/                          # Turborepo root
├── HANDOFF_POPUP_STORE.md
├── package.json                      # workspaces root
├── turbo.json
├── .gitignore
│
├── apps/
│   └── web/                         # React + Vite (Phaser는 Phase 2)
│       ├── .env / .env.example
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx              # 라우팅: / , /login , /home , /store/create , /mypage , /store/:storeId
│           ├── lib/supabase.ts
│           ├── lib/stores.ts               # listPublishedStores/getStoreSummary (§26)
│           ├── lib/storeCreate.ts          # createStore() — 업로드 + create_owner_store RPC (§26 P1)
│           ├── lib/nickname.ts             # checkNicknameAvailable() — 회원가입 중복확인 RPC 래퍼
│           ├── lib/products.ts             # 상품 CRUD + soft delete (§10 상품 MVP, 2026-07-13)
│           ├── lib/gacha.ts                # getActivePromotion / rollGacha (§10, AD-028)
│           ├── lib/addresses.ts            # 배송지 CRUD + 기본 배송지 지정 (§10, AD-030)
│           ├── lib/orders.ts               # placeOrder (RPC) / listStoreOrders (RPC) (§10, AD-030)
│           ├── context/AuthContext.tsx   # role 읽기 + refreshProfile() (§22)
│           ├── context/CartContext.tsx   # 장바구니 client 상태 + localStorage (§10, 2026-07-13)
│           ├── i18n/                       # ko.ts + t() (§25, AD-017)
│           ├── components/StoreEnterModal.tsx  # 입장 모달 (§26)
│           ├── components/ShopPanel.tsx        # 소비자 상품 목록 + 장바구니 담기 (§10)
│           ├── components/CartDrawer.tsx       # 장바구니 +/- 수량 + mock 결제 + 배송지 선택 + 할인/가챠 선택 (§10, AD-028/030)
│           ├── components/OwnerProductPanel.tsx # 점주 상품 등록/수정/숨기기 (§10)
│           ├── components/OwnerOrdersPanel.tsx  # 점주 주문 관리 — 매장별 주문+구매자+배송지 목록 (§10, AD-030)
│           ├── components/AddressFormFields.tsx # 배송지 입력 폼 (마이페이지·결제 공통, §10, AD-030)
│           └── pages/
│               ├── LandingPage.tsx  # 쇼핑하기 / 매장 관리
│               ├── LoginPage.tsx    # 로그인 성공 → /home
│               ├── HomePage.tsx     # 월드 허브: 카드 그리드·검색·입장 모달 (§26)
│               ├── CreateStorePage.tsx  # 점주 매장 만들기 폼 (§26 P1)
│               ├── MyPage.tsx       # 마이페이지 — 배송지 관리 탭 (§10, AD-030)
│               └── StorePage.tsx    # Phaser 탑뷰 월드 + 실시간 채팅 + 점주 툴바 + 상품/장바구니/주문 패널
│
├── packages/
│   ├── shared/                     # types, constants, supabaseClient
│   ├── game-core/                  # socketClient + topDownGame(Phaser)
│   └── ui/                         # 뼈대만
│
└── server/                         # Express + Socket.io (from src/)
    ├── .env / .env.example
    ├── package.json
    ├── examples/socket-test-client.html
    └── src/
        ├── index.js
        ├── app.js
        ├── config/
        │   ├── index.js
        │   ├── redis.js
        │   └── supabase.js        # service_role client (AD-015)
        ├── repositories/storeRepository.js   # supabase-js 기반
        ├── services/channelService.js
        ├── socket/index.js
        └── routes/api.js
```

---

## 6. Blockers & Known Issues

| ID | Issue | Severity | Action |
|---|---|---|---|
| ISS-001 | ~~Node.js PATH~~ | Resolved | 로컬 `npm run dev` + 로그인 플로우 확인됨 |
| ISS-003 | `assignChannel` race condition | Low | 동시 40번째+1 join 시 중복 배정 가능; MVP 이후 Redis Lua/transaction lock |
| ISS-004 | `channelUsers` Redis Set에 disconnect 누락 시 ghost user | Low | heartbeat + TTL 정리 작업 예정 (2026-07-13: List→Set 전환으로 중복-삭제 버그는 해결됐지만, disconnect 이벤트 자체가 안 오는 경우의 ghost는 여전히 남을 수 있음) |
| ISS-005 | ~~CORS prod 설정 미완~~ | Resolved | `WEB_ORIGIN` 환경변수로 제어 (`server/.env`) |
| ISS-006 | ~~Supabase 미연결~~ | Resolved | MCP 연동됨; `popup-platform` 사용 |
| ISS-007 | 2~3주 all-live-simple 일정 tight | High | Week별 마일스톤 엄수; SD/실결제는 post-demo |
| ISS-002 | ~~PostgreSQL + Redis 로컬 필요~~ | Resolved | DB=Supabase, Redis=Upstash |
| ISS-009 | ~~`SUPABASE_SERVICE_ROLE_KEY` 없음~~ | Resolved | `server/.env` 설정 완료 |
| ISS-010 | ~~데모 계정 미생성~~ | Resolved | shopper/owner; owner role SQL 적용 |
| ISS-011 | ~~`apps/web`이 아직 소켓 서버(`game-core`)와 연결 안 됨~~ | Resolved | `StorePage.tsx`가 `mountTopDownGame()`으로 소켓 서버 연결, 실시간 이동/채팅 동작 (2026-07-13) |
| ISS-012 | Supabase `public` 스키마 신규 테이블/함수가 `authenticated`·`anon`에 **테이블 GRANT 자동 부여 안 됨** | Low (반복 발생) | "Automatically expose new tables" 설정이 OFF라 매번 `GRANT ... TO authenticated/anon` 수동 추가 필요 — RLS 정책만 있고 테이블 GRANT를 빼먹으면 `42501 permission denied` 발생. 새 테이블/함수 만들 때마다 체크리스트에 포함할 것. |
| ISS-013 | 기존 `handle_new_user`, `rls_auto_enable` 함수가 SECURITY DEFINER로 `anon`/`authenticated`에 EXECUTE 노출 (Supabase advisor WARN) | Low | 이번 작업 범위 밖(가입 트리거 등 핵심 로직); 별도 세션에서 `search_path` 고정 + 필요시 REVOKE 검토 |
| ISS-014 | ~~로그인 성공 직후 `/home` 이동 → 다시 랜딩으로 튕기고 재로그인해야 진입됨~~ | Resolved | `AuthContext.signInWithPassword`가 로그인 시작 시 `loading=true`를 세팅하지 않아서, `navigate('/home')` 시점에 `authLoading`이 stale(false)+`userId` 아직 null인 순간을 `HomePage`/`CreateStorePage`의 `!authLoading && !userId` 가드가 "로그인 안 됨"으로 오판 → `/`로 리다이렉트. `signInWithPassword`가 로그인 시작 시 `loading:true`로 바꾸고, `onAuthStateChange → loadProfile` 완료까지 유지하도록 수정 (2026-07-13) |
| ISS-015 | ~~매장 만들기 성공 후 홈에 안 보임~~ | Resolved | 새 매장이 `status: draft`로 생성되고 홈 목록은 `status='published'`만 보여줘서 발생. 아직 "출시" 버튼(§26 P2)이 없어 draft가 dead-end였음 → `create_owner_store`가 처음부터 `status: 'published'`로 생성하도록 변경(2026-07-13, AD-019 결정 갱신); 기존 테스트로 만들어진 draft 매장 2개도 함께 published로 전환 |
| ISS-016 | ~~월드 입장 시 페이지 높이가 계속 길어짐~~ | Resolved | Phaser `Scale.RESIZE` + 유동 높이 컨테이너(`flex:1`) 조합으로 캔버스와 레이아웃이 상호 확장되는 현상. `topDownGame.ts`를 `Scale.FIT`으로 변경하고 수동 `resize()` 루프 제거, `StorePage.tsx` 월드 박스를 `height: clamp(...)` 고정으로 수정 (2026-07-13) |
| ISS-017 | ~~채팅창 높이가 상황에 따라 길어지고 Enter UX가 불편함~~ | Resolved | 채팅 메시지 영역을 `height: 120px`로 고정(넘치면 내부 스크롤), 각 메시지에 `HH:MM:SS` 타임스탬프 표시, `Enter`로 채팅 입력창 열기 → 입력 후 `Enter` 전송 시 자동 닫힘 로직으로 개선 (2026-07-13) |
| ISS-018 | ~~멀티 접속 시 상대 이름표 글자 사라짐 + 채널 인원 수 실시간 불일치~~ | Resolved | 서버 `player:moved` 이벤트에 `username`이 누락되어 클라이언트가 이름을 빈 값으로 덮어쓰던 문제 수정(`server/src/socket/index.js`). 또한 채널 뱃지가 입장 시점 값만 보여 고정되던 문제를 해결하기 위해 `channel:visitor-count` 브로드캐스트를 join/leave마다 발행하고, 클라이언트(`topDownGame.ts`)가 이를 구독해 즉시 반영하도록 수정. (2026-07-13) |
| ISS-019 | ~~채널 인원수가 잠깐 올랐다가 다시 0명으로 떨어짐~~ | Resolved | **근본 원인**: (1) React `<StrictMode>`(개발 모드) 특성상 컴포넌트 effect가 mount→cleanup→mount로 두 번 실행되는데, 첫 번째(유령) mount가 만든 소켓이 정리되기 전에 이미 `store:join`을 서버로 보냈고, (2) 서버가 채널 인원을 **List**(`LPUSH`/`LREM`)로 관리해서 같은 `userId`가 두 번 들어가면 `LREM key 0 userId`가 "그 값 전부"를 지워버려 정상 접속까지 같이 0명으로 사라짐. **수정**: ① `topDownGame.ts`에 `onSocketCreated` 콜백 추가해 소켓 생성 즉시 참조를 확보하고, `StorePage.tsx` effect cleanup에서 join 완료 여부와 무관하게 바로 `socket.disconnect()`하도록 변경(유령 접속이 애초에 서버에 도달하지 못하게 차단) ② `server/src/services/channelService.js`의 채널 인원 저장 방식을 List → **Set**(`SADD`/`SREM`/`SCARD`/`SISMEMBER`)로 전환해 같은 유저 중복 입장이 있어도 절대 다른 사람 카운트를 지우지 않도록 근본적으로 차단 ③ 기존에 List로 저장돼있던 Redis 키(`store:*:users`)를 1회 삭제해 타입 충돌(`WRONGTYPE`) 해결. **추가로 발견**: 재시작 과정에서 이전 dev 서버 프로세스들이 완전히 종료되지 않고 계속 누적돼 포트 충돌이 반복되던 문제도 함께 정리(좀비 프로세스 전체 종료 후 단일 세션으로 재기동). (2026-07-13) |
| ISS-020 | 동시에 같은 닉네임으로 회원가입 시도 시 `handle_new_user` 트리거의 unique 제약 위반으로 `signUp()` 자체가 실패할 수 있음 | Low | 클라이언트에서 "중복확인"을 거치게 해 대부분 방지되지만, 확인 직후 다른 사람이 먼저 그 닉네임으로 가입을 완료하는 극히 짧은 race는 이론상 가능(ISS-003과 같은 종류). 데모 트래픽 규모에선 발생 가능성 매우 낮음 — 필요 시 signUp 에러 핸들링에 "이미 사용 중인 닉네임" 안내 추가 |
| ISS-021 | ~~월드 입장 직후 "Cannot read properties of undefined (reading 'keyboard')" 에러 표시~~ | Resolved | 채팅 중 이동 차단 기능(`setMovementEnabled`) 추가 직후 발생. `mountTopDownGame()`의 Promise는 `new Phaser.Game()` 생성 직후 곧바로 resolve되는데, 이 시점엔 Phaser가 아직 내부적으로 Scene을 부팅 중이라 `scene.input`이 존재하지 않을 수 있음. `.then()` 콜백에서 곧바로 `controller.setMovementEnabled()`를 호출했다가 `this.input.keyboard` 접근에서 죽음(`this.input`이 undefined). **수정**: `setMovementEnabled()`가 `this.input?.keyboard`로 안전하게 접근하도록 바꾸고, 씬이 준비되기 전이면 `movementEnabled` 값만 저장해뒀다가 `create()` 마지막에 `applyMovementEnabled()`로 다시 적용하도록 분리(2026-07-13). 실제 이동 차단 자체는 `update()`의 `movementEnabled` 플래그 체크로 항상 보장되고 있어서, 이 크래시가 있던 순간에도 기능 자체는 정상 동작하고 있었음(에러 문구만 잘못 표시됨). |
| ISS-022 | ~~채팅 입력창에서 스페이스바(띄어쓰기)가 안 됨~~ | Resolved | Phaser `createCursorKeys()`가 방향키뿐 아니라 **SPACE(32)까지 전역 `addCapture` + `preventDefault`** 해서, 채팅 `<input>`에 포커스가 있어도 스페이스바가 브라우저까지 전달되지 않음. **수정**: 방향키만 `addKey(..., capture=true)`로 따로 등록(SPACE 미포함). 채팅 열림 시 `removeCapture(방향키)`로 가로채기 해제, 닫으면 `addCapture` 복원(2026-07-13). |
| ISS-023 | ~~SQL로 한글 시드 데이터를 여러 개 한 번에 넣을 때 일부 글자가 다른 글자로 깨져서 입력됨~~ | Resolved (주의 필요) | GUCCI 가챠 아이템 이름 시드(2026-07-13) 중 "디지털"→"대지털", "마이룸"→"마이릲" 등으로 일부 글자가 잘못 생성됨(원인: 한 SQL 문 안에 여러 개의 흔치 않은 한글 복합어를 동시에 생성할 때 에이전트가 글자를 잘못 만들어내는 것으로 추정 — 도구/인코딩 문제가 아니라 텍스트 생성 자체의 오류). **조치**: 항목을 하나씩 나눠서 `UPDATE ... RETURNING`으로 즉시 재확인하며 재입력해 해결. **후속 세션 주의사항**: 한글이 많이 들어가는 SQL/데이터를 한 번에 여러 건 입력할 때는, 입력 직후 반드시 `SELECT`로 실제 저장된 문자열을 재확인할 것(특히 흔치 않은 복합어). 이상하면 하나씩 나눠서 다시 입력. |
| ISS-024 | ~~Upstash Redis 무료 50만 Commands 한도가 개발 중 거의 소진~~ | Resolved | 원인: `player:move`마다 `hset`+`expire`를 Redis에 쓰고, 클라이언트가 50ms마다 이동 이벤트 전송 → Writes 48만+ / Reads 1천 수준. **조치(2026-07-14)**: `expire`는 입장 시 1회만, 서버 Redis 영속화 500ms 스로틀, 클라이언트 emit 250ms. `REDIS_MOVE_PERSIST_MS` env. 개발 시 `npm run dev` 장시간 + 매장 페이지 이동 테스트 주의. |
| ISS-025 | ~~Expo Go SDK 57 APK에서 번들 후 앱 force-close~~ | Resolved | Galaxy Fold 5 등 실기기에서 SDK 57 Expo Go로 번들 완료 직후 크래시. **조치(2026-07-27)**: `apps/mobile` **Expo SDK 52** + React 18.3.1로 다운그레이드, `@popup-cube/shared` 제거(로컬 types), metro 0.81.5 override. **Expo Go는 SDK 52 APK** 설치 필수 (`apps/mobile/README.md`). |
| ISS-026 | ~~모바일 로그인 `Invalid API Key`~~ | Resolved | `apps/mobile/.env` anon key JWT 오타 + 번들 캐시에 옛 키/`placeholder` 잔존. **조치**: `.env` 웹과 동일 키로 수정, `app.config.ts`에서 `.env` 직접 read + `extra`에 주입, `supabase.ts` fallback 정리. |
| ISS-027 | ~~모바일 **디버그 배너**(`연결 준비됨 · 빌드 cfg-4`)~~ | Resolved | User 2026-07-27 모바일 테스트 완료 → §7 체크리스트대로 정리 완료. |
| ISS-028 | ~~PlayWorld **이동 D-pad가 안 보임**~~ | Resolved | CSS `.virtual-dpad` absolute left + wrap을 오른쪽에 둬 화면 밖. **조치:** `VirtualDpad` `embedded` · 왼쪽 아래 · commit `9208754`. |
| ISS-029 | Play 스토어 Expo Go **SDK 54+** vs 프로젝트 **SDK 52** → incompatible | Low | §0: Play Go 삭제 → SDK 52 APK. 프로젝트 54 업은 별도 승인. |
| ISS-030 | ~~폰 가로 회전해도 앱·월드 화면이 세로 고정~~ | Resolved (2단계) | ① `app.config` `orientation: 'default'` ② **Expo Go는 config만으론 부족** → 매장 `store/[storeId].tsx`에서 `expo-screen-orientation` **`OrientationLock.ALL`** (2026-07-31). 홈 나가면 `PORTRAIT_UP`. 폰 **시스템 자동 회전** 켜짐 필수. |
| ISS-031 | ~~몰입 — Expo Go에서 상·하단 OS UI 계속 표시~~ | **Deferred** (AD-051) | User 2026-07-31: **2차 수정 후에도 동일** → **Expo Go 한계로 수용**, 최종 확인은 **EAS development APK**. 코드: `worldImmersive.ts` · `_layout` StatusBar 제거 · `app.config` sticky-immersive · **로컬 커밋 대기**( `main` 최신 push = `6901d70` 이후 변경분). |

---

## 7. Next Steps (Priority Order)

### ⏭ 다음 세션 1순위 — **Sprint 4-4: 바로 구매 mock** (2026-07-31)

| 항목 | 값 |
|---|---|
| **User 확인 완료** | 알약 위치(AD-049) OK · 몰입은 Expo Go ❌ → **dev APK**(AD-051) |
| **4-4 목표** | 진열 팝업 `바로 구매 (준비 중)` → **mock 결제 완료 UX** (토스트/모달 · 주문번호 가짜 · PG 없음) · `DisplayProductModal.tsx` · §32 시안 버튼 순서 유지 |
| **범위 밖(당분간)** | PG 실결제 · 풀 TryOn(AD-020) · 동네 필터(AD-035) |
| **Git** | `6901d70` push됨 · **미커밋:** immersive 2차(`_layout`, `worldImmersive.ts`, `home/login/index` restore 등) — 다음 착수 전 **commit+push** 권장 |

### Cursor 다음 1개 (우선)

| # | 작업 | 상태 |
|---|---|---|
| **1** | **Sprint 4-4 — 바로 구매 mock** (`DisplayProductModal` · PlayWorld/Store 동일 패턴) | ⬜ **다음 착수** |
| 2 | EAS **development** 빌드 + 몰입 재확인 (AD-051) | ⬜ User/인프라 타이밍 |
| 3 | HUD 아이콘 시안 PNG (SVG → 에셋) | ⬜ 폴리시 |
| 4 | AD-034/035 자동로그인·동네필터 | ⬜ 시안만 |
| 5 | PG 실결제 | ⬜ User 후보 미정 |

### (완료) Sprint 4-3 실기 — User 2026-07-31

| # | 확인 항목 | 결과 |
|---|---|---|
| 1~8 | HUD · D-pad · 채팅 · 장바구니 등 | User 진행 중/부분 OK (알약 위치 **OK**) |
| 9 | 가로 모드 | (별도 이슈 없으면 OK) |
| — | **몰입 OS 바** | Expo Go **변화 없음** → AD-051 |

### 사용자가 4-4 후 테스트할 것 (§0 Expo · 웹)

- Vercel `/play` 배포 반영 후 · 진열 → **바로 구매** → mock 완료 화면
- Expo Go는 **월드 WebView**로 동일 플로우 (몰입은 dev APK 때)

**PC Expo (변경 없음)**

```
cd C:\Users\qotjd\Downloads\Cursor\popup_store\apps\mobile
npx expo start --tunnel --port 8082 --clear
```

### Sprint 표

| Sprint | 상태 | 내용 |
|---|---|---|
| 0~3 | ✅ | fixture · Expo · 점주 에디터 · OwnerDisplay · draft |
| **4-1** | ✅ 2026-07-30 | WebView `/play` · fixtures · GUCCI 시드 |
| **4-2** | ✅ 2026-07-30 | 슬롯 팝업 · 장바구니 · 착용 미리보기 · **바로구매 ⬜** |
| **4-3** | ✅ 2026-07-31 | 시안 HUD · 채팅 · 근접 알약 · 회전 · 몰입 코드 |
| **4-4** | ⬜ **다음** | **바로 구매 mock** |

### 키 파일
- `apps/web/src/pages/PlayWorldPage.tsx` — WebView 월드
- `apps/web/src/components/DisplayProductModal.tsx` · `VirtualDpad.tsx` (`embedded`)
- `apps/mobile/app/store/[storeId].tsx`
- 시안: `Online_Popup.docx` · §32 · **§32.1**

### Pending User Input
- [ ] 결제 PG 후보
- [ ] (선택) Expo SDK 54 업그레이드 여부 — 현재 **52 APK 고정**

### 캐릭터 타이밍 (User 2026-07-30)
지금 = PNG 아바타 · 4-2 = 착용 미리보기만 · 본격 스프라이트/장착 = HUD·쇼핑 안정 **후** (AD-020). **순서 앞당기지 않음.**

### (참고·과거) 투자자 미팅 AD-032
2026-07-13 긴급 미팅용 — 현 런칭 Sprint와 별개. 시연 용어는 §31.

---

## 8. Changelog

### 2026-07-31 — ISS-031 Deferred · AD-051 (User Expo Go 몰입 확인)
- **User:** 알약 위치 OK · **몰입(OS 바) Expo Go에서 변화 없음** → dev APK에서 최종 확인 합의
- **Changed:** HANDOFF §7 → **Sprint 4-4 바로 구매 mock** 1순위 · ISS-031 Deferred · AD-051 추가
- **Notes:** 로컬 immersive 2차 코드 **아직 main 미푸시** — 다음 세션 commit 권장

### 2026-07-31 — 몰입 UI 2차 (ISS-031 · Expo Go 대응)
- **Changed:** `worldImmersive.ts` · 재시도·WebView `onLoadEnd` · `androidNavigationBar.sticky-immersive` · 홈/로그인 restore · **`_layout` StatusBar 충돌 제거** · Stack `statusBarHidden`
- **Notes:** Expo Go에서도 안 되면 **EAS development APK**로 확인. `app.config` 바꿨으면 **`--clear` 필수**.

### 2026-07-31 — 월드 몰입 UI + 근접 알약 정렬 (AD-050 · AD-049)
- **Author:** Cursor Agent (User 승인)
- **Changed:** `useWorldImmersiveChrome.ts` · `store/[storeId].tsx` · `expo-navigation-bar` · `play-world.css` 알약 세로/가로 정중앙 · `PlayWorldPage` safe-area top
- **Notes:** Android **overlay-swipe** = 게임식 엣지 스와이프. Expo **`--clear` 재시작** · Vercel `/play` 배포.

### 2026-07-31 — PlayWorld 근접 알약 UI (AD-049 · 옵션 C)
- **Author:** Cursor Agent (User 승인)
- **Changed:** `PlayProximityPill.tsx` · `play-world.css` · `PlayWorldPage` 긴 배너 제거 · `play.proximityTapHint`
- **Notes:** Vercel 배포 후 §0 — 테이블 근처 알약 탭 = HUD 상호작용. **다음:** 월드 상태바 몰입(User 1번).

### 2026-07-31 — 앱 가로 회전 허용 (ISS-030 · AD-048)
- **Author:** Cursor Agent (User 피드백)
- **Changed:** `apps/mobile/app.config.ts` `orientation: 'default'` · `PlayWorldPage.tsx` orientation 리사이즈
- **Notes:** **Expo `--clear` 재시작 필수**(app.config 변경). §7 체크 #9 가로 HUD 재확인.

### 2026-07-31 — Phase 4 Sprint 4-3: 시안형 하단 HUD 바 + 채팅 (AD-047)
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - `PlayHudBar.tsx` — 픽셀 SVG 4칸 (상호작용·채팅·장바구니·전체상품)
  - `PlayWorldChatPanel.tsx` — `/play` 실시간 채팅 오버레이
  - `play-world.css` — 알약 바 · D-pad 왼쪽 · 가로 `max-width` (늘리지 않음)
  - `PlayWorldPage.tsx` — 임시 텍스트 HUD 제거 · `onChatMessage` · 채팅 시 이동 정지
  - `i18n/ko.ts` — `play.hudBarLabel`
- **Notes:** push `2ef3a65`. **실기 테스트: §0 Expo Go 안내** · §7 「사용자가 지금 해야 할 것」9항목 체크리스트.

### 2026-07-30 (c) — 세션 인수인계 · AD-047 · ISS-028/029
- **Author:** Cursor Agent + User
- **Changed:** AD-047 · §32.1 · §7 재개=**Sprint 4-3** · ISS-028 Resolved · ISS-029 문서화
- **Notes:** User 바쁨 중단. 다음 채팅에서 4-3 브리핑.

### 2026-07-30 — PlayWorld D-pad 가시성 (ISS-028)
- **Changed:** `VirtualDpad` `embedded` · PlayWorld 왼쪽 · HUD 오른쪽 · push `9208754`

### 2026-07-30 — Phase 4 Sprint 4-2: 진열 상품 팝업 · 장바구니 · 착용 미리보기
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - `PlayWorldPage.tsx` — HUD(상호작용·장바구니·전체상품) · `DisplayProductModal` · `CartDrawer` · `ShopPanel`
  - `DisplayProductModal.tsx` — `fixtureId` 슬롯 상품 로드 · 착용 미리보기 · 바로구매 준비중
  - GUCCI `display_slots` 상품 3종 · migration `20260730_sprint4_gucci_slot_products.sql`
- **Notes:** push `2350997`. 풀 스프라이트 TryOn은 후속.

### 2026-07-30 — Phase 4 Sprint 4-1: 앱 WebView 월드 + display_fixtures 로드
- **Author:** Cursor Agent (User 승인 · Composer)
- **Changed:**
  - `apps/web/src/pages/PlayWorldPage.tsx` — `/play/:storeId` (앱 WebView 전용) · 해시 세션 복구 · layout 로드 · VirtualDpad
  - `apps/web/src/App.tsx` · `i18n/ko.ts` `play.*`
  - `packages/game-core/src/topDownGame.ts` — `displayFixtures` / `occupancy` 옵션 · top-down 조형물 표시·근접 존
  - `apps/mobile` — `react-native-webview` · `store/[storeId].tsx` WebView · `EXPO_PUBLIC_WEB_ORIGIN`
  - Supabase: GUCCI `display_fixtures` 시드 1건 (`table_round_3`) · migration `20260730_sprint4_gucci_display_fixture_seed.sql`
  - **§0 Expo Go 실기 테스트 안내 규칙** 추가 (SDK 52 · tunnel · 데모계정 · 월드 배포 체크 · 복사용 안내문)
- **Notes:** GUCCI 시각/충돌은 기존 generated PNG 유지. 헤더에 「진열 N개」표시로 DB 연동 확인. push `e271ec8`.

### 2026-07-27 — Phase 4 Sprint 3: OwnerDisplayPanel + draft/출시 (AD-021, AD-033)
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - `OwnerDisplayPanel.tsx` — 8종 조형물 팔레트·격자 배치·겹침 검사·슬롯 상품 연결
  - `StoreEditPage.tsx` — layout 탭 연결, 개요 「출시하기」버튼, draft/published 배지
  - `HomePage.tsx` — 점주 대시보드 임시저장/출시 배지
  - `stores.ts` — `publishStore()`
  - Supabase migration `sprint3_draft_publish` — `create_owner_store` → `status: draft`
  - `i18n/ko.ts` — `ownerDisplay`, `ownerEdit` 출시 문구
  - **ISS-027 Resolved** — 모바일 cfg-4 디버그 배너·fallback 하드코드 제거
- **Notes:** 새 매장은 draft로 생성. GUCCI 등 기존 published 매장 유지. Sprint 4 = 앱 월드·손님 진열 상호작용.

### 2026-07-27 — 모바일 Expo SDK 52 + Supabase 로그인 수정 + 디버그 배너 (ISS-025~027)
- **Author:** Cursor Agent + User (실기 테스트)
- **Changed:**
  - `apps/mobile` — Expo **SDK 52** (React 18.3.1, RN 0.76.9), SDK 57 크래시 회피
  - `apps/mobile/.env` — anon key 웹과 동기화
  - `apps/mobile/app.config.ts` — `.env` 직접 read → `extra.supabaseUrl/AnonKey`
  - `apps/mobile/src/lib/supabase.ts` — manifest `extra` 우선, fallback, auth 에러 한글화
  - `apps/mobile/app/index.tsx`, `login.tsx` — **임시** `연결 준비됨 · 빌드 cfg-4` 배너 (테스트용)
  - root `package.json` — metro 0.81.5 overrides
- **Notes:** Expo Go **SDK 52 APK** 필수. **ISS-027**: 모바일 테스트 완료 후 §7 체크리스트대로 cfg 배너·fallback 하드코드 **전부 제거** (User 2026-07-27 인수인계 확인). Sprint 3 착수 대기(User 승인).

### 2026-07-27 — Phase 4 Sprint 2: 웹 AD-037 + 점주 에디터 MVP
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - `apps/web` — **AD-037 채널 분리**: 랜딩/로그인 점주 전용, 일반 회원 → `/app-only` 안내
  - `HomePage.tsx` → 점주 대시보드 (매장 없으면 만들기, 있으면 에디터 진입)
  - `StoreEditPage.tsx` — `/store/:storeId/edit` (개요 · 상품 · 주문 · 매장 꾸미기 placeholder)
  - `AppOnlyPage.tsx`, `App.tsx` 라우트 정리 (MobileShell 제거, `/mypage`→앱 안내)
  - `StorePage.tsx` — 웹 월드 플레이 비활성 (점주→edit, 그 외→app-only)
  - `OwnerProductPanel` / `OwnerOrdersPanel` — `embedded` 모드 (에디터 탭)
  - `stores.ts` — `getMyStore()`, `CreateStorePage` 성공 시 `/edit` 이동
  - `i18n/ko.ts` — `ownerDashboard`, `ownerEdit`, `appOnly` 키
- **Notes:** 매장 꾸미기(fixture)·draft/출시 = **Sprint 3**. 손님 쇼핑·월드 = **앱(Sprint 4)**.

### 2026-07-27 — Phase 4 Sprint 1: Expo mobile shell (AD-037/038)
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - `apps/mobile/` — Expo **SDK 52** + expo-router, `@popup-cube/mobile` *(CHANGELOG 2026-07-27: SDK 57→52, ISS-025)*
  - Screens: `app/index.tsx` (m01), `login.tsx`, `home.tsx`, `store/[storeId].tsx` (placeholder)
  - `src/context/AuthContext.tsx`, `lib/supabase.ts` (AsyncStorage), `lib/stores.ts`, `components/StoreEnterModal.tsx`
  - `app.config.ts` — slug `popup-cube`, EAS projectId `49c42cb0-df70-47a8-b34d-22878a8e3529`, bundle `com.popupcube.app`
  - `eas.json`, `metro.config.js` (monorepo), `README.md`, `.env.example`
- **Notes:** Phaser·장바구니·동네필터 = Sprint 4+/AD-035. 로컬: `cd apps/mobile && npm run start` → Expo Go. 점주 관리 UI는 앱에 **없음** (PC 웹).

### 2026-07-27 — Phase 4 Sprint 0: fixture DB + Grid Occupancy 엔진
- **Author:** Cursor Agent (User 승인)
- **Changed:**
  - Supabase migration `phase4_display_fixtures` — `fixture_templates`(8종), `display_fixtures`, `display_slots`, RLS, slot seed trigger
  - `supabase/migrations/20260727_phase4_display_fixtures.sql`
  - `packages/shared/src/types.ts` — `FixtureTemplate`, `DisplayFixture`, `DisplaySlot`
  - `packages/game-core/src/occupancyGrid.ts` — `buildOccupancyGrid`, `canWalk`, `canPlaceFixture`, `fixtureInteractRing`
  - `apps/web/src/lib/displayFixtures.ts` — CRUD + `loadStoreDisplayLayout`
- **Notes:** UI(에디터·앱) 없음 — **웹·앱 공통 데이터·충돌 뼈대**. GUCCI §43 픽셀 충돌은 데모 유지. 다음 Sprint 1 = Expo. AD-037 채널 분리 병행.

### 2026-07-24 — §42 실행안: 팝업 사진 wizard + 비용 통제 (AD-042)
- **Author:** User + Cursor Agent
- **Changed:** AD-042, §42 — 3단 wizard, vision+LLM만·image gen v1 금지, fixture 8종, quota표
- **Notes:** 「어떻게 할 거냐」에 대한 **정본 실행안**

### 2026-07-24 — §41 실매장 유사도 제품 원칙 (AD-041)
- **Author:** User + Cursor Agent
- **Changed:** AD-041, §41 — 점주 「본인 팝업 닮기」= 성공 조건, 레고+스킨 모델, published 최소 기준
- **Notes:** §40 카탈로그 ≠ 제네릭 쇼룸 — **점주 브랜딩 레이어**가 핵심

### 2026-07-29 (b) — Vercel 정본 · Pages OFF · Trial FAQ

- **Changed:** §46.11 — FC Zero Pages **Unpublish** (None 없음) · URL 정본 표 · Trial→Hobby FAQ
- **Cross-ref:** `HANDOFF_FC_ZERO.md` §39.2~§39.3 · `VERCEL_MIGRATION.md` 백업 절차

### 2026-07-29 — FC Vercel 이관 · 팀 통합 · §46.11

- **Added:** FC Zero/Platform Production on Vercel (`fc-team-dashboard` · `fc-team-platform`) — Git 연동 ✅ · **`FC_Zero&FC_Platform/setup/VERCEL_MIGRATION.md`**
- **Changed:** §46.3 Live URL · §46.2 Vercel 행 · Quick Facts Vercel 팀 · diagram
- **Added:** §46.11 — Vercel/Railway/Supabase 3프로젝트 · Pro Trial · 결제 미등록 · Agent 워크플로 메모
- **Notes:** Platform Supabase Auth Vercel URL ✅ · Railway Trial $5 ~$0.04/월

### 2026-07-24 — §46 인프라·호스팅 맵 (AD-046)
- **Author:** User + Cursor Agent
- **Changed:** AD-046, §46 — GitHub/Vercel/Railway/Supabase/Upstash/Expo/PG/AI 등 역할·단계·env·비용·Live URL 통합. §28·§9·`DEPLOY.md` cross-ref
- **Notes:** §28 = Vercel/Railway 입문·요금 요약. **전체 설계도 = §46**

### 2026-07-24 — §45 리소스 추출 + 픽셀 도면 에디터 (AD-045)
- **Author:** User + Cursor Agent
- **Changed:** AD-045, §45 — 매장 전체 AI gen 폐기 방향 확정; 실사→**개별 리소스** 추출·점주 라이브러리; **도면 먼저 → 칠하기·점유 배치** 2단 에디터
- **Notes:** GUCCI 데모(§43) 충돌 문제의 **정식 해결책**. §40·§42 AI 파이프라인을 **보완·정교화** (대체 아님 — agent는 배치 제안·추출 보조)

### 2026-07-24 — §44 Grid Occupancy 표준 (AD-044)
- **Author:** User(Gemini 등각 도면 스펙 공유) + Cursor Agent
- **Changed:** AD-044, §44 — 타일 점유·Y-sort·충돌·다방(AD-025) 정식 명세; Gemini 스펙 ↔ AD-033/§43 매핑표
- **Notes:** GUCCI 데모는 §43 하이브리드(타일 이동 + 픽셀 충돌). Phase 4부터 §44가 단일 진실 소스

### 2026-07-24 — §43 GUCCI 등각 월드(generated) + 테이블 상호작용 데모 (AD-043)
- **Author:** User(CEO 데모 품질 요구) + Cursor Agent
- **Why now (지금 하는 이유):**
  - **투자자/대표 시연 마감** — `m05-world-mobile.png` 수준 등각 부티크가 live URL에서 보여야 함
  - **겉면만 등각이 아님** — Phaser **2:1 dimetric 타일** + AI room/avatar **분리 생성·조립** (PDF 시안과 동일 파이프라인)
  - **throwaway 아님** — `packages/game-core`·소켓·장바구니·상품 API는 정식과 **동일 monorepo** (§29). 데모만 GUCCI·하드코드 앵커로 단순화
- **Implemented (코드):**
  - `packages/game-core/src/generatedWorldAssets.ts` — room/avatar 경로, **그리드 앵커**(table center 보정), 충돌(바닥 우선·가구만 차단), NPC, `getGeneratedInteractZone()`
  - `topDownGame.ts` — `visualStyle: 'generated'` (GUCCI), 등각 방향키 이동, `onNearInteractZone` → React
  - `apps/web/public/worlds/generated/` — `gucci-iso-room-empty.png`, chibi avatar (누끼: `scripts/process-avatar-png.cjs`)
  - `DisplayProductModal.tsx` — 테이블 근처 **상호작용** → 진열 상품 3종 · 장바구니 담기 · 착용 미리보기 **플레이스홀더**
  - Live: Vercel `popup-cube-web` + Railway socket (commits `c81bc72`~`9d9c1af`대)
- **Known demo gaps (다음 세션 보정):**
  - 타일 그리드 ↔ room PNG **픽셀 정합** — NPC/충돌 미세 조정 필요할 수 있음
  - `map_config` objects 충돌은 generated 모드에서 **무시** (이중 충돌 방지)
- **Formal (정식 때):**
  - **Phase 4 AD-033** — `display_fixtures` / `display_slots` DB + 점주 `OwnerDisplayPanel` 배치
  - 매장마다 **walkability 마스크** 또는 fixture footprint 자동 생성 (하드코드 `isGeneratedBlockedTile` 대체)
  - room/avatar: 점주 브랜딩 레이어(§41) — AI room **템플릿+팔레트** 또는 승인된 픽셀 에셋 카탈로그
  - `TryOnPreview` 실구현 — 지금은 「정식 버전에서 구현 예정」 텍스트만
  - GUCCI 데모 데이터·`VITE_DEMO_STORE_ID` — 정식 브랜드 전환 시 §30 초기화
- **Notes:** §32 Phase 4 체크리스트 일부 **데모 선행** 완료 표시. §38.7 갭 표 갱신.

### 2026-07-24 — §40.12 수동 꾸미기 vs AI vs 기본 리소스 FAQ
- **Author:** User 질문 + Cursor Agent
- **Changed:** §40.12 — AI 없어도 수동 편집 가능, 플랫폼 fixture 카탈로그는 AI와 **무관하게** 런칭 필수

### 2026-07-24 — §40 점주 AI 매장 에이전트 검토 (AD-040)
- **Author:** User 아이디어 + Cursor Agent
- **Changed:** AD-040, §40 신설 — 자연어/실사→fixture+슬롯, 단계별 현실성·API 쿼ota·아키텍처
- **Notes:** **가능(단계적)** — v1은 NL→구조화 레이아웃+승인; 실사→완전 자동 픽셀 매장은 v2+

### 2026-07-24 — §39.12 Cursor로 앱 개발 가능 (AD-039)
- **Author:** User 질문 + Cursor Agent
- **Changed:** AD-039 추가, §39.12·§39.10 FAQ 보강 — 웹 경험 활용, Expo Go 미리보기, 난이도·권장 순서
- **Notes:** User는 **웹을 Cursor로 많이 개발** — 앱도 **동일 IDE**로 진행

### 2026-07-24 — §39 모바일 크로스플랫폼·스토어 출시 인수인계 (AD-038)
- **Author:** User 질문 + Cursor Agent
- **Changed:** AD-038 추가, §39 신설 — Expo 단일 코드베이스, Play/App Store 등록, EAS Build, OS별 차이·비용·체크리스트
- **Notes:** APK만 따로 개발 후 iOS를 **처음부터 다시** 짜는 구조 **아님**

### 2026-07-24 — §38 시각 디자인 인수인계 (Online_Popup.docx / pptx 검토)
- **Author:** User + Cursor Agent
- **Changed:** §38 신설 — docx·pptx에서 추출한 **앱/웹 UI 톤·화면 흐름·실사/픽셀 분리·현재 코드 갭** 정리
- **Notes:** 다음 세션 에이전트는 §38 + `Online_Popup.docx` 정본으로 시각 방향 유지

### 2026-07-24 — 시안 정본 경로 확정 (Online_Popup.docx / pptx)
- **Author:** User + Cursor Agent
- **Changed:** §1·§37 관련 문서 — `Online_Popup.docx`, `온라인 팝업스토어 플랫폼.pptx`를 시각자료 정본으로 명시
- **Notes:** 에이전트가 앱 UI 톤·등각 픽셀 월드·다크모드 커머스 스타일 인지 완료

### 2026-07-24 — HANDOFF 파일명 통일 + 런칭 단계
- **Author:** User + Cursor Agent
- **Changed:**
  - `HANDOFF.md` → **`HANDOFF_POPUP_STORE.md`** (FC: `HANDOFF_FC_ZERO.md`, Platform: `HANDOFF_PLATFORM.md`와 동일 패턴)
  - §1 Workspace → `C:\Users\qotjd\Downloads\Cursor\popup_store`
  - §1 Launch status — 대표님 마케팅비 전액 지원 확정, 런칭 진입
- **Notes:** 정식 채널 분리(AD-037) 유지 — PC 웹=스토어 관리, 모바일 앱=일반 회원 쇼핑·월드

### 2026-07-14 — 로그인 선택/로그인 화면에서 GUCCI·데모비번 제거
- **Author:** User 피드백 + Cursor Agent
- **Changed:**
  - 로그인 **선택** 목업(`m01-landing-dual-roles` 등)에서 **GUCCI/GG 제거** — POP-UP CUBE만
  - `web-app-split-sian` 브랜드 상점 일러스트 제거
  - 일반 회원 로그인 목업·`LoginPage`에서 **데모 비밀번호 안내·자동 채움 제거**
  - Word 시안 재생성
- **Rule:** 진입/로그인 화면에는 데모 브랜드(GUCCI 등)·데모 비번 문구를 넣지 않음. GUCCI는 **매장 월드 시안**에만.

### 2026-07-14 — 시안 전면 검수: 일반회원=모바일만 · 등각뷰 (AD-037)
- **Author:** User 재검수 요청 + Cursor Agent
- **Findings / Fix:**
  - §4·§5에 **PC 웹 목업**(홈·월드·진열·결제·마이페이지)이 일반 회원 흐름에 남아 있음 → 전부 **모바일 `m02`~`m10`**
  - 월드·진열 목업이 **탑뷰** → **`m05`/`m06`/`m07` 등각뷰(옆방 표현)** 재생성
  - §7 모바일 갤러리 **중복** → 삭제, §4·§5에 통합
  - 문구: 「2D로 그린」→ **등각뷰(2D 픽셀)** 명시
- **Deliverables:** `platform-sian.html` · `docs/온라인-팝업스토어-플랫폼-시안.docx`

### 2026-07-14 — AD-037 시안 검수 반영 (채널·아이콘·문서 동기화)
- **Author:** User 재검수 요청 + Cursor Agent
- **Findings / Fix:**
  - Word§4에 남아 있던 **웹 데모 손님 로그인(`02-login.png`)** · 데스크톱 자동로그인 대체 → **앱 `m02-login-autologin-mobile.png`**
  - Word§7-3 **모바일 점주 관리(`m11`/`m12`/`m13`)** 삭제 — 관리는 PC 웹만 (HTML과 동일)
  - 시안 카피: 손님/점주 표기 → **일반 회원 / 스토어 관리자** 정렬
  - 브랜드 아이콘: `01-landing-web-owner` 기준 큐브로 로그인·앱 시작 목업 재생성
  - HANDOFF §35·§29 채널표 갱신
- **Deliverables:** `platform-sian.html` · `docs/온라인-팝업스토어-플랫폼-시안.docx` · `HANDOFF.md`

### 2026-07-14 — 로그인 카피 통일 · 목업 배경톤 맞춤
- **Author:** User 피드백 + Cursor Agent
- **Changed:**
  - 로그인 UI 카피 고정: **「일반 회원 로그인」 / 「스토어 관리자 로그인」** (시안·HANDOFF §22·`ko.ts`)
  - 밝은 배경색 목업 → **다크 네이비**로 재생성 (`web-app-split`, `m01`, 웹/앱 로그인 등)
  - Word 시안 재생성
- **Notes:** 내부 role 코드(`shopper`/`owner`)는 유지, 노출 문구만 통일.

### 2026-07-14 — 정식 채널: 웹=점주관리 / 앱=손님·점주 (AD-037)
- **Author:** User 요청 + Cursor Agent
- **Changed:**
  - **AD-037** — PC 웹은 점주 관리만(로그인도 점주만). 손님 쇼핑·월드는 **앱만**. 앱은 손님/점주 이중 로그인(왕관 등 역할 차 유지)
  - AD-010·011·013·036·§22·§29 정렬
  - 시안 목업: `web-app-split-sian.png`, `01-landing-web-owner.png`, `02-login-web-owner.png`, `m01-landing-dual-roles.png`
  - `platform-sian.html` + Word 시안 갱신
- **Notes:** 데모 `apps/web`에 손님 플로우가 남아 있어도 **정식 방향은 AD-037**.

### 2026-07-14 — 시안 「구현 예정」표기 제거 · 7·8 삭제
- **Author:** User 피드백 + Cursor Agent
- **Changed:**
  - 시각자료·캡션에서 **「구현 예정」전부 제거** (계획/미구현은 **HANDOFF만** — AD-034~036)
  - 시안 PDF **§7 지금 어디까지 / §8 수익** 삭제, 모바일은 **§7**로 번호만 정리
  - 목업 이미지 `02-login-autologin-sian.png`, `owner-store-region-sian.png`, `m13-...` 재생성 (뱃지 제거)
- **Rule:** 시안(PDF/HTML/목업)에는 “구현 예정”을 쓰지 않음. 예정 사항은 HANDOFF에만.

### 2026-07-14 — 자동로그인·동네필터·모바일 시안 (AD-034~036)
- **Author:** User 요청 + Cursor Agent
- **Changed:**
  - **AD-034** 자동 로그인 — `02-login-autologin-sian.png`, `m02-login-autologin-mobile.png`
  - **AD-035** 동네별 팝업·홈 필터·점주 주소 API — `03-home-neighborhood-sian.png`, `owner-store-region-sian.png`, 모바일 대응
  - **AD-036** 모바일 UI 전 흐름 — `m01`~`m13` 스마트폰 프레임 시안, PDF §9
  - `platform-sian.html` · `HANDOFF.md` §33~35 · PDF 재생성
- **Notes:** 코드 미구현, 시안·계획만 반영.

### 2026-07-14 — PDF 화면 유실 수정
- **Author:** User 리포트 + Cursor Agent
- **Cause:** 실제 화면 캡처가 **어두운 빈 여백이 큰 전체 뷰포트**라 PDF에서 거의 빈 화면처럼 보임. 큰 figure + `page-break-inside:avoid`로 잘림 위험 가능.
- **Fix:** 랜딩·로그인·마이페이지를 **UI 밀착 컷**으로 교체, `figure img`에 `max-height`·print-color-adjust, page-break avoid 완화. PDF 재생성.

### 2026-07-14 — 시안 PDF 비주얼 폴리시 (텍스트·표 꾸밈)
- **Author:** User 요청 + Cursor Agent
- **Changed:** `platform-sian.html` — 표지 다크/골드 프레임, 섹션 헤더 그라데이션, 강조 박스·뱃지·표 하이라이트를 시각자료(네이비·로즈·골드)에 맞춤. 본문 폰트는 **굴림 유지**. 멘트는 `.copy` 클래스로 두어 이후 문구만 교체하기 쉽게.
- **Notes:** PDF 재생성 (`온라인-팝업스토어-플랫폼-시안.pdf`).

### 2026-07-14 — 시안 PDF 문체·양식 정리 (v4)
- **Author:** User 요청 + Cursor Agent
- **Changed:**
  - `docs/platform-sian.html` — 폰트 **굴림(Gulim)** 계열, 미팅 연결 멘트 삭제
  - AD/ISS/기술 약어·「AI 제안서」톤 줄이고, 대표님이 「온라인 팝업스토어를 이렇게 하려는구나」를 읽게 문장·표 재작성
  - `docs/온라인-팝업스토어-플랫폼-시안.pdf` 재생성
- **Notes:** 시각 목업(이미지)은 v3 유지, 설명 문장·레이아웃만 손봄.

### 2026-07-14 — 시안 v3: 2D 통일 · 착용해보기 위치 · 허브 직관성
- **Author:** User 피드백 + Cursor Agent
- **Changed:**
  - 점주 진열 목업 `owner-display-slots-mockup.png` — **3D 제거, 2D 픽셀만** (시안·로드맵에 3D 없음 명시)
  - HUD에서 **착용해보기 제거** — 진열 팝업에서 상품 선택 후 `장바구니 담기` → `바로 구매` → **그 아래** `착용해보기` (`display-interact-popup`, `tryon-preview`, `StorePage`/`ko.ts`)
  - 소비자 허브·입장: `03-home-hub-sian.png`, `04-enter-modal-sian.png` — 여러 OPEN 팝업 예시 + ①선택→②확인→③입장 흐름 명시
  - `platform-sian.html` + PDF 재생성, AD-033·§32 문안 동기화
- **Notes:** 투자자(대표님)가 「플랫폼에 열린 여러 팝업 → 클릭 입장 → 2D 매장에서 진열 상품 구매」를 한눈에 이해하도록 시각 우선 수정.

### 2026-07-14 — 진열 조형물 UX 시안 + HUD 버튼명 정리 (AD-033)
- **Author:** User 요청 + Cursor Agent
- **Changed:**
  - **AD-033** — 진열 조형물(테이블/옷걸이/선반) + 슬롯 상품 배치·순서 + 소비자 상호작용 팝업(구매/담기/착용해보기+아바타 프리뷰). **탐험하기 제거**, **장바구니 ≠ 전체 상품** 버튼명 분리
  - `docs/pdf-assets/` 목업 갱신·추가: `world-mockup-complete.png`, `display-interact-popup.png`, `tryon-preview-mockup.png`, `owner-display-slots-mockup.png`
  - `docs/platform-sian.html` (시안 INDEX) + `docs/온라인-팝업스토어-플랫폼-시안.pdf` 재생성
  - `apps/web` HUD: 탐색 버튼 제거, `장바구니` 하단 노출, `지금 쇼핑하기` → `전체 상품` (`i18n/ko.ts`, `StorePage.tsx`)
  - `§7` Next Steps 0번, `§10`/`§32` 계획, `§22` HUD 표, Phase 4 로드맵에 AD-033 반영
- **Notes:** 코드로 테이블 앞 상호작용·슬롯 DB는 **아직 미구현**(시안·계획 단계). 구현은 Phase 4 본작업.

### 2026-07-12 — 투자자 미팅 일정 긴급 앞당김 + 「코드 기반 시각 프로토타입」 (AD-032, §31)
- **Author:** User request
- **Changed:**
  - `§1` Investor Demo Target — **2026-07-13(일) 저녁** 긴급 미팅으로 변경
  - `AD-032` 추가 — PPT가 아닌 **React 화면 기반 시각 프로토타입**, 정식 개발에 이어짐
  - `§7` — 긴급 미팅 블록·시연 우선순위·Cursor 작업 우선순위
  - `§18` — 일정 변경 경고 + 미팅 후 2~3주 목표 유지
  - `§31` 신설 — 용어 정리·시연 스크립트·동작 필수 여부·정식 연계 표
- **Notes:** 내일 미팅은 **전 기능 live 필수 아님**. `docs/INVESTOR_PITCH.md`와 함께 사용.

### 2026-07-13 — 데모 데이터 초기화 절차 보강 (§30, AD-031)
- **Author:** User request
- **Changed:** `§30` 보강 — 사용자 트리거 문구("데모 관련 흔적 다 지워달라" 등), 지워지는 것/유지되는 것 표, 현재 데모 데이터 목록(GUCCI·데모 계정·테스트 매장), Redis·Storage·localStorage 정리, 실행 후 검증 SQL. `AD-031` 추가. §29 브랜드 행에 §30 참조.
- **Notes:** **지금 삭제 실행한 게 아님** — 정식 개발 들어가기 직전에 사용자가 명시적으로 요청하면 §30 절차 수행.

### 2026-07-13 — 데모 데이터 초기화 절차 문서화 (§30, 실행 아님)
- **Author:** User request
- **Changed:** `§30` 신설 — 정식 개발 전환 전 "데모 때 테스트한 것들 다 지워달라" 요청이 오면 따를 절차. 지울 테이블 순서(FK 의존관계 고려)+바로 쓸 SQL, `auth.users`는 Admin API/대시보드 권장, Storage 버킷·브라우저 `localStorage` 장바구니처럼 DB 밖에서 같이 지워야 하는 것까지 정리.
- **Notes:** **지금 삭제를 실행한 게 아님** — 나중에 사용자가 명시적으로 요청할 때 이 절차를 따름. 실행 전에는 반드시 최종 확인 필요(비가역적).

### 2026-07-13 — 주문 저장 + 소비자 배송지 관리 구현 (AD-030)
- **Author:** User request + Cursor Agent
- **Changed:**
  - Supabase 마이그레이션 `add_user_addresses_table` — `user_addresses`(별명·수령인·연락처·우편번호·주소·기본배송지) + RLS(본인만 SELECT/INSERT/UPDATE/DELETE) + `authenticated` grant
  - `add_orders_tables` — `orders`(store_id/user_id/shipping_address_id/total_amount/discount_percent/reward_type/status) + `order_items`(order_id/product_id/quantity/unit_price) + RLS(구매자 본인 또는 매장 owner만 SELECT, 본인만 INSERT) + `authenticated` grant
  - `create_place_order_function` — `place_order(p_store_id, p_address_id, p_items, p_reward_type, p_discount_percent)` SECURITY INVOKER 함수: 가격은 `products.price`에서 서버가 직접 재계산(클라이언트 가격 불신), 할인율은 실제 활성 프로모션과 일치하는지 검증, 주문+라인 원자적 저장. `authenticated`에게만 EXECUTE(`PUBLIC` 기본 권한도 명시적으로 회수 — 안 그러면 anon도 실행 가능한 채로 남는 것을 뒤늦게 발견해 `fix_orders_function_grants`로 수정)
  - `create_get_store_orders_function` — `get_store_orders(p_store_id)` SECURITY DEFINER 함수(`roll_gacha()`와 동일 패턴): 호출자가 실제 그 매장 owner인지 확인 후에만 주문+구매자 닉네임+배송지 상세를 조인해서 반환
  - `fix_place_order_search_path` — `place_order`에 `search_path` 고정 추가(Supabase security advisor 권고, function_search_path_mutable 경고 해소)
  - `packages/shared/src/types.ts` — `UserAddress`, `NewAddressInput`, `RewardType`, `OrderStatus`, `Order`, `OrderItem`, `OwnerOrderItemView`, `OwnerOrderView` 타입 추가
  - `apps/web/src/lib/addresses.ts` 신규 — `listMyAddresses`, `createAddress`(첫 배송지 자동 기본 지정), `updateAddress`, `deleteAddress`, `setDefaultAddress`
  - `apps/web/src/lib/orders.ts` 신규 — `placeOrder`(RPC 래퍼, 장바구니 중 현재 매장 상품만 필터링해서 전송), `listStoreOrders`(RPC 결과를 주문 단위로 그룹핑)
  - `apps/web/src/components/AddressFormFields.tsx` 신규 — 배송지 입력 폼(마이페이지·결제 공통 재사용)
  - `apps/web/src/pages/MyPage.tsx` 신규 — `/mypage` 배송지 관리 탭(목록/추가/수정/삭제/기본 설정)
  - `apps/web/src/components/CartDrawer.tsx` — "결제하기" 클릭 후 흐름을 **배송지 선택 → 할인/가챠 선택 → 결과**로 확장. 배송지 선택 단계는 저장된 주소가 있으면 라디오 목록(기본 배송지 자동 선택), **저장 유무와 관계없이 항상 "+ 새 배송지 추가" 버튼** 노출. 혜택 확정 시 `place_order()` 호출로 실제 주문 저장
  - `apps/web/src/components/OwnerOrdersPanel.tsx` 신규 — 점주 주문 관리 화면(구매자 닉네임·상품·수량·금액·혜택·배송지·시각)
  - `apps/web/src/pages/StorePage.tsx` — 헤더에 "마이페이지" 버튼 추가, 점주 툴바 "📊 주문 관리"를 `OwnerOrdersPanel`에 연동, `CartDrawer`에 `userId` prop 전달
  - `apps/web/src/pages/HomePage.tsx` — 헤더에 "마이페이지" 버튼 추가
  - `apps/web/src/App.tsx` — `/mypage` 라우트 추가
  - `apps/web/src/i18n/ko.ts` — `mypage.*`, `cart.address*`/`cart.orderSaveError`, `ownerOrders.*`, `common.myPage` 문구 추가
- **Notes:** `npx tsc --noEmit`(shared/web) 통과, lint 이상 없음(turbo lint — 프로젝트에 lint 태스크 자체가 아직 없어 실행 대상 0개, 이전 세션과 동일). Supabase security advisor 확인 — 새로 만든 함수 중 `get_store_orders`도 `roll_gacha`와 같은 이유로 "authenticated가 SECURITY DEFINER 실행 가능" WARN이 뜨는데 의도된 설계(ISS-013 패턴). **결제는 여전히 mock(가짜 PG)** — "결제하기"를 누르면 항상 성공 처리되고 `place_order()`가 `status: 'paid'`로 즉시 저장. 실제 PG 연동은 이 저장 로직을 바꾸는 게 아니라 "결제 승인" 단계 앞에 끼워 넣으면 되므로 별도 작업으로 분리(§7).
- **알려진 한계 (§10에도 기록):** 가챠를 뽑은 뒤 `place_order()` 저장이 실패하면 가챠 결과는 이미 확정됐는데 주문만 없는 상태가 될 수 있음 — 데모 범위에서는 재시도로 충분, 정식 출시 때 트랜잭션 통합 검토.

### 2026-07-13 — 소비자 배송지 관리 요구사항 기록 (AD-030)
- **Author:** User request
- **Changed:**
  - `## 4. Architecture Decisions` — **AD-030** 추가: 마이페이지 주소 관리(여러 개+별명), 결제 시 저장 주소 선택, **저장 주소 유무와 관계없이 항상 "신규 추가" 버튼**
  - `§10` — `(계획) 주문·배송` 섹션 신설: `orders`/`order_items`/`user_addresses` 예정 스키마, UI 흐름, 구현 순서
  - `§7` — 다음 작업 순서 갱신: `orders`+점주 주문 관리를 1순위, `user_addresses`+마이페이지+결제 배송지 선택을 1-a로 명시
  - `§16` — `user_addresses` 테이블 추가, `orders` 설명에 배송지 연동 반영
- **Notes:** 위 항목에서 실제로 구현 완료됨(같은 날 이어서 진행) — 최신 상태는 바로 위 Changelog 항목 참고.

### 2026-07-13 — 투자자 포지셔닝 원칙 기록 (AD-029)
- **Author:** User request
- **Changed:**
  - `## 4. Architecture Decisions` — **AD-029** 추가: 50대 투자자 대상, 게임성보다 "실제 쇼핑몰" 포지셔닝 우선
  - `§0` 판단 기준 5번 — "진짜 쇼핑몰" 포지셔닝 항목 추가
  - `§1 Core Value Propositions` — AD-029 경고 문구 추가
- **Notes:** 기능 우선순위·데모 시연·UI 카피에서 커머스 신뢰감을 먼저 보여줄 것.

### 2026-07-13 — 구매 완료 시 "할인 vs 가챠" 선택 + 가챠 뽑기 (AD-028)
- **Author:** User request + Cursor Agent
- **Changed:**
  - Supabase 마이그레이션 `add_promotion_and_gacha_tables` — `store_promotions`(매장당 할인%), `gacha_pools`(매장 공용 풀, `linked_product_id`는 상품별 풀 확장용으로 항상 NULL), `gacha_pool_entries`(실제 상품 또는 가챠 전용 아이템 중 하나 필수 CHECK, weight), `gacha_rolls`(뽑기 기록) + RLS + grant
  - `fix_gacha_rolls_pool_entry_fk` — `gacha_rolls.pool_entry_id`가 NOT NULL인데 `ON DELETE SET NULL`로 잘못 건 걸 발견해 즉시 수정(NO ACTION으로 변경, 뽑힌 이력 있는 항목은 삭제 안 되게)
  - `create_roll_gacha_function` — `roll_gacha(p_store_id)` SECURITY DEFINER 함수: 로그인 필요, 가중치 랜덤 추첨, `gacha_rolls`에 기록, 당첨 결과 반환. `authenticated`에게만 EXECUTE.
  - `seed_gucci_promotion_and_gacha` — GUCCI에 할인 10% + 가챠 아이템 4종 시드 (모두 가챠 전용, 아직 등록된 실제 상품 없어서)
  - `packages/shared/src/types.ts` — `StorePromotion`, `GachaRollResult` 타입 추가
  - `apps/web/src/lib/gacha.ts` 신규 — `getActivePromotion`, `rollGacha`
  - `apps/web/src/components/CartDrawer.tsx` — mock 결제 완료 후 즉시 "주문 완료"였던 흐름을 "혜택을 선택하세요"(할인/가챠) 단계로 교체, 할인 결과·가챠 결과(실제 상품/가챠 전용 배지 구분) 화면 추가
  - `apps/web/src/pages/StorePage.tsx` — `CartDrawer`에 `storeId` prop 전달
  - `apps/web/src/i18n/ko.ts` — `cart.reward*`/`cart.discount*`/`cart.gacha*` 문구 추가
- **Notes:** `npx tsc --noEmit`(shared/web) 통과, 린트 이상 없음. Supabase security advisor 확인 — `roll_gacha`에 대해 예상된 WARN만 있음(의도대로 `authenticated`만 실행 가능, `anon`은 불가). **시드 데이터 입력 중 한글 텍스트가 여러 번 깨지는 문제 발생** — SQL 문자열에 압축된 한글 단어를 한 번에 여러 개 넣을 때 일부 글자가 다른 글자로 잘못 생성됨(예: "디지털"→"대지털", "마이룸"→"마이릲"); 항목을 하나씩 나눠서 `UPDATE ... RETURNING`으로 즉시 확인하며 재입력해 해결. **후속 세션 주의사항:** 한글이 많이 들어가는 SQL/데이터 입력 시, 한 번에 여러 단어를 넣지 말고 하나씩 입력 후 즉시 SELECT로 재확인할 것 (ISS-023, §6).

### 2026-07-13 — 상품 이미지 표시를 "적응형(contain)"으로 변경
- **Author:** User 지적 + Cursor Agent
- **Changed:** `apps/web/src/components/ShopPanel.tsx`, `CartDrawer.tsx`, `OwnerProductPanel.tsx` — 상품 사진 `objectFit: 'cover'` → `'contain'`(비율 유지, 안 잘림, 여백 생길 수 있음)
- **Notes:** 점주가 특정 픽셀 크기로 사진을 맞춰 올려야 하는 부담 대신, 어떤 비율이든 사진 전체가 보이게 하는 쪽을 선택. 매장 대표 이미지(홈 카드·입장모달·매장만들기 미리보기)는 이번엔 범위 밖 — 아직 `cover` 유지, 필요하면 후속으로 통일 검토(§7).

### 2026-07-13 — 상품 등록/목록 + 장바구니 MVP
- **Author:** User request + Cursor Agent
- **Changed:**
  - Supabase 마이그레이션 `add_products_table` — `products` 테이블(store_id FK, name, description, price(원 단위 정수), image_url, is_active soft-delete, created_at/updated_at) + RLS(`products_public_read`: published+active 매장의 활성 상품만 공개, `products_owner_read/insert/update`: 본인 매장) + `authenticated` INSERT/UPDATE grant, `anon`/`authenticated` SELECT grant (ISS-012 패턴 재확인 — grant 누락 방지 위해 미리 추가)
  - `packages/shared/src/types.ts` — `Product`, `CartItem` 타입 추가
  - `apps/web/src/lib/products.ts` 신규 — `listActiveProducts`(소비자), `listMyProducts`(점주, 활성여부 무관), `createProduct`(이미지 업로드는 `store-assets` 버킷 재사용 `{uid}/products/...` 경로), `setProductActive`(숨기기/다시 보이기), `updateProduct`
  - `apps/web/src/context/CartContext.tsx` 신규 — 장바구니를 `localStorage`에 담아두는 client-only 상태(아직 DB 저장 안 함), `addToCart`/`incrementQuantity`/`decrementQuantity`/`removeItem`/`clearCart`
  - `apps/web/src/components/OwnerProductPanel.tsx` 신규 — 점주 상품 등록 폼(이름·가격·설명·이미지) + 본인 매장 상품 목록(수정/숨기기)
  - `apps/web/src/components/ShopPanel.tsx` 신규 — 소비자용 상품 그리드, 수량 스테퍼(+/−, 기본값 1) + 장바구니 담기
  - `apps/web/src/components/CartDrawer.tsx` 신규 — 장바구니 목록 + 수량 +/- + 합계 + "결제하기(mock)" → 성공 안내 후 장바구니 비움 (실제 PG·`orders` 테이블 없음)
  - `apps/web/src/pages/StorePage.tsx` — 헤더에 장바구니 아이콘/수량 배지 추가, "지금 쇼핑하기" 버튼이 `ShopPanel` 오픈, 점주 툴바 "📷 상품 업로드" 버튼이 `OwnerProductPanel` 오픈
  - `apps/web/src/App.tsx` — `CartProvider`로 앱 전체 감싸기
  - `apps/web/src/i18n/ko.ts` — `shop`, `cart`, `ownerProducts` 문구 추가
- **Notes:** `npx tsc --noEmit`(shared/web) 통과, 린트 이상 없음. Supabase security advisor 확인 — 새 경고 없음(기존 ISS-013 등만 유지). 결제는 완전 mock — 새로고침해도 장바구니는 남지만(브라우저 `localStorage`), 서버·DB엔 주문 기록이 남지 않음(§10 명시).

### 2026-07-13 — §29 추가: Demo→정식→앱 전환 전략 (AD-027, User 질문)
- **Author:** User 질문(상품 MVP 작업 전 확인) + Cursor Agent
- **Added:** `## 29. Demo → 정식 출시 → 앱 전환 전략` — 데모 코드 = throwaway 아님(같은 monorepo·DB·서버 이어감), 데모만 단순화한 항목 표(GUCCI/mock/draft/top-down 등), 웹→앱 재사용 매트릭스(shared·server·Supabase 100% / React UI는 RN 재작성 / Phaser는 WebView 또는 별도), 앱 연동용 코딩 규칙 5줄, 타임라인 4단계
- **Added:** `AD-027` 아키텍처 결정

### 2026-07-13 — §28 추가: Vercel/Railway 역할·무료 플랜 가이드 (User 질문 반영)
- **Author:** User 질문 + Cursor Agent
- **Added:** `## 28. Deployment — Vercel / Railway 역할` — 지금(로컬) vs 배포 후 비교, 4개 서비스 역할 분담(Vercel/Railway/Supabase/Upstash), 배포 시 환경변수 연결 방법, **무료 플랜 여부**(Vercel Hobby=$0, Railway Trial $5/30일 + Free $1/월 + Hobby $5/월), 투자자 데모 비용 감·배포 타이밍 권장
- **Changed:** `## 23 Glossary` — Vercel/Railway 항목에 무료 플랜 한 줄 요약 + §28 참조 링크
- **보강 (같은 날):** "4개 서비스 = 4개 비용?" 질문에 대한 단계별 비용 표 추가 — 데모($0~5) / 정식 출시 초기($5~30 전후, Railway가 가장 먼저 유료) / 확장기(전부 유료 가능하나 매출 발생 단계). 인프라 외 추가 비용(PG 수수료·도메인·앱스토어·AI API)도 별도 표로 정리

### 2026-07-13 — 채팅 입력창 스페이스바(띄어쓰기) 안 되던 문제 수정(ISS-022)
- **Author:** User 리포트 + Cursor Agent
- **Changed (`packages/game-core/src/topDownGame.ts`):**
  - **원인**: Phaser `createCursorKeys()`가 SPACE(32)까지 전역 키 가로채기(`addCapture` → `preventDefault`)에 포함시켜, 채팅 `<input>`에 포커스가 있어도 띄어쓰기가 입력되지 않음
  - **수정**: `createCursorKeys()` 대신 방향키(↑↓←→)만 `addKey(..., capture=true)`로 등록 — SPACE는 게임 이동에 쓰지 않으므로 가로채기 목록에서 제외
  - 채팅 열림(`movementEnabled=false`) 시 `removeCapture(방향키)`로 가로채기 해제 → 채팅창에서 방향키 커서 이동도 정상. 채팅 닫으면 `addCapture` 복원
- **Notes:** `npx tsc --noEmit`(game-core) 통과.

### 2026-07-13 — 채팅 Enter/Esc UX 다듬기 — 빈 내용 Enter도 닫기, Esc 시 입력 내용 버림
- **Author:** User 요청 + Cursor Agent
- **Changed (`apps/web/src/pages/StorePage.tsx`):**
  - `handleSendChatAndClose()` — 입력창이 비어있는 채로 Enter(또는 전송 버튼)를 눌러도 이제 Esc처럼 그냥 닫힘(이전엔 아무 반응 없었음)
  - 전역 `Escape` 처리 — 채팅창을 닫을 때 `chatInput`도 같이 비움. 입력 중이던 내용을 Esc로 취소하고 다시 채팅을 열면, 예전엔 취소했던 내용이 그대로 남아있었는데 이제 항상 빈 칸으로 시작함
- **Notes:** `npx tsc --noEmit`(web) 통과, 린트 이상 없음.

### 2026-07-13 — "Cannot read properties of undefined (reading 'keyboard')" 에러 수정(ISS-021)
- **Author:** User 리포트(스크린샷) + Cursor Agent
- **Changed (`packages/game-core/src/topDownGame.ts`):** `TopDownScene.setMovementEnabled()`가 `this.input.keyboard`에 바로 접근하다가, Scene이 아직 부팅 중이라 `this.input`이 없을 때 크래시나던 문제 수정 — `this.input?.keyboard`로 안전하게 바꾸고, 실제 키보드 상태 반영은 `applyMovementEnabled()`로 분리해 `create()` 끝에서도 한 번 더 적용(게임 로딩 중 채팅을 먼저 열어놓은 경우 대비)
- **Notes:** `npx tsc --noEmit`(game-core) 통과. 이 크래시가 나는 순간에도 실제 "채팅 중 이동 차단" 기능 자체는 `update()`의 플래그 체크로 정상 동작 중이었음 — 화면에 에러 문구만 잘못 표시된 것.

### 2026-07-13 — 이동은 방향키만 + 채팅 입력 중엔 이동 차단
- **Author:** User 요청 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed (`packages/game-core/src/topDownGame.ts`):**
  - WASD 이동 제거 — **방향키(↑↓←→)만** 이동에 사용 (WASD는 채팅 입력 시 글자로 눌릴 수 있어 애초에 이동 키로 부적합했음)
  - `TopDownScene.setMovementEnabled(enabled)` 신규 — 비활성화 시 `update()`에서 이동 처리를 건너뛰고, Phaser의 Scene 키보드 입력(`this.input.keyboard.enabled`)도 꺼서 눌려있던 방향키 상태를 `reset()`으로 정리(채팅 닫자마자 다시 움직이기 시작하는 것 방지)
  - `TopDownGameController.setMovementEnabled(enabled)` — 컨트롤러에 노출
- **Changed (`apps/web/src/pages/StorePage.tsx`):** `chatOpen`이 바뀔 때마다 `gameRef.current?.setMovementEnabled(!chatOpen)` 호출 — 채팅창이 열려 있는 동안은 방향키를 눌러도 캐릭터가 움직이지 않음. 게임이 아직 로딩 중일 때 채팅을 먼저 열어놓은 경우도 `chatOpenRef`로 추적해 로딩 완료 시점에 올바른 상태로 맞춰줌
- **Notes:** `npx tsc --noEmit`(game-core/web) 통과, 린트 이상 없음.

### 2026-07-13 — 카메라 팔로우 + 전체 크기 확대 (캐릭터/이름표가 작다는 피드백 반영) + 방/엘리베이터 확장 계획 기록(AD-025, 미구현)
- **Author:** User 피드백(스크린샷) + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed (`packages/game-core/src/topDownGame.ts`):**
  - `DEFAULT_TILE_SIZE` 40 → 56px, 캐릭터 몸통 24x28 → 32x38, 이름표/말풍선 폰트 12px → 14px, 오브젝트 라벨 10px → 12px
  - Phaser `Game` 캔버스 크기를 "지도 전체 크기"가 아니라 **고정 뷰포트(800x520)**로 분리 — 지도가 커도 화면엔 이 창만큼만 보임
  - `TopDownScene.setupCamera()` 신규 — `camera.setBounds()`로 지도 전체 범위 지정 + `camera.startFollow(self.body, true, 0.15, 0.15)`로 내 캐릭터를 부드럽게 따라다니게 함. 걸어 다니며 시야 밖 공간도 확인 가능
- **Changed (`apps/web/src/pages/StorePage.tsx`):** `worldCanvas` 컨테이너 높이를 `clamp(320px,56vh,560px)` → `clamp(380px,62vh,640px)`로 확대 — 카메라 창이 커 보일 여유 확보
- **계획만 기록 (미구현, AD-025):** User가 참고 이미지(등각뷰, 옆방이 살짝 보이는 구조)를 보여주며 매장에 "여러 방(room)" + "문/엘리베이터로 다른 방·층 이동" 기능을 넣고 싶다고 요청. §10에 `map_config` v2(여러 방 + `transitions`) 초안 구조를 적어뒀고, 실제 구현은 Phase 4 에디터 작업 시작할 때 진행하기로 함(지금은 문서화만)
- **Notes:** `npx tsc --noEmit`(game-core) 통과, 린트 이상 없음. `main`이 `src/index.ts`를 직접 가리켜 web dev 서버가 별도 빌드 없이 바로 HMR로 반영됨 — 페이지 새로고침 후 확인 필요(Phaser 게임은 마운트 시 1회 생성되는 구조라 핫스왑 대상 아님).

### 2026-07-13 — 기존 데모 계정 2개에 닉네임 수동 지정
- **Author:** User 확인 + Cursor Agent
- **Changed:** 닉네임 시스템 도입 전에 만들어졌던 `demo@shopper.com`/`demo@owner.com`은 `profiles.nickname`이 NULL이라 화면에 둘 다 "demo"(이메일 앞부분)로 겹쳐 보이는 문제 발견. SQL로 직접 지정: `demo@shopper.com` → `데모소비자`, `demo@owner.com` → `데모점주`
- **Notes:** 닉네임 "변경" UI는 아직 없음(§7 다음 할 일에 후보로 추가 가능) — 지금은 회원가입 때만 입력 가능. 새로 회원가입하는 계정은 이 문제 없음(AD-023).

### 2026-07-13 — 캐릭터 이름표 개편(발밑 닉네임+왕관+말풍선) + 점주 잠수 면제 + 회원가입/닉네임 중복확인 시스템
- **Author:** User 요청(여러 항목 일괄) + Cursor Agent (Claude Sonnet 5 Thinking)
- **분류:** 요청 항목을 "당장 가능"/"나중에 같이"로 나눔 (§7 참고) — **장바구니**는 상품 등록 기능이 아직 없어 Phase 4 에디터 작업과 함께 하기로 보류, 나머지는 이번에 전부 구현.
- **DB 마이그레이션(`add_nickname_system`):**
  - `profiles.nickname` VARCHAR(20) 추가, 대소문자 무관 유니크 인덱스(`profiles_nickname_unique_idx`, NULL 허용), 길이 제약(2~16자)
  - `handle_new_user()` 트리거 갱신 — `auth.users.raw_user_meta_data.nickname`을 `profiles.nickname`으로 그대로 복사 (이메일 인증 필요 여부와 무관하게 가입 시점에 반영)
  - `is_nickname_available(p_nickname text)` RPC 신규 — `SECURITY DEFINER`로 RLS 우회, 존재 여부만 반환(개인정보 노출 없음), `anon`/`authenticated`에 공개(의도적)
- **서버(점주 왕관 판별 — `isOwner`):**
  - `server/src/repositories/storeRepository.js` — `findStoreById` select에 `owner_id` 추가
  - `server/src/services/channelService.js` — Redis Hash에 `isOwner`(`'1'`/`'0'`) 저장/조회 추가
  - `server/src/socket/index.js` — `store:join`에서 `isOwner = store.owner_id === userId` 계산 → `ack.self`, `player:joined`, 세션(`sessions`)에 포함. `player:move`에서도 `isOwner`를 세션에서 이어서 넘겨야 함(안 넘기면 이동할 때마다 Redis에 `isOwner: '0'`으로 덮어써지는 버그 발견 → 즉시 수정)
- **공통 타입(`packages/shared/src/types.ts`):** `Profile.nickname`, `PlayerState.isOwner`, `StoreJoinResponse.self.isOwner` 추가
- **`packages/game-core/src/topDownGame.ts` (Phaser 렌더링):**
  - 닉네임 이름표를 머리 위 → **발밑**으로 이동, 배경을 검정 반투명(`rgba(0,0,0,0.6)`) + 흰 글자로 본인/상대 통일
  - 점주(`isOwner`)는 이름표 텍스트 앞에 `👑` 접두 (별도 아이콘 오브젝트 없이 텍스트에 포함 — 왼쪽에 왕관, 바로 우측에 닉네임)
  - 머리 위 자리에 **채팅 말풍선** 신규 추가 — `chat:message` 수신 시 `showSpeechBubble()`로 표시, 5초 후 자동 숨김, 5초 전에 새 메시지가 오면 타이머 리셋하며 내용 교체(최신 메시지 하나만 표시, 메이플스토리 방식). 60자 초과 시 말줄임
  - `addOrUpdateRemotePlayer`/`getPlayerIsOwner` 등에 `isOwner` 파라미터/조회 추가; `player:moved`는 `isOwner`를 재전송하지 않으므로 기존에 알고 있던 값을 유지
- **`apps/web/src/pages/StorePage.tsx`:** 잠수 자동퇴장 타이머를 점주가 **본인 매장**일 때는 시작하지 않도록 예외 처리; 캐릭터 이름으로 `nickname ?? email 앞부분` 우선 사용
- **`apps/web/src/context/AuthContext.tsx`:** `profiles.nickname` 로드, `signUp(email, password, nickname)` 함수 추가 — `options.data.nickname`으로 실어 보내 트리거가 즉시 반영하게 함, 세션 유무로 이메일 인증 필요 여부(`needsEmailConfirmation`) 판별
- **`apps/web/src/lib/nickname.ts` 신규:** `isNicknameLengthValid()`, `checkNicknameAvailable()` (RPC 래퍼)
- **`apps/web/src/pages/LoginPage.tsx`:** 로그인/회원가입 모드 토글 추가. 회원가입 모드는 닉네임 입력 + "중복확인" 버튼 필수 — **중복확인을 안 눌렀거나(idle 상태) 눌렀는데 중복(taken)이면 가입 버튼을 눌러도 막고 안내 문구 표시**; 닉네임을 수정하면 이전 확인 결과 자동 무효화(다시 확인해야 함)
- **i18n(`apps/web/src/i18n/ko.ts`):** `signup.*` 문구 전체 신규, `login.toggleToSignup/toggleToLogin` 추가, `authErrors`에 `User already registered` 등 추가
- **신규 이슈:** `ISS-020` (Low) — 동시에 같은 닉네임으로 가입 시도하는 극히 짧은 race는 DB 유니크 제약 위반으로 `signUp()` 실패 가능(ISS-003과 같은 종류, 데모 규모에선 영향 미미)
- **Notes:** `npx tsc --noEmit`(web/game-core/shared) 통과, `node --check`(서버 3개 파일) 통과, 린트 이상 없음. Supabase security advisor 확인 — `is_nickname_available`가 `anon`에 노출되는 WARN은 의도된 설계(중복확인은 가입 전에도 필요).

### 2026-07-13 — 잠수(자리비움) 자동 퇴장 기능 추가 + 채널 인원 0명 버그 근본 수정(ISS-019)
- **Author:** User 리포트/요청 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed (ISS-019 근본 수정):**
  - `packages/game-core/src/topDownGame.ts` — `onSocketCreated` 콜백 추가(소켓 생성 즉시 참조 확보), `joinStore` 응답이 늦게 와도 `socket.disconnected`면 조용히 중단
  - `apps/web/src/pages/StorePage.tsx` — effect cleanup에서 join 완료 여부와 무관하게 즉시 `socket.disconnect()` (React StrictMode 유령 접속이 서버까지 도달하지 못하게 차단)
  - `server/src/services/channelService.js` — 채널 인원 저장을 Redis **List → Set**(`SADD`/`SREM`/`SCARD`/`SISMEMBER`)로 전환. 같은 유저 중복 접속에도 다른 사용자 카운트가 같이 삭제되지 않음
  - 레거시 List 타입 Redis 키(`store:*:users`) 1회 삭제(타입 충돌 `WRONGTYPE` 해소)
  - 재시작 시 이전 dev 서버 프로세스 트리가 완전히 종료되지 않고 누적되던 문제 발견 → 좀비 프로세스 전체 정리, 단일 세션으로 재기동
- **Added (신규 기능 — 잠수 자동 퇴장):**
  - `apps/web/src/pages/StorePage.tsx` — 10분간 이동/채팅 활동이 없으면 자동으로 `/home`으로 이동(`IDLE_TIMEOUT_MS`). 퇴장 30초 전부터 경고 배너 표시(`IDLE_WARNING_MS`), 이동·채팅·쇼핑 버튼 클릭 시 활동 시간 갱신
  - `packages/game-core/src/topDownGame.ts` — `onPlayerMove` 콜백 추가(실제 이동 emit마다 호출 → 잠수 타이머 리셋용)
  - `apps/web/src/pages/HomePage.tsx` — 잠수로 퇴장된 경우 홈 진입 시 안내 배너 1회 표시(`location.state.idleKicked`)
  - `apps/web/src/i18n/index.ts` — `t()`에 `{key}` 치환 파라미터 지원 추가(문구 내 동적 숫자 표시용)
  - `apps/web/src/i18n/ko.ts` — `store.world.idleWarning`, `home.idleKickedNotice` 문구 추가
- **Notes:** `npx tsc --noEmit`(web/game-core) 통과, 린트 이상 없음. 실제 서버 로그로 2개 유저 동시 재접속(HMR 리로드) 상황에서 각자 카운트가 서로 침범 없이 정확히 수렴하는 것 확인.

### 2026-07-13 — 멀티 싱크 핫픽스: 상대 이름표/채널 인원 실시간 갱신(ISS-018)
- **Author:** User 리포트 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - `server/src/socket/index.js` — `player:moved`에 `username` 포함, join/leave 시 `channel:visitor-count` 이벤트 브로드캐스트 추가
  - `packages/shared/src/constants.ts` — `SOCKET_EVENTS.CHANNEL_VISITOR_COUNT` 상수 추가
  - `packages/game-core/src/topDownGame.ts` — `player:moved`에서 username 누락 시 기존 이름 유지 fallback, `channel:visitor-count` 구독으로 채널 인원 뱃지 실시간 반영
- **Notes:** 증상: A/B 동시 접속 시 상대 이름표 텍스트가 빈 배지로 변하고, 먼저 입장한 탭의 채널 인원이 1/40에 고정. 원인과 패치 완료. `npx tsc --noEmit`(game-core/web) 통과.

### 2026-07-13 — 채팅 UX 개선: 고정 높이 + 타임스탬프 + Enter 열기/전송/닫기 (ISS-017)
- **Author:** User 피드백 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - `apps/web/src/pages/StorePage.tsx` — 채팅 메시지 영역 높이를 `120px` 고정하고 오버플로우 시 내부 스크롤만 사용
  - `StorePage.tsx` — 메시지마다 `[HH:MM:SS]` 타임스탬프 표시
  - `StorePage.tsx` — 전역 `Enter`로 채팅창 열기, 입력 중 `Enter` 전송 후 자동 닫기, `Esc`로 닫기
  - `apps/web/src/i18n/ko.ts` — `store.chat.openHint` 문구 추가
- **Notes:** 채팅 입력 로직은 유지하면서 키보드 UX를 데모 시연 친화적으로 정리. `npx tsc --noEmit`(web) 통과.

### 2026-07-13 — 핫픽스: 월드 입장 시 페이지 높이 무한 증가(ISS-016) 수정
- **Author:** User 리포트 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - `packages/game-core/src/topDownGame.ts` — Phaser `Scale.RESIZE` → `Scale.FIT` 전환, 수동 `game.scale.resize()`/window resize 핸들러 제거
  - `apps/web/src/pages/StorePage.tsx` — 월드 캔버스 컨테이너를 `flex:1` 대신 `height: clamp(320px, 56vh, 560px)`로 고정
- **Notes:** 입장 후 페이지가 계속 길어지는 레이아웃 루프 해소. `npx tsc --noEmit`(game-core/web) 재검증 통과.

### 2026-07-13 — Phase 2 착수: Phaser 탑뷰 월드 + 실시간 이동/채팅 연결 (AD-022)
- **Author:** User 승인 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - `packages/game-core/src/topDownGame.ts` 신규 — `mountTopDownGame()` 구현: Phaser 렌더링, map_config camel/snake 정규화, 키보드 이동, Socket.io(`store:join`, `player:move`, `player:joined/moved/left`, `chat:message`) 연동
  - `packages/game-core/src/index.ts` export 추가
  - `apps/web/src/pages/StorePage.tsx` 전면 갱신 — placeholder 제거, 게임 캔버스 마운트, 채팅 패널, 채널 인원 표시, 비로그인 접근 시 `/login?role=shopper` 가드
  - `apps/web/src/i18n/ko.ts`에 `store.world.*`, `store.chat.*` 문구 추가
  - `apps/web/package.json`에 `@popup-cube/game-core` 의존성 추가
- **Notes:** User가 isometric vs top-down 비교 후 **top-down 선택**(AD-022). 핵심 목표는 데모 일정 내 안정적 실시간 체험 확보. `npx tsc --noEmit`(game-core/web) + `npm run build`(web) 통과.

### 2026-07-13 — 정식 출시 방향성 확정: 임시저장(draft)/출시(published) 재도입 (AD-021)
- **Author:** User 지시 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:** `HANDOFF.md`만 갱신 (코드 변경 없음) — `## 4` AD-021 추가, `## 2` Phase 4에 draft/publish 명시, `## 7` Not Done에 Phase 4 필수 항목으로 등록, `## 26`에 "정식 출시 시 임시저장/출시 UX" 요구사항 섹션 추가
- **Notes:** 데모(지금)는 생성 즉시 `published`로 단순화 유지가 맞다고 확인받음. 정식 개발 때는 점주가 편집 중인 매장이 안전하게 "임시저장"되고, 계속 이어서 편집 가능하고, draft 상태도 점주 본인에겐 잘 보이게(배지 등) 만들어서 불편하지 않게 해야 함 — 반드시 Phase 4 에디터 작업과 함께 진행.

### 2026-07-13 — 버그 수정: 로그인 재시도 필요(ISS-014), 매장 만들기 후 홈에 안 보임(ISS-015)
- **Author:** User 리포트 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - `apps/web/src/context/AuthContext.tsx` — `signInWithPassword`가 로그인 시작 시 `loading: true`로 세팅, `profiles` 로드 완료(`onAuthStateChange → loadProfile`) 전까지 유지 → `/home` 이동 직후 stale 상태로 인한 랜딩 튕김 해결
  - Supabase 마이그레이션 `auto_publish_owner_created_stores` — `create_owner_store`가 `status: 'draft'` 대신 처음부터 `'published'`로 매장 생성; 기존 draft 매장(테스트로 만든 "Mr. Sim & Bee" 2건) 함께 published로 전환
- **Notes:** §26 "정책 결정"을 draft-first → publish-first로 갱신. 에디터(Phase 4) 생기면 draft 단계 재도입 검토. 중복 테스트 매장 2건은 삭제 UI가 없어 그대로 둠(§7 다음 할 일에 메모).

### 2026-07-13 — 홈 허브 P1 구현: 점주 매장 만들기 (AD-019, §26)
- **Author:** User 지시 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - Supabase 마이그레이션: `owner_store_create_flow`(`stores_owner_insert` RLS + `store-assets` 버킷 + storage RLS), `tighten_store_assets_select_policy`(광범위 public SELECT → 소유자 한정, advisor 경고 해결), `create_owner_store_function`(원자적 store insert + profile 갱신 함수), `fix_create_owner_store_search_path`(advisor 경고 해결), `grant_stores_insert_update_authenticated`(테이블 GRANT 누락 발견·수정)
  - `apps/web/src/lib/storeCreate.ts` 신규 — 썸네일 업로드 + `create_owner_store` RPC 호출, `CreateStoreError` 타입화된 에러
  - `apps/web/src/pages/CreateStorePage.tsx` 신규 — 이름·이미지 업로드(미리보기)·설명 폼
  - `AuthContext.tsx`에 `refreshProfile()` 추가
  - `HomePage.tsx` 점주 버튼: 토스트 → 실제 `/store/create` 이동
  - `App.tsx`에 `/store/create` 라우트 (React Router v6가 정적 경로를 동적 `:storeId`보다 우선 매칭 — 순서 무관 확인)
  - `ko.ts`에 `createStore.*` 문구 추가, 미사용 `home.createStoreComingSoon` 제거
- **Notes:**
  - `execute_sql`로 `SET LOCAL ROLE authenticated` + `request.jwt.claims` 시뮬레이션 후 `ROLLBACK`하여 실제 데이터 변경 없이 RPC 동작 검증 (데모 계정 role 변경 없음 확인)
  - 검증 중 `stores` 테이블에 `authenticated` INSERT/UPDATE **테이블 GRANT가 없어서 42501 에러** 발견·수정 (ISS-012로 일반화해 기록 — 이 프로젝트에서 반복되는 패턴)
  - `npx tsc -b --noEmit` 통과; Vite dev 서버가 새 파일들 200으로 서빙 확인
  - 매장은 `status: draft`로 생성되어 홈에는 아직 안 보임 — §26 P2(출시 버튼)가 다음 작업

### 2026-07-13 — 홈 허브 P0 구현: 매장 목록·검색·입장 모달 (AD-019, §26)
- **Author:** User 지시 + Cursor Agent (Claude Sonnet 5 Thinking)
- **Changed:**
  - Supabase 마이그레이션 `add_store_home_hub_fields` — `stores.description`, `thumbnail_url`, `status` 추가; GUCCI 시드 `published` 전환
  - `packages/shared/src/types.ts` — `StoreSummary`, `StoreStatus` 타입 추가
  - `apps/web/src/lib/stores.ts` 신규 — `listPublishedStores`, `getStoreSummary` (anon key 직접 조회, RLS 의존)
  - `apps/web/src/pages/HomePage.tsx` 신규 — 카드 그리드, 검색(debounce 250ms), 로딩/에러/empty 상태, 점주용 "매장 만들기" 버튼(토스트만)
  - `apps/web/src/components/StoreEnterModal.tsx` 신규 — 대표 이미지·설명·입장하기/닫기
  - `App.tsx`에 `/home` 라우트 추가; `LoginPage.tsx` 성공 시 `navigate('/home')`으로 변경 (기존 `/store/popup_gucci_01` 직행 제거)
  - `StorePage.tsx` 헤더에 `🏠 홈` 버튼 추가
  - `ko.ts`에 `home.*`, `enterModal.*`, `store.backToHome` 키 추가
- **Notes:**
  - `npx tsc -b --noEmit` 통과, 기존 `npm run dev` 세션에서 HMR 정상 반영 확인
  - REST `/api/stores` 목록 엔드포인트는 만들지 않고 클라이언트 직접 조회로 결정 (§26 참고)
  - 남은 것: 점주 매장 만들기 실제 폼(P1), 비로그인 시 `/store/:id` 직링크 가드

### 2026-07-13 — 점주 전용 픽셀 변환·구매 소유권 장착 구조 확정 (AD-020, §27)
- **Author:** User product/security direction + Cursor Agent
- **Changed:** §27 신설, §4 AD-020, §5·§16 계획 갱신
- **Notes:** 소비자 코드 추출/붙여넣기 제거; 상품 픽셀 자산은 1회 저장, 구매자는 `user_inventory` 소유권 행으로 장착

### 2026-07-13 — 월드 허브 UX 방향 확정 (AD-019, §26)
- **Author:** User product direction + Cursor Agent
- **Changed:** §26 신설, §2 Phase 1.5, §4 AD-019, §7·§10 stores 확장 예정, §18·§20·§22 플로우 갱신
- **Notes:** 로블록스/메이플 월드식 홈·탐색·입장 모달; 점주 매장 만들기 = 픽셀 월드 생성 시작점

### 2026-07-13 — HANDOFF 실시간 갱신 규칙 추가 (§0)
- **Author:** User request + Cursor Agent
- **Changed:** §0 `작업 중 실시간 갱신` 섹션, 상단 인용문, §15 Agent 규칙
- **Notes:** 세션 종료만이 아니라 작업 단위마다 HANDOFF 동기화 필수

### 2026-07-13 — UI 한국어화 + i18n 구조 (AD-017)
- **Author:** User request + Cursor Agent
- **Changed:** `apps/web/src/i18n/ko.ts`, Landing/Login/Store 페이지, §25 i18n
- **Notes:** 기본 ko; 향후 en/ja·자동번역 확장 대비 키 구조

### 2026-07-13 — 환경 설정 완료: Redis + 데모 계정 + owner role
- **Author:** User + Cursor Agent
- **Changed:** `server/.env` REDIS_URL (Upstash), owner role SQL, ISS-001/009/010 상태
- **Notes:** 데모 비밀번호 `demo`; Cursor 터미널은 Node PATH 재시작 필요

### 2026-07-13 — Phase 1 완료: Turborepo + Supabase 실연동 + Auth 화면
- **Author:** Cursor Agent (Sonnet 5) — 사용자 승인 후 진행
- **Changed:**
  - Turborepo 구조 적용: `apps/web`, `packages/{shared,game-core,ui}`, `server/` (from `src/`)
  - Supabase `popup-platform`에 실제 마이그레이션 적용: `stores`, `channels`, `profiles` + RLS + 자동 트리거
  - GUCCI 데모 스토어 시드 (`popup_gucci_01`)
  - 서버 DB 접근을 `pg` → `supabase-js`(service_role key) 전환 (AD-015) — `DATABASE_URL`/`pg` 의존성 제거
  - `apps/web`: 랜딩(쇼핑하기/매장 관리) → 로그인 → 스토어 화면, role 기반 점주 툴바
  - CORS를 `WEB_ORIGIN` 환경변수로 정리 (ISS-005 해결)
- **Notes:**
  - **로컬 Node.js 미설치 확인** — `npm install` 실행 못 함; 사용자 조치 필요 (§7, ISS-001)
  - **`SUPABASE_SERVICE_ROLE_KEY` 비어있음** — MCP가 자동 제공 불가(보안), 사용자가 대시보드에서 복사 필요 (§7, ISS-009)
  - 데모 계정 2개 아직 미생성 (§22)
  - Phaser 실제 렌더링은 다음 세션 (Phase 2)

### 2026-07-13 — 작업 전 브리핑 + 모델 추천 규칙
- **Author:** User request + Cursor Agent
- **Changed:** §0 Work Start Briefing, §24 Model Guide, §15
- **Notes:** 지시 와도 승인 후 착수; 모델명 Cursor 메뉴 기준

### 2026-07-13 — 대화 규칙 + Glossary 추가
- **Author:** User request + Cursor Agent
- **Changed:** §0 대화 규칙, §15 User Context, §23 Glossary, §19 쉬운 설명
- **Notes:** 비개발자 배경; 전문 용어 `(괄호)` 필수

### 2026-07-13 — Q&A 2차: GUCCI 데모, 이중 로그인, 반응형 웹
- **Author:** User + Cursor Agent
- **Changed:** AD-009/010/013/014, §18, §20, §22 Auth UX
- **Decisions:** GUCCI 임시 브랜드; 홈택스식 소비자/점주 로그인; 모바일=반응형 웹; 자연스러운 기능 시연
- **Notes:** Expo 앱 post-demo; `apps/mobile` scaffold deferred

### 2026-07-13 — Web/App 기초 설계 + Investor Demo plan
- **Author:** Cursor Agent + User (Q&A)
- **Changed:** §17 Platform Strategy, §18 Demo Plan, §19 Monorepo, §20 Q&A Log, §21 Testing
- **Decisions:** Turborepo, fashion theme, 2~3wk all-live-simple, web-primary + Expo shell
- **Notes:** Supabase `popup-platform` MCP verified; DB empty

### 2026-07-12 — HANDOFF.md 최초 작성
- **Author:** Cursor Agent
- **Changed:** `HANDOFF.md` 생성; Phase 0 skeleton 상태 문서화
- **Notes:** 이전 세션에서 채널링 소켓 서버 + DB 스키마 구현 완료. Supabase/Railway는 논의만 됨.

### 2026-07-12 — Phase 0: 채널링 소켓 서버 skeleton
- **Author:** Cursor Agent
- **Changed:**
  - `src/` 전체 backend scaffold
  - `src/db/schema.sql` — users, stores, channels + popup_01 seed
  - `src/services/channelService.js` — 40명 채널 자동 배정
  - `src/socket/index.js` — join/move/chat/disconnect
  - `examples/socket-test-client.html`
- **Notes:** User-provided UI mockup (Attack on Titan pop-up) 반영하여 demo store naming.

---

## 9. Environment Variables

> **인프라 전체 맵:** **§46** · 배포: **`DEPLOY.md`**

### `server/.env`
| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | HTTP + Socket.io port |
| `NODE_ENV` | No | `development` | |
| `WEB_ORIGIN` | No | `*` | CORS 허용 도메인 — 배포 시 Vercel URL로 교체 |
| `SUPABASE_URL` | **Yes** | `https://cvrtobxkvpcpcxrcspdp.supabase.co` | 이미 채워져 있음 |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | — | ⚠️ **사용자가 직접 입력** `(비밀 키 — 대시보드에서만 확인 가능, MCP로 자동 조회 불가)` |
| `REDIS_URL` | No | `redis://localhost:6379` | 로컬 or Upstash |
| `MAX_CHANNEL_CAPACITY` | No | `40` | Fallback; per-store override in DB |

`server/.env` — `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`(Upstash) 설정 완료. 배포 시 `WEB_ORIGIN`만 Vercel URL로 교체.

### `apps/web/.env`
| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** | 채워짐 | |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | 채워짐 | `(공개 가능한 anon 키 — 브라우저에 노출 OK)` |
| `VITE_SOCKET_SERVER_URL` | No | `http://localhost:3000` | |
| `VITE_DEMO_STORE_ID` | No | `popup_gucci_01` | |

`apps/web/.env`도 이미 채워져 있어 별도 작업 불필요.

---

## 10. Database Schema

> **적용 완료 (2026-07-13)** — Supabase `popup-platform` 프로젝트에 실제로 만들어져 있는 테이블입니다.  
> 마이그레이션은 Cursor MCP `apply_migration`으로 실행됨 (`init_core_schema`, `seed_gucci_demo_store`).

### `profiles` `(소비자/점주 구분의 핵심 테이블)`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `auth.users.id`와 동일 (Supabase Auth 유저) |
| email | VARCHAR | |
| username | VARCHAR | 가입 시 이메일 앞부분 자동 생성 (구버전 표시용 — 화면에는 `nickname` 우선 사용) |
| **nickname** | VARCHAR(20) | ✅ 2026-07-13 추가 — 게임 캐릭터 닉네임. **대소문자 무관 중복 불가**(`profiles_nickname_unique_idx`, NULL은 여러 개 허용), 2~16자(`nickname_length_chk`). 회원가입 시 `auth.users.raw_user_meta_data.nickname` → 트리거로 자동 복사. 기존(구버전) 계정은 NULL — 앱에서 `nickname ?? email 앞부분`으로 대체 표시 |
| **role** | VARCHAR | `'shopper' \| 'owner' \| 'admin'` — 기본값 `shopper` |
| store_id | VARCHAR FK → stores | 점주(owner)만 값 있음 |
| avatar_config | JSONB | |
| created_at / updated_at | TIMESTAMPTZ | |

**자동화:** 신규 가입 시 트리거(`handle_new_user`)가 `profiles` row를 자동 생성 (기본 role = shopper, nickname은 가입 시 입력값 그대로 복사). 점주로 만들려면 가입 후 SQL로 role을 `owner`로 수동 변경 (§7).

**닉네임 중복확인 RPC:** `is_nickname_available(p_nickname text) returns boolean` — `SECURITY DEFINER`로 RLS 우회, 존재 여부(boolean)만 반환하고 다른 개인정보는 노출 안 함. `anon`/`authenticated` 모두 호출 가능(회원가입 전에도 확인해야 하므로 의도적으로 공개). `apps/web/src/lib/nickname.ts`의 `checkNicknameAvailable()`에서 사용.

### `stores`
| Column | Type | Notes |
|---|---|---|
| id | VARCHAR(64) PK | 데모: `popup_gucci_01` |
| name | VARCHAR(120) | 데모: `GUCCI POP-UP CUBE` |
| **description** | TEXT | ✅ 적용됨 (`add_store_home_hub_fields`) — 홈·입장 모달에 표시 |
| **thumbnail_url** | TEXT | ✅ 적용됨 — 홈 카드·입장 모달 대표 이미지 URL (실제 Storage 업로드는 §26 P1에서) |
| **status** | VARCHAR(20) | ✅ 적용됨: `draft`(기본) \| `published` — 홈 노출 조건 = `is_active AND status='published'` |
| owner_id | UUID FK → auth.users | Nullable |
| map_config | JSONB | Tilemap + objects (see below) |
| max_channel_capacity | INT | Default 40 |
| is_active | BOOLEAN | |
| popup_ends_at | TIMESTAMPTZ | 데모: now + 21일 |

### `products` `(상품 등록/목록 + 장바구니 MVP, 2026-07-13 추가)`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | `gen_random_uuid()` |
| store_id | VARCHAR FK → stores | `on delete cascade` |
| name | VARCHAR(120) | |
| description | TEXT | Nullable |
| price | INTEGER | 원(KRW) 단위, 소수점 없음, `>= 0` |
| image_url | TEXT | Nullable — Storage `store-assets` 버킷 재사용(`{uid}/products/...` 경로) |
| is_active | BOOLEAN | 기본 `true`. **soft delete** — 점주가 "숨기기" 누르면 `false`(주문 이력 연결 대비, 실제 행 삭제 안 함) |
| created_at / updated_at | TIMESTAMPTZ | |

**RLS:** `products_public_read`(활성 상품 + 매장이 `published`+`is_active`일 때만 누구나 조회) / `products_owner_read`(본인 매장 상품은 활성여부 무관 전체 조회) / `products_owner_insert` · `products_owner_update`(본인 매장만). **Grant:** `anon`/`authenticated` SELECT, `authenticated` INSERT/UPDATE(DELETE 없음 — stores와 동일 패턴, ISS-012).

**이미지 표시 방식(2026-07-13):** 상품 사진(등록 미리보기·점주 목록·손님 쇼핑 화면·장바구니 썸네일)은 `objectFit: 'contain'`(적응형 — 사진을 자르지 않고 비율 그대로 박스 안에 전부 보이게, 남는 공간은 여백) 사용. 처음엔 `objectFit: 'cover'`(꽉 채우기, 비율 안 맞으면 잘림)였다가 User 지적으로 변경 — 점주가 사진마다 특정 픽셀 크기로 편집해야 하는 부담 대신, 어떤 비율의 사진을 올려도 안 잘리게 하는 쪽을 선택함. **주의:** 매장 대표 이미지(`CreateStorePage`, `StoreEnterModal`, `HomePage` 카드)는 아직 `cover` 그대로 — 같은 논리를 적용할지는 별도 결정 필요(§7 참고).

**장바구니(cart):** DB 테이블 없음(client-only, 이전과 동일) — `apps/web/src/context/CartContext.tsx`가 `localStorage`에 보관. **결제 자체(PG)는 여전히 mock**이지만, 결제가 확정되면(할인 적용 또는 가챠 뽑기 완료) **실제 `orders`/`order_items`에 저장됨**(2026-07-13, 아래).

### 주문·배송 — `orders` + 배송지 관리 (✅ 구현 완료, AD-030)

> mock 결제(가짜 PG)는 그대로지만, 결제 확정 시점에 **실제 주문이 DB에 저장**됨. 소비자는 마이페이지에서 배송지를 여러 개 등록하고, 결제 시 그중 하나를 선택(또는 새로 추가)해서 씀. 점주는 주문 관리 화면에서 실제 들어온 주문·구매자·배송지를 확인 가능.

**`user_addresses` (소비자 배송지):**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → auth.users, `on delete cascade` | 본인 주소만 |
| label | VARCHAR(40) | **별명** — 예: "집", "회사" |
| recipient_name | VARCHAR(60) | 수령인 |
| phone | VARCHAR(20) | 연락처 |
| postal_code | VARCHAR(10) | 우편번호 |
| address_line1 | VARCHAR(200) | 기본 주소 |
| address_line2 | VARCHAR(200) | Nullable — 상세 주소 |
| is_default | BOOLEAN | 기본 배송지. 첫 배송지는 자동으로 기본 지정(`lib/addresses.ts`가 클라이언트에서 처리) |
| created_at / updated_at | TIMESTAMPTZ | |

**RLS:** `user_addresses_select/insert/update/delete_own` — 전부 `auth.uid() = user_id`만. **Grant:** `authenticated`만 SELECT/INSERT/UPDATE/DELETE (anon 없음 — 개인정보라 공개 조회 불필요).

**`orders` (주문 헤더):**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| store_id | VARCHAR FK → stores, `on delete cascade` | |
| user_id | UUID FK → auth.users, `on delete cascade` | 구매자 |
| shipping_address_id | UUID FK → user_addresses, `on delete set null` | 주소 삭제돼도 과거 주문은 남음(배송지만 null) |
| total_amount | INTEGER | 원(KRW), `place_order()`가 서버에서 재계산해서 채움 |
| discount_percent | INTEGER | Nullable — 할인 선택 시만 |
| reward_type | VARCHAR | `'discount'` \| `'gacha'` |
| status | VARCHAR | `pending` / `paid` / `shipped` / `cancelled` — 지금은 `place_order()`가 항상 `paid`로 생성(mock 결제는 항상 "성공") |
| created_at | TIMESTAMPTZ | |

**`order_items` (주문 라인):**
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| order_id | UUID FK → orders, `on delete cascade` | |
| product_id | UUID FK → products | |
| quantity | INTEGER | `>= 1` |
| unit_price | INTEGER | 주문 시점 단가 스냅샷(**서버가 `products.price`에서 직접 읽음** — 클라이언트가 보낸 가격은 신뢰하지 않음) |

**RLS:** `orders`/`order_items` — 구매자 본인(`user_id = auth.uid()`) 또는 그 매장 점주(`stores.owner_id = auth.uid()`)만 SELECT. INSERT는 본인 것만(실제로는 `place_order()` 함수를 통해서만 발생). **Grant:** `authenticated`만.

**`place_order(p_store_id, p_address_id, p_items, p_reward_type, p_discount_percent)` — 주문 생성 함수 (SECURITY INVOKER):**
- 로그인 필요, 주소는 본인 소유인지 검증
- **가격은 클라이언트가 보낸 값을 절대 믿지 않고 `products.price`를 다시 읽어서 계산** (가격 조작 방지 — `roll_gacha()`와 같은 보안 철학)
- 할인(`discount`) 선택 시 클라이언트가 보낸 `discount_percent`가 **그 매장의 실제 활성 프로모션과 일치하는지 검증** (임의 할인율 주입 방지)
- 주문(`orders`) + 라인(`order_items`)을 한 함수 호출로 원자적 저장, 최종 `order_id`/`total_amount` 반환
- 장바구니에 다른 매장 상품이 섞여 있어도 **현재 매장(`p_store_id`) 상품만 주문에 포함**(할인/가챠와 동일한 기존 알려진 한계 정책)
- `authenticated`에게만 EXECUTE (anon 불가, `PUBLIC` 기본 권한도 명시적으로 회수)

**`get_store_orders(p_store_id)` — 점주 주문 조회 함수 (SECURITY DEFINER, `roll_gacha()`와 같은 패턴):**
- 호출자가 그 매장의 실제 owner인지 확인 후에만 데이터 반환 (아니면 예외)
- 주문 + 라인 + 상품명 + **구매자 닉네임**(`profiles.nickname`) + **배송지 상세**를 한 번에 조인해서 반환 — `profiles`/`user_addresses`는 원래 본인만 조회 가능한 RLS라서, 점주가 "자기 매장 주문의 구매자 정보"만 딱 볼 수 있게 이 함수가 대신 검증
- `authenticated`에게만 EXECUTE

**UI 흐름 (구현 완료):**
```
마이페이지(/mypage) > 배송지 관리
  ├─ 저장된 주소 목록 (별명 + 수령인 + 주소 요약 + 기본 배송지 배지)
  ├─ [+ 새 배송지 추가] / [수정] / [삭제] / [기본으로 설정]
  └─ 여러 개 등록 가능, 각각 별명 — 첫 배송지는 자동 기본 지정

결제(CartDrawer) — "결제하기" 클릭 후 순서
  1. 배송지 선택 단계 — 저장된 주소 라디오 선택(기본 배송지 자동 선택) + 항상 보이는 [+ 새 배송지 추가]
  2. 할인 vs 가챠 선택 단계 (AD-028, 기존과 동일)
  3. 최종 확정 시 `place_order()` 호출 → 실제 주문 저장 → 결과 화면

점주 주문 관리(StorePage 툴바 "📊 주문 관리")
  └─ `get_store_orders()`로 매장 주문 목록 — 구매자 닉네임·상품·수량·금액·혜택 종류·배송지·시각
```

**알려진 한계:** 가챠 선택 후 `place_order()` 저장이 실패하면(네트워크 등) 가챠는 이미 뽑힌 상태로 남고 주문만 재시도해야 함 — 데모 범위에서는 드문 경우라 별도 롤백 처리는 하지 않음. 정식 출시 때는 가챠 롤과 주문 생성을 한 트랜잭션으로 묶는 개선 검토.

### (계획, 다음 작업에서 구현) 구매 프로모션 — "할인 vs 가챠" 선택 (AD-028)

> 결제(mock) 완료 시 소비자가 **확정적 보상(할인)**과 **확률형 보상(가챠 뽑기권)** 중 하나를 직접 고르는 방식.
> **한시적 이벤트가 아니라 상시 기능으로 설계**(프로모션 자주 진행 + 가챠 요소 장기 유지 예정) — 투자자 데모/출시 초반엔 반드시 포함.

```
결제 완료
  └─ "혜택을 선택하세요" 모달
       ├─ [할인] 선택 → 확정 보상 (예: 이번 주문 즉시 할인 / 다음 주문용 할인 코드)
       └─ [가챠] 선택 → gacha_pools에서 서버 측 가중치 랜덤 추첨 (gacha_rolls에 기록)
```

**가챠 풀 구성 (User 확인, 2026-07-13):** 가챠에서 뽑히는 후보는 **① 그 매장에 실제 등록된 상품**(당첨되면 그 상품을 무료로 더 받는 느낌) + **② 가챠에서만 얻을 수 있는 전용 아이템**(샵 목록엔 없고 뽑기로만 획득, 예: 한정 디지털 배지) — 이 둘을 한 풀에 섞어서 구성.

**가챠 풀 범위 (User 결정: 혼합형):** 기본은 **매장 공용 풀**(그 매장에서 무엇을 사든 같은 풀에서 뽑음, 점주가 풀 하나만 관리하면 됨) — 이번 MVP는 이 범위만 구현. 스키마는 나중에 점주가 **특정 상품 전용 풀**을 별도로 추가할 수 있게 확장 여지를 열어둠(`gacha_pools.linked_product_id`, 지금은 항상 NULL = 매장 공용).

```
gacha_pools           (매장별 뽑기 풀)
  - id, store_id, name, linked_product_id (NULL=매장 공용, 지금은 항상 NULL), is_active

gacha_pool_entries     (풀에 들어가는 뽑기 후보 하나하나)
  - id, pool_id
  - product_id  (NULL 아니면 "실제 상품 당첨")
  - exclusive_name / exclusive_image_url  (product_id가 NULL일 때 "가챠 전용 아이템" 이름·이미지)
  - weight       (당첨 확률 가중치)
  - is_active
  - CHECK: product_id IS NOT NULL OR exclusive_name IS NOT NULL  (둘 중 하나는 반드시 있어야 함)

gacha_rolls            (누가 언제 뭘 뽑았는지 기록)
  - id, user_id, store_id, pool_entry_id, rolled_at
```

**✅ 구현 완료 (2026-07-13):**
- `store_promotions`(store_id PK, `discount_percent` 1~100, `is_active`) — RLS: 활성 프로모션 누구나 조회, 점주는 본인 매장 전체 관리(`for all`). GUCCI에 10% 시드.
- `gacha_pools`(id, store_id, name, `linked_product_id` — 지금은 항상 NULL=매장 공용, is_active) — RLS: 점주만 관리, 클라이언트 직접 SELECT는 안 열어둠(뽑기는 RPC로만).
- `gacha_pool_entries`(id, pool_id, `product_id`(실제 상품 당첨) 또는 `exclusive_name`/`exclusive_image_url`(가챠 전용 아이템) 중 하나 필수 — CHECK 제약, `weight`, is_active) — RLS: 점주만 관리.
- `gacha_rolls`(id, user_id, store_id, pool_entry_id, rolled_at) — RLS: 본인 기록만 SELECT, INSERT는 직접 GRANT 없음(→ `roll_gacha()` RPC만 기록 가능, 자기 당첨 조작 방지).
- **`roll_gacha(p_store_id)` RPC** — `SECURITY DEFINER`: 로그인 필요(`auth.uid()` 체크) → 매장 공용 풀에서 가중치 합산 → `random()` 기반 가중치 추첨 → `gacha_rolls`에 기록 → 당첨 결과(실제 상품이면 `products` 조인 정보, 아니면 전용 아이템 정보) 반환. `authenticated`에게만 EXECUTE 권한(anon 불가).
- GUCCI 데모 시드: 할인 10% + 가챠 풀 4종(가중치) — "GUCCI 한정 디지털 배지"(40) / "GG 패턴 스티커 팩"(30) / "마이룸 전용 액세서리 세트"(20) / "황금 티켓(초희귀)"(10). 아직 실제 `products`는 없어서 전부 가챠 전용 아이템으로만 구성(상품 등록되면 나중에 풀에 실제 상품도 추가 가능).
- 클라이언트: `apps/web/src/lib/gacha.ts`(`getActivePromotion`, `rollGacha`), `CartDrawer`에 결제 완료 후 "할인 받기"/"가챠 뽑기" 선택 단계 + 결과 화면(가챠는 "실제 상품 당첨"/"가챠 전용 아이템" 배지 구분).
- **알려진 한계:** 장바구니가 여러 매장 상품을 섞어 담을 수 있는 구조인데, 할인/가챠는 `CartDrawer`를 연 **현재 매장 기준**으로만 적용됨(다른 매장 상품이 섞여 있어도 지금 있는 매장의 프로모션이 적용) — 실사용상 한 매장에서만 쇼핑 후 결제하는 흐름이라 데모 범위에서는 문제 없음, 필요시 매장별로 장바구니를 나누는 개선은 후속 과제.

### `channels`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| store_id | VARCHAR FK → stores | |
| channel_number | INT | Unique per store |
| redis_room_key | VARCHAR | e.g. `popup_gucci_01:channel_1` |
| is_active | BOOLEAN | |

### RLS 정책 `(누가 뭘 볼 수 있는지 규칙)`
| Table | Policy | 의미 |
|---|---|---|
| stores | `stores_public_read` | 활성 매장은 누구나 조회 가능 |
| stores | `stores_owner_update` | 본인이 owner인 매장만 수정 가능 |
| channels | `channels_public_read` | 채널 정보는 누구나 조회 (서버는 service_role로 우회) |
| profiles | `profiles_self_select/update` | 본인 프로필만 조회·수정 |

### `map_config` JSON Shape (Editor Output)
```json
{
  "store_id": "popup_gucci_01",
  "map_size": { "width": 20, "height": 20 },
  "layers": {
    "floor": [{ "x": 0, "y": 0, "tile_id": "carpet_gucci_stripe" }],
    "objects": [
      { "x": 5, "y": 3, "asset_id": "mannequin_gg_shirt", "is_collidable": true },
      { "x": 8, "y": 6, "asset_id": "showcase_bag", "is_collidable": true }
    ]
  }
}
```

### (계획, 미구현) 진열 조형물 · 슬롯 — AD-033

> **쉬운 설명:** 오프라인 매장에서 테이블·옷걸이에 옷을 올려두는 것과 같음.  
> 조형물 = 가구, 슬롯 = 그 위에 상품을 꽂는 칸.

**소비자 흐름**
1. 조형물 앞 접근 → 프롬프트 `E · ○○ 상품 보기`
2. **상호작용** → 「진열 상품」팝업 (그 조형물 슬롯 상품만)
3. 상품마다: **바로 구매** / **장바구니 담기** / **착용해보기**
4. 착용해보기 → 우측 **아바타 미리보기**(착용 전·후) → 적용/취소

**점주 흐름**
1. 「진열 배치」에서 조형물 선택·배치 (테이블 3칸, 옷걸이, 선반 …)
2. 선택 조형물의 슬롯에 상품 **넣기/빼기**
3. 슬롯 **순서 변경** (손님 팝업 나열 순서 = 슬롯 순서)
4. 저장 → `map_config` 또는 전용 테이블에 반영

**초안 스키마 (합의 방향 · 마이그레이션 전)**
```sql
-- display_fixtures: 매장에 놓인 조형물 1개
-- id, store_id, kind ('table_3'|'hanger'|'shelf'|...), x, y, slot_count, label
-- Phase 4: size_w, size_d → fixture_templates lookup (§44 multi-tile occupancy)

-- display_slots: 조형물 칸별 상품
-- fixture_id, slot_index (0..n-1), product_id NULLABLE, sort_order
```

> **✅ 적용 완료 (2026-07-27, Sprint 0)** — `template_id` + `origin_x/y` + `rotation` 방식으로 확정. `size_w/size_d`는 `fixture_templates`에 있음. 마이그레이션: `phase4_display_fixtures` · SQL 파일 `supabase/migrations/20260727_phase4_display_fixtures.sql`

### `fixture_templates` `(플랫폼 카탈로그 — §42.3 8종)`
| Column | Type | Notes |
|---|---|---|
| id | TEXT PK | e.g. `table_round_3` |
| display_name | TEXT | UI 표시명 |
| slot_count | INT | 슬롯 수 |
| size_w / size_d | INT | 타일 footprint (§44) |
| sort_order | INT | 카탈로그 정렬 |
| sprite_key | TEXT | Phaser 스프라이트 (Phase 4b) |
| interaction_kind | TEXT | default `proximity` |
| is_active | BOOLEAN | |

**RLS:** `fixture_templates_public_read` — 활성 템플릿 누구나 SELECT. **Grant:** `anon`/`authenticated` SELECT.

### `display_fixtures` `(매장별 배치 인스턴스)`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| store_id | VARCHAR FK → stores | cascade |
| template_id | TEXT FK → fixture_templates | |
| origin_x / origin_y | INT | 타일 origin |
| rotation | INT | 0 \| 90 \| 180 \| 270 |
| label | TEXT | Nullable |
| sort_order | INT | |
| created_at / updated_at | TIMESTAMPTZ | |

**Trigger:** insert 시 `seed_display_slots_for_fixture()` — `slot_count`만큼 빈 `display_slots` 자동 생성.

**RLS:** `display_fixtures_public_read`(published+active 매장) / `display_fixtures_owner_*`(본인 매장 CRUD). **Grant:** `anon`/`authenticated` SELECT; `authenticated` INSERT/UPDATE/DELETE.

### `display_slots` `(슬롯 ↔ 상품)`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| fixture_id | UUID FK → display_fixtures | cascade |
| slot_index | INT | 0..n-1, UNIQUE(fixture_id, slot_index) |
| product_id | UUID FK → products | Nullable, SET NULL on delete |
| sort_order | INT | 손님 팝업 나열 순 |
| created_at | TIMESTAMPTZ | |

**RLS:** public read via published store / owner update on own fixtures. **Grant:** `anon`/`authenticated` SELECT; `authenticated` UPDATE only.

**코드:** `apps/web/src/lib/displayFixtures.ts` · `packages/game-core/src/occupancyGrid.ts` · `packages/shared/src/types.ts`

~~`map_config.layers.objects`에 `fixture_id` 심기~~ — **별도 테이블 방식으로 확정 (2026-07-27)**

시안: `docs/pdf-assets/display-interact-popup.png`, `tryon-preview-mockup.png`, `owner-display-slots-mockup.png` · 상세 §32

### (계획, 미구현) `map_config` v2 — 여러 방(room)/엘리베이터 (AD-025)

> 지금 데모는 매장 하나 = 지도 한 장(`layers.floor`/`layers.objects`)뿐. 아래는 Phase 4 에디터에서
> "방 여러 개 + 문/엘리베이터로 이동"을 붙일 때 쓸 예정 구조 초안(합의된 스펙 아님, 방향만 잡아둔 것).

```json
{
  "store_id": "popup_gucci_01",
  "rooms": [
    {
      "id": "room_1f",
      "name": "1층 매장",
      "map_size": { "width": 20, "height": 20 },
      "layers": { "floor": [...], "objects": [...] },
      "transitions": [
        { "x": 10, "y": 0, "type": "door", "target_room_id": "room_1f_back", "target_x": 5, "target_y": 18 },
        { "x": 18, "y": 18, "type": "elevator", "target_room_id": "room_2f", "target_x": 10, "target_y": 18 }
      ]
    },
    { "id": "room_1f_back", "name": "쇼룸 옆방", "map_size": {...}, "layers": {...}, "transitions": [...] },
    { "id": "room_2f", "name": "2층", "map_size": {...}, "layers": {...}, "transitions": [...] }
  ]
}
```
- **방(room) 단위로 분리** — 건물 전체를 한 지도에 다 그리지 않고, 방마다 따로 된 작은 지도로 관리. 카메라 follow(2026-07-13 도입)와 잘 맞음 — 어차피 한 화면엔 방 하나 정도만 보임
- **`transitions`** — 특정 타일(`x`,`y`)을 밟으면 다른 방으로 이동. `type: "door"`(같은 층 옆방), `type: "elevator"`(다른 층)로 구분해 두면 나중에 엘리베이터 전용 UI(층 선택 등)를 붙이기 쉬움
- 소켓 쪽엔 "방 이동"을 `store:join`과 비슷하게 다시 입장하는 형태(`room:enter` 같은 신규 이벤트, 같은 채널 유지)로 처리할 가능성이 높음 — Phase 4 에디터 작업 시작할 때 자세히 설계

### Pixel Asset JSON Shape (from user mockup — future pipeline)
```javascript
// Array of { x, y, color } — or 2D grid — for custom uploaded assets
{ x: 12, y: 4, color: "#C8A050" }
```

### Storage Buckets (TODO — Phase 3~4)
- `store-assets`, `product-images`, `avatar-items` — 아직 생성 안 됨

---

## 11. Redis Key Reference

| Key Pattern | Type | Purpose |
|---|---|---|
| `store:{storeId}:channels` | Set | Active channel room keys |
| `store:{roomKey}:users` | Set | User IDs in channel (`SCARD` = count). ~~List~~ → Set 전환 (2026-07-13, ISS-019) |
| `store:{roomKey}:player:{userId}` | Hash | `x`, `y`, `direction`, `username`, `isOwner`(`'1'`\|`'0'`, 2026-07-13 추가) (TTL 24h) |

**Room key format:** `{storeId}:channel_{N}` e.g. `popup_01:channel_1`

---

## 12. Socket.io API Contract

### Client → Server

#### `store:join`
```javascript
// Request
{ storeId: "popup_01", userId: "uuid-or-string", username: "Player1", x?: 10, y?: 10, direction?: "down" }

// Ack response (success)
{
  ok: true,
  store: { id, name, mapConfig, popupEndsAt },
  channel: { number, roomKey, visitorCount, maxCapacity },
  players: [{ userId, x, y, direction, username, isOwner }],  // others in room
  self: { x, y, direction, isOwner }  // isOwner: 이 매장의 점주 본인인지 (2026-07-13 추가, 이름표 왕관용)
}

// Ack response (error)
{ ok: false, error: "Store not found" | "Store is not active" | "..." }
```

#### `player:move`
```javascript
{ x: number, y: number, direction?: "up"|"down"|"left"|"right" }
```

#### `chat:message`
```javascript
{ message: string }  // max 500 chars server-side
```

### Server → Client

| Event | Payload |
|---|---|
| `player:joined` | `{ userId, username, x, y, direction, isOwner }` |
| `player:left` | `{ userId }` |
| `player:moved` | `{ userId, username, x, y, direction }` (isOwner는 안 바뀌는 값이라 재전송 안 함 — 클라이언트가 최초 join/joined 때 받은 값을 계속 사용) |
| `chat:message` | `{ userId, username, message, timestamp }` |
| `channel:visitor-count` | `{ number, roomKey, visitorCount, maxCapacity }` |

---

## 13. REST API

| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{ status: "ok", timestamp }` |
| GET | `/api/stores/:storeId` | Store meta + `channels[]` with live `visitorCount` + `totalVisitors` |

---

## 14. Local Development Commands

```bash
# 0. 사전 준비: Node.js 18+ 설치 확인
node --version

# 1. server/.env 에 SUPABASE_SERVICE_ROLE_KEY 채우기 (§7, §9)
# 2. Redis 실행 (택1)
docker run -p 6379:6379 redis
# 또는 server/.env의 REDIS_URL을 Upstash 주소로 교체

# 3. 루트에서 전체 설치 (workspaces 한 번에)
npm install

# 4. 서버 + 웹 동시 실행 (Turborepo)
npm run dev
# 개별 실행도 가능:
#   cd server && npm run dev        (포트 3000)
#   cd apps/web && npm run dev      (포트 5173)

# 5. 확인
# 웹: http://localhost:5173  (랜딩 → 쇼핑하기/매장 관리)
# 소켓 테스트: server/examples/socket-test-client.html 브라우저로 열기
# API: curl http://localhost:3000/api/stores/popup_gucci_01
```

---

## 15. User Context (Important for Agents)

- **User background:** 정통 개발자 출신 **아님** — §0 대화 규칙 **항상** 준수
- **User knows:** Supabase, Cursor, domain setup, web hosting basics
- **User does NOT yet have in prod:** Socket server hosting, Upstash Redis, payment PG
- **Language:** User communicates in Korean; code/comments can be English
- **Design reference:** Pixel isometric metaverse, pop-up commerce, 40 visitor cap per channel
- **Do NOT** over-engineer; MVP slices preferred
- **Do NOT** create commits unless user explicitly asks
- **Communication:** 전문 용어 → `(직관적 한국어 설명)` 필수; §23 Glossary 참고·보강
- **HANDOFF:** §0 **작업 중 실시간 갱신** + 세션 종료 마무리. 코드 바꾸면 HANDOFF도 같은 흐름에서 즉시 맞춤.
- **Work start:** §0 작업 시작 전 브리핑 + §24 모델 추천 + **승인 후** 착수. 지시가 와도 물어보고 시작.

---

## 16. Future Tables (Not in Schema Yet — Plan Only)

| Table | Purpose |
|---|---|
| ~~`products`~~ | ✅ 2026-07-13 구현됨 — §10 참고 (상품 등록/목록 MVP) |
| ~~`user_addresses`~~ | ✅ 2026-07-13 구현됨 — §10 참고 (배송지 관리, AD-030) |
| ~~`orders` / `order_items`~~ | ✅ 2026-07-13 구현됨 — §10 참고 (`place_order()` 서버 검증 함수로 저장, PG는 여전히 mock) |
| `avatar_items` | 상품과 연결된 표준 아바타 스프라이트·장착 부위·레이어 정보; 자산 원본은 한 번만 저장 |
| `user_inventory` | `user_id + avatar_item_id + order_item_id` 소유권; 픽셀 데이터 복제 없이 구매 자격만 저장 |
| `avatar_equipment` | 사용자별 현재 장착 상태; 부위(slot)당 1개, 서버 검증 후 변경 |
| `store_assets` | 점주가 자기 매장 인테리어에 반복 사용하는 픽셀 자산 |
| `asset_conversion_jobs` | 점주 전용 이미지→픽셀 변환 작업, 상태·비용·감사 기록 |
| ~~`gacha_pools` / `gacha_pool_entries` / `gacha_rolls`~~ | ✅ 2026-07-13 구현됨 — §10 참고 (할인 vs 가챠 선택 MVP, AD-028) |
| ~~`fixture_templates` / `display_fixtures` / `display_slots`~~ | ✅ 2026-07-27 Sprint 0 — §10 참고 (AD-033, §44) |
| `assets` | Uploaded pixel art / sprites (S3/Supabase Storage URL) |

---

## 17. Platform Strategy — Web vs App vs Admin

### Can Cursor build the app?
**Yes — but demo uses responsive web first (AD-010).**
- **Web:** React + Phaser.js — **investor demo primary** (Vercel + mobile browser)
- **App (post-demo):** React Native + Expo — shares `packages/game-core`; build when web core is stable
- Monorepo keeps `apps/mobile/` slot ready for later integration

### Feature Matrix (확정 — 2026-07-13)

| Feature | Web (Demo) | Mobile App (Post-demo) | Admin Web | Demo Priority |
|---|---|---|---|---|
| 팝업 스토어 입장·탐색 (Phaser) | ✅ Primary | 🔜 Same game-core | — | P0 |
| 멀티플레이·좌표 동기화 | ✅ | 🔜 | — | P0 |
| 실시간 채팅·활동 피드 | ✅ | 🔜 | — | P0 |
| 방문자 수 HUD (40 cap) | ✅ | 🔜 | — | P0 |
| **모바일 반응형 UI** | ✅ Demo mobile | — | — | P0 |
| 아바타 Try-on (simple) | ✅ | 🔜 | — | P1 |
| 상품 전시·Shop Now | ✅ | 🔜 | — | P1 |
| 주문 생성 (mock PG) | ✅ | 🔜 | — | P1 |
| 가챠 (server-side roll) | ✅ | 🔜 | — | P1 |
| 마이룸/인벤토리 (simple) | ✅ | 🔜 | — | P2 |
| **점주: 에디터·픽셀 업로드** | ✅ Owner login only | ❌ | — | P1 |
| **플랫폼 어드민** | — | ❌ | ✅ Web only | P2 |

### User Roles & Login (AD-013)

| Role | Login Entry | In-Store UI |
|---|---|---|
| **Shopper** (소비자) | Landing → "쇼핑하기" | 기본 HUD: Explore, Interact, Try On, Chat, Shop Now |
| **Store Owner** (점주) | Landing → "매장 관리" | **동일 HUD** + 점주 툴바: Edit Store, Upload Product, Pixel Convert, Orders |
| **Platform Admin** | `/admin` (separate) | Post-demo |

**홈택스 analogy:** URL/앱은 하나, **로그인 종류**가 다르고 → **권한에 따라 버튼·기능만 추가** (별도 UI 스킨 X)

---

## 18. Investor Demo Plan (2~3 Weeks)

> **⚠️ 2026-07-12 일정 변경 (AD-032):** 대표님 미팅이 **2026-07-13(일) 저녁**으로 **긴급 앞당겨짐**.  
> 아래 2~3주 계획은 **미팅 이후** 보강 목표. **내일 미팅용**은 §31 「코드 기반 시각 프로토타입」 우선.

### Goal (원래 — 미팅 이후에도 유효)
대표님/투자자에게 **"이런 앱입니다"**를 보여주는 **동작하는 프로토타입** (슬라이드 아님)

### Demo Store Concept
- **Brand:** **GUCCI** (investor demo only — replace before public launch)
- **Store ID:** `popup_gucci_01`
- **Store name:** e.g. `GUCCI POP-UP CUBE`
- **Visual:** Isometric pixel boutique, mannequins, GG pattern pixel shirt on display, green/red stripe accents (user pixel ref)
- **Legal note:** Internal demo only; no public marketing with third-party trademarks

### Week-by-Week Milestones

| Week | Deliverable | Investor-visible |
|---|---|---|
| **W1** | Monorepo + Supabase + dual login + Web: walk, multiplayer | "같은 GUCCI 팝업에서 같이 돌아다님" |
| **W2** | Chat, products, mock checkout, gacha | "쇼핑 + 디지털 보상" |
| **W3** | Owner toolbar (edit/upload/pixel), Vercel URL, **phone browser demo** | "점주가 꾸미고, 폰에서도 됨" |

### Demo Flow (Natural — no script, AD-014)
시연자가 대화하며 **기능을 순서대로 클릭**하면 됨. 고정 스피치 불필요.

1. Landing — 두 버튼: **쇼핑하기** / **매장 관리**
2. 소비자 로그인 → **홈(월드 허브)** — GUCCI 카드 등 매장 목록·검색
3. GUCCI 카드 클릭 → **입장 모달** (대표 이미지·설명) → **입장하기**
4. 팝업 월드 입장 → 방문자 수·다른 아바타
5. 채팅, 전시대 클릭, Try On, Shop Now
6. 구매 → 가챠
7. 로그아웃 → **점주 로그인** → 홈에서 본인 매장 + **매장 만들기** / 같은 매장 입장 시 **Edit / Upload** 버튼
8. (선택) 점주 **매장 만들기** — 이름·대표이미지·설명 → 픽셀 월드 편집 시작
9. **폰 브라우저** 같은 URL — 반응형으로 동일 체험

### "All Live Simple" Scope Boundaries

| Feature | Demo Implementation | NOT in demo |
|---|---|---|
| Multiplayer | Real Socket.io + Redis | 1000+ users load test |
| Payment | Create `orders` row; fake "Paid" button | Real PG (Toss/Stripe) |
| Pixel convert | Canvas 32×32 downscale + color quantize | Stable Diffusion LoRA |
| Gacha | Server `Math.random()` + weighted table in DB | Blockchain / NFT |
| Editor | Grid snap, 5–10 asset types | Full tilemap layers |
| Auth | Supabase email; **role** = shopper \| owner | Social OAuth |
| Mobile | **Responsive web** (same URL on phone) | Native app in demo |

---

## 19. Monorepo Structure (AD-007, AD-016 — ✅ 적용 완료)

> **쉬운 설명:** monorepo `(모노레포)` = **웹, 서버, 공통 부품을 한 창고(프로젝트)에 같이 보관**하는 방식.  
> Turborepo `(터보레포)` = 그 창고에서 **"웹만 빌드" "서버만 실행"** 같이 **필요한 것만 빠르게** 돌려주는 도구.

**Why Turborepo (not plain folders):**
- Shared TypeScript types between web/app/server
- Single `npm install` / build pipeline
- Cursor sees entire project; less duplication
- Scales when admin dashboard added later

**Why NOT Flutter now:** separate language, no code share with Phaser web, slows 2~3wk demo

**Mobile app timing:** Investor demo = **responsive web on phone browser**. `apps/mobile` (Expo) added post-demo; `packages/game-core` must stay platform-agnostic for easy hook-up.

```
popup_store/                      # Turborepo root
├── apps/
│   ├── web/                      # React + Phaser — PRIMARY demo (Vercel)
│   └── admin/                    # Platform admin (Week 3+, optional)
│   # apps/mobile/                # POST-DEMO — Expo shell
├── packages/
│   ├── game-core/                # Phaser scenes, socket client — NO DOM deps
│   ├── shared/                   # Types, Supabase client, roles
│   └── ui/                       # HUD + owner toolbar overlay
├── server/                       # Express + Socket.io (from src/)
├── turbo.json
└── HANDOFF_POPUP_STORE.md
```

**Migration note:** Current `src/` → `server/` move planned in Phase 1; do not delete until migrated.

---

## 20. Q&A Decision Log

| Date | Question | User Answer | Agent Decision |
|---|---|---|---|
| 2026-07-13 | Demo deadline? | 2~3 weeks | Week milestones in §18 |
| 2026-07-13 | Demo showcase? | 전부 | All features P0–P2 with simple live impl |
| 2026-07-13 | Web vs App priority? | 둘 다 동시 → **웹 우선** | 데모=반응형 웹; 앱 post-demo |
| 2026-07-13 | App framework? | 미정 | Expo post-demo; game-core 공유 |
| 2026-07-13 | User roles? | 전부 | Shopper + Owner + Admin (§17, §22) |
| 2026-07-13 | Demo realism? | 전부 실제 동작 (단순) | §18 boundaries table |
| 2026-07-13 | Demo theme? | 패션/브랜드 | **GUCCI** — `popup_gucci_01` |
| 2026-07-13 | Monorepo structure? | Agent decides | Turborepo (§19) |
| 2026-07-13 | Demo brand name? | **GUCCI 그대로** (출시 전 삭제) | Internal investor demo only |
| 2026-07-13 | Demo pitch style? | 기능 보여주며 자연스럽게 | §18 flow; no fixed script |
| 2026-07-13 | Mobile demo? | **반응형 웹**; 앱은 나중에 | AD-010; phone browser |
| 2026-07-13 | 데모 이어서 정식? 앱은 처음부터? | **같은 코드베이스 이어감**; 앱은 shared·서버·DB 재사용, UI만 RN 신규 | AD-027, §29 |
| 2026-07-13 | "다음 작업은?"에 옵션 나열해서 고르게 하지 말고 | **에이전트가 우선순위 객관적 판단 후 먼저 제안** | §0 "다음 작업 우선순위 판단" |
| 2026-07-13 | 구매 시 할인/가챠 선택, 한시적 이벤트? | **아니요 — 상시 기능으로 설계, 초반부터 필수** | AD-028, §10 |
| 2026-07-13 | 가챠 후보는 매장 상품 중에서? 가챠 전용 아이템도 있음? | **맞음 — 실제 상품 + 가챠 전용 아이템 혼합** | AD-028, §10 |
| 2026-07-13 | 가챠 풀 범위(매장 공용 vs 상품별)? | **혼합 — 지금은 매장 공용만 구현, 상품별은 확장 여지만** | AD-028, §10 |
| 2026-07-13 | Owner vs shopper? | **홈택스식 이중 로그인** | AD-013; §22 |
| 2026-07-13 | 로그인 후 첫 화면? | **월드 허브(홈)** — 매장 목록·검색·입장 모달 | AD-019; §26 |
| 2026-07-13 | 점주 매장 생성? | 이름·대표이미지·설명 입력 → 픽셀 월드 만들기 | AD-019; §26 |

### Open Questions
- [ ] 결제 PG 후보 (post-demo)

---

## 22. Auth UX — Recommended Implementation (AD-013 + AD-037)

### 정식 출시 채널 (AD-037) — 우선

| 채널 | 누가 | 로그인 | 하는 일 |
|---|---|---|---|
| **PC 웹** (스토어 관리 사이트) | 스토어 관리자만 | **스토어 관리자 로그인만** | 매장·상품·진열·주문/발주 등 **모든 관리** |
| **모바일 앱** | 일반 회원 + 스토어 관리자 | **일반 회원 로그인 / 스토어 관리자 로그인** | 팝업 입장·월드·쇼핑·채팅·구매. 관리자는 본인 매장에서 **왕관** 등 |

> 일반 회원 쇼핑·홈 허브·월드 = **앱만**. 웹에 일반 회원 로그인/쇼핑을 두지 않음.

### Landing — PC 웹 (스토어 관리자 전용)
```
┌─────────────────────────────────────┐
│         POP-UP CUBE · 스토어 관리   │
│   [  스토어 관리자 로그인  ]         │  ← 일반 회원 로그인 없음
│   (일반 회원은 모바일 앱에서 입장)   │
└─────────────────────────────────────┘
```

### Landing — 모바일 앱
```
┌─────────────────────────────────────┐
│         POP-UP CUBE                 │
│   [  일반 회원 로그인  ]             │
│   [  스토어 관리자 로그인  ]         │
└─────────────────────────────────────┘
```
- Supabase sign-in → `profiles.role` determines UI
- Demo accounts (프로토타입): `demo@shopper.com` / `demo@owner.com`
- **앱 로그인 성공 후 → 홈 허브** (AD-019, §26)
- **UI 카피 고정:** 버튼·화면 제목은 **「일반 회원 로그인」 / 「스토어 관리자 로그인」** (쇼핑하기·매장 관리·손님/점주 로그인 혼용 금지)

### In-App UI (same world, role-based)

**일반 회원 (shopper):** `[상호작용] [채팅] [장바구니 🛒] [전체 상품]`  

**스토어 관리자 (owner, 앱에서 자기 매장일 때):** 닉네임 **왕관** + (필요 시) 간단 관리 진입. **풀 에디터·상품 CRUD·발주 관리는 PC 웹**(AD-037)

### 데모 `apps/web` 주의
현재 데모 웹에는 일반 회원·스토어 관리자가 같이 있음 → **시안·정식 방향은 AD-037**. 정식 개발 시 웹에서 일반 회원 플로우 분리/제거.

### DB (`profiles` extends auth.users)
```sql
role: 'shopper' | 'owner' | 'admin'
store_id: nullable  -- owners only
```

### Build order — 진행 상황
1. ✅ Supabase Auth + `profiles` + RLS — §10 적용됨
2. ✅ Landing dual entry — `apps/web/src/pages/LandingPage.tsx`
3. ⬜ **로그인 후 `/home` 월드 허브** — 목록·검색·입장 모달 (AD-019, §26) — *현재는 데모용으로 `/store/popup_gucci_01` 직행*
4. ✅ React HUD: role → show/hide owner toolbar — `apps/web/src/pages/StorePage.tsx`
5. ⬜ 점주 **매장 만들기** 마법사 + `stores` description/thumbnail 마이그레이션
6. ⬜ RLS: owners UPDATE own store `map_config` 실제 에디터 연동 — Phase 3~4

### 데모 계정 만드는 법 (사용자 수동 작업)
1. Supabase 대시보드 → `popup-platform` → **Authentication → Users → Add user**
2. `demo@shopper.com` + 비밀번호 → Create (자동으로 role='shopper' profile 생성됨)
3. `demo@owner.com` + 비밀번호 → Create
4. Cursor에게 "demo@owner.com을 점주로 만들어줘"라고 요청 → 아래 SQL 실행됨:
```sql
update public.profiles
set role = 'owner', store_id = 'popup_gucci_01'
where email = 'demo@owner.com';
```

---

## 21. Testing Environments

> **Live URL · 호스팅 역할:** **§46**

### Web (Primary)
| Environment | Tool | Use |
|---|---|---|
| Local dev | `localhost:5173` (Vite) + `localhost:3000` (socket) | Daily development |
| Mobile layout | Chrome DevTools device mode | Responsive check |
| Staging | Vercel Preview URL | Pre-demo QA |
| **Investor demo** | Vercel Production URL | Pitch day |

### Mobile (Investor Demo)
| Environment | Tool | Use |
|---|---|---|
| **Phone browser** | Safari / Chrome — same Vercel URL | **Primary mobile demo** |
| Chrome DevTools | Device mode | Dev responsive layout |

### Mobile App (Post-Demo)
| Environment | Tool | Use |
|---|---|---|
| Expo Go | Real device | After `apps/mobile` built |
| TestFlight / APK | Beta | Post-demo |

**Mobile demo now:** Open Vercel URL on phone — no app install

### Backend
| Service | Dev | Staging/Demo |
|---|---|---|
| PostgreSQL | Supabase `popup-platform` | Same project (dev data only) |
| Redis | Local Docker or **Upstash** free tier | Upstash |
| Socket server | `npm run dev` in `server/` | **Railway** |

### Multiplayer Test
- Open 2+ browser tabs OR 1 browser + 1 phone
- Different `userId` each → same store → verify avatars + chat

### Supabase MCP (Cursor Agent)
- Project: `popup-platform` (`cvrtobxkvpcpcxrcspdp`)
- Agent can: apply migrations, execute SQL, generate types, check advisors
- **Never connect MCP to production data with real PII**

---

*Last updated: 2026-07-13 (Phase 1: Turborepo + Supabase 완료) by Cursor Agent*

---

## 23. Glossary — 쉬운 용어 설명

> Agent: 새 용어 도입 시 여기에 한 줄 추가. 사용자 대화 시 `(괄호 설명)` 형식 병행.

| 용어 | 쉬운 설명 |
|---|---|
| **Monorepo** `(모노레포)` | 웹·앱·서버 코드를 **하나의 Git 프로젝트** 안에 폴더로 나눠 두는 방식. 반대는 repo마다 따로 두는 **Multirepo**. |
| **Turborepo** `(터보레포)` | monorepo에서 **빌드·실행 순서를 자동 정리**해 주는 도구. 변경된 부분만 다시 빌드해서 **시간 절약**. |
| **Phaser.js** `(파저)` | 웹 브라우저에서 **2D 픽셀 게임** (캐릭터 이동, 맵) 을 그려 주는 엔진. |
| **Socket.io** `(소켓)` | 유저끼리 **실시간**으로 위치·채팅을 주고받게 하는 **전화선 같은 것**. |
| **Redis** `(레디스)` | **잠깐 쓰는 데이터** (지금 몇 명 접속 중, 좌표) 를 아주 **빠르게** 저장하는 메모리 DB. |
| **Supabase** `(수파베이스)` | **DB + 로그인 + 파일 저장** 을 웹에서 관리해 주는 서비스. PostgreSQL 기반. |
| **RLS** `(행 수준 보안)` | DB에서 **"이 유저는 자기 데이터만 본다"** 고 막는 규칙. |
| **Vercel** `(버셀)` | **웹사이트(React)** 를 인터넷에 올려 주는 호스팅. URL 하나로 데모 공유. **Hobby 플랜 = 무료**(개인·비상업용, 월 사용량 한도 있음). 상세는 §28. |
| **Railway** `(레일웨이)` | **Socket.io 서버** 처럼 24시간 켜져 있어야 하는 프로그램을 클라우드에 올리는 곳. **신규 Trial $5(30일 1회)** → 이후 **Free $1/월** 또는 **Hobby $5/월**. 상세는 §28·**§46**. |
| **Upstash** `(업스태시)` | **Redis를 클라우드로** 쓰게 해 주는 서비스. 로컬 Redis 설치 없이 URL 하나로 연결. 채널 인원·플레이어 좌표 캐시. **§46** |
| **GitHub** `(깃허브)` | **소스 코드 저장 + 버전 관리**. push하면 Vercel이 자동으로 웹을 다시 빌드. repo: `qotjdals147/popup-cube`. **§46** |
| **Expo / EAS** `(엑스포)` | **React Native 앱**을 Android·iOS로 빌드·배포하는 도구 (post-demo, §39). **§46** |
| **Mock** `(목)` | **가짜·연습용** — 예: 진짜 결제 없이 "결제됐다"고만 처리. |
| **Scaffold** `(스캐폴드)` | **뼈대만** 먼저 깔아 두는 것. 디테일은 나중. |
| **Deploy** `(배포)` | 만든 걸 **인터넷에서 쓸 수 있게** 올리는 것. |
| **Responsive** `(반응형)` | **폰·태블릿·PC 화면 크기**에 맞게 레이아웃이 자동으로 맞춰지는 것. |
| **game-core** `(게임 코어)` | 웹이든 나중 앱이든 **같이 쓸 게임 로직** 묶음. 한 번 만들면 재사용. |
| **service_role key** `(서버 전용 만능 키)` | Supabase에서 **모든 데이터에 접근 가능한 비밀 키**. 서버(`server/`)만 쓰고, 절대 웹/앱 코드에 넣으면 안 됨. |
| **anon / publishable key** `(공개 열쇠)` | 브라우저에서 써도 안전한 키. 대신 **RLS 규칙**이 실제 접근 범위를 막아줌. |
| **RLS 정책** `(데이터 접근 규칙)` | "이 사람은 이 줄(row)만 볼 수 있다" 를 DB가 강제하는 규칙. |
| **Trigger** `(자동 실행 규칙)` | "회원가입하면 → 자동으로 프로필 한 줄 만들어라" 같은 DB의 자동 반응. |
| **i18n** `(다국어)` | UI 문구를 언어별 파일로 분리해 두는 방식. 지금은 한국어만, 나중에 영어·일본어·자동번역 추가 가능. |
| **월드 허브** `(World Hub)` | 로그인 후 첫 화면. 여러 팝업 매장(픽셀 월드)이 카드로 보이고 검색·입장하는 곳. 로블록스 게임 목록과 비슷한 느낌. |
| **진열 조형물** `(Display Fixture)` | 매장에 두는 **상품 올려두는 가구** — 테이블·옷걸이·선반. 손님은 앞에서 상호작용해 그 위 상품만 봄 (AD-033). |
| **진열 슬롯** `(Display Slot)` | 조형물 위 **칸** (예: 테이블 3칸). 점주가 칸마다 상품을 넣고 순서를 바꿈. |
| **전체 상품** | 매장 **카탈로그 전체** 목록 버튼. **장바구니와 다름** (예전 이름: 「지금 쇼핑하기」). |
| **장바구니** | 담아 둔 상품·수량·결제 화면. HUD·헤더에 별도 버튼. |
| **HUD 바** `(하단 조작 바)` | 월드 화면 **아래 알약 모양 버튼 줄**. 시안: 상호작용·채팅·장바구니·전체상품 4칸 (AD-047 · Sprint 4-3). |
| **근접 알약** `(PlayProximityPill)` | 조형물 가까이 갔을 때 **짧은 가운데 알약** — 이름 + 「탭·상호작용」. 탭 = HUD 상호작용과 같음 (AD-049). |

---

## 24. Cursor Model Selection Guide

> Agent: 작업 착수 전 §0 브리핑에 **1순위 + 대안**을 아래 기준으로 제시.  
> 모델명은 Cursor 채팅 **모델 선택 메뉴**에 보이는 이름과 맞출 것.

### 사용 가능한 모델 (Cursor)

| 모델 | 쉬운 성격 | 적합한 작업 |
|---|---|---|
| **Claude Sonnet 5 Thinking** | 꼼꼼·설계·여러 파일 한 번에 | Monorepo 구조, Supabase 스키마, 아키텍처, 큰 기능 |
| **GPT-5.3 Codex** | 코드 생성·리팩터 강함 | 서버/API, 타입 많은 작업, 보일러플레이트 |
| **Composer 2.5 Fast** | 빠름·가벼운 반복 | UI tweak, 버그 수정, 작은 파일 수정 |
| **Claude Opus 4.8 Thinking** | 가장 깊은 추론 `(비용·시간 ↑)` | 막힌 버그, 보안·결제 설계, 복잡한 디버깅 |
| **GPT-5.5 / 5.6 Medium** | 균형 | 일반 질문, 중간 규모 수정 |
| **Grok 4.5 Fast** | 속도 위주 | 단순 검색·짧은 답변 `(대규모 스캐폴드 비추)` |

### 작업 유형별 추천 (POP-UP CUBE)

| 작업 | 1순위 | 대안 |
|---|---|---|
| Turborepo + 폴더 구조 잡기 | **Claude Sonnet 5 Thinking** | GPT-5.3 Codex |
| Supabase 마이그레이션 + RLS | **Claude Sonnet 5 Thinking** | GPT-5.3 Codex |
| Phaser 게임 월드 MVP | **GPT-5.3 Codex** | Claude Sonnet 5 Thinking |
| 랜딩·HUD React UI | **Composer 2.5 Fast** | GPT-5.3 Codex |
| Socket.io 버그·채널 이슈 | **Claude Sonnet 5 Thinking** | Opus 4.8 Thinking (안 풀릴 때) |
| HANDOFF·설계 Q&A only | **현재 모델** | — |
| 투자자 데모 전 polish | **Composer 2.5 Fast** | Sonnet 5 Thinking |

### 브리핑 템플릿 (복사용)

```markdown
## 작업 브리핑
**할 일:** (한 줄)
**범위:** (파일/기능 목록)
**안 할 일:** (이번에 제외)

**추천 모델:** ○○ — (이유)
**대안:** ○○ — (이유)

작업 시작할까요?
```

---

## 25. Internationalization (i18n) — AD-017

### 현재 (한국 출시)
- **기본 언어:** `ko` (한국어)
- **문구 위치:** `apps/web/src/i18n/ko.ts`
- **사용법:** `t('store.hud.explore')` → `"탐색"`
- **규칙:** 사용자에게 보이는 텍스트는 **컴포넌트에 직접 쓰지 말고** `i18n/ko.ts`에 추가

### 향후 다국어 확장 (post-launch / 글로벌)
| 단계 | 방법 |
|---|---|
| **Phase A** | `en.ts`, `ja.ts` 등 동일 키 구조 파일 추가 |
| **Phase B** | `LocaleContext` + 설정/브라우저 언어 감지 |
| **Phase C** | 자동 번역 API (Google/DeepL)로 `ko.ts` 키 기준 초안 생성 → human review |
| **Phase D** | `packages/shared/src/i18n/`로 이동 → 웹·앱 공유 |

### 자동 번역 고려 시 주의
- **브랜드명·버튼 짧은 문구** — 기계번역 후 반드시 검수
- **게임 내 채팅** — 유저 생성 콘텐츠; 실시간 번역은 별도 기능 (post-demo)
- **DB 저장 데이터** (상품명, 매장명) — 점주가 입력한 언어 유지; 표시 시 locale fallback

### Agent 규칙
- 새 UI 추가 시 **반드시** `ko.ts`에 키 추가 + `t()` 사용
- 영어 UI 문구를 사용자-facing에 넣지 않음 (코드·변수명·주석은 영어 OK)

---

## 26. World Hub — 매장 홈·탐색·생성·입장 (AD-019)

> **쉬운 설명:** 로그인하면 **"여러 팝업 매장이 뜨는 로비"**가 먼저 보이고,  
> 카드를 누르면 **소개 팝업**이 뜬 뒤 **입장하기**로 픽셀 월드에 들어감.  
> 점주는 여기서 **새 매장(=픽셀 월드)을 만드는** 것부터 시작.

**레퍼런스 UX:** 로블록스 게임 목록, 메이플스토리 월드 — 제작자 월드 탐색·검색·입장

### 전체 사용자 플로우

```
[랜딩] 쇼핑하기 / 매장 관리 로그인
         ↓
    [로그인 성공]
         ↓
    [/home 월드 허브]  ←── 로그인 후 기본 화면
    · 매장 카드 그리드 (썸네일 + 이름 + 간단 정보)
    · 검색 (이름·태그 — MVP는 이름 ILIKE)
    · (점주만) [+ 매장 만들기]
         ↓
    카드 클릭
         ↓
    [입장 모달]
    · 대표 이미지 (thumbnail)
    · 매장 이름 + 설명 (description)
    · 방문자 수 / 팝업 기간 (optional, post-MVP)
    · [입장하기]  [닫기]
         ↓
    [/store/:storeId]  픽셀 월드 (Phaser + 멀티플레이)
```

### 점주 — 매장 만들기 `(픽셀 월드 생성의 시작)`

**"매장 만들기" = 빈 픽셀 월드 프로젝트 생성.**

| 단계 | 화면 | 입력·동작 |
|---|---|---|
| 1 | **기본 정보** | 팝업 스토어 **이름** (필수) |
| 2 | | **대표 이미지** 업로드 (필수) — 홈 카드·입장 모달용 |
| 3 | | **스토어 설명** (필수, textarea) |
| 4 | **월드 만들기** | 빈 `map_config`로 에디터 진입 — 타일·오브젝트 배치 (⬜ Phase 4, 아직 없음) |
| 5 | **출시** | (데모: 3단계 완료 즉시 자동 `published`) / (정식: 아래 "정식 출시 시 임시저장/출시 UX" 참고 |

- 생성 시: `stores` row + `profiles.store_id` 연결 + `role=owner` (이미 owner면 store_id만 갱신)
- **데모 범위 (AD-021):** GUCCI는 시드 데이터; 점주 만들기는 **폼 + Storage 업로드**까지 live-simple, 생성 즉시 `status: 'published'`로 바로 홈에 노출(ISS-015 수정, 2026-07-13). 풀 에디터·draft 단계는 Phase 4로 연기.

### 🔜 정식 출시 시 "임시저장(draft) / 출시(published)" UX — 반드시 재도입 (AD-021, User 요청 2026-07-13)

> **데모는 지금처럼 생성 즉시 노출로 충분하지만, 정식 개발 때는 아래 방향으로 점주가 불편하지 않게 다시 설계해야 함.**

- **임시저장이 기본값**: 매장(=픽셀 월드)을 처음 만들면 `status: 'draft'`로 시작. 꾸미는 중간에 손님에게 미완성 상태로 노출되지 않아야 함.
- **계속 편집 가능**: draft 상태에서도 몇 번을 나갔다 들어와도 이어서 편집 가능 — 에디터에 자동저장(autosave) 또는 명시적 "저장" 버튼 필요.
- **draft도 점주 눈에는 잘 보여야 함**: 홈 화면(또는 "내 매장" 별도 영역)에 draft 매장도 카드로 보이되, "임시저장 중" 배지를 달아 손님용 공개 목록과 구분. 점주가 "내가 만든 매장이 사라졌나?" 헷갈리지 않게 하는 것이 핵심(이번 ISS-015가 실제로 이 혼란이었음).
- **출시(publish) 버튼**: 점주가 준비됐다고 판단하면 명시적으로 "출시하기"를 눌러야 `published`로 전환되고 그때부터 손님 홈 목록에 노출.
- **출시 후에도 재편집 가능**: 출시된 매장도 점주는 계속 편집할 수 있어야 함(예: 시즌 상품 교체) — 편집 내용을 바로 반영할지, "임시저장 → 재출시" 2단계로 할지는 에디터 설계 시 결정.
- **매장 여러 개 관리**: 데모의 "매장 1개 = store_id 단일 포인터" 단순화도 정식에서는 점주가 draft/published 여러 매장을 동시에 관리할 수 있게 확장 검토 (현재 §26 "정책 결정"의 임시 제약).
- **연동 시점**: Phase 4 에디터 작업과 함께 진행 (§2 로드맵), 에디터 없이 draft 단계만 먼저 넣지 않기 — 그럼 지금과 같은 막다른 흐름 문제가 재발함.

### 소비자 — 탐색·입장

1. 홈에서 카드 스크롤 / 검색
2. 관심 매장 카드 클릭
3. **모달**에서 대표 이미지·설명 확인
4. **입장하기** → 해당 월드 로딩 → 기존 HUD (탐색·채팅·쇼핑 등)

- 월드 안에서 **홈으로 돌아가기** 버튼 필요 (헤더 또는 HUD)
- 직링크 `/store/:id`는 유지 가능 — 공유 URL용; 비로그인 시 로그인 후 해당 매장 모달 또는 바로 입장 (정책은 구현 시 확정)

### UI 와이어프레임 (홈)

```
┌──────────────────────────────────────────────────────────┐
│  POP-UP CUBE          [🔍 매장 검색...]        [로그아웃] │
├──────────────────────────────────────────────────────────┤
│  인기 팝업 · 새로 열린 매장 · (점주) [+ 매장 만들기]      │
│                                                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                    │
│  │ 썸네일   │  │ 썸네일   │  │ 썸네일   │   ...             │
│  │ GUCCI   │  │ Brand B │  │ Brand C │                    │
│  │ POP-UP  │  │         │  │         │                    │
│  └─────────┘  └─────────┘  └─────────┘                    │
└──────────────────────────────────────────────────────────┘
```

### UI 와이어프레임 (입장 모달)

```
        ┌─────────────────────────────┐
        │  [대표 이미지 — 큰 썸네일]    │
        │                             │
        │  GUCCI POP-UP CUBE          │
        │  ─────────────────────      │
        │  스토어 설명 텍스트...        │
        │                             │
        │   [  입장하기  ]  [ 닫기 ]   │
        └─────────────────────────────┘
```

### 라우트

| Path | 역할 | 상태 |
|---|---|---|
| `/` | 랜딩 | ✅ |
| `/login?role=shopper\|owner` | 로그인 → 성공 시 `/home` | ✅ (기존 `/store/popup_gucci_01` 직행에서 변경) |
| `/home` | **월드 허브** — 카드 그리드·검색·입장 모달 | ✅ P0 구현 (`HomePage.tsx`) |
| `/store/create` | 점주 매장 만들기 폼 | ✅ P1 구현 (`CreateStorePage.tsx`) — 성공 시 `/store/:storeId`로 바로 이동 |
| `/store/:storeId` | 픽셀 월드 플레이 | ✅ 기존 StorePage + 홈으로 돌아가기 버튼 추가 |
| `/store/:storeId/edit` | 점주 에디터 | ✅ Sprint 2 MVP (`StoreEditPage.tsx`) |

### DB / API (구현 완료 — P0)

**`stores` 마이그레이션 적용됨** (`add_store_home_hub_fields`, 2026-07-13):
```sql
ALTER TABLE stores
  ADD COLUMN description TEXT,
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published'));
-- 홈 목록 조건: is_active = true AND status = 'published'
```
GUCCI 시드에 description·thumbnail_url·`status='published'` 반영됨.

**조회 방식 — REST API 대신 클라이언트 직접 조회 (P0 결정):**
- `apps/web/src/lib/stores.ts`의 `listPublishedStores(search)` / `getStoreSummary(id)`가 **`supabase-js` anon key로 직접 조회**
- 기존 `stores_public_read` RLS(`is_active = true`) + `status` 필터로 안전하게 공개 가능
- 별도 `GET /api/stores` REST 엔드포인트는 **만들지 않음** (P0 범위); 방문자 수·채널 정보 등 서버 로직이 필요해지면 추후 추가 검토
- 검색은 `ilike`로 이름 부분 일치 (MVP)

**Storage 업로드 — P1 구현 완료:**
- Supabase Storage 버킷 `store-assets` 생성 (`public: true` — `/storage/v1/object/public/...` URL로 누구나 조회 가능)
- RLS: `store_assets_owner_insert`/`_update`/`_select` — 본인 `auth.uid()` 폴더(`{uid}/파일명`)에만 업로드/수정/목록 조회 가능 (advisor 권고에 따라 광범위 public SELECT 대신 소유자 한정 — public URL 열람 자체는 bucket public 플래그로 별도 보장됨)
- 업로드 경로: `store-assets/{ownerUid}/{timestamp}.{ext}`
- GUCCI 시드의 `thumbnail_url`은 여전히 실제 파일 없는 고정 URL(placeholder) — `<img onError>`로 매장 이름 첫 글자 fallback

**매장 생성 — DB 함수 `create_owner_store` (원자적 처리, `auto_publish_owner_created_stores` 마이그레이션으로 2026-07-13 갱신):**
```sql
CREATE OR REPLACE FUNCTION public.create_owner_store(
  p_id VARCHAR, p_name VARCHAR, p_description TEXT, p_thumbnail_url TEXT
) RETURNS VARCHAR LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'AUTH_REQUIRED'; END IF;
  INSERT INTO public.stores (id, name, description, thumbnail_url, owner_id, status, map_config)
  VALUES (p_id, p_name, p_description, p_thumbnail_url, auth.uid(), 'published', -- (§26 정식 출시 시 'draft'로 되돌릴 예정, AD-021)
    jsonb_build_object('storeId', p_id, 'mapSize', jsonb_build_object('width', 20, 'height', 20),
      'layers', jsonb_build_object('floor', '[]'::jsonb, 'objects', '[]'::jsonb)));
  UPDATE public.profiles SET role = 'owner', store_id = p_id, updated_at = now() WHERE id = auth.uid();
  RETURN p_id;
END; $$;
```
- **SECURITY INVOKER**(기본값) — 호출자의 RLS를 그대로 따름 (SECURITY DEFINER로 우회하지 않음, Supabase 보안 체크리스트 준수)
- `search_path = public` 고정 (advisor 경고 해결)
- `GRANT EXECUTE ... TO authenticated`
- 컬럼 자체의 `DEFAULT 'draft'`는 그대로 남겨둠 — 정식 출시 때 이 함수만 `'draft'`로 되돌리면 §26 "정식 출시 시 임시저장/출시 UX"를 그대로 적용 가능
- **RLS 추가:** `stores_owner_insert ON stores FOR INSERT WITH CHECK (auth.uid() = owner_id)`
- **테이블 GRANT 추가:** `GRANT INSERT, UPDATE ON public.stores TO authenticated` — RLS 정책만으론 부족했음(기존 SELECT grant 이슈와 동일 원인: "Automatically expose new tables" OFF); `execute_sql`로 `SET LOCAL ROLE authenticated` + `request.jwt.claims` 시뮬레이션 후 트랜잭션 롤백으로 검증 완료 (실제 데이터 변경 없이 확인)
- 클라이언트: `apps/web/src/lib/storeCreate.ts`의 `createStore()`가 업로드 → `supabase.rpc('create_owner_store', ...)` 순서로 호출
- 생성 후 `AuthContext.refreshProfile()`로 로컬 role/store_id 즉시 반영 → `/store/:storeId`로 이동

**정책 결정 (§26 P1, 2026-07-13 수정):**
- **누구나** 로그인 상태면 매장 생성 가능(사전 `role=owner` 불필요) — 생성 행위 자체가 owner로 승격시킴
- **매장 개수 제한 없음** — `profiles.store_id`는 항상 "가장 최근에 만든/관리 중인 매장"을 가리키는 단일 포인터로 단순화 (다중 매장 운영은 post-demo)
- **새로 만든 매장은 처음부터 `status: 'published'`** (ISS-015로 draft 방식 폐기) — 지금은 꾸미는 에디터(Phase 4)가 없어서 "출시 전 숨김" 단계가 의미 없었고, 만들자마자 홈에 안 보이는 게 사용자에게 버그처럼 느껴졌음. 에디터가 생기면 그때 다시 draft 단계를 도입해도 됨.

### 홈택스식 로그인과의 관계 (AD-013 + AD-019)

| | 소비자 | 점주 |
|---|---|---|
| 로그인 입구 | 쇼핑하기 | 매장 관리 |
| 로그인 후 | **동일 `/home`** | **동일 `/home`** + 매장 만들기 버튼 |
| 월드 안 UI | 기본 HUD | **동일 HUD** + 점주 툴바 (본인 매장일 때만) |

→ 로그인 종류는 다르지만, **탐색 화면(홈)은 같고** 점주만 **만들기·편집 권한**이 추가됨.

### 데모(MVP) 구현 우선순위

| 우선순위 | 기능 | 상태 |
|---|---|---|
| P0 | `/home` + GUCCI 카드 1개 이상 | ✅ 완료 |
| P0 | 입장 모달 (이미지·설명·입장하기) | ✅ 완료 (`StoreEnterModal.tsx`) |
| P1 | 검색 (이름) | ✅ 완료 (250ms debounce + `ilike`) |
| P1 | 점주 매장 만들기 폼 (3필드) | ✅ 완료 — `/store/create`, Storage 업로드, `create_owner_store` RPC |
| P1 | 생성 즉시 홈에 노출 (`status: published`) | ✅ 완료 (ISS-015 수정, 2026-07-13) |
| P2 | 카테고리·인기 정렬·방문자 수 배지 | ⬜ post-demo |

### i18n 키 (`ko.ts`) — 적용됨

`home.title`, `home.searchPlaceholder`, `home.createStore`, `home.loading`, `home.errorLoad`, `home.emptyTitle`, `home.emptySubtitle(Search)`,  
`enterModal.enter`, `enterModal.close`, `enterModal.noDescription`,  
`createStore.title/subtitle/nameLabel/namePlaceholder/thumbnailLabel/thumbnailHint/thumbnailChange/thumbnailSelect/descriptionLabel/descriptionPlaceholder/submit/submitting/errorRequired/errorThumbnailTooLarge/errorGeneric`,  
`store.backToHome`

### 현재 코드와의 차이 (남은 기술 부채)

- **매장 개수 제한 없음** — 같은 owner가 여러 번 만들면 `profiles.store_id`가 매번 최신 매장으로 바뀜(의도된 단순화, 위 "정책 결정" 참고)
- **비로그인 직링크 `/store/:id`** — 아직 로그인 가드 없음 (StorePage 자체에 리다이렉트 미구현)
- **REST `/api/stores` 목록 엔드포인트** — 만들지 않기로 결정(위 참고); 필요해지면 재검토
- **환불/삭제 시 Storage 파일 정리 없음** — 매장 삭제 기능 자체가 없어 지금은 해당 없음; 나중에 추가 시 orphan 파일 정리 로직 필요
- **매장 "삭제" UI 없음** — 테스트로 만든 중복 매장을 사용자가 스스로 지울 방법이 없음(현재는 SQL로만 제거 가능)

### 버그 수정 기록 (2026-07-13)

- **ISS-014 (로그인 2번 해야 진입되는 문제)**: `AuthContext.signInWithPassword`가 로그인 시작 시 `loading` 플래그를 세팅하지 않던 게 원인. 로그인 API 호출이 끝나고 `navigate('/home')`이 실행되는 시점과, `onAuthStateChange`가 감지해 `profiles`(role/store_id)를 다 읽어오는 시점 사이에 시간차가 있는데, 그 사이의 "아직 못 읽음" 상태를 `HomePage`/`CreateStorePage`의 가드가 "로그인 안 된 사용자"로 착각해 `/`로 돌려보냈음 → 재로그인해야 그때는 이미 profile이 로드돼 있어서 성공. **수정**: 로그인 시도 시작 시 `loading: true`로 바꾸고, `profiles` 로드가 끝날 때까지(`onAuthStateChange → loadProfile`) `true`를 유지하도록 변경. 이제 홈 이동은 profile이 다 로드된 뒤에만 "로그인 완료"로 판단함.
- **ISS-015 (매장 만들기 후 홈에 안 보임)**: 새 매장이 `status: 'draft'`로 생성되는데 홈 목록은 `status: 'published'`만 보여줘서 발생. 아직 "출시" 버튼도 없어서 draft 상태에서 빠져나올 방법이 없는 막다른 흐름이었음. **수정**: `create_owner_store` 함수가 처음부터 `status: 'published'`로 매장을 생성하도록 변경(에디터가 없는 지금은 "출시 전 숨김" 단계가 불필요). 기존에 테스트로 만들어진 draft 매장 2개("Mr. Sim & Bee" 중복 2건)도 published로 일괄 전환.

*Last updated: 2026-07-13 (로그인 재시도 버그 + 매장 미노출 버그 수정: ISS-014, ISS-015) by Cursor Agent*

---

## 27. Owner Pixel Assets & Purchase-Gated Avatar Equipment (AD-020)

> **핵심:** 소비자에게 이미지 변환이나 복사 가능한 비밀 코드를 맡기지 않는다.  
> 점주가 상품 등록 중 표준 픽셀 아이템을 만들고, 구매가 확인된 사용자 계정의 옷장에 서버가 자동 지급한다.

### 기존 방식의 문제

1. 소비자가 직접 이미지·프롬프트·코드를 다뤄야 해 불편하고 민원이 많아짐
2. 프롬프트와 모델 결과가 달라 크기·위치·화풍이 불규칙함
3. 모든 소비자가 AI API를 사용하면 비용과 악용 요청이 급증함
4. 타 브랜드·미구매 상품 이미지를 임의 변환해 장착하면 저작권 및 구매자 형평성 문제 발생
5. 복사 가능한 아이템 코드는 구매자가 다른 사람에게 전달할 수 있어 **소유권 증명 수단이 될 수 없음**

### 확정 원칙

| 구분 | 권한·처리 |
|---|---|
| **상품용 아바타 아이템 생성** | 해당 스토어 점주만 가능; 상품 등록 과정에서 생성·검수·연결 |
| **소비자** | 변환 API 사용 X, 코드 붙여넣기 X; 구매 후 **내 옷장에 자동 지급** |
| **장착 승인** | 클라이언트가 아니라 서버가 로그인 사용자 + 구매/지급 이력 + 부위 호환을 확인 |
| **매장 인테리어 자산** | 점주가 자기 스토어에서 생성·재사용 가능; 한 번 만든 자산은 API 재호출 없이 계속 사용 |
| **임의 코드·파일** | DB에 없거나 소유권이 없으면 장착 거절 |

### “코드 공유” 방지 — 권장안

**소비자에게 전달 가능한 비밀 코드를 발급하지 않는다.** 구매 완료 트랜잭션에서 서버가 바로:

1. `orders` / `order_items`에 구매 기록 생성
2. 연결된 `avatar_item_id`를 `user_inventory`에 지급
3. 옷장 UI에 자동 표시
4. 장착 요청 시 서버 함수가 `auth.uid()`의 inventory를 조회
5. 소유권이 없으면 **“구매 또는 지급 내역을 확인할 수 없어 장착할 수 없습니다.”** 표시

아이템의 픽셀 스프라이트는 `avatar_items`/Storage에 **한 번만** 저장한다. 구매자마다 저장하는 것은 큰 이미지가 아니라 아래와 같은 작은 소유권 행 하나뿐이다.

```text
user_inventory:
  user_id, avatar_item_id, order_item_id, acquired_at, revoked_at
```

따라서 구매자마다 다른 코드를 만들 필요가 없고, DB 메모리 낭비도 크지 않다. 오히려 이 행은 환불·취소·고객지원·중복 지급 방지를 위해 반드시 필요한 구매 권리 증명이다.

> **예외:** 오프라인 구매처럼 계정과 결제가 바로 연결되지 않을 때만 1회용 교환권을 고려한다. 원문 코드는 저장하지 않고 hash·만료일·사용자 귀속·사용 시각을 저장하며, 한 번 사용하면 폐기한다.

### 서버 장착 검증 (클라이언트 신뢰 금지)

`equip(item_id, requested_slot)` 요청을 받으면 서버/RPC가 원자적으로:

1. 로그인 세션 확인
2. `user_inventory(user_id, item_id)` 활성 소유권 확인
3. `avatar_items.status = active` 및 판매/지급 취소 여부 확인
4. 아이템의 지정 `slot`과 요청 부위 일치 확인
5. 같은 부위의 기존 아이템 해제 후 `avatar_equipment` 갱신
6. 성공한 장착 상태만 클라이언트에 반환

**절대 금지:** 브라우저가 보낸 `user_id`, “구매함=true”, 픽셀 배열을 그대로 신뢰하거나 service_role 키를 웹에 노출.

### 부위 슬롯과 렌더링 규격

초기 슬롯 예시:

`hair`, `head_accessory`, `face_accessory`, `top`, `bottom`, `outerwear`, `shoes`, `back`, `hand`

- 아이템은 서버가 정한 **한 개의 주 슬롯**을 가짐
- 부위별 앵커 좌표 `(anchor_x, anchor_y)`와 `layer_order`를 고정
- `top` 위에 `outerwear`, 몸 뒤에 `back` 등 합성 순서를 고정
- 방향/걷기 애니메이션이 필요하므로 임의 `{x,y,color}` 배열만 받지 말고 **정해진 크기·프레임의 스프라이트 시트**로 변환
- 생성 결과가 규격을 통과하지 못하면 점주가 수정/재생성 후 출시

### 점주용 변환 흐름

#### A. 판매 상품 → 아바타 아이템

`상품 이미지 업로드 → 권리 보유 확인 → 부위 선택 → 변환 → 표준 규격 검사 → 점주 미리보기/승인 → 상품 연결 → 출시`

- 상품 등록 시 아바타 아이템 연결을 필수로 할지는 카테고리별 결정: 의류·장신구는 필수, 식품·생활용품은 선택/제외
- 점주는 자기 스토어 상품에만 생성 가능
- 출시된 자산에 변경 이력이 필요하면 version을 올리고 기존 구매자의 권리는 유지

#### B. 매장 인테리어 자산

`소재/가구 사진 업로드 → 변환 → 점주 자산함 저장 → 자기 월드에서 횟수 제한 없이 재배치`

- **사용 횟수는 무제한**이지만 변환 API 호출 자체는 비용·악용 방지를 위해 rate limit/공정사용량 적용
- 같은 이미지는 hash로 중복 감지해 기존 결과 재사용
- 단순 픽셀화는 우선 **Canvas downscale + 고정 팔레트**로 로컬 처리하고, AI는 배경 제거·형태 보정이 필요할 때만 사용

### API 비용 절감

1. 변환 API는 `role=owner` + 본인 `store_id`만 호출
2. 이미지 hash 캐시 — 동일 입력·설정은 기존 결과 반환
3. 점주 미리보기 단계는 저해상도/저비용 모델, 최종 승인 때만 고품질 처리
4. 점주·스토어별 호출량과 비용 기록, rate limit 및 월간 공정사용량
5. 소비자는 생성 API를 전혀 호출하지 않고 저장된 스프라이트만 렌더링
6. 가능한 변환은 Canvas 기반 결정론적 처리로 통일해 결과 편차와 비용 동시 축소

### 저작권·브랜드 보호

점주 전용으로 제한하는 것만으로 저작권 문제가 완전히 해결되지는 않는다.

- 업로드 시 **“본 이미지·상품을 등록할 권리가 있습니다”** 확인
- 상품·스토어 소유 관계 기록 및 원본 파일 hash/업로드 로그 보관
- 출시 전 자동 필터 + 필요 시 관리자 검수
- 신고·비공개·삭제 절차와 반복 위반 점주 제재
- 타 브랜드 이름/로고 무단 사용은 약관과 운영 정책으로 별도 통제

### 예정 데이터 관계

```text
stores ──< products ──1 avatar_items ──< user_inventory >── profiles
                    │                         │
                    └──< order_items >────────┘

profiles ──1 avatar_equipment (slot별 현재 item_id)
stores ──< store_assets
stores ──< asset_conversion_jobs
```

### 환불·양도 정책 (구현 전 확정 필요)

- 기본 권장: 환불 완료 시 해당 `user_inventory.revoked_at` 설정 후 자동 해제
- 이미 동일 아이템을 다른 주문/이벤트로도 보유했다면 활성 소유권이 하나라도 있을 때 유지
- 계정 간 양도·선물은 초기에는 금지; 나중에 공식 선물 기능을 별도 거래 기록으로 구현

### 사용자 알림 문구 예정 (`ko.ts`)

- `inventory.purchaseRequired`: `구매 또는 지급 내역을 확인할 수 없어 장착할 수 없습니다.`
- `inventory.itemUnavailable`: `현재 사용할 수 없는 아이템입니다.`
- `inventory.wrongSlot`: `이 부위에는 장착할 수 없는 아이템입니다.`
- `inventory.equipSuccess`: `아이템을 장착했습니다.`

### 상태

- **설계 확정 / 미구현**
- 실제 Supabase 테이블·RLS·서버 RPC는 마이그레이션 전에 별도 브리핑 및 사용자 승인 필요
- 사용자 제공 이미지의 `{x,y,color}` 예시는 개념 검증 자료로 유지하되, 운영 아이템은 표준 스프라이트 시트 규격을 사용

---

## 28. Deployment — Vercel / Railway 역할 (쉬운 설명)

> **언제 읽나:** "배포가 뭐지?", "Vercel/Railway가 왜 필요하지?" 질문 시.  
> **상태 (2026-07-24):** **Vercel Live** ✅ — https://popup-cube-web.vercel.app · Railway `server/` ✅ (소켓 URL은 §46·`DEPLOY.md`).  
> **전체 호스팅 맵(모든 서비스·앞으로 필요한 것):** **§46** ← 여기서 시작해도 됨.

### 지금 상태 vs 배포 후

| | 지금 (로컬) | 배포 후 |
|---|---|---|
| **웹 화면** | `http://localhost:5173` (내 PC에서만) | `https://xxxx.vercel.app` (누구나 접속) |
| **실시간 서버** | `http://localhost:3000` (내 PC 켜 있어야 함) | `https://xxxx.up.railway.app` (24시간 켜짐) |
| **DB/로그인** | Supabase 클라우드 (이미 온라인) | 동일 |
| **Redis** | Upstash 클라우드 (이미 온라인) | 동일 |

**비유:** 지금은 "내 집 거실에서만 보여주는 데모"이고, 배포하면 "인터넷에 간판을 달아 누구나 들어올 수 있는 매장"이 되는 것.

### 각 서비스 역할 (POP-UP CUBE 기준)

| 서비스 | 올리는 것 | 이 프로젝트에서 하는 일 |
|---|---|---|
| **Vercel** | `apps/web` (React + Vite) | 랜딩, 로그인/회원가입, 홈(매장 목록), 매장 입장 화면, 채팅 UI, 장바구니 UI 등 **손님이 보는 화면 전체** |
| **Railway** | `server/` (Express + Socket.io) | 캐릭터 실시간 이동 동기화, 채널 인원 수, 채팅 — **매장 안에서 사람들이 동시에 움직이고 말하는 걸 중계** |
| **Supabase** | (이미 클라우드) | 회원 DB, 매장/상품 데이터, 로그인, 파일(이미지) 저장 |
| **Upstash Redis** | (이미 클라우드) | "지금 이 채널에 몇 명?" 같은 **초고속 임시 메모** |

**왜 둘 다 필요한가**
- **Vercel만** 있으면 → 화면은 보이지만, 다른 사람 캐릭터/채팅/인원수가 안 될 수 있음
- **Railway만** 있으면 → 실시간 서버는 돌아가도, 손님이 볼 **웹 화면 주소**가 없음
- 그래서 **Vercel(웹) + Railway(실시간 서버)** 조합이 필요

### 배포할 때 서로 연결하는 방법 (나중에 할 일)

1. **Vercel**에 `apps/web` 배포 → URL 예: `https://popup-cube.vercel.app`
2. **Railway**에 `server/` 배포 → URL 예: `https://popup-cube-server.up.railway.app`
3. **Vercel 환경변수** `VITE_SOCKET_SERVER_URL` = Railway URL (웹이 실시간 서버를 찾게)
4. **Railway 환경변수** `WEB_ORIGIN` = Vercel URL (CORS — 다른 사이트에서 오는 요청 허용)
5. Supabase / Upstash 키는 각각 Vercel·Railway에 동일하게 설정

### 무료 플랜 있나? (2026-07-13 기준 — 공식 문서 확인)

#### Vercel — **있음 (Hobby = 무료)**

| 항목 | 내용 |
|---|---|
| **플랜명** | Hobby (예전 Free tier와 유사) |
| **가격** | **$0 / 영구 무료** |
| **용도 제한** | **개인·비상업(non-commercial) 프로젝트** — 투자자 데모·상업 서비스는 Pro($20/월) 필요할 수 있음 (공식 Fair Use Guidelines 참고) |
| **대표 한도** | Fast Data Transfer 월 ~100GB, Function 호출 월 ~100만 회 등 (초과 시 해당 기능 일시 정지, 추가 구매 불가) |
| **데모 적합성** | **웹 화면 데모 URL 만들기에는 보통 충분** — 트래픽이 폭주하지 않는 투자자 시연 규모 |

공식: [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby), [Pricing](https://vercel.com/pricing)

#### Railway — **완전 무제한 무료는 아님. Trial + 소액 Free + 유료**

| 플랜 | 가격 | 크레딧 | 비고 |
|---|---|---|---|
| **Trial** (신규 1회) | $0 | **$5 일회성** (가입 후 30일 내) | 처음 배포 테스트·짧은 데모에 적합 |
| **Free** | $0/월 | **$1/월** (이월 안 됨, 매달 리셋) | 아주 작은 앱 1개 수준. 프로젝트 1개, 서비스 3개, RAM 0.5GB/서비스 등 제한 |
| **Hobby** | **$5/월** (최소 요금) | $5 사용량 포함 | 실시간 서버(Socket.io)를 **안정적으로 24시간** 돌리려면 데모 이후 이쪽이 현실적 |
| **Pro** | $20/월~ | $20 사용량 포함 | 팀·본격 운영용 |

**주의 (Railway + 우리 프로젝트)**
- Socket.io 서버는 **항상 켜져 있어야** 해서, Free의 **$1/월**만으로는 금방 소진되거나 부족할 수 있음
- **투자자 데모 2~3주**만 필요하면 → Trial $5로 시작해 보고, 기간/크레딧 부족 시 Hobby $5/월 전환 검토
- Trial 종료 후 아무 플랜도 없으면 워크로드가 **중지**될 수 있음 (공식 문서: 30일 후 Free로 전환 또는 업그레이드)

공식: [Railway Pricing Plans](https://docs.railway.com/pricing/plans), [Free Trial](https://docs.railway.com/pricing/free-trial)

#### Supabase / Upstash (참고)

| 서비스 | 무료 여부 | 데모 시 |
|---|---|---|
| **Supabase** | Free tier 있음 (이미 `popup-platform` 사용 중) | 현재 프로젝트로 계속 가능 |
| **Upstash Redis** | Free tier 있음 (이미 REDIS_URL 설정됨) | 채널 인원 소규모 데모에 보통 충분 |

### 투자자 데모 비용 감 (대략)

| 시나리오 | 예상 |
|---|---|
| **최소 (짧은 Trial 기간 안에 데모)** | Vercel $0 + Railway Trial $0 + Supabase/Upstash Free ≈ **$0** |
| **데모 기간이 Trial 넘김 / 서버 계속 켜둠** | Vercel $0 + Railway Hobby **$5/월** + Supabase/Upstash Free ≈ **월 $5 전후** |
| **상업·본격 운영** | Vercel Pro 검토 + Railway Hobby/Pro + Supabase 유료 검토 |

### "4개 서비스 = 4개 비용?" — 아니요, 단계별로 다름 (User 질문 2026-07-13)

**핵심:** 역할 4개(DB/캐시/실시간서버/웹화면)는 정식 출시에도 그대로 필요하지만, **"4개 다 처음부터 유료"는 아님.** 무료 플랜으로 시작해서 사용자가 늘어나는 만큼만 단계적으로 올리는 게 일반적.

| 서비스 | 데모 (지금~2·3주) | 정식 출시 초기 (사용자 적을 때) | 사용자 많아지면 |
|---|---|---|---|
| **Supabase** | Free (현재 사용 중) | Free로 시작 가능 | Pro **$25/월~** (DB 용량·백업·성능) |
| **Upstash Redis** | Free (현재 사용 중) | Free **월 50만 Commands** — 이동 좌표를 매 프레임 Redis에 쓰면 개발 중 금방 소진(ISS-024). 패치 후 500ms 스로틀 적용 | 사용량 기반 유료 (동시 접속 규모에 따라) |
| **Vercel** | Free (Hobby) | Hobby는 **비상업 한정** — 상업 서비스는 Pro **$20/월** 필요 | Pro + 사용량 추가 |
| **Railway** | Trial $5 → 짧으면 $0 | **Hobby $5/월~** (실시간 서버 24시간 상시 가동은 사실상 필수 지출) | Pro $20/월~ (트래픽 따라) |
| **월 합계 감** | **$0 ~ $5** | **$5 ~ $30 전후** | 매출 규모에 맞춰 증가 (그때는 수익 발생 단계) |

**주의점**
- **Railway가 가장 먼저 유료가 됨** — Socket.io 서버는 항상 켜져 있어야 해서 무료 크레딧($1/월)으로는 부족
- **Vercel Hobby는 "비상업" 조건** — 실제 판매가 일어나는 정식 서비스면 Pro 전환이 규정상 맞음
- Supabase/Upstash는 무료 한도가 넉넉한 편이라 초기엔 그대로 가고, 사용자 증가 시 전환

**인프라 외에 정식 출시 때 추가로 드는 것 (인프라 4개와 별개)**
| 항목 | 비용 감 |
|---|---|
| **결제 PG** (토스페이먼츠·카카오페이 등) | 결제액의 수수료 % (§7 Pending User Input — 후보 미정) |
| **도메인** (`popupcube.co.kr` 등) | 연 1~2만 원대 |
| **앱스토어 출시** (post-demo, Expo 앱) | Apple $99/년, Google $25 1회 + 인앱결제 수수료 |
| **AI 이미지 변환 API** (점주 픽셀 변환, AD-020) | 호출량 기반 — 점주 전용 제한 + 캐싱으로 절감 설계됨 |

### 배포 타이밍 (권장)

1. **지금:** 로컬에서 기능 완성 (상품/장바구니, 월드 UX 등)
2. **데모 1~2주 전:** Vercel + Railway 첫 배포, URL로 폰/노트북 테스트
3. **피치 당일:** Vercel Production URL을 투자자에게 공유

---

## 29. Demo → 정식 출시 → 앱 전환 전략 (AD-027 + AD-037)

> **User 질문 (2026-07-13):** "지금 데모 이어서 정식 버전 계속 만드는 거지? 앱은 웹 코드 참조해서 빠르게? 아님 처음부터 다시?"  
> **User 확정 (2026-07-14, AD-037):** 정식은 **웹=스토어 관리만**, **일반 회원 쇼핑·월드는 무조건 앱**.

### 한 줄 답

- **데모 → 정식:** **맞아요. 같은 프로젝트를 이어서 만듭니다.** 지금 코드를 버리고 새로 시작하는 게 아니에요.
- **웹 → 앱:** **처음부터 0은 아니에요.** DB·서버·타입·로그인·실시간 통신 로직은 **그대로 재사용**하고, **화면(UI)만** 앱용으로 새로 짜는 쪽에 가깝습니다. **Android·iOS도 앱 소스 한 벌(Expo)** — APK 따로, iOS 네이티브 따로 **이중 개발 아님** (§39, AD-038).
  - **역할 분담 (AD-037):** **PC 웹 = 스토어 관리(관리자 전용)**, **모바일 앱 = 일반 회원·스토어 관리자(쇼핑·월드)**.

### 정식 제품 채널 (AD-037)

| | PC 웹 | 모바일 앱 |
|---|---|---|
| **대상** | 스토어 관리자만 | 일반 회원 + 스토어 관리자 |
| **로그인** | **스토어 관리자 로그인**만 | **일반 회원 로그인** / **스토어 관리자 로그인** 별도 |
| **핵심** | 매장·상품·진열·주문/발주 **관리 전부** | 홈·입장·월드·쇼핑·구매·채팅 (+ 본인 매장 왕관 등) |
| **일반 회원** | ❌ 없음 | ✅ 여기만 |
| **스토어 관리 UI** | ✅ 여기만 | ❌ 없음 (입장·쇼핑만) |

시안: `docs/pdf-assets/web-app-split-sian.png`, `01-landing-web-owner.png`, `m01-landing-dual-roles.png`

### 데모 vs 정식 — 뭐가 같고 뭐가 다른가

| 구분 | 데모 (지금) | 정식 출시 (이어서) |
|---|---|---|
| **코드베이스** | `popup_store` monorepo **동일** | 같은 repo에서 기능 추가·다듬기 |
| **DB / Supabase** | `popup-platform` **동일** | 테이블·RLS 추가 (상품, 주문, 장바구니 등) |
| **서버 / Socket.io** | `server/` **동일** | 이벤트·로직 확장 |
| **웹 앱** | `apps/web` — 데모에선 손님+점주 혼재 | **정식: 점주 관리 전용**으로 정리 (AD-037) |
| **모바일 앱** | 없음 (시안만) | **손님·점주 실사용 채널** (AD-037) |
| **브랜드** | GUCCI 데모 (AD-009) | **교체·삭제** 후 실제 브랜드 — DB 데이터는 §30으로 한 번에 초기화 가능 |
| **매장 출시** | 생성 즉시 `published` (AD-021 단순화) | `draft` → 편집 → `published` 재도입 |
| **월드 뷰** | top-down (AD-022) | 등각뷰 업그레이드 **선택** (필수 아님) |
| **결제** | mock (가짜 주문) | 실제 PG 연동 |
| **점주 에디터** | 버튼만 / 최소 폼 | 풀 에디터 + 방/엘리베이터 (AD-025) |
| **아바타** | 네모 placeholder | 실제 픽셀 스프라이트 + 장착 (AD-020) |

**비유:** 지금은 **"매장 인테리어 시안 + 기본 전기·수도 공사까지 된 건물"**이고, 정식 출시는 **같은 건물에 가구 넣고, 간판 바꾸고, 결제 단말기 붙이는 것** — 건물을 허물고 다시 짓는 게 아님.

**다음 작업(상품 등록/목록 + 장바구니 MVP)** 도 이 연속선 위에 있음 — 데모용 임시 UI가 아니라, 정식에도 쓸 **DB 스키마 + API + 웹 화면**의 첫 버전으로 만드는 것.

### 웹 → 앱 — 뭐를 재사용하고 뭐를 새로 하나

```
                    ┌─────────────────────────────────────┐
                    │         apps/web (React)            │  ← 지금 만드는 화면
                    │  랜딩, 로그인, 홈, 매장, 장바구니…   │
                    └──────────────┬──────────────────────┘
                                   │  UI는 앱에서 새로 짬
                    ┌──────────────▼──────────────────────┐
                    │    apps/mobile (Expo) — post-demo    │  ← 나중에 추가
                    │  같은 기능, React Native 컴포넌트     │
                    └──────────────┬──────────────────────┘
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
    ┌──────▼──────┐      ┌────────▼────────┐     ┌───────▼───────┐
    │ packages/   │      │ packages/       │     │ server/       │
    │ shared      │      │ game-core       │     │ Socket.io     │
    │ 타입·상수   │      │ 소켓·게임 로직   │     │ 실시간 중계    │
    │ ✅ 앱 재사용 │      │ ⚠️ 일부 재사용  │     │ ✅ 앱 재사용   │
    └──────┬──────┘      └────────┬────────┘     └───────┬───────┘
           │                       │                       │
           └───────────────────────┼───────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │  Supabase (DB·Auth·Storage)         │
                    │  Upstash Redis                       │
                    │  ✅ 웹·앱 동일                        │
                    └─────────────────────────────────────┘
```

| 레이어 | 웹→앱 재사용 | 설명 |
|---|---|---|
| **`packages/shared`** (타입, Socket 이벤트 상수) | **✅ 거의 100%** | `Product`, `CartItem`, `PlayerState` 등 — 앱도 같은 타입 import |
| **`server/`** (Socket.io, 채널, 채팅) | **✅ 100%** | 앱도 같은 Railway 서버에 접속 |
| **Supabase** (DB, Auth, Storage, RLS) | **✅ 100%** | 웹·앱 같은 계정, 같은 상품/장바구니 데이터 |
| **Upstash Redis** | **✅ 100%** | 실시간 접속자 — 앱도 동일 |
| **`packages/game-core` 소켓 클라이언트** | **✅ 높음** | `socketClient.ts`, `joinStore()` 등 — DOM 없음 |
| **`packages/game-core` Phaser 월드** | **⚠️ 웹 전용** | Phaser는 브라우저 엔진 → 앱에선 **WebView로 감싸거나** RN용 렌더링 별도 검토 (§17, AD-010) |
| **`apps/web` React 페이지/컴포넌트** | **❌ UI 코드 직접 복사 불가** | React ≠ React Native. **하지만** API 호출 순서, 화면 흐름, 비즈니스 로직은 **참고·이식** 가능 |
| **장바구니·상품 로직 (다음 MVP)** | **✅ DB+API는 100%, UI는 앱용 재작성** | 지금 만드는 `products` 테이블·RLS·장바구니 상태 설계가 앱에서도 그대로 쓰임 |

### 앱 만들 때 "처음부터 다시"인 부분 vs "수월한" 부분

**처음부터 다시 하지 않아도 되는 것 (이미 깔려 있음)**
- 회원가입/로그인 체계 (Supabase Auth)
- 매장 목록, 입장, 채널 배정
- 실시간 이동·채팅 프로토콜
- 닉네임, 점주/소비자 role
- (다음 MVP 이후) 상품·장바구니 **DB와 권한 규칙**

**앱에서 새로 짜야 하는 것 (하지만 설계도는 이미 있음)**
- React Native 화면 (버튼, 리스트, 장바구니 UI 레이아웃)
- 앱 네비게이션 (탭, 스택)
- 픽셀 월드 표시 방식 (WebView 내 Phaser **또는** 추후 네이티브 렌더링)
- 앱스토어 배포·푸시 알림 등 앱 전용 기능

**비유**
- **웹:** 매장 건물 + 인테리어를 직접 지음
- **앱:** **같은 건물(서버·DB)** 에 들어가지만, **입구·안내판·계산대 배치**는 앱에 맞게 다시 짬. 청사진(타입·API·흐름)은 이미 있어서 **허둥지둥 처음부터 설계하는 것보다 훨씬 빠름**

### 데모 기간 동안 앱 연동을 염두에 둔 코딩 규칙 (에이전트 필수)

1. **비즈니스 로직·타입은 `packages/shared`에** — 웹 전용 파일에만 두지 말 것
2. **DB 스키마는 웹·앱 공용**으로 설계 (RLS로 역할별 접근)
3. **API·Socket 이벤트 이름은 shared constants** — 앱이 같은 이름으로 subscribe
4. **`apps/web`은 "첫 클라이언트"**일 뿐, 유일한 클라이언트가 아님
5. Phaser·DOM 의존 코드는 `game-core` 안에서도 **웹 전용 파일로 분리** 유지 (`topDownGame.ts` vs `socketClient.ts`)

### 타임라인 (현재 합의)

| 단계 | 시기 | 산출물 |
|---|---|---|
| **1. 데모 (지금~2·3주)** | 진행 중 | 반응형 웹 + GUCCI + mock 결제 + 투자자 URL |
| **2. 정식 웹 MVP** | 데모 이후 | 실 PG, draft/publish, 상품·장바구니 본격화, 브랜드 교체 |
| **3. 앱 (Expo)** | 웹 핵심 안정 후 | `apps/mobile` — shared·서버·DB 재사용, RN UI 신규 (**Android+iOS 한 코드베이스**, AD-038) |
| **4. 앱스토어 출시** | 앱 MVP 후 | TestFlight + Play Store (§39) |

## 30. 데모 데이터 초기화 절차 (정식 개발 전환 시 — AD-031)

> **User 질문(2026-07-13):** "정식개발 들어가기 전에 디비에 있는 데모 때 테스트하던 것들 다 지워달라 하면 깔끔하게 지워줄 수 있어?"
>
> **답: 네, 가능합니다.** 테이블·함수·코드는 그대로 두고 **데이터(행)만 전부 비우면** 깔끔하게 초기화됩니다. 아래 절차대로 하면 됩니다.
>
> **⚠️ 지금 실행하는 게 아님** — 나중에 사용자가 명시적으로 요청할 때만 수행.

### 사용자가 이렇게 말하면 §30 절차 시작
아래와 비슷한 **명시적 요청**이 오면 Cursor는 §0 브리핑 후 §30을 따라 실행합니다 (애매하면 "전체 삭제 맞는지" 한 번 더 확인).

- "데모 관련 흔적 다 지워달라"
- "정식 개발 들어가기 전에 DB 테스트 데이터 전부 초기화해줘"
- "GUCCI·데모 계정·테스트 매장 다 삭제하고 깨끗하게 시작하고 싶어"

### 한눈에: 지워지는 것 vs 유지되는 것

| 구분 | 지워짐 (초기화) | 유지됨 (그대로) |
|---|---|---|
| **Supabase DB** | 모든 매장·상품·주문·가챠·배송지·채널·프로필·가입 계정 | 테이블 구조, RLS, 함수(`roll_gacha`, `place_order`, `get_store_orders`, `create_owner_store` 등), 마이그레이션 이력 |
| **Storage** | `store-assets` 버킷 안 업로드 파일(매장 썸네일·상품 사진) | 버킷 자체·RLS 설정 |
| **Redis** | 채널 인원·플레이어 좌표 등 실시간 세션 데이터(있으면) | Redis 인스턴스·키 패턴 |
| **코드베이스** | — | `apps/web`, `server/`, `packages/*` 전부 (AD-027) |
| **브라우저** | 각 PC의 `localStorage` 장바구니(`popup_cube_cart_v1`) — 사용자/개발자가 직접 지우거나 안내 | — |

### 현재(데모) DB에 있는 대표 테스트 데이터 — 전부 삭제 대상
| 종류 | 예시 | 비고 |
|---|---|---|
| 데모 브랜드 매장 | `popup_gucci_01` (GUCCI POP-UP CUBE, AD-009) | 할인 10%·가챠 풀 4종 시드 포함 |
| 테스트로 만든 매장 | `store_237c7feca7`, `store_21c81b95ea` ("Mr. Sim & Bee") | §7 참고 |
| 데모 계정 | `demo@shopper.com`, `demo@owner.com` (비밀번호 `demo`) | 닉네임 `데모소비자`/`데모점주` |
| 그 외 | 회원가입·쇼핑·주문·가챠·배송지 테스트로 쌓인 **모든 행** | 특정 것만 남기고 싶으면 §30 대신 "○○만 삭제"로 별도 요청 |

### 원칙
- **지우는 건 데이터(행)만.** 테이블 구조·RLS·서버 함수·코드베이스는 전부 그대로 — AD-027("정식은 지금 코드를 이어서 만드는 것")과 동일
- **비가역적(되돌릴 수 없음)** — 실행 전 **반드시** "정말 전체 삭제해도 되는지" 최종 확인 (§0보다 한 단계 더 신중)
- 실행 후 §5·§7·§8 갱신, Changelog에 "데모 데이터 초기화 실행 완료" 기록

### 지울 대상 (실행 순서 — FK 의존관계상 자식 테이블부터)
| 순서 | 테이블 | 비고 |
|---|---|---|
| 1 | `order_items` | `orders` 삭제 시 CASCADE로 자동 삭제되지만 명시적으로 먼저 지워도 무방 |
| 2 | `orders` | |
| 3 | `gacha_rolls` | |
| 4 | `gacha_pool_entries` | |
| 5 | `gacha_pools` | |
| 6 | `store_promotions` | |
| 7 | `products` | |
| 8 | `user_addresses` | |
| 9 | `channels` | |
| 10 | `stores` | GUCCI 데모 매장 + 테스트로 만든 중복 매장(`store_237c7feca7` 등) 전부 |
| 11 | `profiles` | `auth.users` 삭제 시 CASCADE로 같이 삭제됨(11·12는 한 번에 처리) |
| 12 | `auth.users` | 데모/테스트 계정 전체(`demo@shopper.com`, `demo@owner.com` 포함) |

**바로 쓸 수 있는 SQL (1~10, `execute_sql`/`apply_migration`으로 실행):**
```sql
delete from public.order_items;
delete from public.orders;
delete from public.gacha_rolls;
delete from public.gacha_pool_entries;
delete from public.gacha_pools;
delete from public.store_promotions;
delete from public.products;
delete from public.user_addresses;
delete from public.channels;
delete from public.stores;
-- profiles는 아래 auth.users 삭제 시 CASCADE로 함께 삭제됨 (profiles.id FK → auth.users, on delete cascade)
```

**`auth.users`(11~12)는 SQL DELETE보다 Admin API/대시보드 권장** — 세션·리프레시 토큰 등 인증 관련 부가 데이터까지 안전하게 정리됨. Supabase 대시보드 → Authentication → Users에서 계정별 삭제, 또는 `supabase.auth.admin.deleteUser(userId)` 사용.

### DB 밖에서 같이 지워야 하는 것 (놓치기 쉬움)
- **Storage 이미지 파일** — `store-assets` 버킷에 업로드된 매장 썸네일·상품 이미지. 위 SQL로 DB 행(URL 참조)을 지워도 **실제 파일은 그대로 남음**. Supabase 대시보드 → Storage → `store-assets` → 전체 삭제(또는 스토리지 API).
- **Redis 실시간 데이터** — 소켓 서버가 채널 인원·플레이어 좌표를 Redis에 보관(§11). DB `channels`/`stores`를 지워도 Redis 키(`popup_gucci_01:channel_*` 등)는 남을 수 있음. Upstash/로컬 Redis에서 해당 키 삭제 또는 `FLUSHDB`(해당 DB만 비울 때 — **다른 프로젝트와 Redis를 공유 중이면 FLUSHDB 금지**, 키 패턴으로만 삭제).
- **브라우저 `localStorage` 장바구니** — 장바구니는 서버가 아니라 사용자 브라우저에 저장(§10). DB 초기화 후에도 예전 장바구니가 남을 수 있음 — 개발자도구 → Application → Local Storage → `popup_cube_cart_v1` 삭제 안내.

### 실행 절차 (이 요청이 실제로 들어왔을 때)
1. **재확인** — "정말 전체 삭제, 되돌릴 수 없음" + GUCCI·데모 계정·테스트 매장·주문·가챠 전부 포함 맞는지 확인
2. 위 표 1~10 SQL을 Supabase MCP `execute_sql`로 실행 (또는 마이그레이션 `demo_data_reset`으로 기록)
3. `auth.users` 전체 삭제 — Supabase 대시보드 Authentication → Users 일괄 삭제 권장 (`profiles`는 CASCADE)
4. Storage `store-assets` 버킷 비우기
5. Redis 채널/플레이어 키 정리 (서버 사용 중이면)
6. **검증** — 아래 SELECT로 public 테이블 0건·auth 사용자 0명 확인 후 사용자에게 보고
7. §5·§7·§8 갱신 — "데모 데이터 초기화 완료, 스키마·코드 유지, 정식 개발용 빈 DB 상태"

**실행 후 검증 SQL (0건이면 성공):**
```sql
select 'stores' as tbl, count(*) from public.stores
union all select 'products', count(*) from public.products
union all select 'orders', count(*) from public.orders
union all select 'profiles', count(*) from public.profiles;
-- auth.users는 대시보드에서 0명인지 확인
```

### 실행 후 상태 (정식 개발 시작점)
- DB: **스키마·RLS·함수만 있는 빈 상태** — 새 브랜드 매장·실제 점주/소비자 계정부터 다시 쌓으면 됨
- 코드: **변경 없음** — 바로 정식 기능(PG, draft/publish, 에디터 등) 개발 이어감
- GUCCI 관련 **코드/환경변수**(`VITE_DEMO_STORE_ID` 등)는 정식 브랜드로 바꿀 때 별도 작업(§29 표 참고) — DB 초기화와는 별개

---

## 31. 긴급 투자자 미팅 — 코드 기반 시각 프로토타입 (2026-07-13 저녁, AD-032)

> **User (2026-07-12 오전):** 일정이 **내일(7/13) 저녁**으로 앞당겨짐.  
> 「딱 보이는 것만」「실제 작동 안 해도 됨」「의도만 파악」「그런데 정식 개발에 바로 이어지는」 자료가 필요함.

### 이게 뭔지 — 한 줄

**「코드 기반 시각 프로토타입」** = PowerPoint가 아니라 **진짜 웹 화면**으로 「이런 서비스」를 보여주되,  
아직 안 붙은 기능은 **mock·정적·준비 중**이어도 되고, **만든 화면·컴포넌트는 정식에 그대로 이어짐**.

```
[PPT 시안]     → 예쁘지만 코드 0% → 정식 때 다시 짜야 함 (버림)
[우리 방식]    → React 화면 그대로 → 데이터/기능만 나중에 채움 (이어감) ✅
[완전 live]    → 전부 실제 동작   → 2~3주 목표, 내일까지는 필수 아님
```

### 대표님(50대)에게 전달할 프레임 (AD-029)

- **「온라인 팝업스토어 / 쇼핑몰」** 이 먼저 — 게임이 아님
- **「팝업에 들어가서 실물을 산다」** — 메타버스 장난감이 아님
- 캐릭터·채팅·가챠는 **「재밌게 쇼핑하게 하는 장치」** — 보조 설명만

### 미팅 시연 스크립트 (3~7분, 클릭 위주 — AD-014)

| 순서 | 화면 | 보여줄 의도 | 동작 필수? |
|---|---|---|---|
| 1 | 랜딩 `/` | 소비자/점주 **두 갈래** (홈택스식) | ✅ 로그인만 되면 됨 |
| 2 | 홈 `/home` | **여러 팝업 매장** 허브·검색 | ✅ 카드·입장 모달 |
| 3 | 입장 모달 | 매장 **대표 이미지·설명** | ✅ |
| 4 | 매장 `/store/:id` | **팝업 공간**에 들어온 느낌 | △ 월드 보이면 OK, 멀티는 bonus |
| 5 | 지금 쇼핑하기 | **실물 상품** 목록 | ✅ |
| 6 | 장바구니 → 배송지 → 결제 | **진짜 쇼핑몰** 흐름 | ✅ mock 결제 OK |
| 7 | 할인 vs 가챠 | **구매 후 증정 이벤트** (§6 INVESTOR_PITCH) | △ 되면 보여주기 |
| 8 | 점주 툴바 | **상품 등록·주문 관리** | ✅ 주문 관리 강력 추천 |
| 9 | (말로만) | 아바타 과시·점주 에디터·PG | ❌ 화면만 있으면 「로드맵」 |

**데모 계정:** `demo@shopper.com` / `demo@owner.com` (비밀번호 `demo`) — §22

**피해야 할 것:** 안 되는 버튼 눌러 **에러 터짐** · 게임 용어만 나열 · 「다음에 만들 예정」만 말하고 **화면 없음**

### 시각만 있어도 되는 것 (내일까지)

- 탐색·상호작용·착용해보기·픽셀변환·매장편집 버튼 → **비활성 + 「준비 중」** OK
- 월드 그래픽이 **네모 캐릭터**여도 OK — 「픽셀 아트 팝업」 설명으로 커버
- 멀티·채팅이 **불안정**하면 시연 중 생략 가능 — 「실시간 동시 접속은 개발 중」

### 정식 개발과 어떻게 이어지나

| 지금 만드는 것 | 정식 때 |
|---|---|
| `pages/*.tsx` 라우트 | 그대로 — 기능만 연결 |
| `components/*Panel.tsx` | 그대로 — API·검증 보강 |
| `i18n/ko.ts` 문구 | 그대로 — 다국어 확장 |
| mock 결제·정적 버튼 | PG·실제 에디터로 **교체** |
| GUCCI 테마 | 브랜드 교체(AD-009) |

→ **「시각 시안」이 코드 안에 이미 있다** = 정식 때 **같은 URL·같은 화면**에서 기능만 채움.

### 미팅 전 실행 완료 (2026-07-14 Cursor)

- **UI 폴리시:** 랜딩·홈·입장 모달 **커머스 톤** 문구, 로그인 **비밀번호 `demo` 기본값** + 힌트
- **미구현 버튼:** 탐색·상호작용·착용·매장편집·픽셀변환 → **「준비 중」 토스트** (`DemoToast`)
- **월드 에러:** 기술 메시지 숨김 → **「쇼핑·주문은 이용 가능」** 안내 배너
- **매장 헤더:** `popup_gucci_01` 대신 **매장 이름** 표시
- **데모 DB 시드 (Supabase `popup-platform`):**
  - `popup_gucci_01` 상품 4종 (스카프·티·백·디지털 번들)
  - `demo@shopper.com` 기본 배송지 1건
- **로컬 시연 URL:** `http://localhost:5173/` · 같은 Wi‑Fi 폰: `http://192.168.75.218:5173/`
- **서버:** `npm run dev` 실행 중 (web 5173 + socket 3000)

### 관련 문서

- **`docs/INVESTOR_PITCH.md`** — 사업 설명·가챠 논리·3분 시연 (미팅 전 User 읽기용)
- **`Online_Popup.docx`** — 스크린 덱 시안 정본 (모바일 m01~m10 + PC owner UI)
- **`온라인 팝업스토어 플랫폼.pptx`** — 투자 피치 덱 (사업 논리·여정 요약)
- **`docs/platform-sian.html`** — 시안 INDEX(HTML)
- **§18** — 원래 2~3주 full-live 로드맵 (미팅 **후** 보강)
- **§32** — 진열 조형물·슬롯 UX (AD-033)
- **§33** — 자동 로그인 (AD-034)
- **§34** — 동네별 팝업·홈 필터 (AD-035)
- **§35** — 모바일 UI (AD-036)
- **§38** — 시각 디자인 (docx/pptx)
- **§39** — Android/iOS 크로스플랫폼·Play/App Store 출시 (AD-038) · **§39.12 Cursor로 앱 개발** (AD-039)
- **§40** — 점주 AI 매장 에이전트 (AD-040)
- **§41** — 실매장 유사도 제품 원칙 (AD-041)
- **§42** — 비용·편의 실행안 wizard (AD-042)
- **§43** — GUCCI 데모 등각 월드 — 지금 vs 정식 (AD-043)
- **§44** — Grid Occupancy 표준 (AD-044)
- **§45** — 리소스 추출 + 픽셀 도면 에디터 (AD-045)
- **§46** — 인프라·호스팅 맵 (AD-046) · `DEPLOY.md`

---

## 32. 진열 조형물 · 슬롯 쇼핑 UX (AD-033) — 개발 계획

> **한 줄:** 손님은 **가구 앞에서 그 위 상품만** 보고 사고·입어보고, 점주는 **가구를 놓고 칸에 상품을 꽂고 순서를 바꾼다.**

### 왜 필요한가
지금 「전체 상품」목록만 있으면 일반 쇼핑몰과 차별이 약함.  
팝업 **공간**에서 테이블·옷걸이 앞에 서서 고르는 느낌이 핵심 경험.

### HUD 버튼 규칙 (시안·앱 공통, 2026-07-14 v3~)
| 버튼 | 역할 | 비고 |
|---|---|---|
| ~~탐험하기/탐색~~ | **삭제** | 이동은 WASD/방향키 |
| ~~착용해보기 (HUD)~~ | **삭제** | 상품 팝업 안으로만 |
| 상호작용 | 근처 진열 조형물 상품 팝업 | Phase 4 live |
| 채팅 | 실시간 채팅 | 구현됨 |
| **장바구니** | CartDrawer | 구현됨 |
| **전체 상품** | ShopPanel 카탈로그 | 구 「지금 쇼핑하기」 |

### 착용해보기 위치 (필수)
1. 진열 조형물 앞 → 상호작용 → 상품 목록 팝업  
2. **상품 클릭(선택)**  
3. 버튼 순서: `장바구니 담기` → `바로 구매` → **`착용해보기`** (담기·구매 **아래**)  
4. 착용해보기 → 우측 아바타 미리보기 (착용 전·후)

### 시각 = 2D only
시안·에디터·월드 목업은 **2D 픽셀/탑뷰**. 3D는 로드맵에 없음 (AD-022·AD-033).

### 구현 체크리스트 (Phase 4)
- [x] DB: `display_fixtures` / `display_slots` + `fixture_templates` + RLS (2026-07-27 Sprint 0)
- [x] **§44 Grid Occupancy** — `buildOccupancyGrid()`, fixture w×d 점유 (`occupancyGrid.ts`, 2026-07-27)
- [ ] walkable mask / blueprint 연동 (§45)
- [x] Phaser: 조형물 proximity + Interact (GUCCI 데모 — `onNearInteractZone`, §43)
- [x] `DisplayProductModal` — 슬롯 상품 + 담기 + 착용 **미리보기**(Sprint 4-2) · 바로구매·풀 스프라이트 ⬜
- [ ] `TryOnPreview` — 우측 아바타 착용 전·후 (파츠 레이어 · AD-020)
- [x] 점주 `OwnerDisplayPanel` — 조형물 배치 + 슬롯 CRUD + 순서 (Sprint 3)
- [x] GUCCI `display_fixtures` 시드 + 슬롯 상품 3종 (Sprint 4-1/4-2)
- [x] 앱 WebView `/play/:storeId` + 진열 상호작용 HUD (Sprint 4-1/4-2) — **지금 HUD는 임시 텍스트 버튼**
- [x] **Sprint 4-3 — 시안형 하단 HUD 바 (AD-047, §32.1)** — 픽셀 4아이콘 · 세로/가로 · 채팅 포함
- [ ] i18n·시안·PDF와 버튼명 동기화 유지 · **시안 PNG 아이콘으로 교체**(선택)

### 시각 자료
| 파일 | 내용 |
|---|---|
| `docs/pdf-assets/m05-world-mobile.png` | **등각뷰** 앱 월드 (일반 회원) |
| `docs/pdf-assets/m06-display-interact-mobile.png` | 앱 진열 상호작용 |
| `docs/pdf-assets/m07-tryon-mobile.png` | 앱 착용해보기 |
| `docs/pdf-assets/owner-display-slots-mockup.png` | 점주 진열 **2D** |
| `docs/pdf-assets/03-home-hub-sian.png` | 열린 팝업 허브 (다중 매장 예시) |
| `docs/pdf-assets/04-enter-modal-sian.png` | 입장 모달 (①②③ 흐름) |
| `docs/pdf-assets/02-login-autologin-sian.png` | 자동 로그인 (구현 예정) |
| `docs/pdf-assets/03-home-neighborhood-sian.png` | 동네 필터·구역별 홈 |
| `docs/pdf-assets/owner-store-region-sian.png` | 점주 매장 지역(주소 API) |
| `docs/pdf-assets/m01-..m10-*.png` | 모바일 시안 (쇼핑·입장·월드) — 관리 UI는 PC 웹 (`owner-*`) |

*Last updated: 2026-07-30 (AD-047 · §32.1 · Sprint 4-3 next) by Cursor Agent*

---

## 32.1 월드 모바일 HUD 바 (AD-047) — Sprint 4-3

> **한 줄:** 시안처럼 **하단 알약(가로) 바에 픽셀 아이콘 4칸** — 상호작용 · 채팅 · 장바구니 · 전체상품. 지금 PlayWorld의 **임시 텍스트 버튼**을 이걸로 교체.

### 왜 지금인가
Sprint 4-2로 **기능**(진열·담기·장바구니·전체상품)은 됨. UX만 시안과 다름. User 확인(2026-07-30): **다음 작업 = 이 HUD**.

### 레이아웃 (확정)

| 방향 | D-pad | HUD 바 |
|---|---|---|
| **세로(portrait)** | 왼쪽 아래 (`VirtualDpad` `embedded`) | 하단 **중앙~풀폭 근처** 알약 바 (시안) |
| **가로(landscape)** | 왼쪽 아래 유지 | **같은 알약을 가로로 늘리지 않음** (`max-width` 유지) · 하단 **중앙 또는 오른쪽** |

**금지:** 가로모드에서 바를 화면 가로 전체로 stretch · D-pad와 HUD 겹침 · 시안에 없는 5번째 HUD 버튼.

### 버튼 4칸 (시안 `Online_Popup.docx` · §32 HUD 규칙과 동일)

| 칸 | 동작 (이미 있는 기능 연결) |
|---|---|
| 상호작용 | 근처 fixture → `DisplayProductModal` (4-2) |
| 채팅 | PlayWorld에 **채팅 UI 연결** (StorePage 채팅과 동일 소켓 — 4-3에서 HUD에 포함) |
| 장바구니 | `CartDrawer` |
| 전체상품 | `ShopPanel` |

### 근접 안내 알약 (AD-049 · 옵션 C — 2026-07-31)
- **긴 가로 배너**(「탭해서 진열 상품 보기」) **사용 안 함** — D-pad·HUD와 겹침.
- **`PlayProximityPill`**: 조형물 **이름**(가운데) + 「탭 · 상호작용」 · **탭 = HUD 상호작용**과 동일.
- 위치: **세로** = D-pad **윗줄** · **화면 가로 정중앙** · **가로** = HUD 위 라인 유지 · **화면 가로 정중앙** (`play-world.css` 2026-07-31).
- **엘리베이터/문 (후속):** 같은 알약 · 라벨만 「2층으로」 등 · 실행은 여전히 HUD 상호작용.

### 구현 메모 (다음 에이전트)
1. §0 브리핑·User 승인 후 착수
2. 주 파일: `PlayWorldPage.tsx` + 새 컴포넌트 예: `PlayHudBar.tsx` (또는 동등)
3. 픽셀 아이콘: 시안/docx 참고 · 없으면 단순 픽셀 스타일 SVG/PNG placeholder 후 교체 가능
4. `VirtualDpad` `embedded` 유지(ISS-028) — 위치만 HUD와 충돌 없게
5. StorePage 데모 월드 HUD도 **가능하면** 같은 바 재사용 (필수는 앱 `/play` 먼저)

### 완료 기준
- [x] 세로·가로 모두 알약 바 + D-pad 동시 사용 가능
- [x] 4버튼 모두 동작 (채팅 포함)
- [x] 임시 텍스트 HUD 제거
- [ ] User 실기 확인 · HANDOFF push · Changelog 배포

*Last updated: 2026-07-31 by Cursor Agent*

---

## 33. 자동 로그인 (AD-034) — 개발 계획

> **한 줄:** 「자동 로그인」체크 시 이 기기에서 다음부터 비밀번호 없이 들어온다.

### UX
- `LoginPage` 비밀번호 아래 **체크박스 `자동 로그인`**
- 보조 문구: 「다음부터 이 기기에서 자동으로 로그인」
- 체크 해제 시 기존과 동일(세션 만료 시 재로그인)

### 구현 방향 (초안)
- Supabase Auth `persistSession: true` (웹 기본) + **명시적 opt-out** when unchecked
- 앱(Expo): `expo-secure-store`에 refresh token
- **보안:** 공용 PC 안내 문구(선택), 로그아웃 시 토큰 삭제

### 시각 자료
`docs/pdf-assets/02-login-autologin-sian.png`, `m02-login-autologin-mobile.png`

### 체크리스트
- [ ] `LoginPage` UI + i18n
- [ ] 체크 상태 localStorage/SecureStore
- [ ] 로그아웃 시 persist 정리
- [ ] 시안·PDF 동기화

---

## 34. 동네별 팝업 · 홈 필터 (AD-035) — 개발 계획

> **한 줄:** 같은 브랜드도 **동네마다 다른 팝업** — 홈에서 동네별로 묶어 보여준다.

### 왜 필요한가
오프라인 팝업은 「성수동 팝업」「청담 팝업」처럼 **장소가 브랜드 경험의 일부**. 플랫폼도 매장 단위에 **지역(동네)**을 붙여 구분.

### 데이터 (초안)
```sql
-- stores 테이블 확장 (마이그레이션 전 초안)
-- region_sido, region_sigungu, region_dong (또는 neighborhood_label)
-- address_line1, postal_code  -- 주소 API 결과
-- lat, lng  -- 선택
```

### 점주 흐름
1. 매장 만들기/수정 → **주소 검색**(카카오/다음 우편번호 API)
2. 시·구·**동네** 자동 채움 + 지도 핀(선택)
3. 저장 → 홈 목록·필터에 반영

### 소비자 흐름
1. 홈 상단 **동네 필터 칩**(전체 | 성수동 | 청담 | …)
2. **구역별 섹션** — 「성수동」아래 해당 매장 카드, 「청담」아래 …
3. 카드 부제: `GUCCI · 성수동` vs `GUCCI · 청담`

### 주소 API 공유
- `AddressFormFields` / `user_addresses` (AD-030)와 **동일 검색 컴포넌트** 재사용
- 점주 매장 지역 + 소비자 배송지 입력 모두 같은 API

### 시각 자료
`03-home-neighborhood-sian.png`, `owner-store-region-sian.png`, `m03-home-neighborhood-mobile.png`  
*(모바일 점주 지역 `m13`은 AD-037에 따라 시안에서 제외 — 지역 지정은 PC 웹 `owner-store-region-sian.png`)*

### 체크리스트
- [ ] `stores` 지역 컬럼 + 마이그레이션
- [ ] `AddressSearch` 공통 컴포넌트 (우편번호 API)
- [ ] `HomePage` 필터 + 구역 groupBy
- [ ] 점주 매장 생성/수정 폼
- [ ] GUCCI 데모 시드: 성수/청담 2매장 예시

---

## 35. 모바일 UI (AD-036) — 개발 계획

> **한 줄:** 데스크톱 시안과 **같은 IA**, 스마트폰 한 화면에 맞게 재배치.  
> **AD-037:** 앱에는 **일반 회원·스토어 관리자 로그인**만 두고, **매장·상품·진열·주문 관리 화면은 넣지 않음**(관리는 PC 웹 전용).

### 범위 (시안·정식 채널)
| 영역 | 모바일 시안 파일 |
|---|---|
| 시작 (이중 로그인) | `m01-landing-dual-roles.png` |
| 로그인+자동로그인 | `m02-login-autologin-mobile.png` |
| 동네별 홈 | `m03-home-neighborhood-mobile.png` |
| 입장 | `m04-enter-modal-mobile.png` |
| 월드 | `m05-world-mobile.png` |
| 진열 상호작용 | `m06-display-interact-mobile.png` |
| 착용해보기 | `m07-tryon-mobile.png` |
| 전체 상품 | `m08-shop-panel-mobile.png` |
| 결제 | `m09-checkout-mobile.png` |
| 마이페이지 | `m10-mypage-mobile.png` |

> **제외 (AD-037):** `m11`/`m12`/`m13` 모바일 점주 **관리** 시안은 시안 문서에서 제거. 지역·진열·주문 관리는 PC 웹 (`owner-*.png`)만.

### 구현 순서 (초안)
1. `apps/web` **반응형** — StorePage HUD·패널 bottom sheet *(데모 프로토타입)*
2. 터치 이동·가상 조이스틱(선택)
3. Expo 앱 — 공통 패키지 재사용(AD-027) · **정식 손님 채널** · Android+iOS 동시 (§39, AD-038)

### 체크리스트
- [ ] breakpoints + 모바일 레이아웃
- [ ] 월드 캔버스 모바일 뷰포트
- [ ] 시안 HTML/Word §4·§5와 코드 IA 동기화 (일반 회원=앱·등각뷰, 관리=웹)

---

## 38. Visual Design Handoff — 앱/웹 시각 방향 (2026-07-24)

> **정본:** `Online_Popup.docx` (스크린 덱, 22장 목업) · `온라인 팝업스토어 플랫폼.pptx` (투자 피치, 19슬라이드)  
> **요약 목적:** 다음 에이전트·Expo 앱 작업 시 **「어떤 느낌으로 가는지」** 코드 없이도 HANDOFF만으로 파악.

### 38.1 한 줄 포지셔닝

**「에이블리/일반 쇼핑앱처럼 익숙한 커머스 UX」 + 「등각(isometric) 2D 픽셀 팝업 월드에서 구경하는 재미」**  
게임이 주인공이 아님 — **실물 구매·배송·주문·스토어 관리**가 중심, 월드·채팅·착용해보기·가챠는 보조 (AD-029, pptx 슬라이드 2).

pptx 슬라이드 9: **메타버스 실패 원인 = UI 복잡** → 앱 월드 HUD는 **4개만** (상호작용 / 채팅 / 장바구니 / 전체상품). 더 늘리지 말 것.

### 38.2 채널별 시각 톤 (AD-037)

| | **모바일 앱 (일반 회원)** | **PC 웹 (스토어 관리자)** |
|---|---|---|
| **배경** | 다크 네이비 `#0A0E1A` 계열 | 다크 사이드바 + 밝은/중간 톤 메인 |
| **포인트 색** | 코랄/로즈 핑크 CTA (`로그인`, `입장하기`, `담기`) | 골드/옐로우 (`저장`, 탭 활성, OWNER TOOLS) |
| **로고** | POP-UP CUBE 큐브 아이콘 + sans-serif | POP-UP CUBE \| OWNER TOOLS / STORE OWNER |
| **월드** | **등각 2D 픽셀** — 옆방·옆 공간이 살짝 보이는 부티크 | 2D 픽셀 변환·진열 미리보기 (3D 없음) |
| **쇼핑 UI** | **실사 사진** — 상세·장바구니·결제 | 실사 업로드 + 오른쪽 **앱 미리보기** 패널 |
| **로그인 카피** | `일반 회원 로그인` / `스토어 관리자 로그인` | **`스토어 관리자 로그인`만** |

### 38.3 실사 vs 픽셀 — 같은 상품, 두 이미지 (docx §7-1)

| 용도 | 이미지 | 노출 위치 |
|---|---|---|
| 쇼핑·주문 | **실사** | 앱 상세, 목록, 장바구니, 결제, 마이페이지 |
| 팝업 월드 | **픽셀 스프라이트** | 진열 슬롯, 착용해보기, 월드 속 캐릭터·가구 |

점주는 PC 웹 **상품 등록 탭** — 기본정보 → 상세설명 → 이미지(실사) → 2D 월드용 → 미리보기(실사×픽셀 나란히).  
2D 변환: 실사 1장 → 4방향 픽셀 → 등각 테이블 진열 미리보기 → **승인** 후만 노출.

### 38.4 모바일 앱 화면 흐름 (m01~m10, docx §4~§5)

| # | 시안 | 핵심 UX |
|---|---|---|
| m01 | 이중 로그인 선택 | 일반 회원 / 스토어 관리자 분기 |
| m02 | 일반 회원 로그인 | 자동 로그인 체크 (AD-034) |
| m03 | 동네별 홈 | 필터 칩(성수동·청담·홍대…) + 2열 카드, 썸네일=**등각 픽셀 매장**, OPEN 뱃지, `입장 >` |
| m04 | 입장 모달 | 등각 매장 일러 + 「실제 상품 구매·배송·주문」 + `입장하기` |
| m05 | 월드 | 타이틀(매장명), 아바타 이동, 말풍선 채팅, 하단 4버튼 HUD, LIVE CHAT 바 |
| m06 | 진열 상호작용 | 테이블/옷걸이 앞 → **그 슬롯 상품만** 바텀시트, `담기`/`바로 구매`/`착용해보기` |
| m07 | 착용해보기 | 왼쪽 실사 / 오른쪽 아바타 픽셀, `적용하기` |
| (상세) | 상품 상세 | 실사 갤러리, 옵션, 하단 고정 `장바구니 담기`+`바로 구매`, 아래 `착용해보기` |
| m08 | 전체 상품 | 2열 그리드, 수량 +/-, `담기` + `상세페이지 보기` |
| m09 | 결제 | 3단(장바구니→배송지→혜택), 할인 vs 사은품 선택 |
| m10 | 마이페이지 | 배송지 CRUD |

**제외:** m11~m13 모바일 점주 관리 — AD-037에 따라 시안·앱 모두 **없음**. 관리는 PC `owner-*.png`만.

### 38.5 PC 웹 owner UI (docx §6)

- **사이드바:** OWNER TOOLS — 매장 만들기, 매장 관리, 주문, 정산 등
- **매장 만들기:** 주소 검색 → 동네(성수동 등) 지정 → 지도 미리보기 → 저장
- **상품 등록:** 탭 5개 (기본정보 / 상세설명 / 이미지 실사 / 2D 월드용 / 미리보기)
- **2D 변환 화면:** 실사 → 4방향 픽셀 → 등각 테이블 진열 미리보기 → `승인`
- **진열 배치:** 가구(테이블·옷걸이)에 상품 끼워 넣기
- **주문 관리:** 구매자·상품·배송지·시각

### 38.6 pptx 투자 논리 (구현 시 카피·우선순위 참고)

- 실물 커머스 본질 — **메타버스 사업 아님**
- 투웨이(관리=웹, 쇼핑=앱)로 개발비 절감
- 오프라인 팝업 **스쿱/사은품** → 온라인 구매 후 할인·사은품 선택(가챠)
- UI/UX 전문가 협업 자본 필요 (복잡 UI = 메타버스 실패 요인)
- 동네별 독립 팝업 — 같은 브랜드도 `GUCCI · 성수동` vs `GUCCI · 청담` 별개 매장

### 38.7 현재 코드 vs 시안 갭 (2026-07-24)

| 시안 | 현재 `apps/web` (데모) |
|---|---|
| 모바일 전용 다크 UI | 반응형 웹, 손님+점주 혼재 |
| 등각(isometric) 픽셀 월드 | **GUCCI 데모만** `generated` 등각 (§43). 일반 매장·정식 = Phase 4 fixture 에디터 + walkability |
| 동네 필터 홈 (m03) | 단순 스토어 목록 |
| 실사/픽셀 이중 이미지 | 단일 product image |
| PC owner 전용 | 일반 회원 플로우도 웹에 존재 |

**정식:** AD-037 — `apps/web` → owner 전용 정리, `apps/mobile`(Expo) → §38.4 시안대로 신규 UI.

### 38.8 에이전트 작업 시 체크

- [ ] 새 UI는 **§38.2 색·톤**과 m01~m10 레이아웃에 맞출 것
- [ ] 월드 HUD **4버튼** 유지 (pptx 슬라이드 9)
- [ ] 쇼핑 화면은 **실사**, 월드·착용은 **픽셀** — 혼용 금지
- [ ] 「게임」보다 「쇼핑몰·팝업스토어」 카피 우선 (AD-029)
- [ ] 시각 변경 시 `Online_Popup.docx`와 불일치하면 User 확인

---

## 39. Mobile App — Android/iOS 크로스플랫폼 & 스토어 출시 (AD-038)

> **User 질문 (2026-07-24):** Play Store·App Store 둘 다 등록하려면 Android/iOS 각각 따로 개발해야 하나? APK 개발 후 iOS를 **또 처음부터** 만들어야 하나?  
> **한 줄 답:** **스토어는 둘 다 필요하지만, 앱 소스는 한 벌(Expo/React Native)**. Android·iOS는 **빌드·스토어 등록·일부 설정**만 나뉨 — 네이티브(Kotlin+Swift) **이중 개발 아님**.

### 39.1 용어 정리

| 용어 | 의미 |
|---|---|
| **APK / AAB** | Android 설치·배포 패키지 (Play Store 업로드는 보통 **AAB**) |
| **IPA** | iOS 빌드 산출물 → App Store Connect 업로드 |
| **Play Store** | Google Android 앱 마켓 |
| **App Store** | Apple iOS 앱 마켓 |
| **Expo** | React Native 기반 — JS/TS **한 코드베이스**로 Android+iOS |
| **EAS (Expo Application Services)** | Expo 공식 **클라우드 빌드·제출** (Mac 없이 iOS 빌드 가능) |

### 39.2 우리 아키텍처 (코드 재사용)

```
packages/shared, game-core  ← 타입·Supabase·소켓 (웹·앱 공통)
server/ + Supabase          ← API·DB·Auth (웹·앱 공통)
apps/web (React)            ← PC 스토어 관리만 (AD-037)
apps/mobile (Expo/RN)       ← 일반 회원 쇼핑·월드 — Android + iOS 동일 소스
         │
         ├── eas build --platform android  → AAB → Play Store
         └── eas build --platform ios      → IPA → App Store
```

- **AD-027:** 앱 UI만 React Native로 **새로** 짜되, DB·서버·인증·주문 로직은 **재사용**.
- **AD-038:** Kotlin(Android) + Swift(iOS) **별도 앱 두 개** 만들 계획 **없음**.

### 39.3 개발 방식 비교 (왜 Expo인가)

| 방식 | 코드 | POP-UP CUBE |
|---|---|---|
| **네이티브** | Android Kotlin + iOS Swift **거의 두 벌** | ❌ 채택 안 함 (비용·기간 2배) |
| **Expo / React Native** | **한 벌** → 두 OS 빌드 | ✅ **채택** (monorepo·HANDOFF·AD-027/038) |
| **Flutter** | Dart 한 벌 | ❌ 미채택 (이미 RN·Expo 방향) |
| **모바일 웹/PWA만** | 웹 URL | ❌ 정식 손님 채널 아님 (AD-037) |

### 39.4 OS별로 **같은 것** vs **다른 것**

| 대부분 공유 (한 번 구현) | OS·스토어마다 따로 |
|---|---|
| 화면·네비·로그인·API 호출 | **개발자 계정** (Google Play Console, Apple Developer) |
| 장바구니·주문·월드 연동 | **빌드 산출물** (AAB vs IPA) |
| `packages/shared` 타입·Supabase | **스토어 심사·등록** (스크린샷, 설명, 개인정보처리방침) |
| 비즈니스 로직 | **푸시** (Android FCM vs iOS APNs) — 출시 후 |
| | **인앱결제/PG** — 스토어 정책·SDK 차이 (PG 확정 후, §7 Pending) |
| | **iOS 빌드** — Apple 정책상 **Mac 또는 EAS 클라우드** 필요 |
| | 일부 UI (세이프에리어, 뒤로가기, 권한 다이얼로그) — RN이 대부분 추상화 |

### 39.5 스토어 등록 — 비용·계정 (런칭 예산)

| 항목 | 비용·비고 |
|---|---|
| **Google Play Console** | **$25 1회** (개발자 등록) |
| **Apple Developer Program** | **$99/년** (필수 — iOS·TestFlight) |
| **앱 내 결제 수수료** | 스토어 경유 IAP 시 Apple/Google **15~30%** (자사 PG 웹결제와 정책 별도 검토) |
| **EAS Build** | Expo 무료 티어 + 유료 플랜 (iOS 클라우드 빌드량) — [expo.dev/pricing](https://expo.dev/pricing) |
| **도메인·개인정보처리방침 URL** | 스토어 심사 필수 (§28 배포 참고) |

### 39.6 구현·출시 순서 (권장)

| 단계 | 작업 | 산출물 |
|---|---|---|
| **1** | `apps/mobile` Expo scaffold (`npx create-expo-app` + monorepo workspace) | 로컬 `expo start` |
| **2** | `@popup-cube/shared` 연동, Supabase Auth, m01~m03 화면 | Android/iOS 시뮬레이터·Expo Go 실기 테스트 |
| **3** | 월드(Phaser/game-core) RN 임베딩 방식 확정 | m05~m07 |
| **4** | `eas.json` + EAS Build 프로필 (preview / production) | `.aab` + `.ipa` |
| **5** | **내부 테스트** — Android 내부 테스트 트랙, iOS **TestFlight** | QA |
| **6** | 스토어 listing — 아이콘, 스크린샷(m01~m10), 설명, 연령·개인정보 | 심사 제출 |
| **7** | **Production** — Play Store + App Store 동시 또는 Android 선출시 | 런칭 |

> **데모:** 투자·내부 시연은 여전히 **폰 브라우저 + Vercel URL** 가능(AD-010). **스토어 등록 = 정식 런칭 단계**.

### 39.7 EAS / Expo — 에이전트·개발자 메모

**초기 파일 (2026-07-27 Sprint 1 — ✅ 생성됨):**
```
apps/mobile/
├── app.config.ts               # slug popup-cube, EAS projectId, bundle com.popupcube.app
├── eas.json                    # development / preview / production
├── metro.config.js             # monorepo watchFolders
├── app/                        # expo-router (m01~m04 shell)
│   ├── index.tsx               # m01 이중 로그인
│   ├── login.tsx               # m02
│   ├── home.tsx                # m03
│   └── store/[storeId].tsx     # placeholder → Sprint 4 Phaser
├── src/
│   ├── context/AuthContext.tsx
│   ├── lib/supabase.ts         # AsyncStorage session
│   └── components/StoreEnterModal.tsx
└── README.md
```

**`eas.json` 프로필 예시 (개념):**
- `development` — Expo Go / dev client
- `preview` — QA 내부 배포 (APK 직접 설치 or TestFlight)
- `production` — 스토어 제출용 AAB/IPA

**Bundle ID (미정 — User 확정 필요):**
- Android: `com.popupcube.app` (예시)
- iOS: 동일 reverse-DNS 권장

**자동 로그인 (AD-034):**
- 웹: `localStorage` + Supabase `persistSession`
- 앱: **`expo-secure-store`** (§33) — 토큰 평문 저장 금지

### 39.8 Phaser / game-core in React Native

- `packages/game-core`는 **DOM 의존 없이** 유지 (§19).
- 앱에서 월드 옵션 (구현 시 택1):
  1. **WebView** + Phaser (빠른 이식, 성능·제스처 trade-off)
  2. **react-native-game-engine** / Canvas 계열 + game-core 로직만 공유
  3. **Expo GL** + 커스텀 렌더 (공수 큼)
- **정식 시안:** 등각 픽셀 월드(§38) — 탑뷰( AD-022 데모)에서 **업그레이드** 예정.

### 39.9 스토어 심사 — 미리 준비할 것

- [ ] **앱 아이콘** — POP-UP CUBE 큐브 (시안 §38.2)
- [ ] **스크린샷** — m01~m10 기준 (6.5"·6.7" iPhone, Android phone)
- [ ] **앱 설명** — 「온라인 팝업스토어 · 실물 구매·배송」(AD-029 톤)
- [ ] **개인정보처리방침 URL** (필수)
- [ ] **문의 이메일 / 지원 URL**
- [ ] **데모 계정** — 심사용 테스트 ID (GUCCI 데모 계정 §30과 분리 검토)
- [ ] **결제** — mock → PG 연동 시 **Apple/Google 인앱결제 정책**과 실물 PG 관계 User·법무 확인
- [ ] **연령 등급** — 쇼핑·가챠(사은품) 표현에 맞게 설정
- [ ] **권한 설명** — 카메라(착용/업로드), 알림(푸시) 등 사용 시 `Info.plist` / Android manifest

### 39.10 FAQ (다음 세션용)

| Q | A |
|---|---|
| APK만 만들면 iOS는? | **같은 Expo 프로젝트**에서 `eas build -p ios` — **재개발 아님** |
| 코드가 100% 동일? | **95%+** — OS별 설정·가끔 `Platform.OS` 분기 |
| Mac 없이 iOS? | **EAS Build 클라우드**로 가능 (Apple Developer 계정은 필요) |
| 웹 React 코드 복사? | **로직·타입은 shared**, **UI는 RN 컴포넌트로 재작성** (AD-027) |
| Play만 먼저 출시? | 가능 — **같은 코드베이스**에서 Android 선출시 후 iOS 심사 |
| **Cursor로 앱 개발 가능?** | **가능** — Expo+RN+TS, 같은 monorepo·Agent·HANDOFF. 미리보기만 Expo Go/에뮬레이터 (§39.12, AD-039) |
| 웹 React JSX 그대로 복붙? | **UI는 RN 컴포넌트로 재작성** (`div`→`View` 등). shared·API는 재사용 |

### 39.11 체크리스트 (에이전트)

- [ ] `apps/mobile` Expo app in turborepo
- [ ] `eas.json` + EAS project link
- [ ] Android `applicationId` / iOS `bundleIdentifier` User 확정
- [ ] Google Play Console + Apple Developer 계정
- [ ] TestFlight + Play 내부 테스트
- [ ] §38 시안과 스크린샷·아이콘 일치
- [ ] AD-034 SecureStore 자동 로그인
- [ ] HANDOFF §39 갱신 (bundleId·스토어 URL 확정 시)

### 39.12 Cursor IDE로 앱 개발 — User 웹 경험 활용 (AD-039)

> **User (2026-07-24):** 웹사이트는 Cursor로 많이 해봤다. **팝업 앱도 Cursor로 가능한가?**  
> **한 줄 답:** **가능.** Cursor는 웹 전용이 아니라 **코드 에디터 + Agent** — Expo(React Native) 앱도 **지금 웹 하던 방식 그대로** 같은 `popup_store` monorepo에서 진행.

#### 왜 가능한가

| 항목 | 웹 (`apps/web`) | 앱 (`apps/mobile`) |
|---|---|---|
| IDE | Cursor | **동일 Cursor** |
| 언어 | TypeScript | **동일** |
| UI 패러다임 | React | **React Native (React와 유사)** |
| API·DB | Supabase, `packages/shared` | **동일 재사용** |
| Agent 워크플로우 | HANDOFF 읽기 → 코드 수정 → 터미널 | **동일** |
| 저장소 | `popup_store/` monorepo | **같은 워크스페이스** |

**별도 “앱 전용 IDE” 필수 아님** — Expo가 네이티브(Kotlin/Swift) 직접 작성을 대부분 숨김.

#### 웹 vs 앱 — Cursor 작업 시 **다른 점**

| | 웹 | 앱 |
|---|---|---|
| **미리보기** | 브라우저 `localhost:5173` | **Expo Go**(폰 QR) 또는 Android/iOS **에뮬레이터** |
| **실행 명령** | `npm run dev` (web) | `npx expo start` (`apps/mobile`) |
| **UI 마크업** | HTML + CSS | `View`, `Text`, `Pressable` + StyleSheet |
| **스타일** | CSS/Tailwind | RN StyleSheet (개념은 비슷, 문법 다름) |
| **월드(Phaser)** | `apps/web`에 이미 있음 | **이식 필요** — WebView+Phaser 또는 RN Canvas (§39.8) |
| **스토어 출시** | Vercel 배포 | EAS Build + Play/App Store (§39.6) — Cursor **밖**에서 계정·심사 |

**코드 작성 = Cursor**, **폰에서 확인 + 스토어 제출 = Expo/구글/애플**이 추가되는 구조.

#### 개발 루프 (에이전트·User 공통)

```
Cursor (편집 + Agent)
    ↓
apps/mobile (Expo) + packages/shared
    ↓
npx expo start  →  Expo Go QR 스캔  또는  에뮬레이터
    ↓
기능 완성 후 eas build  →  Play Store / App Store
```

웹 때 `npm run dev` → 브라우저와 **1:1 대응**하는 앱 루틴.

#### 영역별 난이도 (Cursor Agent 기준)

| 영역 | Cursor로 가능? | 난이도 | 비고 |
|---|---|---|---|
| m01~m04 로그인·홈·입장 | ✅ | 웹과 **비슷** | §38.4 |
| m08~m10 장바구니·결제·마이 | ✅ | 웹과 **비슷** | Supabase·shared 재사용 |
| m05~m07 **픽셀 월드·진열·착용** | ✅ | **웹보다 한 단계↑** | Phaser DOM 의존 — §39.8 |
| `eas.json`·앱 설정 | ✅ Agent 보조 | 보통 | bundleId User 확정 필요 |
| 스토어 심사·계정 | △ | Cursor **밖** | §39.9 체크리스트 |

#### User 웹 경험 → 앱 권장 순서

1. **`apps/mobile` Expo scaffold** — Agent: 「§39대로 mobile 생성」
2. **쇼핑 UI 먼저** (m02~m04, m08~m10) — 웹과 거의 같은 난이도
3. **월드는 2단계** — WebView+Phaser(빠름) vs RN 네이티브(느리지만 UX 좋음) 선택
4. **매일 Expo Go 실기 테스트** — 브라우저 대신 폰으로 확인
5. **EAS Build + 스토어** — §39.6·§39.9

#### 에이전트 규칙 (앱 작업 시)

- User는 **Cursor 웹 경험 풍부** — RN 문법만 설명 과다하지 말고 **HANDOFF·시안(§38) 기준으로 구현** 우선
- `apps/web` JSX **그대로 복붙 금지** — RN 컴포넌트로 **동일 IA** 재구현
- 비즈니스 로직은 **`packages/shared`로** — 웹·앱 중복 구현 금지 (§29 규칙)
- 터미널: `apps/mobile`에서 `npx expo start` — Agent가 **직접 실행·로그 확인**
- 월드 작업 전 §39.8 옵션 User 또는 Agent가 **브리핑 후** 착수 (§0)

---

## 40. 점주 AI 매장 에이전트 — 자연어·실사 → 레이아웃·진열 (AD-040)

> **User (2026-07-24):** 점주가 API 이미지 생성만 쓰는 것보다, **실제 팝업 사진 첨부** 또는 **자연어**("여기 선반, 저기 옷걸이 5벌" 등)로 **외관 + 실제 동작하는 진열 가구(슬롯 수)**까지 잡아주는 **웹 내장 AI 에이전트**를 API 사용량 안에서 줄 수 있나?  
> **한 줄 답:** **가능 — 단, 단계적으로.** v1은 **자연어 → 구조화된 매장 JSON(가구·슬롯·좌표) → 2D 미리보기 → 점주 승인**. 실사→픽셀 **전체 매장 자동 생성**은 v2+ (비용·품질 이슈). **진열 가구의 슬롯·용량**은 **고정 템플릿 카탈로그 + LLM 배치**가 현실적 (AD-033과 직결).

### 40.1 User가 원하는 것 (정리)

| 입력 | 원하는 출력 |
|---|---|
| 오프라인 팝업 **실사 사진** | 온라인 매장 **분위기·색·배치** 반영 |
| **자연어** 설명 | "왼쪽에 3칸 테이블", "옷걸이 5벌", "입구 쪽 카운터" 등 |
| (둘 다) | **보기 좋은 외관** + **손님이 실제로 상호작용하는 fixture**(AD-033) |

기존 계획(AD-012, docx §7-2)은 **상품 1장 → 픽셀 스프라이트** 변환에 가깝다.  
User 아이디어는 **매장 단위 copilot** — 범위가 넓지만 **AD-033(display_fixtures/slots) 위에 얹으면** 구현 경로가 있다.

### 40.2 현실성 평가 (솔직)

| 기능 | 가능? | 난이도 | API 비용 | 비고 |
|---|---|---|---|---|
| 자연어 → **테이블 3칸·옷걸이 5슬롯** 등 **구조 데이터** | ✅ **높음** | 중 | **낮음** (텍스트 LLM 1회) | fixture **템플릿 ID**만 고르면 됨 |
| 자연어 → **좌표·방 배치** 제안 | ✅ | 중 | 낮~중 | 그리드/방 템플릿 위 배치 |
| 실사 → **색·무드·존 힌트** (vision) | ✅ | 중 | 중 (vision 1회) | 레이아웃 **제안**용 |
| 실사 → **등각 픽셀 매장 전체** 자동 생성 | △ | **매우 높음** | **높음** | v1 **비권장** — 품질·일관성 불안 |
| 상품 실사 → **픽셀 스프라이트** (기존 AD-020) | ✅ | 중 | 중 (장당) | **상품별** 캐시·승인 — 유지 |
| 에이전트가 **승인 없이** 손님에게 노출 | ❌ | — | — | **금지** — draft→승인→publish (AD-021) |

**결론:** User vision **전체는 로드맵으로 타당**. **런칭 v1**은 「AI가 매장 전체를 그려준다」보다 **「AI가 레이아웃 초안을 짜주고, 점주가 미리보기에서 고친 뒤 승인」**이 현실적.  
→ **2026-07-24 보완 (AD-045, §45):** v1 최종 방향은 **리소스 추출 + 도면 에디터** — scene gen은 **하지 않음**.

### 40.3 권장 아키텍처 — 「에이전트 + 템플릿 카탈로그」

```
점주 (PC 웹 OWNER)
  │  채팅 + 사진 업로드
  ▼
Owner Store Agent (server/edge — API 키 서버만)
  │  tools 호출
  ├─ list_fixture_templates()     # table_3slot, rack_5, shelf_2 …
  ├─ suggest_layout(nl, photo?)   # → map_config + fixtures JSON
  ├─ apply_layout_draft(store_id) # draft 상태만 (AD-021)
  ├─ suggest_palette(photo?)      # 벽/바닥 색 (선택)
  └─ convert_product_pixel(prod)  # 기존 AD-020 (별도 quota)
  ▼
2D 미리보기 (Phaser/editor) — 점주 드래그 수정 가능
  ▼
[승인] → published → 손님 앱 월드 반영
```

**핵심:** AI가 **픽셀을 매번 새로 그리지 않음**.  
**미리 정의된 2D fixture 스프라이트**(AD-033) + **슬롯 수 메타데이터**를 LLM이 **배치·선택**한다.

#### Fixture 템플릿 예 (AD-033 확장)

| template_id | 표시명 | slot_count | interaction |
|---|---|---|---|
| `table_round_3` | 원형 테이블 3칸 | 3 | proximity → 슬롯 상품 |
| `rack_hanger_5` | 옷걸이 5벌 | 5 | 동일 |
| `shelf_wall_2` | 벽 선반 2칸 | 2 | 동일 |
| `counter_1` | 카운터 1칸 | 1 | 동일 |

점주: *「입구 오른쪽에 옷걸이 5개, 가운데 테이블 3칸」*  
→ Agent JSON:

```json
{
  "room_id": "main",
  "fixtures": [
    { "template": "rack_hanger_5", "x": 12, "y": 4, "rotation": 0 },
    { "template": "table_round_3", "x": 8, "y": 10, "rotation": 90 }
  ],
  "palette": { "wall": "#1a3d2e", "floor": "#2d1810" }
}
```

### 40.4 입력 모드

| 모드 | 처리 | API |
|---|---|---|
| **A. 자연어만** | LLM → fixture 배치 JSON | 텍스트 LLM (저렴) |
| **B. 실사 + 자연어** | Vision → 무드/색/존 힌트 + LLM 배치 | Vision + LLM |
| **C. 실사 → 배경만** | palette/wallpaper 제안 또는 타일 텍스처 (선택) | Image gen (비쌈, quota) |
| **D. 상품 픽셀** | 기존 docx §7-2, AD-020 | 상품당 1회, **hash 캐시** |

**User 제안과의 정렬:** A+B를 **v1**, C를 **v2**, D는 **상품 등록 탭**에서 별도 유지.

### 40.5 API 비용·악용 방지 (플랫폼 quota)

| 정책 | 내용 |
|---|---|
| **호출 주체** | **점주(owner)만** — 손님·anon **불가** (AD-020과 동일) |
| **서버 프록시** | LLM/Vision/Image API **키는 server/edge만** — 브라우저 직접 호출 금지 |
| **월간 quota** | 예: 매장당 **에이전트 대화 30턴**, **vision 5회**, **image gen 3회** (User·요금제로 조정) |
| **캐시** | `(store_id + prompt_hash + photo_hash)` → 동일 요청 **재생성 skip** |
| **승인 필수** | Agent 출력 = **draft** — `published`는 점주 **[승인]** 후만 (AD-021) |
| **템플릿 우선** | 자유 geometry 생성 **금지** — 카탈로그 밖 fixture는 "준비 중" |
| **로그·과금** | `owner_agent_runs` 테이블 — 토큰·비용·store_id 기록 |

**대략 비용 감 (변동):**
- 레이아웃 제안 1회 (텍스트 LLM): **원 단위~수십 원**
- vision 1장 + LLM: **수십~백 원대**
- SD/이미지 gen 매장 배경 1장: **백 원~** — **quota 엄격히**

### 40.6 UX (PC 웹 OWNER)

```
┌─────────────────────────────────────────────────────────┐
│ 매장 편집 · AI 어시스턴트          │  2D 미리보기 (live) │
│ ─────────────────────────         │  [등각/탑뷰]        │
│ 🤖 "성수동 팝업 느낌으로…"         │  fixture 배치 반영  │
│ 📷 [팝업 사진 첨부]               │                     │
│ 👤 "입구 옆 옷걸이 5…"           │  [승인] [수정] [취소]│
└─────────────────────────────────────────────────────────┘
```

- Agent 답변은 **「적용 미리보기」** — draft 반영, **승인 전 손님 비노출**
- 수동 드래그 에디터(AD-033)와 **병행** — AI는 **초안**, 점주가 **최종**

### 40.7 구현 단계 (로드맵)

| Phase | 범위 | 선행 조건 |
|---|---|---|
| **4a** | AD-033 fixture DB + 수동 에디터 | **필수 선행** |
| **4b** | Fixture **템플릿 카탈로그** JSON + Phaser 렌더 | 4a |
| **4c** | **NL → layout JSON** agent (텍스트만, quota) | 4b |
| **4d** | Vision: 실사 → palette/zone 힌트 | 4c |
| **4e** | Image gen: 배경/장식 (선택, quota) | 4d |
| **4f** | 요금제별 quota · `owner_agent_runs` | 4c+ |

**런칭 MVP:** **4a~4b (수동 진열)** = 핵심 · **4c (NL agent)** = 차별화 베타 · **4d~4e** = 런칭 후

### 40.8 기존 AD와 관계

| AD | 관계 |
|---|---|
| **AD-033** | Agent 출력의 **실체** — fixture·slot 스키마 |
| **AD-021** | draft/publish — Agent **승인 게이트** |
| **AD-020** | **상품** 픽셀 변환 — 매장 agent와 **분리 quota** |
| **AD-012** | 데모 Canvas downscale — 정식 agent **대체·확장** |
| **AD-011** | Agent UI = **PC 웹 OWNER** 전용 |

### 40.9 리스크·한계

- AI **오배치** → 미리보기·수정·승인 필수
- 실사 1장으로 오프라인과 **100% 동일** 픽셀 매장은 기대치 조절
- **저작권** — 점주 업로드 사진·브랜드 로고 AI 재생성 정책 명시
- **할루시네이션** — 없는 fixture 제안 → **카탈로그 화이트리스트**로 차단

### 40.10 체크리스트

- [ ] AD-033 fixture/slot 스키마 확정
- [ ] `fixture_templates` 시드 (table_3, rack_5, …)
- [ ] `OwnerDisplayPanel` 수동 편집 MVP
- [ ] `server/agent/owner-store-agent` + tool schema
- [ ] `owner_agent_runs` + quota
- [ ] OWNER 웹: 채팅 + draft preview + 승인

### 40.11 Pending User Input

- [ ] Agent **LLM 벤더** (OpenAI / Anthropic / Gemini 등)
- [ ] 매장당 **월 quota** 상한
- [ ] v1: **NL agent만** vs **vision 포함**
- [ ] **런칭 필수** vs **런칭 후 Pro 기능**

### 40.12 FAQ — 「수동 꾸미기 불가능?」 (User 2026-07-24)

> **User:** AI·템플릿 이야기 들으니, **기본 리소스 없으면 수동 꾸미기도 불가능**한 거 아닌가?

**아님.** 정리:

| | 설명 |
|---|---|
| **수동 꾸미기** | **가능하고, v1 핵심** — `OwnerDisplayPanel`(AD-033): 드래그로 가구 배치, 슬롯에 상품 끼우기, 순서 변경. AI **없어도** 동작해야 함. |
| **AI 에이전트** | **선택·보조** — 같은 fixture 카탈로그 위에서 **초안만** 빠르게 채워 줌. 수동 에디터 **대체 아님**. |
| **플랫폼 기본 리소스** | **필수 (AI 유무와 무관)** — 2D 픽셀 월드 + **슬롯 있는 진열 가구**는 스프라이트·메타(slot_count)가 있어야 손님 **상호작용**이 됨. |

**불가능한 것 vs 가능한 것**

| ❌ (v1 비목표) | ✅ (v1 목표) |
|---|---|
| 포토샵처럼 **아무 그림이나** 붙이면 자동으로 쇼핑 슬롯 동작 | 플랫폼 **fixture 카탈로그**에서 고르고 **수동** 배치 |
| AI가 **카탈로그 밖** 가구를 매번 새로 생성 | 벽/바닥 **팔레트·타일** 몇 종 + 가구 N종 **런칭 세트** |
| AI 없으면 매장 꾸미기 **불가** | AI 없이 **100% 수동**으로 매장 완성 가능 |

**플랫폼이 런칭 시 제공해야 할 최소 리소스 (AI와 별개):**

1. **방/바닥/벽** — 템플릿 2~3종 (등각/탑뷰)
2. **진열 fixture** — 테이블(3칸), 옷걸이(5), 선반(2) 등 **5~10종** + slot_count 메타
3. **(선택)** 점주 **대표 이미지·설명** — 이미 `CreateStorePage`에 있음 (홈 카드용)
4. **(후속)** 점주 **커스텀 픽셀 업로드** — 슬롯 규격 맞춘 스프라이트만 허용 (AD-020 확장)

**비유:** **뼈대(슬롯 fixture)** 는 플랫폼이 제공하고, **살(색·사진·브랜드·존 배치)** 은 점주 **실매장**에서 가져온다 — §41. AI는 그 살 붙이기를 **도와주는** 역할.

---

## 41. 실매장 유사도 — 「우리 팝업」이 보여야 한다 (AD-041)

> **User (2026-07-24):** 단순 게임이 아니라 **실제 팝업스토어**와 연관된 플랫폼. 점주는 **본인 팝업**과 **최대한 비슷한** 온라인 매장을 원할 것.  
> **한 줄:** **맞다 — 이건 제품 성공 조건.** 기술적으로 「제네릭 게임 맵 1개」로 끝내면 **입점 동기·손님 신뢰**가 없다. **동작 골격(fixture+슬롯)** 과 **점주 브랜딩(실매장에서 끌어온 시각·배치)** 을 **분리**해서, 후자를 최대한 채우는 게 설계 목표.

### 41.1 점주가 「닮았다」고 느끼는 요소 (우선순위)

| # | 요소 | 점주 입력 | 손님이 느끼는 것 |
|---|---|---|---|
| 1 | **브랜드 색·무드** | 팝업 **실사**, 로고, 설명 | 「GUCCI 팝업」vs 「아무 쇼룸」 |
| 2 | **공간 배치** | 「입구·테이블·옷걸이·카운터」 위치 | 오프라인 **동선**과 비슷 |
| 3 | **진열 방식** | 테이블 N칸, 옷걸이 M벌 | 실물 **진열과 같은 방식**으로 고름 |
| 4 | **상품** | **실물 사진** + (선택) 픽셀 | 살 **진짜 그 상품** |
| 5 | **대표 비주얼** | 대표 이미지, 입장 모달 | 홈·입장에서 **그 팝업** |
| 6 | **(후속) 벽/바닥 텍스처** | 팝업 사진에서 추출 palette/타일 | 픽셀 공간 **색감** 일치 |

**100% 픽셀 복제**가 아니어도, 위 1~5만 잘 되면 **「우리 팝업 온라인 버전」** 인식 가능 (시안 GUCCI 예시).

### 41.2 기술 모델 — 「레고 뼈대 + 점주 스킨」

```
┌─────────────────────────────────────────────────┐
│  점주 브랜딩 레이어 (매장마다 다름)                │
│  · 실사 사진 → palette / zone / 대표 이미지      │
│  · 자연어·수동 → 존 배치 (입구 테이블, …)        │
│  · 상품 실사 → 쇼핑 UI + (선택) 픽셀 스프라이트   │
├─────────────────────────────────────────────────┤
│  플랫폼 골격 (공통, 슬롯·상호작용 보장)            │
│  · fixture 템플릿 (테이블·옷걸이·선반)            │
│  · slot_count, proximity, 주문 연동              │
│  · 방/층/문 (AD-025)                             │
└─────────────────────────────────────────────────┘
```

- **게임처럼 보이되** → 손님 UX는 픽셀·아바타  
- **쇼룸처럼 느껴지려면** → **점주 레이어**가 두꺼워야 함  
- AI(AD-040)는 **점주 레이어를 빠르게 채우는 도구** — 제네릭 맵을 **덮어쓰는** 쪽

### 41.3 점주가 「내 팝업 닮기」를 하는 경로 (AI 없이도)

| 방법 | 설명 | 런칭 |
|---|---|---|
| **대표 이미지·설명** | 홈 카드·입장 모달 | ✅ 구현됨 |
| **실사 상품 + 상세** | 쇼핑은 실사 (docx §7-1) | ✅ 구현됨 |
| **팔레트/테마** | 벽·바닥·액센트 색 — 점주 선택 또는 사진에서 추출 | Phase 4 |
| **존 배치** | 수동 에디터로 fixture 위치 = 실매장 동선 | Phase 4 (AD-033) |
| **상품 픽셀** | 내 상품 사진 → 월드·착용용 (AD-020) | Phase 4 |
| **커스텀 배경** | 팝업 사진 → 타일/배경 (quota) | v2 |
| **AI 한 번에** | 사진+말 → 위를 초안 (AD-040) | v1 베타~ |

**핵심:** 「닮음」의 대부분은 **점주가 넣는 실사·색·배치·상품**에서 나옴. 플랫폼 fixture는 **「진열이 동작하게 하는 관」**일 뿐, **관만으로는 GUCCI 팝업이 안 됨.**

### 41.4 제품에서 피해야 할 것

- 모든 입점 매장이 **똑같은 회색 쇼룸**
- fixture 카탈로그만 있고 **브랜드 색·사진·존 커스터마이즈** 없음
- 데모 GUCCI만 화려하고 **점주 매장은 기본 템플릿**만
- 「게임 맵 에디터」 UX — 점주에게는 **「내 팝업 옮기기」** 카피

### 41.5 런칭 MVP — 실매장 유사도 최소 기준

점주 매장이 published 되려면 (에디터 완성 시):

- [ ] **대표 이미지** (실매장·브랜드)
- [ ] **테마 palette 1세트** (기본 3색 이상 — 사진 추출 or 수동)
- [ ] **fixture 1종 이상** 배치 + 슬롯에 **실물 상품** 1개 이상
- [ ] (권장) 입장 모달·월드 타이틀 = **매장명·브랜드**

→ 「템플릿만 깔린 빈 방」은 **출시 불가** (draft만 허용, AD-021).

### 41.6 AI·카탈로그와의 관계 (§40 보완)

| 오해 | 실제 |
|---|---|
| 카탈로그 = 모든 매장 똑같이 생김 | 카탈로그 = **진열 가구 종류**. **색·배치·상품·사진**은 매장마다 다름 |
| AI 없으면 닮을 수 없음 | **수동**으로 palette·배치·상품·대표 이미지로 **충분히** 닮김 |
| AI = 제네릭 맵 생성 | AI = **점주 실사·설명** → palette·배치 **초안** (§40) |

### 41.7 Pending User Input

- [x] palette/테마 — **사진 자동 추출 우선** + 수동 미세조정 → **§42**
- [x] published **최소 기준**(§41.5) — **강제**
- [x] 입점 온보딩 — **「팝업 사진으로 시작」wizard** → AD-042, **§42**

---

## 42. 실행안 — 비용 아끼면서 「내 팝업 닮기」+ 점주 편의 (AD-042)

> **User (2026-07-24):** 그걸 **어떻게** 할 거냐 — **비용**도 아끼고, 점주 **편의**도 줘야 한다.  
> **한 줄:** **「사진 3장 → 5분 안에 초안 → 손으로 조금만 고침 → 출시」**. 비싼 **매장 전체 image gen은 v1 금지**. **싼 vision+LLM**으로 **색·배치**만 자동, **동작**은 **fixture 레고**, **닮음**은 **점주 실사·상품**에서.

### 42.1 점주 UX — 「팝업 사진으로 시작」3단 wizard

**목표:** 점주는 **게임 에디터**가 아니라 **「우리 팝업 옮기기」**만 본다.

```
STEP 1  기본 정보 (구현됨)
        매장명 · 동네(주소) · 대표 이미지 1장

STEP 2  📷 「팝업 사진으로 꾸미기」
        · 실매장 사진 1~3장 (전경 / 진열 / 입구)
        · (선택) 한 줄: "가운데 원형 테이블, 벽에 옷걸이…"
        · [AI로 초안 만들기] — 10~30초

STEP 3  미리보기 + 손 수정
        ┌ 실매장 사진 ┬ 온라인 미리보기 ┐
        │  참고용      │  드래그로 수정    │
        └─────────────┴──────────────────┘
        · 색 3칸 (AI 추출 → 슬라이더 조정)
        · 가구 드래그 (카탈로그 8종)
        · 슬롯에 상품 연결
        · [임시저장] [출시하기]

STEP 4  상품 등록 — 실사 + (선택) 월드용 픽셀 1장/상품
```

**편의:** 말/사진으로 시작 · 실사 vs 미리보기 **나란히** · AI 틀리면 **드래그** · 「테이블 3칸」 등 **일반어**

### 42.2 서버 처리 — v1 비용表

| 단계 | 기술 | 비용/매장 | v1 |
|---|---|---|---|
| 색·무드 | Vision → palette JSON | ~수십 원, **1회** | ✅ |
| 배치 초안 | LLM + fixture 8종 | ~수십 원, **1회** | ✅ |
| 채팅 수정 | layout patch JSON | ~원/턴 | ✅ quota |
| 벽/바닥 | palette → **타일 12종** 매칭 | **0원** | ✅ |
| 가구 | **플랫폼 스프라이트 8종** | **0원** | ✅ |
| 상품 픽셀 | 실사→픽셀, hash 캐시 | ~백 원/상품 1회 | ✅ |
| **매장 전체 gen** | SD 등 | 비쌈 | ❌ **금지** |

**원칙:** **생성 최소 · 추출+조합 최대** — 상세 워크플로 **§45**

### 42.3 Fixture 8종 (런칭)

`table_round_3`, `table_rect_4`, `rack_hanger_5`, `rack_hanger_8`, `shelf_wall_3`, `pedestal_1`, `counter_1`, `display_case_2`  
+ 바닥 4 · 벽 4 · 액센트 4 타일 = palette만으로 **매장마다 다른 분위기**

### 42.4 월 quota (입점 기본)

| 항목 | 한도 |
|---|---|
| wizard vision+layout | **1회 무료** |
| agent 채팅 | **10턴/월** |
| vision 재분석 | **2회/월** |
| 상품 픽셀 | **20장/월** (캐시) |
| 매장 배경 gen | **0 (v1)** |

AI 실패 시 → **수동 palette + 드래그** fallback (막히지 않음).

### 42.5 닮음 공식

`palette(실사) + 대표이미지 + fixture배치(동선) + 상품실사 + (선택)상품픽셀`  
→ **100% 픽셀 복제 불필요**, GUCCI 시안 수준 인식 목표.

### 42.6 구현 순서

1. AD-033 fixture 8종 + OwnerDisplayPanel (수동 출시 가능)  
2. palette 추출 + 타일 매칭  
3. StoreSetupWizard STEP 2~3  
4. server agent suggest/patch  
5. quota + `owner_agent_runs`

### 42.7 체크리스트

- [x] fixture 8종 DB 카탈로그 (`fixture_templates` 시드, 2026-07-27)
- [ ] fixture 8종 등각 픽셀 아트
- [ ] 타일 12종
- [ ] `StoreSetupWizard`
- [ ] `extract_palette` / `suggest_layout` API
- [ ] 실사|미리보기 split view
- [ ] quota UI

---

## 43. GUCCI 데모 등각 월드 — 지금 vs 정식 (AD-043)

> **User 질문 (2026-07-24):** 「지금 왜 이렇게 하고 있고, 정식 땐 어떻게 할 건지」 다인수인계에 정리되고 있나?  
> **한 줄 답:** **예.** `HANDOFF_POPUP_STORE.md`가 living document(AD-018). 아래가 그 요약.

### 43.1 지금 하는 이유 (CEO/투자자 데모)

| 목표 | 내용 |
|---|---|
| **보여줄 것** | `m05-world-mobile.png` 수준 **등각 2D 픽셀 부티크** + 멀티플레이 + 채팅 + 상품/장바구니 |
| **기한** | 런칭·시연 (§1 Launch status) |
| **브랜드** | GUCCI = **데모 전용** (AD-009), 정식 전 교체·§30 초기화 |
| **기술 선택** | PDF 시안과 **같은 AI 이미지 생성** → room/avatar **분리 PNG** → Phaser **2:1 dimetric 그리드**에 조립 |

**하지 않는 것 (데모에서 시도했다가 폐기):**
- 목업 PNG를 Phaser 배경으로 **통째 붙이기**
- `Graphics`로 사각형·chevron **placeholder** 바닥/가구 그리기
- `map_config` 가구 충돌과 generated 충돌 **이중 적용**

### 43.2 아키텍처 (겉면만 등각 아님)

```
[AI room PNG 1024×1536]  ── 배경 (고정)
[AI avatar PNG]          ── 캐릭터 (depth sort)
[Tile grid tx,ty]        ── Socket 이동·멀티플레이 논리 좌표
[Room pixel px,py]       ── 발 위치 = dimetric 투영; 가구 충돌·상호작용은 **픽셀 ellipse/rect**
[Socket.io]              ── 멀티플레이 (정식과 동일)
```

**투영식 (2026-07-24 보정):**  
`px = (tx - ty) × 26 + 580`, `py = (tx + ty) × 13 + 601`  
테이블 중심 `(554, 874)` ↔ tile `(10, 11)` 앵커.

**충돌:** 타일 숫자 박스 ❌ → `TABLE_PIXEL_ELLIPSE` + 소파/카운터 rect + 바닥 bounds (`generatedWorldAssets.ts`).  
**상호작용:** 테이블 **위(ellipse 내부) ❌**, 테이블 **주변 ring(0.78<d≤1.48) ✅**.

- **파일:** `generatedWorldAssets.ts`, `topDownGame.ts` (`visualStyle: 'generated'`)

### 43.3 정식 때 (Phase 4+)

| 데모 (지금) | 정식 |
|---|---|
| GUCCI 하드코드 room PNG | 점주 **템플릿 room + palette** 또는 승인된 픽셀 에셋 (§41·§42) |
| `isGeneratedBlockedTile()` 수동 zones | **§44 Grid Occupancy** — fixture footprint + walkability 마스크 |
| `GENERATED_NPCS` 고정 | 실제 접속 유저 only (또는 이벤트 NPC 설정) |
| `DisplayProductModal` → products API 3종 | **`display_slots`** → fixture별 슬롯 상품 (AD-033) |
| 착용 미리보기 placeholder | `TryOnPreview` 실구현 |
| `apps/web` 반응형 데모 | **앱(Expo)** 쇼핑·월드 + **웹** 점주 관리 (AD-037) |

**선행 조건:** AD-033 fixture DB + OwnerDisplayPanel + **§44 occupancy 빌드** → 그 위에 AI agent(AD-040) optional.

> 정식 충돌·배치 규칙의 **단일 진실 소스**는 **§44**. §43은 데모(GUCCI) 한정 예외.

### 43.4 다음 에이전트가 이어갈 때

1. §43 Changelog + `generatedWorldAssets.ts` 읽기
2. 그리드/NPC/충돌 이슈 → **앵커 수치** 조정 (코드 구조 바꾸지 말 것)
3. Phase 4 착수 시 §32 + **§44** — occupancy 빌드·DB 슬롯 연동부터
4. 큰 결정은 AD 테이블에 한 줄 추가 (AD-018)

---

## 44. Grid Occupancy 표준 — 등각 타일 맵 (AD-044)

> **User (2026-07-24):** Gemini에 등각뷰 도면 구조를 물어본 결과 — `grid[x][y]` 다중 타일 가구 점유, Y-sort, 벽·가구 충돌, 방+문 — **우리도 이쪽이 맞나?**  
> **한 줄 답:** **정식(Phase 4+) 아키텍처 = 예, 동일 축.** GUCCI 데모(§43)만 **과도기 하이브리드**(타일 이동 + PNG 픽셀 충돌).

### 44.1 시스템 개요

POP-UP CUBE 월드는 **2D 등각(isometric / 2:1 dimetric) 뷰**이지만, **논리 좌표는 바둑판 타일 그리드**로 관리한다.

| 레이어 | 역할 | 정식 | GUCCI 데모 (§43) |
|---|---|---|---|
| **Tile grid `(tx, ty)`** | Socket 이동·멀티플레이·충돌·상호작용 | ✅ 단일 진실 소스 | ✅ 이동·서버 동기화 |
| **Room pixels `(px, py)`** | 스프라이트·배경 PNG 위치 (투영) | ✅ 렌더만 | ✅ + **임시 픽셀 충돌** |
| **Fixture occupancy** | 가구가 차지하는 **여러 타일** | ✅ `origin + w×d` | ❌ 하드코드 ellipse/rect |
| **Y-sort depth** | 앞/뒤 가림 | ✅ `(tx + ty)` | ✅ `generatedDepth()` |

**원칙:** 정식에서는 **PNG·스프라이트는 그림**, **타일 occupied가 게임 규칙**(걷기·충돌·상호작용)의 기준이다.

### 44.2 Gemini 스펙 ↔ POP-UP CUBE 매핑

User가 공유한 Gemini 도면(3방 거실·침실·창고 예시)은 **등각 맵의 일반 패턴**이다. POP-UP CUBE에 그대로 대응하면:

| Gemini / 일반 등각 스펙 | POP-UP CUBE 정식 | 관련 AD·§ |
|---|---|---|
| 2D 그리드 `grid[x][y]` | `map_config` + runtime occupancy 빌드 | AD-033, §7 |
| 가구 **다중 타일** (3×1 소파, 2×2 침대 …) | `display_fixtures`: `origin` + `size.w` × `size.d` | AD-033, §32 |
| `isOccupied = true` + `placedObject` | `grid[tx][ty].occupied` + `fixture_id` | §44.4 |
| **Y-Sort** `SortOrder = X + Y` | `isoDepth()` / `generatedDepth()` — `(tileX + tileY) × 1000 + layer` | `isoVisuals.ts`, `generatedWorldAssets.ts` |
| 벽·가구 = Unwalkable | `walkable: false` 또는 `is_collidable: true` | §44.5 |
| **문(Door)** = 방 간 통로 | `transitions[]` (door / elevator) | AD-025, §7 |
| Pathfinding (A*) | Phase 4+ optional — v1은 키보드 직접 이동 | §44.6 |
| 3개 방 레이아웃 | `map_config v2` — `rooms[]` 각각 20×20 등 | AD-025 |

> Gemini 예시의 「6×5 거실」은 **참고 도면**이지 POP-UP CUBE 고정 크기가 아님. 데모 GUCCI는 **단일 room 20×20** + AI room PNG 1장.

### 44.3 좌표계 (2-layer)

**1) 논리 타일 `(tx, ty)`** — 정수 그리드, Socket·Redis·충돌·상호작용

**2) 화면 픽셀 `(px, py)`** — 등각 투영으로 스프라이트 배치 (데모 GUCCI, 2026-07-24 보정):

```
px = (tx - ty) × 26 + 580
py = (tx + ty) × 13 + 601
```

- 앵커: 테이블 중심 tile `(10, 11)` ↔ pixel `(554, 874)`
- **정식:** fixture `origin`은 **타일** 기준; 스프라이트 offset은 템플릿 메타데이터
- **데모:** AI room PNG와 그리드 100% 정합 전까지 §43 **픽셀 ellipse/rect** 보정 레이어 유지

### 44.4 Fixture 점유 (Multi-tile Occupancy)

가구/조형물(display fixture)은 **1×1이 아닐 수 있다.** `(originX, originY)` + `width`(X축 칸 수) + `depth`(Y축 칸 수)로 점유 타일을 계산한다.

**예시 (Gemini 도면과 동일 규칙):**

| 오브젝트 | size (w×d) | origin | 점유 타일 (예) |
|---|---|---|---|
| 대형 소파 | 3×1 | (1, 1) | (1,1)(2,1)(3,1) |
| 더블 침대 | 2×2 | (7, 1) | (7,1)(8,1)(7,2)(8,2) |
| 세로 수납장 | 1×3 | (0, 6) | (0,6)(0,7)(0,8) |
| 단일 화분 | 1×1 | (4, 4) | (4,4) |
| **GUCCI 중앙 테이블 (정식화 시)** | 3×3 (안) | (9, 10) | 9~11 × 10~12 |

**배치 시:** 점유 구간 `[origin.x .. origin.x+w-1] × [origin.y .. origin.y+d-1]` 모든 칸을 `occupied: true`로 마킹.

**삭제·이동 시:** 이전 점유 칸 전부 해제 후 새 origin에 재점유.

**정식 TypeScript (Phase 4 구현 방향):**

```typescript
interface TileCell {
  walkable: boolean;       // false = 벽·바닥 밖
  occupied: boolean;       // fixture가 점유
  fixtureId?: string;
}

interface DisplayFixture {
  id: string;
  kind: 'table_round_3' | 'sofa_3x1' | 'hanger' | 'shelf' | ...;
  origin: { x: number; y: number };
  size: { w: number; d: number };  // width × depth (타일 칸)
  slot_count: number;
  label?: string;
}

function occupyFixture(grid: TileCell[][], fixture: DisplayFixture): void {
  for (let dx = 0; dx < fixture.size.w; dx++) {
    for (let dy = 0; dy < fixture.size.d; dy++) {
      const x = fixture.origin.x + dx;
      const y = fixture.origin.y + dy;
      grid[x][y] = { ...grid[x][y], occupied: true, fixtureId: fixture.id };
    }
  }
}
```

**DB:** §7·§32 초안 — `display_fixtures` (store_id, kind, x, y, slot_count) + `size` 컬럼 또는 kind→템플릿 카탈로그에서 w×d lookup.

### 44.5 충돌 (Collision)

| 타일 상태 | 이동 | 비고 |
|---|---|---|
| `walkable: false` | ❌ | 벽, 매장 밖, 바닥 마스크 밖 |
| `occupied: true` | ❌ | fixture footprint |
| 문 tile (`transitions`) | ✅ (조건: 해당 transition 활성) | 방 이동 트리거 |
| 그 외 walkable & !occupied | ✅ | |

**상호작용 (AD-033):** 손님이 fixture **인접 walkable 타일**에 서 있을 때 `E · ○○ 상품 보기` — ellipse ring(데모) 대신 **타일 기준 proximity** (fixture bounding box + 1칸 ring).

**데모 예외 (§43):** `isGeneratedBlockedTile()` — room PNG 픽셀 영역(테이블 ellipse, 소파/카운터 rect, floor bounds). **이중 충돌 금지:** generated 모드에서 `map_config.layers.objects` collidable **무시**.

### 44.6 Y-Sorting (Depth Indexing)

등각뷰에서 **화면 아래(큰 ty, 또는 tx+ty 큼)** 오브젝트가 앞에 그려져야 한다.

```
depth = (tileX + tileY) × 1000 + layerOffset
```

- **캐릭터:** layer ≈ 5~6 (`topDownGame.ts`)
- **가구 스프라이트:** fixture `(origin.x + origin.y + size)` 기준 또는 tile별 depth
- **말풍선:** layer ≈ 25

구현: `isoDepth()` (`isoVisuals.ts`), `generatedDepth()` (`generatedWorldAssets.ts`) — **정식·데모 동일 공식**.

### 44.7 다방·문 (AD-025)

Gemini 「3방 + 벽 + 문」= POP-UP CUBE **`map_config v2`**:

```json
{
  "store_id": "popup_example",
  "rooms": [
    {
      "id": "room_1f",
      "map_size": { "width": 20, "height": 20 },
      "layers": { "floor": [...], "objects": [...] },
      "fixtures": [ { "kind": "sofa_3x1", "origin": { "x": 1, "y": 1 }, "size": { "w": 3, "d": 1 } } ],
      "transitions": [
        { "x": 10, "y": 0, "type": "door", "target_room_id": "room_back", "target_x": 5, "target_y": 18 }
      ]
    }
  ]
}
```

- 방마다 **독립 occupancy grid** 빌드 → `room:enter` 시 해당 room grid 로드 (Phase 4 설계)
- **문 타일:** `walkable: true`, `transition_id` — occupied 아님

### 44.8 Pathfinding

| 단계 | 정책 |
|---|---|
| v1 (Phase 4 launch) | **키보드/WASD 직접 이동** — occupied·walkable만 검사 |
| v2+ | A* 또는 grid BFS — NPC patrol, 클릭 이동, AI agent 경로 검증 |

데모·정식 v1 모두 **A* 필수 아님**. Gemini 스펙의 pathfinding은 **정식 v2+** 로드맵.

### 44.9 데모 vs 정식 — 한눈에

| | GUCCI 데모 (지금, §43) | 정식 (Phase 4+, §44) |
|---|---|---|
| Room visual | AI PNG 1장 | 템플릿 + palette / 승인 픽셀 (§41·§42) |
| 이동 좌표 | 20×20 tile | room별 tile grid |
| 충돌 | PNG pixel ellipse/rect | **`grid occupied` + walkable mask** |
| 가구 | 하드코드 영역 | `display_fixtures` + 카탈로그 w×d |
| 상호작용 | pixel ring around table | fixture tile proximity |
| Y-sort | `(tx+ty)` ✅ | 동일 |
| 다방 | 1 room | AD-025 `rooms[]` |
| Pathfinding | 없음 | v2+ optional |

### 44.10 Phase 4 구현 체크리스트

- [x] `buildOccupancyGrid(map_config | fixtures[])` — `packages/game-core/src/occupancyGrid.ts` (2026-07-27)
- [x] fixture 카탈로그 — `fixture_templates` DB 8종 + `size_w`, `size_d`, `slot_count` (2026-07-27)
- [ ] `OwnerDisplayPanel` — 배치 시 overlap·벽 검사 = occupied 충돌
- [ ] Phaser — `canWalk(tx,ty)` = walkable && !occupied; generated 픽셀 충돌 **제거**
- [ ] Interact — fixture bbox + adjacent tile ring
- [ ] `map_config v2` rooms + transitions (AD-025)
- [ ] (v2+) A* pathfinding module

### 44.11 관련 파일·§

| 항목 | 위치 |
|---|---|
| 데모 투영·픽셀 충돌 | `packages/game-core/src/generatedWorldAssets.ts` |
| **§44 occupancy 엔진** | `packages/game-core/src/occupancyGrid.ts` |
| **fixture CRUD (웹·앱 공용)** | `apps/web/src/lib/displayFixtures.ts` |
| depth sort | `isoVisuals.ts`, `generatedWorldAssets.ts`, `topDownGame.ts` |
| fixture·슬롯 UX | §32, AD-033 |
| 다방 | §7 `map_config v2`, AD-025 |
| 데모 한정 예외 | §43 |
| 점주 AI 배치 출력 | §40 — LLM JSON = §44 fixture list |
| **정식 점주 워크플로** | **§45** — 도면 → 리소스 배치 |

*Last updated: 2026-07-24 (§44 Grid Occupancy) by Cursor Agent*

---

## 45. 리소스 추출 + 픽셀 도면 에디터 (AD-045)

> **User (2026-07-24):** 매장 **전체**를 AI로 그리면 API도 많이 쓰고, GUCCI 데모처럼 **충돌·좌표 어긋남** 생길 수 있다.  
> 차라리 **실사에서 타일·가구·소품·재고만** 뽑아 **점주 계정 라이브러리**에 두고, 필요할 때마다 **리소스만** 추가 생성.  
> 꾸미기 **전에** 픽셀 **도면**(벽·구조)을 자유롭게 잡고 → 바닥은 **좌클릭 드래그로 칠하기** → 가구·장식은 **칸 점유** 맞게 배치·벽걸이도 점유 공간.  
> **한 줄 답:** **이해 맞고, 정식 방향으로 채택.** §44 occupancy 위에서 **「도면 먼저, 꾸미기는 그리드에 맞춰」** — GUCCI §43 픽셀 보정을 **구조적으로 제거**하는 설계.

### 45.1 왜 매장 전체 생성을 안 하는가

| 문제 (GUCCI 데모 §43에서 이미 겪음) | 원인 |
|---|---|
| 캐릭터가 테이블 위·벽 안으로 들어감 | AI **room PNG**와 **타일 그리드**가 1:1 정합 안 됨 |
| `isGeneratedBlockedTile()` 픽셀 ellipse 수동 튜닝 | **그림**이 충돌의 기준이 됨 — 유지보수 지옥 |
| API 비용 | room 1024×1536 **통째 gen** = 호출 1번당 비쌈 |
| 점주 재사용 | 통째 PNG는 **부분 수정·재배치** 불가 |

**AD-045 원칙:** AI는 **장면(scene)을 만들지 않는다.** **부품(part)** 만 뽑고, **점주가 그리드 에디터**에서 조립한다.

### 45.2 제품 모델 — 「추출 → 라이브러리 → 도면 → 꾸미기」

```
점주 실사 업로드 (전경 / 진열 / 입구 / 상품)
        │
        ▼
  API: 리소스 추출 (quota, 서버만)
        │  · 바닥/벽 타일 패턴 (repeatable)
        │  · 진열 가구 스프라이트 + slot_count 추정
        │  · 소품·장식 (1×1 또는 w×d)
        │  · (선택) 재고 상품 ↔ 실물 사진 매칭 픽셀
        ▼
  owner_asset_library  ← store/owner 귀속, 영구 보관
        │
        ▼
  STEP A: 픽셀 도면 (Blueprint) — 구조만
        │  · 방·벽·문·unwalkable 영역 추가/수정/삭제
        │  · §44 grid walkable 마스크 생성
        ▼
  STEP B: 꾸미기 (Decorate)
        │  · 바닥: 팔레트/추출 타일로 **칸 칠하기** (드래그 페인트)
        │  · 가구: 라이브러리에서 선택 → **origin + w×d** 스냅 배치
        │  · 벽걸이: wall layer 점유 (§45.5)
        │  · 슬롯에 상품 연결 (AD-033)
        ▼
  draft → 승인 → published (AD-021)
        ▼
  손님 Phaser 월드 — §44 occupancy만, 픽셀 보정 ❌
```

### 45.3 AI API — 「전체 그림」vs 「리소스 추출」

| | 매장 전체 gen (❌) | 리소스 추출 (✅ AD-045) |
|---|---|---|
| 출력 | room PNG 1장 | 타일·가구·소품 **N개 스프라이트** + 메타 |
| API 비용 | 호출당 **높음** | **작은 crop/segment 단위** — 필요한 만큼만 |
| 그리드 정합 | ❌ 수동 보정 | ✅ 에디터가 **그리드에 배치** |
| 충돌 | PNG 픽셀 | §44 **occupied** |
| 재사용 | 어려움 | 라이브러리에 **영구**, 다른 매장·칸에도 |
| 추가 요청 | 통째 재생성 | 「이 화분만」「이 테이블만」**1개씩** |

**비용 직관:** 전체 room 1장 ≈ 리소스 5~15개 추출 합과 비슷하거나 더 비쌀 수 있음.  
하지만 추출은 **캐시·선택적 호출** — 초기 3~5개만 뽑고 나머지는 꾸미다 부족할 때 추가.

### 45.4 점주 에셋 라이브러리 (계정 귀속)

**초안 스키마:**

```sql
-- owner_assets (또는 store_assets)
-- id, owner_id, store_id NULLABLE, kind, label,
-- storage_path, thumb_path,
-- size_w, size_d,           -- §44 floor occupancy (가구·소품)
-- slot_count NULLABLE,      -- 진열 fixture만
-- mount: 'floor'|'wall', wall_face NULLABLE,
-- source_photo_path, extract_job_id,
-- created_at
```

| kind | 예 | 메타 |
|---|---|---|
| `floor_tile` | 대리석 패턴, 카펫 칸 | repeat, palette |
| `wall_tile` | 벽지·브릭 | repeat |
| `fixture` | 테이블·옷걸이·선반 | w×d, slot_count, interact |
| `prop` | 화분·박스·소형 장식 | w×d, collidable |
| `product_pixel` | 내 상품 픽셀 | product_id FK (AD-020) |

- **귀속:** `owner_id` — 점주 계정; `store_id`로 매장별 필터
- **Storage:** Supabase `store-assets` bucket (§7 TODO)
- **RLS:** 본인 owner만 CRUD; published 매장에만 손님 read

### 45.5 2단 에디터 UX

#### STEP A — 픽셀 도면 (Blueprint)

점주가 **먼저** 「우리 매장 구조」를 잡는다. **예쁜 그림 아님** — **논리 도면**.

| 도구 | 동작 | grid 반영 |
|---|---|---|
| 벽 그리기 | 선/사각형으로 벽 | `walkable: false` |
| 문 추가 | 벽 위 door tile | `walkable: true` + `transition` (AD-025) |
| 방 구역 | room id 라벨 (다방) | room별 sub-grid |
| 지우개 | 벽·문 삭제 | walkable 복원 |
| (선택) AI 힌트 | 실사 → **벽선·존** 제안 (vision, 저렴) | 점주 **수정 후** 확정 |

- **자유 추가/수정/삭제** — User 요구 그대로
- 출력: `blueprint` JSON → `buildWalkabilityMask()` → §44 `grid[x][y].walkable`

#### STEP B — 꾸미기 (Decorate)

| 도구 | UX | §44 |
|---|---|---|
| **바닥 칠하기** | 라이브러리 타일 선택 → **좌클릭 드래그**로 칸 채움 (페인트) | `layers.floor[tx,ty]=tile_id` |
| **가구 배치** | 라이브러리 fixture 드래그 | `occupyFixture()` w×d |
| **소품** | 1×1 또는 다칸 | occupied |
| **벽걸이** | 벽 타일 클릭 → facing | **wall layer** (§45.6) |
| **슬롯** | fixture 선택 → 상품 끼우기 | AD-033 |

**플랫폼 카탈로그 8종(§42)** = 라이브러리 **기본 내장**. 추출 리소스 = **같은 슬롯 규격** 맞으면 slot_count·w×d 메타만 검증 후 사용.

### 45.6 벽면 점유 (Wall mount)

바닥 `grid[x][y]`와 **별 레이어**:

```
wall_slots[x][y][face]  — face ∈ N|E|S|W
  · occupied, asset_id, depth sort
  · 바닥 walkable과 독립 — 「벽에 걸린 그림」은 floor 칸을 막지 않음 (또는 얇은 선반은 1칸 점유 정책 선택)
```

- **벽걸이 옷걸이·선반·액자:** wall slot + (선반류는 floor 1칸 forward 점유 옵션)
- **Y-sort:** `(tx+ty)` + layer offset (§44.6)
- Phase 4 v1: **floor fixture 우선**, wall mount v1.1

### 45.7 §40·§42와의 관계 (보완, 대체 아님)

| 기존 (§40·§42) | AD-045로 정교화 |
|---|---|
| vision → palette | ✅ 유지 — **타일 매칭**에 사용 |
| LLM → fixture 배치 초안 | ✅ 유지 — **Blueprint 위** 배치 제안 |
| 매장 전체 image gen **금지** | ✅ **강화** — room/scene gen **영구 비권장** |
| 플랫폼 fixture 8종 | ✅ **fallback** — 추출 실패·quota 초과 시 |
| 상품 픽셀 (AD-020) | ✅ **라이브러리 `product_pixel`** 로 통합 |

**Agent 역할 변경:** 「매장 그려줘」→ 「**이 사진에서 테이블이랑 바닥 타일 뽑아줘**」+ 「**도면 위에 여기 테이블 놓을까?**」

### 45.8 GUCCI 데모 vs 정식 (한 줄)

| GUCCI §43 | AD-045 정식 |
|---|---|
| AI **room PNG 통째** | ❌ 사용 안 함 |
| 픽셀 ellipse 충돌 | ❌ → §44 occupied |
| 하드코드 NPC·테이블 | → fixture 라이브러리 + 도면 배치 |
| CEO 시연용 **throwaway visual** | 점주 **Self-serve 에디터** |

### 45.9 API quota (리소스 추출 기준)

| 항목 | v1 제안 |
|---|---|
| wizard 최초 추출 | **5 리소스/매장** 무료 (타일1+가구2+소품2) |
| 추가 추출 | **3회/월** 또는 유료 |
| 재추출 동일 사진 | hash 캐시 → **0원** |
| vision 벽선 힌트 | §42 vision quota 공유 |
| **scene / room gen** | **0** |

### 45.10 Phase 4 구현 체크리스트

- [ ] `owner_assets` 테이블 + Storage + RLS
- [ ] `extract_resource` API (segment/crop → sprite + w×d + slot 추정)
- [ ] `BlueprintEditor` — 벽·문·walkable 페인트
- [ ] `DecorateEditor` — floor drag-paint, fixture snap, overlap 검사
- [x] `buildOccupancyGrid(blueprint, fixtures)` — §44 (`occupancyGrid.ts`, 2026-07-27)
- [ ] Phaser: generated 픽셀 충돌 경로 **제거**, tile-only
- [ ] Agent tools: `extract_from_photo`, `suggest_blueprint`, `suggest_placement`
- [ ] (v1.1) `wall_slots` 벽걸이

### 45.11 Pending User Input

- [ ] 추출 API — **segmentation 전용** vs **image gen crop** 혼합
- [ ] 추출 fixture **slot_count 자동 추정** vs 점주 수동 지정
- [ ] 벽걸이 — floor 칸 점유 **안 함** vs **얇은 선반 1칸** 정책
- [ ] 라이브러리 — **매장별** vs **점주 계정 전역** 공유

*Last updated: 2026-07-24 (§45 resource extract + blueprint editor) by Cursor Agent*

---

## 46. 인프라·호스팅 맵 — 전체 설계 (AD-046)

> **User (2026-07-24):** Railway, Supabase, Vercel 등 호스팅이 많은데 HANDOFF에 정리돼 있나? **어떤 용도로 어떤 사이트** 쓰이고 **앞으로 뭐가 더 필요**한지 미리 설계해 두자.  
> **한 줄:** **§28** = Vercel/Railway **입문·요금**. **§46** = **전체 인프라 지도** (현재 + 정식 + 앱 + PG + AI).

### 46.1 아키텍처 — 누가 뭘 담당하나

```
                    [사용자]
        ┌──────────────┼──────────────┐
        │              │              │
   PC 브라우저    폰 브라우저      (정식) Expo 앱
        │              │              │
        └──────┬───────┴──────┬───────┘
               │              │
         [Vercel]         [Vercel 또는
          apps/web         앱스토어 APK/IPA]
               │              │
    VITE_SUPABASE_*     @popup-cube/shared
    (anon key)                │
               │              │
               └──────┬───────┘
                      │  REST / Auth / Storage
               ┌──────▼──────┐
               │  Supabase   │  popup-platform (Seoul)
               │  Postgres   │  stores, products, orders, profiles…
               │  Auth       │  demo@shopper.com / demo@owner.com
               │  Storage    │  store-assets 버킷
               └──────▲──────┘
                      │  service_role (server만)
               ┌──────┴──────┐
               │  Railway    │  server/ — Express + Socket.io
               │  (24h ON)   │  멀티플레이·채팅·채널 배정
               └──────┬──────┘
                      │
               ┌──────▼──────┐
               │  Upstash    │  Redis — 채널 인원(Set), 플레이어 Hash
               │  Redis      │  (이동 좌표는 스로틀 — ISS-024)
               └─────────────┘

[GitHub] qotjdals147/popup-cube — push → Vercel auto-build
[GitHub] qotjdals147/fc-team-dashboard · fc-team-platform — 같은 Vercel 팀 popup-cube (FC, 2026-07-29)
[Cursor] 로컬 개발 · Agent · Supabase MCP
```

**왜 Supabase만으로 안 되나 (AD-006):** Realtime DB ≠ 게임 틱(50~250ms) 이동 동기화. **Socket.io 전용 서버**가 Railway에 있어야 멀티플레이가 안정적.

### 46.2 서비스 카탈로그 — 전체

| 서비스 | 대시보드 | 이 프로젝트에서 하는 일 | 코드/설정 위치 | 지금 | 정식 때 |
|---|---|---|---|---|---|
| **GitHub** | github.com | 소스·PR·이력. `main` push → Vercel 배포 | repo `popup-cube` | ✅ | ✅ |
| **Vercel** | vercel.com | **손님·데모 웹 UI** (`apps/web` React+Vite+Phaser) · **FC Zero/Platform 정적** (별도 프로젝트, 동일 팀) | `apps/web/`, `vercel.json` · FC: **`setup/VERCEL_MIGRATION.md`** | ✅ Live | ✅ (+ 점주 PC 웹 분리 검토 AD-037) |
| **Railway** | railway.com | **Socket.io 실시간 서버** (`server/`) | `server/`, `railway.toml`(있으면) | ✅ | ✅ Hobby $5/월~ |
| **Supabase** | supabase.com | **DB + Auth + Storage + (선택) Edge** | `popup-platform`, MCP, migrations | ✅ Free | Free→Pro |
| **Upstash** | upstash.com | **Redis** — 채널·좌표 임시 저장 | `server/.env` `REDIS_URL` | ✅ Free | 사용량 과금 |
| **Cursor** | cursor.com | IDE + Agent + Supabase MCP | 로컬 | ✅ | ✅ |
| **Expo / EAS** | expo.dev | **Android+iOS 앱** 빌드·OTA (§39) | `apps/mobile/` (미생성) | ⬜ | ✅ Phase 3 |
| **Apple Developer** | developer.apple.com | iOS TestFlight·App Store | — | ⬜ | $99/년 |
| **Google Play Console** | play.google.com/console | Android APK/AAB | — | ⬜ | $25 1회 |
| **결제 PG** | 토스·카카오 등 | 실결제 (지금 mock) | `server/` 또는 Edge | ⬜ mock | ✅ 정식 |
| **AI API** | OpenAI·Gemini 등 | 점주 리소스 추출·레이아웃 (§40·§45) | **server만** 프록시 | ⬜ | ✅ quota |
| **도메인/DNS** | 가비아·Cloudflare | `popupcube.co.kr` 등 | Vercel Custom Domain | ⬜ | 선택 |
| **모니터링** | Sentry 등 | 에러·성능 | — | ⬜ | 선택 |
| **주소 API** | 카카오·다음 | 점주 매장 지역 (AD-035) | server proxy | ⬜ | ✅ |

### 46.3 Live URL · 프로젝트 ID (2026-07-29)

| 항목 | 값 |
|---|---|
| **Popup 웹 (Production)** | https://popup-cube-web.vercel.app |
| **FC Zero (Production)** | https://fc-team-dashboard.vercel.app · Vercel `fc-team-dashboard` · Git `qotjdals147/fc-team-dashboard` |
| **FC Platform (Production)** | https://fc-team-platform.vercel.app · Vercel `fc-team-platform` · Git `qotjdals147/fc-team-platform` · Supabase Auth Site URL ✅ |
| **Vercel 팀** | `popup-cube` (3 프로젝트). 팀 slug rename → preview URL만 영향 · Production `*.vercel.app`는 **프로젝트명** 기준 |
| **GitHub** | https://github.com/qotjdals147/popup-cube |
| **Supabase (Popup)** | `popup-platform` · ref `cvrtobxkvpcpcxrcspdp` · region Seoul |
| **Supabase URL** | `https://cvrtobxkvpcpcxrcspdp.supabase.co` |
| **Railway 소켓** | `popup-cube-server` · Trial **$5 크레딧** (2026-07-29: ~$0.2 사용 · est. ~$0.04/월) |
| **데모 계정** | `demo@shopper.com` / `demo` · `demo@owner.com` / `demo` |
| **데모 매장** | `popup_gucci_01` |

FC 배포 상세: **`FC_Zero&FC_Platform/setup/VERCEL_MIGRATION.md`** · **`docs/HANDOFF_FC_ZERO.md` §39** · **`docs/HANDOFF_PLATFORM.md` §10g**

배포 절차 상세: **`popup_store/DEPLOY.md`**

### 46.4 환경변수 — 서비스 간 연결 (필수 쌍)

| 변수 | 설정 위치 | 가리키는 곳 | 비고 |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Vercel · `apps/web/.env` | Supabase | 공개 OK |
| `VITE_SUPABASE_ANON_KEY` | Vercel · `apps/web/.env` | Supabase anon | 공개 OK, RLS가 보호 |
| `VITE_SOCKET_SERVER_URL` | Vercel · `apps/web/.env` | **Railway URL** | ❌ `localhost` on live |
| `VITE_DEMO_STORE_ID` | Vercel | `popup_gucci_01` | 데모 전용 |
| `WEB_ORIGIN` | Railway · `server/.env` | Vercel URL 또는 `*` | CORS |
| `SUPABASE_URL` | Railway · `server/.env` | Supabase | |
| `SUPABASE_SERVICE_ROLE_KEY` | Railway · `server/.env` | Supabase | ⚠️ **서버만**, 절대 Vercel |
| `REDIS_URL` | Railway · `server/.env` | Upstash | |
| `REDIS_MOVE_PERSIST_MS` | Railway | `500` 권장 | ISS-024 |

**비밀키 저장 위치 (에이전트):**

| 파일 | 용도 | 커밋 |
|---|---|---|
| workspace `.env.local` → `POPUP_*` | Cursor Agent · MCP · REST 검증 | ❌ never |
| `popup_store/server/.env` | 로컬·Railway 동기화 원본 | ❌ never |
| `popup_store/apps/web/.env` | 로컬 Vite | ❌ never (anon만 example 가능) |
| Vercel / Railway **Dashboard Variables** | Production | — |

규칙: `.cursor/rules/supabase-env.mdc` — FC Zero / FC Platform / POPUP **키 혼용 금지**.

### 46.5 단계별 — 앞으로 필요한 것

#### Phase A — 지금 (CEO/투자자 데모) ✅ 대부분 완료

| 필요 | 서비스 | 상태 |
|---|---|---|
| 웹 URL | Vercel | ✅ |
| 멀티플레이 | Railway + Upstash | ✅ (URL 쌍만 항상 확인) |
| DB·로그인·상품 | Supabase | ✅ |
| 소스·자동 배포 | GitHub → Vercel | ✅ |
| 모바일 시연 | 폰 브라우저 → Vercel URL | ✅ (§35 mobile mode) |

#### Phase B — 정식 웹 출시 (Phase 4, AD-033·§45)

| 추가 필요 | 서비스 | 이유 |
|---|---|---|
| **Vercel Pro** 검토 | Vercel | Hobby = 비상업 조건 — 실제 판매 시 Pro ($20/월) |
| **Railway Hobby** | Railway | $1/월 Free로 24h 소켓 부족 (§28) |
| **Supabase Pro** 검토 | Supabase | 매장·주문·이미지 증가, 백업 |
| **커스텀 도메인** | DNS + Vercel | 브랜드 URL |
| **PG 연동** | 토스페이먼츠 등 | mock → 실결제 |
| **AI API + quota** | OpenAI/Gemini | §45 리소스 추출·§40 agent (**server 프록시**) |
| **주소 검색 API** | 카카오 로컬 등 | AD-035 동네·배송지 |

#### Phase C — 모바일 앱 (§39, AD-038)

| 추가 필요 | 서비스 | 이유 |
|---|---|---|
| **Expo EAS** | expo.dev | Android/iOS 빌드 |
| **Apple Developer** | Apple | TestFlight·App Store |
| **Google Play** | Google | APK/AAB 배포 |
| **(동일 백엔드)** | Supabase + Railway + Upstash | 앱도 **같은** API·소켓 — repo만 `apps/mobile` 추가 |

#### Phase D — 규모 확대 (트래픽·매출 발생 후)

| 검토 | 서비스 |
|---|---|
| Supabase read replica / connection pool | Supabase |
| Redis 플랜 업 | Upstash |
| Railway Pro / 수평 확장 | Railway |
| CDN·이미지 최적화 | Vercel / Cloudflare |
| 에러 모니터링 | Sentry |
| 로그·분석 | Datadog / Logtail (선택) |

### 46.6 월 비용 감 — 단계별 (§28 보강)

| 단계 | 구성 | 월 예상 |
|---|---|---|
| **데모 (지금)** | Vercel $0 + Railway Trial/Hobby $0~5 + Supabase/Upstash Free | **$0 ~ $5** |
| **정식 초기** | + Railway Hobby + (PG 수수료만 %) + (AI API 소량) | **$5 ~ $40** + PG% |
| **앱 출시** | + Apple $99/년 + Google $25 1회 + EAS | 분摊 **~$10/월** |
| **성장기** | Vercel Pro + Supabase Pro + Railway Pro | **$50 ~ $150+** |

PG·앱스토어 수수료·AI 호출량은 **매출/사용량 비례** — §28 표와 동일.

### 46.7 안 쓰는 것 / 대안 보류

| 서비스 | 안 쓰는 이유 |
|---|---|
| **Supabase Realtime** alone | 게임 이동 동기화 부적합 (AD-006) — Socket.io 유지 |
| **Netlify / Cloudflare Pages** | Vercel 이미 연동·동작 중 |
| **Render / Fly.io** | Railway로 통일 (§28·DEPLOY.md) |
| **Firebase** | Supabase(Postgres) + Auth 이미 전환 완료 (AD-015) |
| **자체 VPS + Docker** | MVP에 DevOps 부담 — managed PaaS 우선 |
| **Heroku** | Railway와 역할 중복 |

### 46.8 새 서비스 추가 시 체크리스트 (AD-018)

1. **§46 표**에 한 줄 추가 (역할·env·비용)
2. **§9** env 표 업데이트
3. **AD 테이블**에 결정 한 줄 (AD-0xx)
4. **Changelog** 기록
5. `service_role` / API 키 → **server 또는 Edge만** — 브라우저 금지
6. `DEPLOY.md`에 배포 단계 추가 (해당 시)

### 46.9 관련 § · 파일

| 문서 | 내용 |
|---|---|
| **§28** | Vercel/Railway 쉬운 설명·무료 플랜·4개 서비스 비용 |
| **§9** | env 변수 표 |
| **§11** | Redis 키 패턴 |
| **§21** | 테스트 환경 (로컬 vs Staging vs Live) |
| **§29** | 데모→정식→앱 — 코드 재사용 |
| **`DEPLOY.md`** | Railway/Vercel 배포 클릭 순서 |
| **`FC_Zero&FC_Platform/setup/VERCEL_MIGRATION.md`** | FC Vercel 이관 · Git · Auth · 요금 메모 |
| **`.cursor/rules/supabase-env.mdc`** | POPUP vs FC Zero vs FC Platform 키 분리 |

### 46.11 워크스pace 인프라 메모 (2026-07-29)

기획·에이전트 세션에서 정리 — **3프로젝트 공통**.

#### Vercel (팀 `popup-cube`)

| 프로젝트 | URL | Git |
|---|---|---|
| `popup-cube-web` | popup-cube-web.vercel.app | `popup-cube` monorepo |
| `fc-team-dashboard` | fc-team-dashboard.vercel.app | `fc-team-dashboard` ✅ |
| `fc-team-platform` | fc-team-platform.vercel.app | `fc-team-platform` ✅ |

- **플랜**: 팀 단위 **Pro Trial** (~9일 남을 때 배너). **카드 없음** → Hobby(무료) · **카드 있음** → Pro ~$20/월. **사이트 보통 유지**.
- **결제 수단**: User **미등록** (2026-07-29).
- **GitHub Pages**:
  - **FC Zero** — **OFF** (`Unpublish site` · Source에 `None` 없음) · 백업 복구 → **`HANDOFF_FC_ZERO.md` §39.2**
  - **FC Platform** — **ON 가능** (백업) · 동일 절차
  - Pages OFF = `github.io`만 404 · **Git push · Vercel 배포 유지**

#### URL 정본 (2026-07-29)

| Product | 들어갈 주소 |
|---|---|
| FC Zero | **https://fc-team-dashboard.vercel.app** |
| FC Platform | **https://fc-team-platform.vercel.app** |
| Popup web | **https://popup-cube-web.vercel.app** |

#### Railway (Popup only)

- `popup-cube-server` · Trial $5 크레딧 · **카드 없음** → 크레딧 소진 시 업그레이드 또는 중지.
- FC Zero/Platform **Railway 없음**.

#### Supabase (프로젝트 3개 분리 · 키 혼용 금지)

| Product | Supabase ref | Auth URL |
|---|---|---|
| FC Zero | `ajcidqsjpkzupxeizbyp` | 없음 (`meta` PW) |
| FC Platform | `rdscgnvseplwlftjixom` | Vercel Site URL ✅ |
| Popup | `cvrtobxkvpcpcxrcspdp` | Vercel + local |

에이전트: workspace `.env.local` `FC_ZERO_*` / `FC_PLATFORM_*` / `POPUP_*` · 규칙 `.cursor/rules/supabase-env.mdc`

#### Cursor / Agent 워크플로

- **배포**: Git push → Vercel (FC·Popup). Supabase MCP = DB. Vercel MCP = 선택(조회·로그).
- **VS Code 확장**(GitLens 등)보다 **MCP + HANDOFF + Rules**가 Agent 효율에 핵심.
- **MSW MCP** = MapleStory World용 — **이 3프로젝트 무관**.

#### 미완 · 선택

- [ ] GitHub repo에 FC `vercel.json` / `.vercelignore` push
- [x] **FC Zero GitHub Pages OFF** (Unpublish site · 2026-07-29) — 복구 §39.2
- [ ] FC Platform Pages OFF (선택 · 백업 유지 가능)
- [ ] Vercel 팀 slug `popup-cube` → 중립명 rename
- [ ] 법인 Pro · 커스텀 도메인

### 46.10 Pending User Input

- [ ] **Railway Production URL** — HANDOFF에 User가 확정 URL 기록 (민감 아님, 공개 URL)
- [ ] **정식 도메인** 후보 (`popupcube.com` 등)
- [ ] **PG** 1순위 (토스페이먼츠 / 카카오 / …)
- [ ] **AI API** 1순위 (Gemini / OpenAI — §40)
- [ ] 데모·정식 **Supabase 프로젝트 분리** 여부 (지금은 하나로 demo+dev 공존 — §30 초기화 정책)

*Last updated: 2026-07-29 (§46.11 Pages OFF · Trial FAQ) by Cursor Agent*

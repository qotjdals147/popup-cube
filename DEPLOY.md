# POP-UP CUBE — Vercel + Railway 배포

## CEO 데모 URL

- **웹:** Vercel Production URL
- **소비자:** `demo@shopper.com` / `demo`
- **점주:** `demo@owner.com` / `demo`

---

## 1) Railway — 실시간 서버 (`server/`)

매장 월드·채팅·멀티플레이용 Socket.io 서버.

### GitHub 연동 (권장)

1. https://railway.com → GitHub 로그인
2. **New Project** → **Deploy from GitHub repo** → `popup-cube`
3. 서비스 **Settings** → **Root Directory** = `server`
4. **Variables** 추가:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `WEB_ORIGIN` | `*` (또는 Vercel URL) |
| `SUPABASE_URL` | `https://cvrtobxkvpcpcxrcspdp.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `server/.env` 참고 (비밀) |
| `REDIS_URL` | Upstash URL (`server/.env` 참고) |
| `MAX_CHANNEL_CAPACITY` | `40` |

5. **Settings** → **Networking** → **Generate Domain**  
   → 예: `https://popup-cube-server-production.up.railway.app`

### CLI

```bash
cd popup_store/server
railway login
railway init
railway up
railway domain
```

---

## 2) Vercel — 웹 (`apps/web`)

### Environment Variables

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_DEMO_STORE_ID` | `popup_gucci_01` |
| `VITE_SOCKET_SERVER_URL` | **Railway 도메인 URL** (https://...) |

⚠️ `http://localhost:3000` 이면 CEO PC에서 월드 접속 불가.

환경변수 변경 후 **Redeploy** 필수 (Vite는 빌드 시 env 주입).

---

## Monorepo (Vercel)

- **Root Directory:** `apps/web`
- `apps/web/vercel.json` — install/build 명령 포함


# POP-UP CUBE — Vercel 배포

## CEO 데모 URL

배포 후 Vercel 대시보드 또는 CLI 출력의 Production URL을 공유합니다.

- 소비자: `demo@shopper.com` / `demo`
- 점주: `demo@owner.com` / `demo`

## Vercel 환경변수 (Project Settings → Environment Variables)

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_SOCKET_SERVER_URL` | Railway URL (없으면 월드·채팅만 오프라인) |
| `VITE_DEMO_STORE_ID` | `popup_gucci_01` |

## Monorepo 설정

- **Root Directory:** `apps/web`
- `apps/web/vercel.json`에 install/build 명령 포함

## GitHub 연동 (권장)

1. GitHub에 `popup-cube` repo 생성
2. Vercel → Import Git Repository
3. Root Directory: `apps/web`
4. 환경변수 입력 후 Deploy

## CLI 배포

```bash
cd popup_store
npx vercel --cwd apps/web
npx vercel --cwd apps/web --prod
```

@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"

where cloudflared >nul 2>&1
if errorlevel 1 (
  if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (
    set "PATH=%ProgramFiles(x86)%\cloudflared;%PATH%"
  ) else if exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
    set "PATH=%ProgramFiles%\cloudflared;%PATH%"
  ) else if exist "%LocalAppData%\Microsoft\WinGet\Links\cloudflared.exe" (
    set "PATH=%LocalAppData%\Microsoft\WinGet\Links;%PATH%"
  ) else (
    echo cloudflared not in PATH. Close cmd, open NEW cmd, run again.
    echo Or: winget install Cloudflare.cloudflared
    pause
    exit /b 1
  )
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

if exist cloudflare-tunnel.log del /f cloudflare-tunnel.log

echo [1/2] Starting cloudflared...
start "cloudflared" /MIN cmd /c "cloudflared tunnel --url http://localhost:8082 > cloudflare-tunnel.log 2>&1"

echo Waiting 12 sec...
ping -n 13 127.0.0.1 >nul

set "CF_URL="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "$m = Select-String -Path 'cloudflare-tunnel.log' -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -ErrorAction SilentlyContinue | Select-Object -Last 1; if ($m) { $m.Matches.Value }"`) do set "CF_URL=%%u"

if not defined CF_URL (
  echo.
  echo Could not read tunnel URL. cloudflare-tunnel.log:
  type cloudflare-tunnel.log 2>nul
  echo.
  echo Copy https URL from log, then run:
  echo   set EXPO_PACKAGER_PROXY_URL=https://YOUR-URL
  echo   npx expo start --lan --port 8082 --clear
  pause
  exit /b 1
)

echo Tunnel: %CF_URL%
set "EXPO_PACKAGER_PROXY_URL=%CF_URL%"
echo [2/2] Starting Expo...
npx expo start --lan --port 8082 --clear

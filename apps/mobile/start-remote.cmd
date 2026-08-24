@echo off
cd /d "%~dp0"

where ngrok >nul 2>&1
if errorlevel 1 (
  echo Install: winget install ngrok.ngrok
  pause
  exit /b 1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [1/2] Starting ngrok...
start "ngrok" cmd /k ngrok http http://localhost:8082 --host-header=localhost

ping -n 9 127.0.0.1 >nul

set "NGROK_URL="
for /f "usebackq delims=" %%u in (`powershell -NoProfile -Command "try { (Invoke-RestMethod http://127.0.0.1:4040/api/tunnels).tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1 -ExpandProperty public_url } catch { '' }"`) do set "NGROK_URL=%%u"

if not defined NGROK_URL (
  echo Copy https URL from ngrok window, then:
  echo   set EXPO_PACKAGER_PROXY_URL=https://YOUR-URL
  echo   npx expo start --lan --port 8082 --clear
  pause
  exit /b 1
)

echo Tunnel: %NGROK_URL%
echo Note: ngrok free may cause Expo Go infinite loading. Prefer start-remote-cloudflare.cmd
set "EXPO_PACKAGER_PROXY_URL=%NGROK_URL%"
npx expo start --lan --port 8082 --clear

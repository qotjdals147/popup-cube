@echo off
cd /d "%~dp0"

REM Dead tunnel URL in env = Expo Go blue screen (ISS-039)
set "EXPO_PACKAGER_PROXY_URL="
set "REACT_NATIVE_PACKAGER_HOSTNAME="

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Starting Expo LAN on port 8082...
echo Phone must be on SAME Wi-Fi as this PC.
echo Test in phone browser: http://YOUR_PC_IP:8082/status
npx expo start --lan --port 8082 --clear

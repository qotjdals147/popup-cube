@echo off
cd /d "%~dp0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8082" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo Starting Expo LAN on port 8082...
npx expo start --lan --port 8082 --clear

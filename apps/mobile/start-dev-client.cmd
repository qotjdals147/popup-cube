@echo off
cd /d "%~dp0"
echo [Dev Client] Expo Go가 아닌 POP-UP CUBE 앱에서 QR을 스캔하세요.
echo [Dev Client] 카메라앱/Expo Go로 찍으면 무반응일 수 있습니다.
npx expo start --dev-client --tunnel --port 8082 --clear

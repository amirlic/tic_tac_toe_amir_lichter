@echo off
echo 🎮 Starting Tic-Tac-Toe Servers
echo ==============================

cd /d "%~dp0"
docker-compose -f docker/docker-compose.yml up -d

echo.
echo ✅ Servers started!
echo   • Server A: http://localhost:3001
echo   • Server B: http://localhost:3002
echo.
pause

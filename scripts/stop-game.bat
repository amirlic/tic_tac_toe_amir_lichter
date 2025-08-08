@echo off
echo 🛑 Stopping Tic-Tac-Toe Game...

cd /d "%~dp0\.."
docker-compose -f docker/docker-compose.yml down

echo.
echo ✅ Game stopped successfully!
echo.
pause

@echo off
echo 🛑 Stopping Tic-Tac-Toe Game...
echo ==============================
echo.

cd /d "%~dp0\.."

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker is not running or containers are already stopped.
) else (
    echo 🔽 Stopping Docker containers...
    docker-compose -f docker/docker-compose.yml down
    
    echo.
    echo 🧹 Cleaning up...
    docker system prune -f >nul 2>&1
)

echo.
echo ✅ Game stopped successfully!
echo 💡 To start again, run: .\scripts\start-game.bat
echo.
pause

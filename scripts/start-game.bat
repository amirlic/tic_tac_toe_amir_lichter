@echo off
echo 🎮 Starting Tic-Tac-Toe Game...
echo =============================
echo.

cd /d "%~dp0\.."

REM Check if Docker is running
echo 🔍 Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not accessible!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo ✅ Docker is running
echo.
echo 🚀 Starting Docker containers...
docker-compose -f docker/docker-compose.yml up -d

echo.
echo ⏳ Waiting for services to start...
timeout /t 8 /nobreak >nul

echo.
echo 🎯 Testing connection...
docker ps --format "table {{.Names}}\t{{.Status}}"

echo.
echo ✅ Game is ready!
echo.
echo 📋 Next steps:
echo   • To play manually: .\scripts\play-game.bat
echo   • To see automated demo: node tests\working-demo.js
echo   • To stop servers: .\scripts\stop-game.bat
echo.
echo 🌐 Server URLs:
echo   • Server A: http://localhost:3001
echo   • Server B: http://localhost:3002
echo.
pause

@echo off
echo 🎮 Tic-Tac-Toe Game Launcher
echo ==========================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not accessible!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if servers are running
echo Checking server status...
docker-compose -f ../docker/docker-compose.yml ps --format json >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  Servers are not running!
    echo Would you like to start them now? (Y/N)
    set /p startServers="Enter choice: "
    if /i "%startServers%"=="Y" (
        echo Starting servers...
        docker-compose -f ../docker/docker-compose.yml up -d
        echo Waiting for servers to be ready...
        timeout /t 5 /nobreak >nul
    ) else (
        echo Please run "run-demo.bat" or "quick-demo.bat" first to start the servers.
        pause
        exit /b 1
    )
)

echo.
echo ✅ Servers are ready!
echo.
echo Choose your action:
echo 1. Start Interactive Game Client
echo 2. Exit
echo.
set /p choice="Enter your choice (1-2): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting interactive game client...
    echo You'll be able to choose your server inside the game.
    cd /d "%~dp0.."
    node src/client.js
    goto :end
) else if "%choice%"=="2" (
    echo Goodbye! 👋
    exit /b 0
) else (
    echo Invalid choice! Please run the script again.
    pause
    exit /b 1
)

:end

pause

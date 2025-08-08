@echo off
REM Windows batch script to start Tic-Tac-Toe servers and test clients
REM AI-Generated: 90% - Windows automation scripts
REM Human Refinements: Error handling, user experience

echo ========================================
echo Real-Time Tic-Tac-Toe Game Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js found

echo.
echo Checking Redis availability...
redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo WARNING: Redis is not running
    echo Please start Redis server before running the game
    echo.
    echo To install Redis on Windows:
    echo 1. Install via Chocolatey: choco install redis-64
    echo 2. Or download from: https://redis.io/download
    echo 3. Start with: redis-server
    echo.
)

echo.
echo Choose an option:
echo 1. Start Server A (port 3001)
echo 2. Start Server B (port 3002)
echo 3. Start both servers
echo 4. Start client
echo 5. Start development environment
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo Starting Server A on port 3001...
    node src/server.js 3001
) else if "%choice%"=="2" (
    echo Starting Server B on port 3002...
    node src/server.js 3002
) else if "%choice%"=="3" (
    echo Starting both servers...
    start "Server A" cmd /k "node src/server.js 3001"
    start "Server B" cmd /k "node src/server.js 3002"
    echo Both servers started in separate windows
    pause
) else if "%choice%"=="4" (
    echo Starting game client...
    node src/client.js
) else if "%choice%"=="5" (
    echo Starting development environment...
    start "Server A" cmd /k "node src/server.js 3001"
    timeout /t 2 /nobreak >nul
    start "Server B" cmd /k "node src/server.js 3002"
    timeout /t 2 /nobreak >nul
    start "Client 1" cmd /k "node src/client.js"
    timeout /t 1 /nobreak >nul
    start "Client 2" cmd /k "node src/client.js"
    echo Development environment started!
    echo - 2 servers running
    echo - 2 clients ready
    pause
) else (
    echo Invalid choice
    pause
)

echo.
echo Game session ended
pause

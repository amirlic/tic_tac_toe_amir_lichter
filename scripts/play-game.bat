@echo off
echo 🎮 Tic-Tac-Toe Game Launcher
echo.
echo Choose your connection:
echo 1. Connect to Server A (Port 3001)
echo 2. Connect to Server B (Port 3002)
echo 3. Exit
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Starting game client for Server A...
    node src/client.js ws://localhost:3001
) else if "%choice%"=="2" (
    echo Starting game client for Server B...
    node src/client.js ws://localhost:3002
) else if "%choice%"=="3" (
    echo Goodbye!
    exit /b 0
) else (
    echo Invalid choice! Please run the script again.
    pause
)

pause

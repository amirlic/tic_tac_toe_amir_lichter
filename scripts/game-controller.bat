@echo off
:start
echo.
echo 🎮 Tic-Tac-Toe Game Controller
echo =============================
echo.
echo Welcome to the Real-Time Cross-Server Tic-Tac-Toe Game!
echo.
echo What would you like to do?
echo.
echo 1. 🚀 Start the game servers
echo 2. 🎯 Play the game (interactive)
echo 3. 🎬 Run automated demo  
echo 4. 🛑 Stop the servers
echo 5. 🧪 Test all components
echo 6. 📖 View README
echo 7. 🚪 Exit
echo.
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" (
    call start-game.bat
    goto :start
) else if "%choice%"=="2" (
    call play-game.bat
    goto :start
) else if "%choice%"=="3" (
    echo.
    echo 🎬 Running automated demo...
    cd /d "%~dp0\.."
    node tests\working-demo.js
    pause
    goto :start
) else if "%choice%"=="4" (
    call stop-game.bat
    goto :start
) else if "%choice%"=="5" (
    call test-all.bat
    goto :start
) else if "%choice%"=="6" (
    cd /d "%~dp0\.."
    type README.md | more
    pause
    goto :start
) else if "%choice%"=="7" (
    echo Goodbye! 👋
    exit /b 0
) else (
    echo Invalid choice! Please try again.
    pause
    goto :start
)

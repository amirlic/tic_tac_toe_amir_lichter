@echo off
echo 🧪 Testing All BAT Files...
echo ==========================
echo.

cd /d "%~dp0"

echo 1️⃣ Testing start-game.bat exists...
if exist "start-game.bat" (
    echo ✅ start-game.bat found
) else (
    echo ❌ start-game.bat missing!
    exit /b 1
)

echo.
echo 2️⃣ Testing stop-game.bat exists...
if exist "stop-game.bat" (
    echo ✅ stop-game.bat found
) else (
    echo ❌ stop-game.bat missing!
    exit /b 1
)

echo.
echo 3️⃣ Testing play-game.bat exists...
if exist "play-game.bat" (
    echo ✅ play-game.bat found
) else (
    echo ❌ play-game.bat missing!
    exit /b 1
)

echo.
echo 4️⃣ Testing required files...
cd /d "%~dp0\.."

if exist "src\client.js" (
    echo ✅ client.js found
) else (
    echo ❌ client.js missing!
    exit /b 1
)

if exist "docker\docker-compose.yml" (
    echo ✅ docker-compose.yml found
) else (
    echo ❌ docker-compose.yml missing!
    exit /b 1
)

if exist "tests\working-demo.js" (
    echo ✅ working-demo.js found
) else (
    echo ❌ working-demo.js missing!
    exit /b 1
)

echo.
echo 5️⃣ Testing Docker availability...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Docker not accessible (this is OK if not needed right now)
) else (
    echo ✅ Docker is available
)

echo.
echo 6️⃣ Testing Node.js availability...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not available!
    exit /b 1
) else (
    echo ✅ Node.js is available
)

echo.
echo 🎉 All tests passed! 
echo.
echo 📋 Available commands:
echo   • .\start-game.bat  - Start the game servers
echo   • .\play-game.bat   - Play the game interactively
echo   • .\stop-game.bat   - Stop the servers
echo   • .\test-all.bat    - Run this test again
echo.
pause

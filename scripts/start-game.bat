@echo off
echo 🎮 Starting Tic-Tac-Toe Game...
echo.

cd /d "%~dp0\.."

echo 🚀 Starting Docker containers...
docker-compose -f docker/docker-compose.yml up -d

echo.
echo ⏳ Waiting for services...
ping 127.0.0.1 -n 6 > nul

echo.
echo 🎯 Testing connection...
node tests/quick-test.js

echo.
echo ✅ Game is ready!
echo.
echo To play: .\scripts\play-game.bat
echo To stop: .\scripts\stop-game.bat
echo.
pause

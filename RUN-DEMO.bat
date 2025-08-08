@echo off
echo 🎬 Running Automated Demo
echo ========================

cd /d "%~dp0"
node tests/working-demo.js

pause

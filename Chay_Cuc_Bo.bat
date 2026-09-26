@echo off
title Duong Den Vinh Quang - May Chu Cuc Bo (Local Server)
echo ================================================================
echo   🎮 HE THONG GAMESHOW DUONG DEN VINH QUANG - LOCALHOST
echo ================================================================
cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Node.js tren may tinh cua ban!
    echo Vui long tai va cai dat Node.js tai: https://nodejs.org/
    pause
    exit /b
)

if not exist node_modules (
    echo [THONG BAO] Dang cai dat cac thu vien phu thuoc (npm install)...
    call npm install
)

echo.
echo [THONG BAO] Dang khoi chay May Chu tro game tren http://localhost:3000...
echo.
timeout /t 2 >nul
start http://localhost:3000/controller
node server.js
pause

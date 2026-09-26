#!/bin/bash
echo "================================================================"
echo "  🎮 HỆ THỐNG GAMESHOW ĐƯỜNG ĐẾN VINH QUANG - LOCALHOST"
echo "================================================================"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if ! command -v node &> /dev/null
then
    echo "[LỖI] Không tìm thấy Node.js! Vui lòng cài đặt Node.js từ https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[THÔNG BÁO] Đang cài đặt các thư viện cần thiết (npm install)..."
    npm install
fi

echo ""
echo "[THÔNG BÁO] Đang khởi chạy Máy Chủ trò game tại http://localhost:3000..."
echo ""

if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000/controller" &
elif command -v open &> /dev/null; then
    open "http://localhost:3000/controller" &
fi

node server.js

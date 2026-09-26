# 🎮 Đường Đến Vinh Quang - Hướng dẫn chạy Localhost & Mạng Cục Bộ (LAN)

Hệ thống Gameshow **Đường Đến Vinh Quang** tích hợp máy chủ Node.js + Express + WebSocket thời gian thực, hỗ trợ chạy trên **Localhost** và kết nối qua **Mạng Wi-Fi / LAN** cho các máy Thí sinh, MC, Máy chiếu và Controller.

---

## 🚀 1. Cách chạy trên Localhost

### **Bước 1: Cài đặt Node.js**
Đảm bảo máy tính đã cài đặt **Node.js** (Phiên bản v18+).

### **Bước 2: Cài đặt thư viện dependencies**
Mở Terminal / Command Prompt tại thư mục dự án và chạy:
```bash
npm install
```

### **Bước 3: Khởi chạy Máy Chủ (Server)**
Chạy lệnh sau:
```bash
npm run dev
# hoặc
npm start
```

Máy chủ sẽ khởi chạy thành công tại cổng **3000**:
```
================================================================
  🎮 ĐƯỜNG ĐẾN VINH QUANG - MÁY CHỦ WEBSOCKET SẴN SÀNG HOẠT ĐỘNG
================================================================
  🏠 Cục bộ (Localhost) : http://localhost:3000
  ⚡ WebSocket URL     : ws://localhost:3000/ws
  🌐 Mạng LAN          : http://192.168.x.x:3000
----------------------------------------------------------------
  📱 Điều khiển (Controller): http://localhost:3000/controller
  🖥️  Máy chiếu (Projector) : http://localhost:3000/projector
  🎤 Màn hình MC (Host)    : http://localhost:3000/host
  ⚡ Thí sinh (Player)     : http://localhost:3000/player
  📊 Bảng điểm (Scoreboard) : http://localhost:3000/scoreboard
================================================================
```

---

## 🌐 2. Truy cập từ Điện thoại / Laptop khác trong cùng Wi-Fi / LAN

Khi máy chủ khởi chạy, Terminal sẽ hiển thị **địa chỉ IP Mạng LAN** (ví dụ: `http://192.168.1.15:3000`).

Các máy khác trong cùng mạng Wi-Fi/LAN chỉ cần mở trình duyệt và truy cập:
- **Máy Điều Khiển (Admin / BTC):** `http://<IP-MÁY-CHỦ>:3000/controller`
- **Máy Chiếu (Projector / TV):** `http://<IP-MÁY-CHỦ>:3000/projector`
- **Màn Hình MC (Host):** `http://<IP-MÁY-CHỦ>:3000/host`
- **Màn Hình Thí Sinh (Player 1..4):** `http://<IP-MÁY-CHỦ>:3000/player`
- **Bảng Điểm (Scoreboard):** `http://<IP-MÁY-CHỦ>:3000/scoreboard`

---

## ⚡ Các tính năng đã được hỗ trợ tối ưu trên Localhost:
1. **Đồng bộ WebSocket độ trễ siêu thấp (< 10ms):** Tín hiệu gõ đáp án, bấm chuông, đồng hồ đếm ngược được truyền tức thì giữa Controller, MC, Thí sinh và Máy chiếu.
2. **Không cần cài đặt DB hay Cloud:** Tự động kết nối WebSocket server tích hợp trong `server.js`.
3. **Cơ chế Fallback thông minh:** Nếu bị rớt mạng, hệ thống tự động fallback qua BroadcastChannel / SSE / MQTT để đảm bảo trận thi không bị ngắt quãng.

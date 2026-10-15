const shapesData = [
    { id: 0, name: "Group 3", type: "GROUP", text: "—", x: 4.1, y: 0, w: 1271.8, h: 30.4, fill: "none", line: "none", font: "—" },
    { id: 1, name: "Rectangle 21", type: "AUTO_SHAPE", text: "—", x: 92.4, y: 25.8, w: 88.3, h: 4.8, fill: "#00B050", line: "#C6D1DE", font: "—" },
    { id: 2, name: "Rectangle 24", type: "AUTO_SHAPE", text: "Câu hỏi", x: 3.7, y: 44.5, w: 78.7, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 3, name: "Rectangle 25", type: "AUTO_SHAPE", text: "Nhập dữ liệu câu hỏi từ file", x: 3.7, y: 60.8, w: 387.2, h: 32, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 4, name: "Rectangle 26", type: "AUTO_SHAPE", text: "Chọn file", x: 180.7, y: 60.8, w: 88.3, h: 32, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 5, name: "Rectangle 27", type: "AUTO_SHAPE", text: "Chọn file", x: 280.4, y: 60.8, w: 341.8, h: 32, fill: "#FDFDFD", line: "none", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 6, name: "Rectangle 29", type: "AUTO_SHAPE", text: "--- Phần thi Xuất phát ---", x: 3.7, y: 92.6, w: 618.5, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 7, name: "Rectangle 2", type: "AUTO_SHAPE", text: "Bộ đề 1", x: 3.7, y: 110.5, w: 77.3, h: 32, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 8, name: "Rectangle 20", type: "AUTO_SHAPE", text: "Bộ đề 2", x: 81.1, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 9, name: "Rectangle 22", type: "AUTO_SHAPE", text: "Bộ đề 3", x: 158.4, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 10, name: "Rectangle 23", type: "AUTO_SHAPE", text: "Bộ đề 4", x: 235.7, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 11, name: "Rectangle 28", type: "AUTO_SHAPE", text: "Bộ đề 5", x: 313, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 12, name: "Rectangle 30", type: "AUTO_SHAPE", text: "Bộ đề 6", x: 390.3, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 13, name: "Rectangle 31", type: "AUTO_SHAPE", text: "Bộ đề 7", x: 467.6, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 14, name: "Rectangle 32", type: "AUTO_SHAPE", text: "Bộ đề 8", x: 544.9, y: 110.5, w: 77.3, h: 32, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 15, name: "Rectangle 43", type: "AUTO_SHAPE", text: "—", x: 3.7, y: 142.3, w: 618.5, h: 273.8, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "—" },
    { id: 16, name: "Rectangle 44", type: "AUTO_SHAPE", text: "Câu hỏi", x: 660.3, y: 60.8, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 17, name: "Rectangle 45", type: "AUTO_SHAPE", text: "Đáp án", x: 1049.4, y: 60.8, w: 74.8, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 18, name: "Rectangle 46", type: "AUTO_SHAPE", text: "Câu 1", x: 3.7, y: 166.8, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 19, name: "Rectangle 47", type: "AUTO_SHAPE", text: "Câu 2", x: 3.7, y: 191.1, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 20, name: "Rectangle 48", type: "AUTO_SHAPE", text: "Câu 3", x: 3.7, y: 215.4, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 21, name: "Rectangle 49", type: "AUTO_SHAPE", text: "Câu 4", x: 3.7, y: 239.7, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 22, name: "Rectangle 50", type: "AUTO_SHAPE", text: "Câu 5", x: 3.7, y: 263.7, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 23, name: "Rectangle 51", type: "AUTO_SHAPE", text: "Câu 6", x: 3.7, y: 288, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 24, name: "Rectangle 52", type: "AUTO_SHAPE", text: "Câu 7", x: 3.7, y: 312.3, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 25, name: "Rectangle 53", type: "AUTO_SHAPE", text: "Câu 8", x: 3.7, y: 336.6, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 26, name: "Rectangle 54", type: "AUTO_SHAPE", text: "Câu 9", x: 3.7, y: 360.9, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 27, name: "Rectangle 55", type: "AUTO_SHAPE", text: "Câu 10", x: 3.7, y: 385.2, w: 77.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 28, name: "Rectangle 57", type: "AUTO_SHAPE", text: "Câu 1", x: 76.6, y: 168.9, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 29, name: "Rectangle 58", type: "AUTO_SHAPE", text: "Câu 2", x: 76.6, y: 193.2, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 30, name: "Rectangle 59", type: "AUTO_SHAPE", text: "Câu 3", x: 76.6, y: 217.5, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 31, name: "Rectangle 60", type: "AUTO_SHAPE", text: "Câu 4", x: 76.6, y: 241.8, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 32, name: "Rectangle 61", type: "AUTO_SHAPE", text: "Câu 5", x: 76.6, y: 265.9, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 33, name: "Rectangle 62", type: "AUTO_SHAPE", text: "Câu 6", x: 76.6, y: 290.2, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 34, name: "Rectangle 63", type: "AUTO_SHAPE", text: "Câu 7", x: 76.6, y: 314.5, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 35, name: "Rectangle 64", type: "AUTO_SHAPE", text: "Câu 8", x: 76.6, y: 338.7, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 36, name: "Rectangle 65", type: "AUTO_SHAPE", text: "Câu 9", x: 76.6, y: 363, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 37, name: "Rectangle 66", type: "AUTO_SHAPE", text: "Câu 10", x: 76.6, y: 387.3, w: 391, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 38, name: "Rectangle 67", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 168.9, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 39, name: "Rectangle 68", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 193.2, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 40, name: "Rectangle 69", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 217.5, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 41, name: "Rectangle 70", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 241.8, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 42, name: "Rectangle 71", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 265.9, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 43, name: "Rectangle 72", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 290.2, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 44, name: "Rectangle 73", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 314.5, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 45, name: "Rectangle 74", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 338.7, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 46, name: "Rectangle 75", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 363, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 47, name: "Rectangle 76", type: "AUTO_SHAPE", text: "Đáp án", x: 470.9, y: 387.3, w: 145.8, h: 22.3, fill: "THEME:BACKGROUND_1", line: "THEME:BACKGROUND_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 48, name: "Rectangle 77", type: "AUTO_SHAPE", text: "--- Phần thi Ra khơi ---", x: 0, y: 416.1, w: 618.5, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 49, name: "Rectangle 80", type: "AUTO_SHAPE", text: "Câu hỏi", x: 81.1, y: 434.2, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 50, name: "Rectangle 81", type: "AUTO_SHAPE", text: "Đáp án", x: 470.1, y: 434.2, w: 74.8, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 51, name: "Rectangle 82", type: "AUTO_SHAPE", text: "Câu 1", x: 3.7, y: 459, w: 77.3, h: 23.2, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 52, name: "Rectangle 83", type: "AUTO_SHAPE", text: "—", x: 76.6, y: 459, w: 391, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 53, name: "Rectangle 84", type: "AUTO_SHAPE", text: "—", x: 470.9, y: 459, w: 145.8, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 54, name: "Rectangle 85", type: "AUTO_SHAPE", text: "Chọn video", x: 81.1, y: 487.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 55, name: "Rectangle 86", type: "AUTO_SHAPE", text: "Chọn ảnh", x: 470.9, y: 487.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 56, name: "Rectangle 87", type: "AUTO_SHAPE", text: "Câu 2", x: 3.7, y: 523, w: 77.3, h: 23.2, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 57, name: "Rectangle 88", type: "AUTO_SHAPE", text: "—", x: 76.6, y: 523, w: 391, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 58, name: "Rectangle 89", type: "AUTO_SHAPE", text: "—", x: 470.9, y: 523, w: 145.8, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 59, name: "Rectangle 90", type: "AUTO_SHAPE", text: "Chọn video", x: 81.1, y: 551.6, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 60, name: "Rectangle 91", type: "AUTO_SHAPE", text: "Chọn ảnh", x: 470.9, y: 551.6, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 61, name: "Rectangle 92", type: "AUTO_SHAPE", text: "Câu 3", x: 3.7, y: 587.9, w: 77.3, h: 23.2, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 62, name: "Rectangle 93", type: "AUTO_SHAPE", text: "—", x: 76.6, y: 587.9, w: 391, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 63, name: "Rectangle 94", type: "AUTO_SHAPE", text: "—", x: 470.9, y: 587.9, w: 145.8, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 64, name: "Rectangle 95", type: "AUTO_SHAPE", text: "Chọn video", x: 81.1, y: 616.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 65, name: "Rectangle 96", type: "AUTO_SHAPE", text: "Chọn ảnh", x: 470.9, y: 616.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 66, name: "Rectangle 97", type: "AUTO_SHAPE", text: "Câu 4", x: 3.7, y: 655.9, w: 77.3, h: 23.2, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 67, name: "Rectangle 98", type: "AUTO_SHAPE", text: "—", x: 76.6, y: 655.9, w: 391, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 68, name: "Rectangle 99", type: "AUTO_SHAPE", text: "—", x: 470.9, y: 655.9, w: 145.8, h: 23.2, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 69, name: "Rectangle 100", type: "AUTO_SHAPE", text: "Chọn video", x: 81.1, y: 684.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 70, name: "Rectangle 101", type: "AUTO_SHAPE", text: "Chọn ảnh", x: 470.9, y: 684.5, w: 103.8, h: 30.3, fill: "THEME:BACKGROUND_1", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 71, name: "Rectangle 103", type: "AUTO_SHAPE", text: "--- Phần thi Vượt sóng ---", x: 622.3, y: 42.9, w: 618.5, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 72, name: "Rectangle 104", type: "AUTO_SHAPE", text: "Hàng 1", x: 660.3, y: 85.3, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 73, name: "Rectangle 105", type: "AUTO_SHAPE", text: "Hàng 2", x: 660.3, y: 109.8, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 74, name: "Rectangle 106", type: "AUTO_SHAPE", text: "Hàng 3", x: 660.3, y: 134.3, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 75, name: "Rectangle 107", type: "AUTO_SHAPE", text: "Hàng 4", x: 660.3, y: 158.7, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 76, name: "Rectangle 108", type: "AUTO_SHAPE", text: "Hàng 1", x: 737.1, y: 85.3, w: 312.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 77, name: "Rectangle 109", type: "AUTO_SHAPE", text: "Hàng 2", x: 737.1, y: 109.8, w: 312.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 78, name: "Rectangle 110", type: "AUTO_SHAPE", text: "Hàng 3", x: 737.1, y: 134.3, w: 312.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 79, name: "Rectangle 111", type: "AUTO_SHAPE", text: "Hàng 4", x: 737.1, y: 158.7, w: 312.3, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 80, name: "Rectangle 112", type: "AUTO_SHAPE", text: "Hàng 1", x: 1061, y: 85.3, w: 129.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 81, name: "Rectangle 113", type: "AUTO_SHAPE", text: "Hàng 2", x: 1061, y: 109.8, w: 129.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 82, name: "Rectangle 114", type: "AUTO_SHAPE", text: "Hàng 3", x: 1061, y: 134.3, w: 129.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 83, name: "Rectangle 115", type: "AUTO_SHAPE", text: "Hàng 4", x: 1061, y: 158.7, w: 129.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 84, name: "Rectangle 116", type: "AUTO_SHAPE", text: "0 ký tự", x: 1196.5, y: 85.3, w: 79.8, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 85, name: "Rectangle 117", type: "AUTO_SHAPE", text: "0 ký tự", x: 1196.5, y: 109.8, w: 79.8, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / PRESET / Arial" },
    { id: 86, name: "Rectangle 118", type: "AUTO_SHAPE", text: "0 ký tự", x: 1196.5, y: 134.3, w: 79.8, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / PRESET / Arial" },
    { id: 87, name: "Rectangle 119", type: "AUTO_SHAPE", text: "0 ký tự", x: 1196.5, y: 158.7, w: 79.8, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / PRESET / Arial" },
    { id: 88, name: "Rectangle 120", type: "AUTO_SHAPE", text: "Đáp án vòng thi", x: 666.7, y: 183.2, w: 382.7, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 89, name: "Rectangle 122", type: "AUTO_SHAPE", text: "Đáp án vòng thi", x: 1061, y: 183.2, w: 129.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 90, name: "Rectangle 123", type: "AUTO_SHAPE", text: "0 ký tự", x: 1196.5, y: 183.2, w: 79.8, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / PRESET / Arial" },
    { id: 91, name: "Rectangle 124", type: "AUTO_SHAPE", text: "--- Phần thi Vinh quang ---", x: 622.3, y: 211.6, w: 618.5, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 92, name: "Rectangle 125", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.9, y: 250.4, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 93, name: "Rectangle 126", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.9, y: 250.4, w: 74.8, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 94, name: "Rectangle 128", type: "AUTO_SHAPE", text: "Môn học", x: 660.3, y: 250.4, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 95, name: "Rectangle 129", type: "AUTO_SHAPE", text: "10 điểm", x: 737.1, y: 229.5, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 96, name: "Oval 131", type: "AUTO_SHAPE", text: "—", x: 729.7, y: 238.3, w: 7.4, h: 7.4, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 97, name: "Rectangle 132", type: "AUTO_SHAPE", text: "20 điểm", x: 850.5, y: 229.5, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 98, name: "Oval 133", type: "AUTO_SHAPE", text: "—", x: 843.1, y: 238.3, w: 7.4, h: 7.4, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 99, name: "Rectangle 134", type: "AUTO_SHAPE", text: "30 điểm", x: 956.6, y: 229.5, w: 77.3, h: 24.5, fill: "#9E9E9E", line: "#FDFDFD", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 100, name: "Oval 135", type: "AUTO_SHAPE", text: "—", x: 949.2, y: 238.3, w: 7.4, h: 7.4, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "—" },
    { id: 101, name: "Rectangle 136", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 274.7, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 102, name: "Rectangle 137", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 274.7, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 103, name: "Rectangle 138", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 274.7, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 104, name: "Rectangle 139", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 301.1, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 105, name: "Rectangle 140", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 301.1, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 106, name: "Rectangle 141", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 301.1, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 107, name: "Rectangle 142", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 328.6, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 108, name: "Rectangle 143", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 328.6, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 109, name: "Rectangle 144", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 328.6, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 110, name: "Rectangle 145", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 355, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 111, name: "Rectangle 146", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 355, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 112, name: "Rectangle 147", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 355, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 113, name: "Rectangle 148", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 381.6, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 114, name: "Rectangle 149", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 381.6, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 115, name: "Rectangle 150", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 381.6, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 116, name: "Rectangle 151", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 408, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 117, name: "Rectangle 152", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 408, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 118, name: "Rectangle 153", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 408, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 119, name: "Rectangle 154", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 435.5, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 120, name: "Rectangle 155", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 435.5, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 121, name: "Rectangle 156", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 435.5, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 122, name: "Rectangle 157", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 461.9, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 123, name: "Rectangle 158", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 461.9, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 124, name: "Rectangle 159", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 461.9, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 125, name: "Rectangle 160", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 489.6, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 126, name: "Rectangle 161", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 489.6, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 127, name: "Rectangle 162", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 489.6, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 128, name: "Rectangle 163", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 516.1, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 129, name: "Rectangle 164", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 516.1, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 130, name: "Rectangle 165", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 516.1, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 131, name: "Rectangle 166", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 543.6, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 132, name: "Rectangle 167", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 543.6, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 133, name: "Rectangle 168", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 543.6, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 134, name: "Rectangle 169", type: "AUTO_SHAPE", text: "Câu hỏi", x: 756.3, y: 570, w: 386.7, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 135, name: "Rectangle 170", type: "AUTO_SHAPE", text: "Đáp án", x: 1145.3, y: 570, w: 125.1, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 136, name: "Rectangle 171", type: "AUTO_SHAPE", text: "Môn học", x: 659.7, y: 570, w: 94.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 137, name: "Rectangle 172", type: "AUTO_SHAPE", text: "--- Phần thi Câu hỏi phụ ---", x: 622.3, y: 597.2, w: 618.5, h: 17.9, fill: "THEME:ACCENT_1", line: "THEME:ACCENT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 138, name: "Rectangle 173", type: "AUTO_SHAPE", text: "Câu hỏi", x: 812.4, y: 597.1, w: 330.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 139, name: "Rectangle 174", type: "AUTO_SHAPE", text: "Đáp án", x: 1163.5, y: 597.1, w: 106.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 140, name: "Rectangle 175", type: "AUTO_SHAPE", text: "Câu hỏi", x: 812.4, y: 624.6, w: 330.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 141, name: "Rectangle 176", type: "AUTO_SHAPE", text: "Đáp án", x: 1163.5, y: 624.6, w: 106.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 142, name: "Rectangle 177", type: "AUTO_SHAPE", text: "Câu hỏi", x: 812.4, y: 651, w: 330.6, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" },
    { id: 143, name: "Rectangle 178", type: "AUTO_SHAPE", text: "Đáp án", x: 1163.5, y: 651, w: 106.9, h: 24.5, fill: "THEME:BACKGROUND_1", line: "THEME:TEXT_1", font: "10.5 / THEME:TEXT_1 / Arial" }
];

function resolveColor(c) {
    if (!c || c === "—" || c === "None") return "transparent";
    if (c.startsWith("#")) return c;
    if (c.includes("THEME:ACCENT_1")) return "#4F81BD";
    if (c.includes("THEME:BACKGROUND_1")) return "#FFFFFF";
    if (c.includes("THEME:TEXT_1")) return "#333333";
    if (c.includes("PRESET")) return "#333333";
    return "#CCCCCC";
}

function renderSlide() {
    const canvas = document.getElementById("slideCanvas");
    if (!canvas) return;

    shapesData.forEach(shape => {
        const div = document.createElement("div");
        div.className = `shape shape-${shape.id}`;
        if (shape.name.toLowerCase().includes("oval")) {
            div.classList.add("ellipse");
        }

        div.style.left = `${shape.x}px`;
        div.style.top = `${shape.y}px`;
        div.style.width = `${shape.w}px`;
        div.style.height = `${shape.h}px`;

        const bgColor = resolveColor(shape.fill);
        div.style.backgroundColor = bgColor;

        let lineColor = resolveColor(shape.line);
        if (shape.line && shape.line !== "none" && shape.line !== "—") {
            div.style.border = `1px solid ${lineColor}`;
        } else {
            div.style.border = `none`;
        }

        if (shape.text && shape.text !== "—") {
            // Replace "/" with space if needed as per prompt
            const cleanText = shape.text.replace(/\//g, ' ');
            div.innerText = cleanText;
            
            // Check font styling
            if (shape.font && shape.font !== "—") {
                if (shape.font.includes("THEME:TEXT_1") || shape.font.includes("PRESET")) {
                    div.style.color = "#333333";
                } else {
                    div.style.color = "#333333";
                }
            }
        }

        canvas.appendChild(div);
    });
}

function scaleCanvas() {
    const container = document.getElementById("canvasContainer");
    if (!container) return;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const targetWidth = 1280;
    const targetHeight = 720;

    const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);
    container.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", scaleCanvas);
window.addEventListener("DOMContentLoaded", () => {
    renderSlide();
    scaleCanvas();
});
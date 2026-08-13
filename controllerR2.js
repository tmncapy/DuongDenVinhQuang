// ControllerR2.js - Round 2: Ra khơi
let currentRKQuestion = 1;
let rkTimerInterval = null;
let rkTimeLeft = 30;

function selectRKQuestion(num) {
    currentRKQuestion = num;
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`btn_rk_q${i}`);
        if (btn) {
            if (i === num) {
                btn.style.background = '#2563eb';
                btn.style.color = '#ffffff';
            } else {
                btn.style.background = '#80bfff';
                btn.style.color = '#002060';
            }
        }
    }
    // Clear contestant inputs on controller for the new question
    for (let i = 1; i <= 5; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_rk`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_rk`);
        if (extraEl) extraEl.value = '';
    }

    rkTimeLeft = (num === 1 || num === 2) ? 30 : 20;
    updateTab2Preview();
    const qItem = gameData.raKhoi ? (gameData.raKhoi[num - 1] || { q: '', a: '' }) : { q: '', a: '' };
    sendToProjector('RA_KHOI_SHOW_QUESTION', {
        questionIndex: num,
        questionText: qItem.q || `Nội dung câu hỏi Ra Khơi số ${num}`,
        contestants: gameData.contestants
    });
}

function cycleRKQuestion() {
    let next = currentRKQuestion + 1;
    if (next > 4) next = 1;
    selectRKQuestion(next);
}

function updateTab2Preview() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    const titleEl = document.getElementById('rk_preview_title');
    if (titleEl) titleEl.innerText = `VÒNG THI RA KHƠI: CÂU HỎI THỨ ${currentRKQuestion}`;
    const selectBarTitle = document.getElementById('rk_select_bar_title');
    if (selectBarTitle) selectBarTitle.innerText = `Câu hỏi thứ ${currentRKQuestion}`;
    const qTextEl = document.getElementById('rk_preview_q_text');
    if (qTextEl) qTextEl.innerText = qItem.q || `Nội dung câu hỏi Ra Khơi số ${currentRKQuestion}...`;
    const aTextEl = document.getElementById('rk_preview_a_text');
    if (aTextEl) aTextEl.innerText = `Đáp án: ${qItem.a || '...'}`;
    const timerEl = document.getElementById('rk_preview_timer');
    if (timerEl) timerEl.innerText = rkTimeLeft;
}

function onClickBatDauDoanBang() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '', m: '' }) : { q: '', a: '', m: '' };
    sendToProjector('RA_KHOI_PLAY_CLIP', {
        questionIndex: currentRKQuestion,
        questionText: qItem.q || `Nội dung câu hỏi đoạn băng số ${currentRKQuestion}`,
        mediaUrl: qItem.m || ''
    });
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = "Phát đoạn băng";
    showToast(`Bắt đầu phát đoạn băng cho Câu ${currentRKQuestion}`);
}

function onClickVideoTangToc() {
    onClickBatDauDoanBang();
}

function onClickGiaiMaMedia() {
    sendToProjector('RA_KHOI_SHOW_GIAI_MA', { questionIndex: currentRKQuestion });
    showToast(`Hiện Giải mã Video/Ảnh cho Câu ${currentRKQuestion}`);
}

function onClickDiemTS() {
    sendToProjector('RA_KHOI_SHOW_SCORES');
    showToast('Hiển thị Điểm Thí Sinh trên Projector');
}

function onClickRKTangToc() {
    sendToProjector('RA_KHOI_INTRO');
    showToast('Hiển thị Tăng Tốc / Ra Khơi trên Projector');
}

function onClickRKTinhThoiGian() {
    clearInterval(rkTimerInterval);
    rkTimeLeft = 30; // 30s suy nghĩ trả lời
    const timerEl = document.getElementById('rk_preview_timer');
    if (timerEl) timerEl.innerText = rkTimeLeft;
    
    rkTimerInterval = setInterval(() => {
        rkTimeLeft--;
        if (timerEl) timerEl.innerText = rkTimeLeft;
        if (rkTimeLeft <= 0) {
            clearInterval(rkTimerInterval);
            const statusEl = document.getElementById('rk_preview_status');
            if (statusEl) statusEl.innerText = "Hết giờ!";
        }
    }, 1000);

    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    sendToProjector('RA_KHOI_START_TIMER', {
        questionIndex: currentRKQuestion,
        duration: 30,
        questionText: qItem.q
    });
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = "Đang đếm 30s";
    showToast(`Bắt đầu tính thời gian 30s cho Câu ${currentRKQuestion}`);
}

function onClickRKDapAnTS() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    const contestantsData = [];
    for (let i = 1; i <= 4; i++) {
        const ts = (gameData.contestants && gameData.contestants[i - 1]) || {};
        const nameVal = document.getElementById(`ts${i}_name_rk`)?.value || ts.name || `Thí sinh ${i}`;
        const timeVal = document.getElementById(`ts${i}_extra_rk`)?.value || ts.rk_time || '00.00';
        const ansVal = document.getElementById(`ts${i}_ans_rk`)?.value || ts.rk_answer || '';
        contestantsData.push({
            name: nameVal,
            rk_time: timeVal,
            rk_answer: ansVal
        });
    }

    sendToProjector('RA_KHOI_SHOW_CONTESTANT_ANSWERS', {
        questionIndex: currentRKQuestion,
        correctAnswer: qItem.a,
        contestants: contestantsData
    });
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = "Hiện đáp án TS";
    showToast('Hiển thị Scene Đáp án Thí Sinh Ra Khơi trên Projector');
}

function onClickRKHienDapAn() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    sendToProjector('RA_KHOI_SHOW_ANSWER', {
        questionIndex: currentRKQuestion,
        answerText: qItem.a
    });
    showToast('Hiện Đáp án Đúng trên Projector');
}

function onClickRKDatLai() {
    clearInterval(rkTimerInterval);
    // Clear contestant inputs on controller
    for (let i = 1; i <= 5; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_rk`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_rk`);
        if (extraEl) extraEl.value = '';
    }
    rkTimeLeft = (currentRKQuestion === 1 || currentRKQuestion === 2) ? 30 : 20;
    const timerEl = document.getElementById('rk_preview_timer');
    if (timerEl) timerEl.innerText = rkTimeLeft;
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = "Đã đặt lại";
    updateTab2Preview();
    sendToProjector('RA_KHOI_RESET');
    showToast('Đã đặt lại vòng thi Ra Khơi');
}

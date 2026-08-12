// ControllerR1.js - Round 1: Xuất phát
let currentXuatPhatDe = 1;
let currentXuatPhatQIndex = 0;
let xuatPhatTimerInterval = null;
let xuatPhatTimeLeft = 60;

function changeXuatPhatDe(val) {
    currentXuatPhatDe = parseInt(val) || 1;
    currentXuatPhatQIndex = 0;
    updateTab1Preview();
    showToast(`Đã chọn Bộ đề ${currentXuatPhatDe}`);
}

function selectLuotThi(turnIndex) {
    currentXuatPhatTurn = Math.min(4, Math.max(1, turnIndex));
    currentXuatPhatQIndex = 0;

    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`btn_luot_${i}`);
        if (btn) {
            if (i === currentXuatPhatTurn) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }

    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;

    updateTab1Preview();
    sendToProjector('XUAT_PHAT_SELECT_CONTESTANT', { name, score });
}

function updateTab1Preview() {
    const turnName = gameData.contestants[currentXuatPhatTurn - 1]?.name || `THÍ SINH ${currentXuatPhatTurn}`;
    const currentScore = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;

    const titleEl = document.getElementById('preview_turn_title');
    if (titleEl) titleEl.innerText = `LƯỢT THI ${currentXuatPhatTurn}: ${turnName.toUpperCase()}`;

    const qNumEl = document.getElementById('preview_q_num');
    if (qNumEl) qNumEl.innerText = currentXuatPhatQIndex + 1;

    const deSelectEl = document.getElementById('preview_de_select');
    if (deSelectEl) deSelectEl.value = currentXuatPhatDe;

    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = xuatPhatTimeLeft < 10 ? ('0' + xuatPhatTimeLeft) : xuatPhatTimeLeft;

    const scoreEl = document.getElementById('preview_current_score');
    if (scoreEl) scoreEl.innerText = currentScore;

    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };

    const qTextEl = document.getElementById('preview_q_text');
    if (qTextEl) qTextEl.innerText = currentQ.q ? `Câu ${currentXuatPhatQIndex + 1}: ${currentQ.q}` : `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`;

    const aTextEl = document.getElementById('preview_a_text');
    if (aTextEl) aTextEl.innerText = `Đáp án: ${currentQ.a || '...'}`;
}

function onClickIntroXuatPhat() {
    sendToProjector('XUAT_PHAT_INTRO');
    showToast('Phát Intro Xuất Phát');
}

function onClickLuatXuatPhat() {
    sendToProjector('XUAT_PHAT_LUAT');
    showToast('Hiển thị Luật thi Xuất Phát');
}

function onClickHienGraphicChonDe() {
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CHON_DE', { name });
    showToast('Đã hiện graphic Chọn Đề trên Projector');
}

function onClickHienGraphicCauHoi() {
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CAU_HOI', { 
        name: name,
        score: score
    });
    showToast('Đã hiện graphic khung Câu Hỏi trên Projector (chưa hiện câu hỏi)');
}

function onClickRandomDe() {
    const chosenSet = Math.floor(Math.random() * 8) + 1;
    currentXuatPhatDe = chosenSet;
    currentXuatPhatQIndex = 0;
    updateTab1Preview();
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_RANDOM_DE', { deNumber: chosenSet, name: name });
    showToast(`Đã random chọn Bộ đề ${chosenSet} cho ${name}`);
}

function onClickKhoidong() {
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CHON_DE', { name });
    showToast('Khởi động lượt thi');
}

function onClickBatDau60s() {
    clearInterval(xuatPhatTimerInterval);
    xuatPhatTimeLeft = 60;
    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = "60";

    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;

    sendToProjector('XUAT_PHAT_START_TIMER', {
        questionText: currentQ.q || `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`,
        questionIndex: currentXuatPhatQIndex + 1,
        contestantName: name,
        score: score
    });

    const targetTime = Date.now() + 60000;
    xuatPhatTimerInterval = setInterval(() => {
        xuatPhatTimeLeft = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        if (timerEl) timerEl.innerText = xuatPhatTimeLeft < 10 ? ('0' + xuatPhatTimeLeft) : xuatPhatTimeLeft;
        if (xuatPhatTimeLeft <= 0) {
            clearInterval(xuatPhatTimerInterval);
            const statusEl = document.getElementById('preview_status_text');
            if (statusEl) statusEl.innerText = "Hết giờ!";
        }
    }, 200);

    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "Đang đếm giờ...";
    showToast('Bắt đầu tính thời gian 60 giây!');
}

function onClickDung() {
    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    if (gameData.contestants[currentXuatPhatTurn - 1]) {
        gameData.contestants[currentXuatPhatTurn - 1].score += 10;
        const newScore = gameData.contestants[currentXuatPhatTurn - 1].score;
        const disp = document.getElementById(`ts${currentXuatPhatTurn}_score_disp`);
        if (disp) disp.innerText = newScore;
        saveAllData();
        updateTab1Preview();
        sendToProjector('XUAT_PHAT_RIGHT', { score: newScore, answerText: currentQ.a || 'Đáp án' });
    } else {
        sendToProjector('XUAT_PHAT_RIGHT', { answerText: currentQ.a || 'Đáp án' });
    }
    showToast('Trả lời ĐÚNG (+10đ)');
}

function onClickSai() {
    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
    sendToProjector('XUAT_PHAT_WRONG', { score, answerText: currentQ.a || 'Đáp án' });
    showToast('Trả lời SAI');
}

function onClickChuyenCau() {
    if (currentXuatPhatQIndex < 9) {
        currentXuatPhatQIndex++;
        updateTab1Preview();
        const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
        const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
        const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
        sendToProjector('XUAT_PHAT_NEXT_QUESTION', {
            questionIndex: currentXuatPhatQIndex + 1,
            questionText: currentQ.q || `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`,
            score
        });
        showToast(`Đã chuyển sang Câu ${currentXuatPhatQIndex + 1}`);
    } else {
        showToast('Đã hết 10 câu hỏi của lượt thi này');
    }
}

function onClickDatLaiVongThi() {
    clearInterval(xuatPhatTimerInterval);
    xuatPhatTimeLeft = 60;
    currentXuatPhatQIndex = 0;
    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = "60";
    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "Đã đặt lại";
    updateTab1Preview();

    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
    sendToProjector('XUAT_PHAT_RESET', { score });
    showToast('Đã đặt lại vòng thi Xuất Phát');
}

function onClickDungNhac() {
    sendToProjector('XUAT_PHAT_STOP_SOUND');
    showToast('Đã dừng nhạc');
}

function onClickHoanThanh() {
    sendToProjector('XUAT_PHAT_FINISH');
    sendToProjector('XUAT_PHAT_STOP_SOUND');
    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "Hoàn thành";
    showToast('Đã hoàn thành lượt thi - Đã ẩn màn hình Projector');
}

function onClickPhatAmThanh() {
    showToast('Đã phát âm thanh hiệu ứng');
}

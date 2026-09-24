// ControllerR1.js - Round 1: Xuất phát
let currentXuatPhatDe = 1;
let currentXuatPhatQIndex = 0;
let xuatPhatTimerInterval = null;
let xuatPhatTimeLeft = 60;
let isXuatPhatStarted = false;

function changeXuatPhatDe(val) {
    currentXuatPhatDe = parseInt(val) || 1;
    currentXuatPhatQIndex = 0;
    isXuatPhatStarted = false;
    updateTab1Preview();
    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[0] || { q: '', a: '' };
    const payload = {
        type: 'XUAT_PHAT_SHOW_QUESTION',
        deIndex: currentXuatPhatDe,
        questionIndex: 1,
        questionText: currentQ.q || '',
        answerText: currentQ.a || '',
        answer: currentQ.a || '',
        xpQuestionShown: false,
        contestants: gameData.contestants,
        timestamp: Date.now()
    };
    sendToProjector('XUAT_PHAT_SHOW_QUESTION', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast(`Đã chọn Bộ đề ${currentXuatPhatDe}`);
}

function selectLuotThi(turnIndex) {
    currentXuatPhatTurn = Math.min(4, Math.max(1, turnIndex));
    currentXuatPhatQIndex = 0;
    isXuatPhatStarted = false;

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
    const payload = {
        type: 'XUAT_PHAT_SELECT_CONTESTANT',
        turnIndex: currentXuatPhatTurn,
        name,
        score,
        questionIndex: 1,
        questionText: '',
        xpQuestionShown: false,
        contestants: gameData.contestants,
        timestamp: Date.now()
    };
    sendToProjector('XUAT_PHAT_SELECT_CONTESTANT', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
}

function updateTab1Preview() {
    const titleEl = document.getElementById('preview_turn_title');
    const scoreEl = document.getElementById('preview_current_score');
    const qNumEl = document.getElementById('preview_q_num');
    const deSelectEl = document.getElementById('preview_de_select');
    const timerEl = document.getElementById('preview_timer');
    const qTextEl = document.getElementById('preview_q_text');
    const aTextEl = document.getElementById('preview_a_text');

    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        if (titleEl) titleEl.innerText = `LƯỢT THI: CHƯA CHỌN THÍ SINH`;
        if (scoreEl) scoreEl.innerText = '0';
        if (qNumEl) qNumEl.innerText = '1';
        if (timerEl) timerEl.innerText = '60';
        if (qTextEl) qTextEl.innerText = 'Vui lòng chọn Lượt thi của Thí sinh (TS1, TS2, TS3, hoặc TS4)...';
        if (aTextEl) aTextEl.innerText = 'Đáp án: ...';
        return;
    }

    const turnName = gameData.contestants[currentXuatPhatTurn - 1]?.name || `THÍ SINH ${currentXuatPhatTurn}`;
    const currentScore = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;

    if (titleEl) titleEl.innerText = `LƯỢT THI ${currentXuatPhatTurn}: ${turnName.toUpperCase()}`;
    if (qNumEl) qNumEl.innerText = currentXuatPhatQIndex + 1;
    if (deSelectEl) deSelectEl.value = currentXuatPhatDe;
    if (timerEl) timerEl.innerText = xuatPhatTimeLeft;
    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = xuatPhatTimeLeft;
    if (scoreEl) scoreEl.innerText = currentScore;

    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };

    if (!isXuatPhatStarted) {
        if (qTextEl) qTextEl.innerText = '🔒 Đang chờ bấm Bắt đầu thi (Câu hỏi đầu tiên đang ẩn)...';
        if (aTextEl) aTextEl.innerText = 'Đáp án: 🔒 [Đang ẩn - Bấm Bắt đầu để xem]';
    } else {
        if (qTextEl) qTextEl.innerText = currentQ.q ? `Câu ${currentXuatPhatQIndex + 1}: ${currentQ.q}` : `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`;
        if (aTextEl) aTextEl.innerText = `Đáp án: ${currentQ.a || '...'}`;
    }
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
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước (TS1, TS2, TS3, hoặc TS4)!');
        return;
    }
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CHON_DE', { turnIndex: currentXuatPhatTurn, name });
    showToast('Đã hiện graphic Chọn Đề trên Projector');
}

function onClickHienGraphicCauHoi() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước (TS1, TS2, TS3, hoặc TS4)!');
        return;
    }
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CAU_HOI', { 
        turnIndex: currentXuatPhatTurn,
        name: name,
        score: score
    });
    showToast('Đã hiện graphic khung Câu Hỏi trên Projector (chưa hiện câu hỏi)');
}

function onClickRandomDe() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước (TS1, TS2, TS3, hoặc TS4)!');
        return;
    }
    const chosenSet = Math.floor(Math.random() * 8) + 1;
    currentXuatPhatDe = chosenSet;
    currentXuatPhatQIndex = 0;
    updateTab1Preview();
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_RANDOM_DE', { turnIndex: currentXuatPhatTurn, deNumber: chosenSet, name: name });
    showToast(`Đã random chọn Bộ đề ${chosenSet} cho ${name}`);
}

function onClickKhoidong() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước (TS1, TS2, TS3, hoặc TS4)!');
        return;
    }
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    sendToProjector('XUAT_PHAT_SHOW_GRAPHIC_CHON_DE', { turnIndex: currentXuatPhatTurn, name });
    showToast('Khởi động lượt thi');
}

function onClickBatDau60s() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước (TS1, TS2, TS3, hoặc TS4)!');
        return;
    }
    isXuatPhatStarted = true;
    updateTab1Preview();

    clearInterval(xuatPhatTimerInterval);
    xuatPhatTimeLeft = 60;
    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = "60";

    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;

    const payload = {
        type: 'XUAT_PHAT_START_TIMER',
        turnIndex: currentXuatPhatTurn,
        deIndex: currentXuatPhatDe,
        questionText: currentQ.q || `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`,
        answerText: currentQ.a || '',
        answer: currentQ.a || '',
        questionIndex: currentXuatPhatQIndex + 1,
        contestantName: name,
        score: score,
        xpQuestionShown: true,
        timestamp: Date.now()
    };
    sendToProjector('XUAT_PHAT_START_TIMER', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    const targetTime = Date.now() + 60000;
    xuatPhatTimerInterval = setInterval(() => {
        xuatPhatTimeLeft = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        if (timerEl) timerEl.innerText = xuatPhatTimeLeft;
        const statusEl = document.getElementById('preview_status_text');
        if (statusEl) statusEl.innerText = xuatPhatTimeLeft;
        if (xuatPhatTimeLeft <= 0) {
            clearInterval(xuatPhatTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 200);

    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "60";
    showToast('Bắt đầu tính thời gian 60 giây!');
}

function onClickDung() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước!');
        return;
    }
    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    if (gameData.contestants[currentXuatPhatTurn - 1]) {
        gameData.contestants[currentXuatPhatTurn - 1].score += 10;
        const newScore = gameData.contestants[currentXuatPhatTurn - 1].score;
        if (typeof syncContestantsUI === 'function') syncContestantsUI();
        saveAllData();
        sendToProjector('XUAT_PHAT_RIGHT', { score: newScore, answerText: currentQ.a || 'Đáp án' });
    } else {
        sendToProjector('XUAT_PHAT_RIGHT', { answerText: currentQ.a || 'Đáp án' });
    }
    showToast('Trả lời ĐÚNG (+10đ)');
}

function onClickSai() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước!');
        return;
    }
    const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
    const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
    const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
    sendToProjector('XUAT_PHAT_WRONG', { score, answerText: currentQ.a || 'Đáp án' });
    showToast('Trả lời SAI');
}

function onClickChuyenCau() {
    if (!currentXuatPhatTurn || currentXuatPhatTurn <= 0) {
        showToast('⚠️ Vui lòng chọn Lượt thi của Thí sinh trước!');
        return;
    }
    if (currentXuatPhatQIndex < 9) {
        currentXuatPhatQIndex++;
        updateTab1Preview();
        const questions = gameData.xuatPhat[currentXuatPhatDe] || [];
        const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
        const score = gameData.contestants[currentXuatPhatTurn - 1]?.score || 0;
        const name = gameData.contestants[currentXuatPhatTurn - 1]?.name || `Thí sinh ${currentXuatPhatTurn}`;
        const payload = {
            type: 'XUAT_PHAT_NEXT_QUESTION',
            turnIndex: currentXuatPhatTurn,
            deIndex: currentXuatPhatDe,
            questionIndex: currentXuatPhatQIndex + 1,
            questionText: currentQ.q || `Nội dung câu hỏi số ${currentXuatPhatQIndex + 1}`,
            answerText: currentQ.a || '',
            answer: currentQ.a || '',
            contestantName: name,
            score,
            xpQuestionShown: true,
            timestamp: Date.now()
        };
        sendToProjector('XUAT_PHAT_NEXT_QUESTION', payload);
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(payload);
        }
        showToast(`Đã chuyển sang Câu ${currentXuatPhatQIndex + 1}`);
    } else {
        showToast('Đã hết 10 câu hỏi của lượt thi này');
    }
}

function resetS1ContestantDe(tsIdx) {
    sendToProjector('RESET_S1_DE', { contestantId: tsIdx || 'ALL' });
    if (typeof showToast === 'function') {
        showToast(`Đã reset nút chọn bộ đề Xuất Phát`);
    }
}

function onClickDatLaiVongThi() {
    clearInterval(xuatPhatTimerInterval);
    xuatPhatTimeLeft = 60;
    currentXuatPhatQIndex = 0;
    currentXuatPhatTurn = 0;
    isXuatPhatStarted = false;
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`btn_luot_${i}`);
        if (btn) btn.classList.remove('active');
    }
    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = "60";
    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "60";
    updateTab1Preview();

    const payload = {
        type: 'XUAT_PHAT_RESET',
        turnIndex: 0,
        score: 0,
        round: 'XUAT_PHAT',
        activeRound: 'XUAT_PHAT',
        xpQuestionShown: false,
        timestamp: Date.now()
    };
    sendToProjector('XUAT_PHAT_RESET', payload);
    sendToProjector('RESET_S1_DE', { contestantId: 'ALL' });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    showToast('Đã đặt lại vòng thi Xuất Phát');
}

function onClickDungNhac() {
    sendToProjector('XUAT_PHAT_STOP_SOUND');
    showToast('Đã dừng nhạc');
}

function onClickHoanThanh() {
    isXuatPhatStarted = false;
    updateTab1Preview();
    const payload = {
        type: 'XUAT_PHAT_FINISH',
        xpQuestionShown: false,
        timestamp: Date.now()
    };
    sendToProjector('XUAT_PHAT_FINISH', payload);
    sendToProjector('XUAT_PHAT_STOP_SOUND');
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    const statusEl = document.getElementById('preview_status_text');
    if (statusEl) statusEl.innerText = "0";
    const timerEl = document.getElementById('preview_timer');
    if (timerEl) timerEl.innerText = "0";
    clearInterval(xuatPhatTimerInterval);
    showToast('Đã hoàn thành lượt thi - Đã ẩn màn hình Projector');
}

function onClickPhatAmThanh() {
    showToast('Đã phát âm thanh hiệu ứng');
}

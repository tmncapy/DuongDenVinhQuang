// ControllerRExtra.js - Extra Questions Tab (Câu Hỏi Phụ / Tie-Breaker)
let currentCHPQuestion = 1;
let chpTimerInterval = null;
let chpTimeLeft = 15;

function selectCHPQuestion(num) {
    currentCHPQuestion = num;
    for (let i = 1; i <= 3; i++) {
        const btn = document.getElementById(`btn_chp_q${i}`);
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
    const label = document.getElementById('chp_current_q_label');
    if (label) label.innerText = num;
    updateTab5Preview();
}

function getCHPSelectedParticipants() {
    const list = [];
    for (let i = 1; i <= 4; i++) {
        const cb = document.getElementById(`chp_ts_${i}`);
        if (cb && cb.checked) {
            list.push(i);
        }
    }
    return list.length > 0 ? list : [1, 2, 3, 4];
}

function updateCHPParticipants() {
    const activeParticipants = getCHPSelectedParticipants();
    for (let i = 1; i <= 4; i++) {
        const row = document.getElementById(`chp_ts_row_${i}`);
        if (row) {
            if (activeParticipants.includes(i)) {
                row.style.opacity = '1';
                row.style.pointerEvents = 'auto';
            } else {
                row.style.opacity = '0.4';
                row.style.pointerEvents = 'none';
            }
        }
    }
}

function updateTab5Preview() {
    const qInput = document.getElementById(`chp_q_${currentCHPQuestion}`);
    const aInput = document.getElementById(`chp_a_${currentCHPQuestion}`);
    const qItem = (gameData.cauHoiPhu && gameData.cauHoiPhu[currentCHPQuestion - 1]) || {};
    const qText = (qInput && qInput.value.trim()) || qItem.q || `Nội dung câu hỏi phụ số ${currentCHPQuestion}`;
    const aText = (aInput && aInput.value.trim()) || qItem.a || '';

    const timerEl = document.getElementById('chp_preview_timer');
    if (timerEl) timerEl.innerText = chpTimeLeft;
}

function onClickCHPShowQuestion() {
    if (typeof saveAllData === 'function') saveAllData();
    const qInput = document.getElementById(`chp_q_${currentCHPQuestion}`);
    const aInput = document.getElementById(`chp_a_${currentCHPQuestion}`);
    const qItem = (gameData.cauHoiPhu && gameData.cauHoiPhu[currentCHPQuestion - 1]) || {};
    const qText = (qInput && qInput.value.trim()) || qItem.q || `Nội dung câu hỏi phụ số ${currentCHPQuestion}`;
    const aText = (aInput && aInput.value.trim()) || qItem.a || '';
    const participants = getCHPSelectedParticipants();

    chpTimeLeft = 15;
    if (chpTimerInterval) clearInterval(chpTimerInterval);

    const payload = {
        type: 'CAU_HOI_PHU_SHOW_QUESTION',
        round: 'CHP',
        activeRound: 'CHP',
        questionIndex: currentCHPQuestion,
        questionText: qText,
        answerText: aText,
        participatingContestants: participants,
        timestamp: Date.now()
    };

    sendToProjector('CAU_HOI_PHU_SHOW_QUESTION', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);

    try {
        const audio = new Audio('sounds/BeginQues.mp3');
        audio.play().catch(e => console.warn("Controller audio blocked:", e));
    } catch(e) {}

    updateTab5Preview();
    if (typeof showToast === 'function') showToast(`Đã mở Câu Hỏi Phụ ${currentCHPQuestion} trên màn hình`);
}

function onClickCHPStartTimer() {
    if (typeof saveAllData === 'function') saveAllData();
    chpTimeLeft = 15;
    if (chpTimerInterval) clearInterval(chpTimerInterval);

    const timerEl = document.getElementById('chp_preview_timer');
    if (timerEl) timerEl.innerText = "15";

    const participants = getCHPSelectedParticipants();

    const payload = {
        type: 'CAU_HOI_PHU_START_TIMER',
        duration: 15,
        round: 'CHP',
        activeRound: 'CHP',
        questionIndex: currentCHPQuestion,
        participatingContestants: participants,
        timestamp: Date.now()
    };

    sendToProjector('CAU_HOI_PHU_START_TIMER', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);

    chpTimerInterval = setInterval(() => {
        chpTimeLeft--;
        if (timerEl) timerEl.innerText = Math.max(0, chpTimeLeft);
        if (chpTimeLeft <= 0) {
            clearInterval(chpTimerInterval);
            if (typeof showToast === 'function') showToast("Hết giờ làm bài câu hỏi phụ!");
        }
    }, 1000);

    if (typeof showToast === 'function') showToast('Bắt đầu đếm ngược 15 giây (Audio 15s)');
}

function onClickCHPShowContestantAnswers() {
    if (typeof saveAllData === 'function') saveAllData();
    const participants = getCHPSelectedParticipants();

    const answersMap = {};
    for (let i = 1; i <= 4; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_chp`);
        const extraEl = document.getElementById(`ts${i}_extra_chp`);
        const nameEl = document.getElementById(`ts${i}_name_chp`);
        answersMap[i] = {
            name: nameEl?.value || gameData.contestants?.[i - 1]?.name || `Thí sinh ${i}`,
            answer: ansEl?.value || '',
            time: extraEl?.value || '00.00'
        };
    }

    const payload = {
        type: 'CAU_HOI_PHU_SHOW_CONTESTANT_ANSWERS',
        round: 'CHP',
        activeRound: 'CHP',
        questionIndex: currentCHPQuestion,
        participatingContestants: participants,
        answers: answersMap,
        timestamp: Date.now()
    };

    sendToProjector('CAU_HOI_PHU_SHOW_CONTESTANT_ANSWERS', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);

    try {
        const audio = new Audio('sounds/Answer.mp3');
        audio.play().catch(e => console.warn("Controller audio blocked:", e));
    } catch(e) {}

    if (typeof showToast === 'function') showToast('Hiển thị đáp án thí sinh phần thi Câu Hỏi Phụ');
}

function onClickCHPShowAnswer() {
    const aInput = document.getElementById(`chp_a_${currentCHPQuestion}`);
    const qItem = (gameData.cauHoiPhu && gameData.cauHoiPhu[currentCHPQuestion - 1]) || {};
    const aText = (aInput && aInput.value.trim()) || qItem.a || '';

    const payload = {
        type: 'CAU_HOI_PHU_SHOW_ANSWER',
        round: 'CHP',
        activeRound: 'CHP',
        questionIndex: currentCHPQuestion,
        answerText: aText,
        timestamp: Date.now()
    };

    sendToProjector('CAU_HOI_PHU_SHOW_ANSWER', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);

    if (typeof showToast === 'function') showToast(`Hiển thị đáp án đúng câu phụ ${currentCHPQuestion}: ${aText}`);
}

function importCHPFromSystem() {
    for (let i = 1; i <= 3; i++) {
        const sysQ = document.getElementById(`sys_chp_q_${i}`)?.value || (gameData.cauHoiPhu?.[i - 1]?.q) || '';
        const sysA = document.getElementById(`sys_chp_a_${i}`)?.value || (gameData.cauHoiPhu?.[i - 1]?.a) || '';
        const chpQ = document.getElementById(`chp_q_${i}`);
        const chpA = document.getElementById(`chp_a_${i}`);
        if (chpQ) chpQ.value = sysQ;
        if (chpA) chpA.value = sysA;
        if (!gameData.cauHoiPhu) gameData.cauHoiPhu = [];
        gameData.cauHoiPhu[i - 1] = { q: sysQ, a: sysA };
    }
    if (typeof saveAllData === 'function') saveAllData();
    if (typeof updateTab5Preview === 'function') updateTab5Preview();
    if (typeof showToast === 'function') showToast('Đã nhập 3 câu hỏi phụ từ Tab Hệ Thống!');
}

function onClickCHPReset() {
    if (chpTimerInterval) clearInterval(chpTimerInterval);
    chpTimeLeft = 15;
    const timerEl = document.getElementById('chp_preview_timer');
    if (timerEl) timerEl.innerText = "15";

    for (let i = 1; i <= 4; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_chp`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_chp`);
        if (extraEl) extraEl.value = '';
    }

    const payload = {
        type: 'CAU_HOI_PHU_RESET',
        round: 'CHP',
        activeRound: 'CHP',
        timestamp: Date.now()
    };

    sendToProjector('CAU_HOI_PHU_RESET', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);

    if (typeof showToast === 'function') showToast('Đã đặt lại phần thi Câu Hỏi Phụ');
}

window.addEventListener('DOMContentLoaded', () => {
    updateCHPParticipants();
    selectCHPQuestion(1);
});

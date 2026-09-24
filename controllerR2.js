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

    sendToProjector('CLEAR_PLAYER_ANSWERS', { round: 'RK' });

    rkTimeLeft = (num === 1 || num === 2) ? 30 : 20;
    updateTab2Preview();
    const qItem = gameData.raKhoi ? (gameData.raKhoi[num - 1] || { q: '', a: '' }) : { q: '', a: '' };
    sendToProjector('RA_KHOI_SHOW_QUESTION', {
        round: 'RK',
        questionIndex: num,
        questionText: qItem.q || `Nội dung câu hỏi Ra Khơi số ${num}`,
        answerText: qItem.a || '',
        answer: qItem.a || '',
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
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = rkTimeLeft;
}

function onClickBatDauDoanBang() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '', m: '' }) : { q: '', a: '', m: '' };
    sendToProjector('RA_KHOI_PLAY_CLIP', {
        questionIndex: currentRKQuestion,
        questionText: qItem.q || `Nội dung câu hỏi đoạn băng số ${currentRKQuestion}`,
        mediaUrl: qItem.m || '',
        timestamp: Date.now()
    });
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = rkTimeLeft;
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
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = rkTimeLeft;
    
    rkTimerInterval = setInterval(() => {
        rkTimeLeft--;
        if (timerEl) timerEl.innerText = rkTimeLeft;
        const statusEl = document.getElementById('rk_preview_status');
        if (statusEl) statusEl.innerText = rkTimeLeft;
        if (rkTimeLeft <= 0) {
            clearInterval(rkTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 1000);

    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    sendToProjector('RA_KHOI_START_TIMER', {
        questionIndex: currentRKQuestion,
        duration: 30,
        questionText: qItem.q,
        answerText: qItem.a || '',
        answer: qItem.a || ''
    });
    showToast(`Bắt đầu tính thời gian 30s cho Câu ${currentRKQuestion}`);
}

function onClickRKDapAnTS() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    const contestantsData = [];
    for (let i = 1; i <= 4; i++) {
        const ts = (gameData.contestants && gameData.contestants[i - 1]) || {};
        const nameVal = document.getElementById(`ts${i}_name_rk`)?.value || ts.name || `Thí sinh ${i}`;
        let timeVal = document.getElementById(`ts${i}_extra_rk`)?.value || ts.rk_time || '';
        let ansVal = document.getElementById(`ts${i}_ans_rk`)?.value || ts.rk_answer || '';

        // In case time was embedded in ansVal
        const match = ansVal.match(/\(([\d\.]+)(?:s|giây)?\)/i);
        if (match) {
            if (!timeVal || timeVal === '00.00') {
                timeVal = match[1];
            }
            ansVal = ansVal.replace(/\(([\d\.]+)(?:s|giây)?\)/i, '').trim();
        }

        timeVal = (timeVal || '00.00').toString().replace(/s|giây/gi, '').trim();
        const num = parseFloat(timeVal);
        if (!isNaN(num)) {
            timeVal = num < 10 ? '0' + num.toFixed(2) : num.toFixed(2);
        } else {
            timeVal = '00.00';
        }

        contestantsData.push({
            name: nameVal,
            rk_time: timeVal,
            time: timeVal,
            rk_answer: ansVal,
            answer: ansVal
        });
    }

    sendToProjector('RA_KHOI_SHOW_CONTESTANT_ANSWERS', {
        questionIndex: currentRKQuestion,
        correctAnswer: qItem.a,
        contestants: contestantsData
    });
    const statusEl = document.getElementById('rk_preview_status');
    if (statusEl) statusEl.innerText = rkTimeLeft;
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
    if (statusEl) statusEl.innerText = rkTimeLeft;
    updateTab2Preview();
    
    sendToProjector('RA_KHOI_RESET', {
        questionIndex: currentRKQuestion,
        round: 'RA_KHOI',
        activeRound: 'RA_KHOI',
        timestamp: Date.now()
    });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({
            type: 'RA_KHOI_RESET',
            questionIndex: currentRKQuestion,
            round: 'RA_KHOI',
            activeRound: 'RA_KHOI',
            timestamp: Date.now()
        });
    }

    showToast('Đã đặt lại vòng Ra Khơi');
}

function onClickRKAutoScore() {
    const qItem = gameData.raKhoi ? (gameData.raKhoi[currentRKQuestion - 1] || { q: '', a: '' }) : { q: '', a: '' };
    const correctAns = (qItem.a || '').trim();
    
    // Gather all 4 contestants with their names, answers, and times
    const list = [];
    for (let i = 1; i <= 4; i++) {
        const rawName = gameData.contestants?.[i - 1]?.name || document.getElementById(`ts${i}_name_rk`)?.value || `Thí sinh ${i}`;
        const cleanName = rawName.replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
        const ansVal = (document.getElementById(`ts${i}_ans_rk`)?.value || '').trim();
        let timeVal = (document.getElementById(`ts${i}_extra_rk`)?.value || '00.00').trim();
        
        let numTime = parseFloat(timeVal.replace(/s|giây/gi, ''));
        if (isNaN(numTime) || numTime <= 0) numTime = 999;
        
        list.push({ idx: i, name: cleanName, ans: ansVal, timeStr: timeVal, timeNum: numTime });
    }
    
    // Sort by response time ascending (fastest first)
    list.sort((a, b) => a.timeNum - b.timeNum);

    let promptMsg = `⚡ CHẤM ĐIỂM RA KHƠI (Thang điểm: 40 - 30 - 20 - 10)\n`;
    if (correctAns) {
        promptMsg += `Đáp án đúng: "${correctAns}"\n\n`;
    }
    promptMsg += `Thứ tự thời gian trả lời của 4 thí sinh:\n`;
    list.forEach((item, pos) => {
        promptMsg += `${pos + 1}. [TS ${item.idx}] ${item.name} (${item.timeStr}s) - Đáp án: "${item.ans || '(chưa nhập)'}"\n`;
    });
    promptMsg += `\nNhập số thứ tự Thí sinh trả lời ĐÚNG (theo số TS 1, 2, 3, 4; cách nhau bằng dấu phẩy, ví dụ: 1, 3):\n(Thí sinh nhanh nhất trong số người đúng nhận 40đ, tiếp theo là 30đ, 20đ, 10đ)`;

    const input = prompt(promptMsg, "");
    if (input === null || input.trim() === '') return;

    const chosenIdxs = input.split(/[,+\s]+/).map(s => parseInt(s.trim())).filter(n => n >= 1 && n <= 4);
    if (chosenIdxs.length === 0) {
        if (typeof showToast === 'function') showToast('Không chọn thí sinh nào.');
        return;
    }

    // Filter list preserving the time-sorted order
    const correctContestants = list.filter(item => chosenIdxs.includes(item.idx));
    const pointScale = [40, 30, 20, 10];
    const results = [];

    correctContestants.forEach((item, rank) => {
        const pts = pointScale[rank] || 10;
        if (typeof adjustScore === 'function') {
            adjustScore(item.idx, pts);
        }
        results.push(`TS${item.idx} (+${pts}đ)`);
    });

    if (typeof showToast === 'function') {
        showToast(`Đã cộng điểm Ra Khơi: ${results.join(', ')}`);
    }
}
window.onClickRKAutoScore = onClickRKAutoScore;



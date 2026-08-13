// ControllerR3.js - Round 3: Vượt sóng
let currentVSRow = 1;
let vsTimerInterval = null;
let vsTimeLeft = 20;
let vsRevealedKeyIndices = [];

function selectVSRow(row) {
    currentVSRow = row;
    const buttons = document.querySelectorAll('#tab3-content .vs-row-btn');
    buttons.forEach((btn, idx) => {
        if ((idx + 1 === row) || (row === 'center' && idx === 4)) {
            btn.style.background = '#0056b3';
            btn.style.color = '#fff';
        } else {
            btn.style.background = idx === 4 ? '#38bdf8' : '#80bfff';
            btn.style.color = idx === 4 ? '#fff' : '#002060';
        }
    });
    const titleEl = document.getElementById('vs_preview_title');
    const qTextEl = document.getElementById('vs_preview_q_text');
    const aTextEl = document.getElementById('vs_preview_a_text');
    
    let currentQText = "";
    if (row === 'center') {
        if (titleEl) titleEl.innerText = "VÒNG THI VƯỢT SÓNG: Ô CHỮ TRUNG TÂM";
        const q = document.getElementById('vs_q_center')?.value || gameData.vuotSong?.center?.q || "Chưa nhập câu hỏi trung tâm";
        const a = document.getElementById('vs_a_center')?.value || gameData.vuotSong?.center?.a || "Chưa nhập đáp án";
        if (qTextEl) qTextEl.innerText = q;
        if (aTextEl) aTextEl.innerText = `Đáp án: ${a} | Từ khóa CNV: ${gameData.vuotSong?.keyword || '...'}`;
        currentQText = q;
    } else {
        if (titleEl) titleEl.innerText = `VÒNG THI VƯỢT SÓNG: HÀNG NGANG ${row}`;
        const q = document.getElementById(`vs_q_${row}`)?.value || gameData.vuotSong?.[`h${row}`]?.q || `Chưa nhập câu hỏi hàng ${row}`;
        const a = document.getElementById(`vs_a_${row}`)?.value || gameData.vuotSong?.[`h${row}`]?.a || `Chưa nhập đáp án`;
        if (qTextEl) qTextEl.innerText = q;
        if (aTextEl) aTextEl.innerText = `Đáp án: ${a} | Từ khóa CNV: ${gameData.vuotSong?.keyword || '...'}`;
        currentQText = q;
    }
    if (typeof updateVuotSongState === 'function') {
        updateVuotSongState();
    } else {
        sendToProjector('VUOT_SONG_SYNC_GRID', { vuotSong: gameData.vuotSong });
    }
    sendToProjector('VUOT_SONG_SELECT_ROW', { row: row, questionText: currentQText, contestants: gameData.contestants });
    showToast(`Đã chọn Hàng ngang ${row}`);
}

function onClickVSFlipRow() {
    sendToProjector('VUOT_SONG_SELECT_ROW', { row: currentVSRow });
    showToast(`Đã lật ô chữ hàng ngang ${currentVSRow} trên Projector`);
}

function onClickVSOpenRowAnswer() {
    if (!currentVSRow) {
        showToast('Chưa chọn hàng ngang nào!');
        return;
    }
    let a = "";
    if (currentVSRow === 'center') {
        a = document.getElementById('vs_a_center')?.value || "";
    } else {
        a = document.getElementById(`vs_a_${currentVSRow}`)?.value || "";
    }
    sendToProjector('VUOT_SONG_OPEN_ROW_ANSWER', { row: currentVSRow, answer: a });
    showToast(`Đã mở đáp án hàng ngang ${currentVSRow}`);
}

function onClickVSOpenKeywordLetters() {
    const kw = (gameData.vuotSong?.keyword || gameData.vuotSong?.center?.a || document.getElementById('vs_keyword')?.value || '').trim();
    const cleanKw = kw.replace(/\s+/g, '').toUpperCase();
    const totalLen = cleanKw.length;
    
    if (totalLen === 0) {
        showToast('Chưa nhập Từ khóa / Đáp án vòng thi Vượt Sóng!');
        return;
    }

    // Filter out indices out of bounds if keyword length changed
    vsRevealedKeyIndices = vsRevealedKeyIndices.filter(i => i < totalLen);

    // Find unopened indices
    const unopened = [];
    for (let i = 0; i < totalLen; i++) {
        if (!vsRevealedKeyIndices.includes(i)) {
            unopened.push(i);
        }
    }

    if (unopened.length === 0) {
        showToast('Tất cả chữ cái của đáp án vòng thi đã được mở!');
        return;
    }

    // Rule: max per click = Math.floor(totalLen / 4), at least 1
    const maxPerClick = Math.max(1, Math.floor(totalLen / 4));
    const availableToOpen = Math.min(maxPerClick, unopened.length);
    // Random count between 1 and availableToOpen
    const numToOpen = Math.floor(Math.random() * availableToOpen) + 1;

    // Randomly pick numToOpen indices from unopened array
    const newlyOpened = [];
    const tempUnopened = [...unopened];
    for (let k = 0; k < numToOpen; k++) {
        const randomIndex = Math.floor(Math.random() * tempUnopened.length);
        const pickedIdx = tempUnopened.splice(randomIndex, 1)[0];
        newlyOpened.push(pickedIdx);
        vsRevealedKeyIndices.push(pickedIdx);
    }

    sendToProjector('VUOT_SONG_OPEN_KEYWORD_LETTERS', {
        keyword: cleanKw,
        revealedIndices: vsRevealedKeyIndices,
        newlyOpened: newlyOpened
    });

    showToast(`Đã mở thêm ${numToOpen} chữ cái đáp án (${vsRevealedKeyIndices.length}/${totalLen} ô)`);
}

function onClickVSOpenAllAnswers() {
    const kw = (gameData.vuotSong?.keyword || gameData.vuotSong?.center?.a || '').trim();
    const cleanKw = kw.replace(/\s+/g, '').toUpperCase();
    vsRevealedKeyIndices = [];
    for (let i = 0; i < cleanKw.length; i++) {
        vsRevealedKeyIndices.push(i);
    }
    sendToProjector('VUOT_SONG_OPEN_ALL_ANSWERS', { vuotSong: gameData.vuotSong });
    showToast('Đã mở đáp án Vòng thi Vượt Sóng!');
}

function onClickVSShowQuestion() {
    const q = currentVSRow === 'center' ? (document.getElementById('vs_q_center')?.value || "Chưa nhập câu hỏi trung tâm") : (document.getElementById(`vs_q_${currentVSRow}`)?.value || `Chưa nhập câu hỏi hàng ${currentVSRow}`);
    sendToProjector('VUOT_SONG_SHOW_QUESTION', { row: currentVSRow, questionText: q });
    showToast('Đã hiển thị câu hỏi Vượt Sóng trên Projector');
}

function onClickVSStartTimer() {
    clearInterval(vsTimerInterval);
    vsTimeLeft = 20;
    const timerEl = document.getElementById('vs_preview_timer');
    if (timerEl) timerEl.innerText = vsTimeLeft;
    
    vsTimerInterval = setInterval(() => {
        vsTimeLeft--;
        if (timerEl) timerEl.innerText = vsTimeLeft;
        if (vsTimeLeft <= 0) {
            clearInterval(vsTimerInterval);
        }
    }, 1000);

    sendToProjector('VUOT_SONG_START_TIMER', { duration: 20 });
    showToast('Bắt đầu 20s Vượt Sóng trên Projector');
}

function onClickVSShowAnswers() {
    const contestants = [];
    for (let i = 1; i <= 4; i++) {
        contestants.push({
            name: gameData.contestants?.[i-1]?.name || document.getElementById(`ts${i}_name_vs`)?.value || `Thí sinh ${i}`,
            answer: document.getElementById(`ts${i}_ans_vs`)?.value || '',
            time: '00.00'
        });
    }
    sendToProjector('VUOT_SONG_SHOW_CONTESTANT_ANSWERS', { contestants: contestants });
    showToast('Hiển thị đáp án thí sinh Vượt Sóng trên Projector');
}

function onClickVSDatLai() {
    vsRevealedKeyIndices = [];
    clearInterval(vsTimerInterval);
    vsTimeLeft = 20;
    const timerEl = document.getElementById('vs_preview_timer');
    if (timerEl) timerEl.innerText = vsTimeLeft;

    currentVSRow = null;
    const buttons = document.querySelectorAll('#tab3-content .vs-row-btn');
    buttons.forEach((btn, idx) => {
        btn.style.background = idx === 4 ? '#38bdf8' : '#80bfff';
        btn.style.color = idx === 4 ? '#fff' : '#002060';
    });
    const titleEl = document.getElementById('vs_preview_title');
    const qTextEl = document.getElementById('vs_preview_q_text');
    const aTextEl = document.getElementById('vs_preview_a_text');
    if (titleEl) titleEl.innerText = "CHƯA CHỌN HÀNG NGANG";
    if (qTextEl) qTextEl.innerText = "Nội dung câu hỏi...";
    if (aTextEl) aTextEl.innerText = "Đáp án...";
    
    sendToProjector('VUOT_SONG_RESET');
    showToast('Đã đặt lại vòng Vượt Sóng');
}

// ControllerR3.js - Round 3: Vượt sóng
let currentVSRow = 1;
let vsTimerInterval = null;
let vsTimeLeft = 20;
let vsRevealedKeyIndices = [];

function removeVietnameseTones(str) {
    if (!str) return '';
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    try {
        str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    } catch(e) {}
    return str;
}

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

    // Clear contestant 20s inputs on controller for the new horizontal row
    for (let i = 1; i <= 4; i++) {
        const extraEl = document.getElementById(`ts${i}_extra_vs`);
        if (extraEl) extraEl.value = '';
        const ansEl = document.getElementById(`ts${i}_ans_vs`);
        if (ansEl && !ansEl.value.startsWith('[CNV]')) {
            ansEl.value = '';
        }
    }

    sendToProjector('CLEAR_PLAYER_ANSWERS', { round: 'VS' });

    window.vsQuestionIsShown = false;
    const titleEl = document.getElementById('vs_preview_title');
    const qTextEl = document.getElementById('vs_preview_q_text');
    const aTextEl = document.getElementById('vs_preview_a_text');
    const statusEl = document.getElementById('vs_preview_status');
    if (statusEl) statusEl.innerText = "20";
    
    if (row === 'center') {
        if (titleEl) titleEl.innerText = "VÒNG THI VƯỢT SÓNG: Ô CHỮ TRUNG TÂM";
    } else {
        if (titleEl) titleEl.innerText = `VÒNG THI VƯỢT SÓNG: HÀNG NGANG ${row}`;
    }
    const q = row === 'center' ? (document.getElementById('vs_q_center')?.value || gameData.vuotSong?.center?.q || "") : (document.getElementById(`vs_q_${row}`)?.value || gameData.vuotSong?.[`h${row}`]?.q || "");
    const a = row === 'center' ? (document.getElementById('vs_a_center')?.value || gameData.vuotSong?.center?.a || "") : (document.getElementById(`vs_a_${row}`)?.value || gameData.vuotSong?.[`h${row}`]?.a || "");

    if (qTextEl) qTextEl.innerText = q || `Nội dung câu hỏi Hàng ngang ${row}`;
    if (aTextEl) aTextEl.innerText = `Đáp án: ${a || '...'} | Từ khóa CNV: ${gameData.vuotSong?.keyword || '...'}`;

    const payload = {
        type: 'VUOT_SONG_SELECT_ROW',
        row: row,
        round: 'VS',
        questionText: q,
        answerText: a,
        answer: a,
        vsQuestionShown: false,
        gameData: gameData,
        contestants: gameData.contestants,
        timestamp: Date.now()
    };
    sendToProjector('VUOT_SONG_SELECT_ROW', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
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
    const cleanKw = removeVietnameseTones(kw).replace(/\s+/g, '').toUpperCase();
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
    const cleanKw = removeVietnameseTones(kw).replace(/\s+/g, '').toUpperCase();
    vsRevealedKeyIndices = [];
    for (let i = 0; i < cleanKw.length; i++) {
        vsRevealedKeyIndices.push(i);
    }
    sendToProjector('VUOT_SONG_OPEN_ALL_ANSWERS', { vuotSong: gameData.vuotSong });
    showToast('Đã mở đáp án Vòng thi Vượt Sóng!');
}

function onClickVSShowQuestion() {
    if (!currentVSRow) {
        showToast('⚠️ Vui lòng chọn Hàng ngang trước khi bấm Hiện câu hỏi!');
        return;
    }
    window.vsQuestionIsShown = true;
    const q = currentVSRow === 'center' ? (document.getElementById('vs_q_center')?.value || gameData.vuotSong?.center?.q || "Chưa nhập câu hỏi trung tâm") : (document.getElementById(`vs_q_${currentVSRow}`)?.value || gameData.vuotSong?.[`h${currentVSRow}`]?.q || `Chưa nhập câu hỏi hàng ${currentVSRow}`);
    const a = currentVSRow === 'center' ? (document.getElementById('vs_a_center')?.value || gameData.vuotSong?.center?.a || "Chưa nhập đáp án") : (document.getElementById(`vs_a_${currentVSRow}`)?.value || gameData.vuotSong?.[`h${currentVSRow}`]?.a || `Chưa nhập đáp án`);

    const qTextEl = document.getElementById('vs_preview_q_text');
    const aTextEl = document.getElementById('vs_preview_a_text');
    if (qTextEl) qTextEl.innerText = q;
    if (aTextEl) aTextEl.innerText = `Đáp án: ${a} | Từ khóa CNV: ${gameData.vuotSong?.keyword || '...'}`;

    const payload = {
        type: 'VUOT_SONG_SHOW_QUESTION',
        row: currentVSRow,
        questionText: q,
        answerText: a,
        answer: a,
        vsQuestionShown: true,
        round: 'VS',
        timestamp: Date.now()
    };
    sendToProjector('VUOT_SONG_SHOW_QUESTION', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast('Đã hiển thị câu hỏi Vượt Sóng trên Projector & Player');
}

function onClickVSStartTimer() {
    clearInterval(vsTimerInterval);
    vsTimeLeft = 20;
    const timerEl = document.getElementById('vs_preview_timer');
    if (timerEl) timerEl.innerText = vsTimeLeft;
    const statusEl = document.getElementById('vs_preview_status');
    if (statusEl) statusEl.innerText = vsTimeLeft;
    
    vsTimerInterval = setInterval(() => {
        vsTimeLeft--;
        if (timerEl) timerEl.innerText = vsTimeLeft;
        const statusEl = document.getElementById('vs_preview_status');
        if (statusEl) statusEl.innerText = vsTimeLeft;
        if (vsTimeLeft <= 0) {
            clearInterval(vsTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 1000);

    const q = currentVSRow === 'center' ? (document.getElementById('vs_q_center')?.value || gameData.vuotSong?.center?.q || "") : (document.getElementById(`vs_q_${currentVSRow}`)?.value || gameData.vuotSong?.[`h${currentVSRow}`]?.q || "");
    const a = currentVSRow === 'center' ? (document.getElementById('vs_a_center')?.value || gameData.vuotSong?.center?.a || "") : (document.getElementById(`vs_a_${currentVSRow}`)?.value || gameData.vuotSong?.[`h${currentVSRow}`]?.a || "");

    const payload = {
        type: 'VUOT_SONG_START_TIMER',
        duration: 20,
        row: currentVSRow,
        questionText: q,
        answerText: a,
        answer: a,
        timestamp: Date.now()
    };
    sendToProjector('VUOT_SONG_START_TIMER', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast('Bắt đầu 20s Vượt Sóng trên Projector');
}

function onClickVSReturnToGrid() {
    window.vsQuestionIsShown = false;
    clearInterval(vsTimerInterval);
    const timerEl = document.getElementById('vs_preview_timer');
    if (timerEl) timerEl.innerText = vsTimeLeft;
    const statusEl = document.getElementById('vs_preview_status');
    if (statusEl) statusEl.innerText = vsTimeLeft;

    const qTextEl = document.getElementById('vs_preview_q_text');
    const aTextEl = document.getElementById('vs_preview_a_text');
    if (qTextEl) qTextEl.innerText = "🔒 [Đang ẩn] - Bấm [Hiện câu hỏi] để hiển thị nội dung cho Player & Máy chiếu";
    if (aTextEl) aTextEl.innerText = `Đáp án: 🔒 [Đang ẩn - Bấm Hiện câu hỏi để xem] | Từ khóa CNV: ${gameData.vuotSong?.keyword || '...'}`;

    const payload = {
        type: 'VUOT_SONG_RETURN_GRID',
        row: currentVSRow,
        round: 'VS',
        activeRound: 'VUOT_SONG',
        timestamp: Date.now()
    };
    sendToProjector('VUOT_SONG_RETURN_GRID', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast('Đã quay lại giao diện hàng ngang (giữ nguyên trạng thái chọn & đáp án)');
}

function onClickVSShowAnswers() {
    const contestants = [];
    for (let i = 1; i <= 4; i++) {
        const extraInput = document.getElementById(`ts${i}_extra_vs`);
        const ansInput = document.getElementById(`ts${i}_ans_vs`);
        let ansVal = ansInput?.value || '';
        let timeVal = extraInput?.value || '';

        // Clean any attached prefixes just in case (e.g. 🔔, [CNV], [Bấm chuông], etc.)
        ansVal = ansVal.replace(/^[🔔\s]*(\[CNV\]|\[Bấm chuông\])?\s*/gi, '').trim();

        // In case time was embedded in ansVal (e.g. "jhfurhusrehf (09.51s)" or "(09.51)")
        const match = ansVal.match(/\(([\d\.]+)(?:s|giây)?\)/i);
        if (match) {
            if (!timeVal || timeVal === '00.00') {
                timeVal = match[1];
            }
            ansVal = ansVal.replace(/\(([\d\.]+)(?:s|giây)?\)/i, '').trim();
        }

        // Clean timeVal to remove any 's' or 'giây'
        timeVal = (timeVal || '00.00').toString().replace(/s|giây/gi, '').trim();
        const num = parseFloat(timeVal);
        if (!isNaN(num)) {
            timeVal = num < 10 ? '0' + num.toFixed(2) : num.toFixed(2);
        } else {
            timeVal = '00.00';
        }

        const rawBase = gameData.contestants?.[i-1]?.name || document.getElementById(`ts${i}_name_vs`)?.value || `Thí sinh ${i}`;
        const baseName = rawBase.replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();

        contestants.push({
            name: baseName,
            answer: ansVal,
            time: timeVal
        });
    }
    sendToProjector('VUOT_SONG_SHOW_CONTESTANT_ANSWERS', { contestants: contestants });
    showToast('Hiển thị đáp án thí sinh Vượt Sóng trên Projector');
}

function updateVSBuzzerLabels() {
    if (!window.vsSubmissions) window.vsSubmissions = {};

    const submissions = Object.keys(window.vsSubmissions).map(idxStr => {
        const idx = parseInt(idxStr);
        const sub = window.vsSubmissions[idxStr];
        const timeVal = typeof sub === 'object' ? sub.time : sub;
        const numTime = typeof sub === 'object' ? (sub.numTime || parseFloat(timeVal) || 999) : (parseFloat(timeVal) || 999);
        const timestamp = (typeof sub === 'object' && sub.timestamp) ? sub.timestamp : 0;
        return { idx, timeVal, numTime, timestamp };
    });

    submissions.sort((a, b) => {
        if (Math.abs(a.numTime - b.numTime) > 0.001) {
            return a.numTime - b.numTime;
        }
        return a.timestamp - b.timestamp;
    });

    for (let i = 1; i <= 4; i++) {
        const nameInput = document.getElementById(`ts${i}_name_vs`);
        const rawBase = (typeof gameData !== 'undefined' && gameData.contestants?.[i - 1]?.name) || `Thí sinh ${i}`;
        const baseName = rawBase
            .replace(/\s*🔔.*$/gi, '')
            .replace(/\s*\(Thứ \d+.*?\)/gi, '')
            .replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '')
            .replace(/\s*\(\d+\)/g, '')
            .trim();

        const orderIdx = submissions.findIndex(s => s.idx === i);
        if (orderIdx !== -1) {
            const rank = orderIdx + 1;
            const timeStr = submissions[orderIdx].timeVal;
            const rankSuffix = submissions.length > 1 ? ` (${rank})` : '';
            if (nameInput) {
                // Tên thí sinh bấm sang màu đỏ sau đó là ngoặc đơn ghi thời gian bấm và ngoặc đơn nữa ghi thứ tự bấm chuông (nếu có nhiều người bấm cùng lúc)
                nameInput.value = `${baseName} (${timeStr}s)${rankSuffix}`;
                nameInput.style.color = '#dc2626';
                nameInput.style.fontWeight = 'bold';
            }
        } else {
            if (nameInput) {
                nameInput.value = baseName;
                nameInput.style.color = '#000000';
                nameInput.style.fontWeight = 'bold';
            }
        }
    }
}
window.updateVSBuzzerLabels = updateVSBuzzerLabels;

function markVSContestantSubmitted(tsIdx, timeStr) {
    if (!window.vsSubmissions) window.vsSubmissions = {};
    const idx = parseInt(tsIdx);
    if (isNaN(idx) || idx < 1 || idx > 4) return;

    if (!window.vsRoundStartTime) {
        const savedTime = parseInt(localStorage.getItem('s3_round_start_time'));
        window.vsRoundStartTime = (savedTime && Date.now() - savedTime < 3600000) ? savedTime : Date.now();
    }

    let cleanTime = (timeStr || '').toString().replace(/s|giây/gi, '').trim();
    if (!cleanTime || cleanTime === '00.00' || isNaN(parseFloat(cleanTime))) {
        let elapsed = (Date.now() - window.vsRoundStartTime) / 1000;
        cleanTime = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
    } else {
        let num = parseFloat(cleanTime);
        if (!isNaN(num)) {
            cleanTime = num < 10 ? '0' + num.toFixed(2) : num.toFixed(2);
        }
    }

    if (!window.vsSubmissions[idx]) {
        window.vsSubmissions[idx] = {
            time: cleanTime,
            numTime: parseFloat(cleanTime) || 999,
            timestamp: Date.now()
        };
    }

    const ansInput = document.getElementById(`ts${idx}_ans_vs`);
    if (ansInput && (!ansInput.value || ansInput.value === '[CNV] Bấm chuông')) {
        ansInput.value = '[CNV] Bấm chuông';
    }

    updateVSBuzzerLabels();

    // Trigger full-screen orange flash on corresponding scoreboard (10 flashes)
    const flashPayload = {
        type: 'S3_FLASH_SCOREBOARD',
        contestantId: idx,
        round: 'VUOT_SONG',
        timestamp: Date.now()
    };
    sendToProjector('S3_FLASH_SCOREBOARD', flashPayload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(flashPayload);
    }
}
window.markVSContestantSubmitted = markVSContestantSubmitted;

function triggerVSBell(idx) {
    if (!window.vsRoundStartTime) {
        const savedTime = parseInt(localStorage.getItem('s3_round_start_time'));
        window.vsRoundStartTime = (savedTime && Date.now() - savedTime < 3600000) ? savedTime : Date.now();
    }
    let elapsed = (Date.now() - window.vsRoundStartTime) / 1000;
    let timeStr = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
    
    const ansInput = document.getElementById(`ts${idx}_ans_vs`);
    if (ansInput && !ansInput.value) {
        ansInput.value = '[CNV] Bấm chuông';
    }
    markVSContestantSubmitted(idx, timeStr);
}

function resetVSContestantBell(tsIdx) {
    if (tsIdx === 'ALL' || !tsIdx) {
        window.vsSubmissions = {};
        for (let i = 1; i <= 4; i++) {
            const ansInput = document.getElementById(`ts${i}_ans_vs`);
            if (ansInput && (ansInput.value === '[CNV] Bấm chuông' || ansInput.value.startsWith('[CNV]'))) {
                ansInput.value = '';
            }
        }
        if (typeof updateVSBuzzerLabels === 'function') {
            updateVSBuzzerLabels();
        } else {
            for (let i = 1; i <= 4; i++) {
                const nameInput = document.getElementById(`ts${i}_name_vs`);
                if (nameInput) {
                    const rawBase = gameData.contestants?.[i - 1]?.name || `Thí sinh ${i}`;
                    const baseName = rawBase.replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
                    nameInput.value = baseName;
                    nameInput.style.color = '#000';
                    nameInput.style.fontWeight = 'bold';
                }
            }
        }
        const payloadAll = {
            type: 'RESET_VS_BELL',
            contestantId: 'ALL',
            round: 'VS',
            activeRound: 'VUOT_SONG',
            timestamp: Date.now()
        };
        sendToProjector('RESET_VS_BELL', payloadAll);
        sendToProjector('VUOT_SONG_RESET_BELL', payloadAll);
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(payloadAll);
            sendSupabaseAction({ ...payloadAll, type: 'VUOT_SONG_RESET_BELL' });
        }
        if (typeof showToast === 'function') showToast('Đã reset nút chuông cho tất cả thí sinh');
    } else {
        if (window.vsSubmissions) delete window.vsSubmissions[tsIdx];
        const ansInput = document.getElementById(`ts${tsIdx}_ans_vs`);
        if (ansInput && (ansInput.value === '[CNV] Bấm chuông' || ansInput.value.startsWith('[CNV]'))) {
            ansInput.value = '';
        }
        if (typeof updateVSBuzzerLabels === 'function') {
            updateVSBuzzerLabels();
        } else {
            const nameInput = document.getElementById(`ts${tsIdx}_name_vs`);
            if (nameInput) {
                const rawBase = gameData.contestants?.[tsIdx - 1]?.name || `Thí sinh ${tsIdx}`;
                const baseName = rawBase.replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
                nameInput.value = baseName;
                nameInput.style.color = '#000';
                nameInput.style.fontWeight = 'bold';
            }
        }
        const payloadSingle = {
            type: 'RESET_VS_BELL',
            contestantId: tsIdx,
            round: 'VS',
            activeRound: 'VUOT_SONG',
            timestamp: Date.now()
        };
        sendToProjector('RESET_VS_BELL', payloadSingle);
        sendToProjector('VUOT_SONG_RESET_BELL', payloadSingle);
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(payloadSingle);
            sendSupabaseAction({ ...payloadSingle, type: 'VUOT_SONG_RESET_BELL' });
        }
        if (typeof showToast === 'function') showToast(`Đã reset nút chuông cho Thí sinh ${tsIdx}`);
    }
}

function onClickVSDatLai() {
    resetVSContestantBell('ALL');
    window.vsRoundStartTime = Date.now();
    try { localStorage.setItem('s3_round_start_time', window.vsRoundStartTime); } catch(e) {}
    vsRevealedKeyIndices = [];
    clearInterval(vsTimerInterval);
    vsTimeLeft = 20;
    const timerEl = document.getElementById('vs_preview_timer');
    if (timerEl) timerEl.innerText = "20";
    const statusEl = document.getElementById('vs_preview_status');
    if (statusEl) statusEl.innerText = "20";

    // Clear contestant inputs on controller
    for (let i = 1; i <= 5; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_vs`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_vs`);
        if (extraEl) extraEl.value = '';
    }

    if (typeof syncContestantsUI === 'function') {
        syncContestantsUI();
    }

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
    
    sendToProjector('VUOT_SONG_RESET', { round: 'VUOT_SONG', activeRound: 'VUOT_SONG', vsQuestionShown: false });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({
            type: 'VUOT_SONG_RESET',
            round: 'VUOT_SONG',
            activeRound: 'VUOT_SONG',
            vsQuestionShown: false,
            timestamp: Date.now()
        });
    }

    showToast('Đã đặt lại vòng Vượt Sóng');
}

function onClickVSScoreKeyword() {
    // List contestants with bell times if available
    let buzzedList = [];
    for (let i = 1; i <= 4; i++) {
        const rawName = gameData.contestants?.[i - 1]?.name || document.getElementById(`ts${i}_name_vs`)?.value || `Thí sinh ${i}`;
        const cleanName = rawName.replace(/\s*🔔.*$/gi, '').replace(/\s*\(Thứ \d+.*?\)/gi, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
        const sub = window.vsSubmissions?.[i];
        const bellTime = sub ? (typeof sub === 'object' ? sub.time : sub) : null;
        const ansVal = (document.getElementById(`ts${i}_ans_vs`)?.value || '').trim();
        buzzedList.push({
            idx: i,
            name: cleanName,
            bellTime: bellTime,
            ans: ansVal
        });
    }

    let defaultTs = "1";
    // If someone buzzed first, suggest them
    const buzzedOnly = buzzedList.filter(b => b.bellTime);
    buzzedOnly.sort((a, b) => (parseFloat(a.bellTime) || 999) - (parseFloat(b.bellTime) || 999));
    if (buzzedOnly.length > 0) {
        defaultTs = buzzedOnly[0].idx.toString();
    }

    let msg = `🎯 CHẤM ĐIỂM ĐÁP ÁN VÒNG THI VƯỢT SÓNG\n`;
    msg += `Thang điểm theo thời điểm trả lời: 50 - 40 - 30 - 20 - 10\n\n`;
    msg += `Danh sách thí sinh:\n`;
    buzzedList.forEach(b => {
        let rankStr = '';
        if (b.bellTime && buzzedOnly.length > 0) {
            const rank = buzzedOnly.findIndex(x => x.idx === b.idx) + 1;
            rankStr = ` (Thứ ${rank})`;
        }
        const bellInfo = b.bellTime ? `🔔 Chuông: ${b.bellTime}s${rankStr}` : `Chưa bấm chuông`;
        msg += `[TS ${b.idx}] ${b.name} (${bellInfo}) - Đáp án: "${b.ans}"\n`;
    });
    msg += `\nNhập số thứ tự Thí sinh trả lời đúng (1-4):`;

    const tsInput = prompt(msg, defaultTs);
    if (!tsInput) return;
    const tsIdx = parseInt(tsInput.trim());
    if (isNaN(tsIdx) || tsIdx < 1 || tsIdx > 4) {
        alert("Số thứ tự thí sinh không hợp lệ (phải từ 1 đến 4)!");
        return;
    }

    let timeMsg = `Chọn thời điểm trả lời cho [TS ${tsIdx}] (Thang điểm: 50, 40, 30, 20, 10):\n`;
    timeMsg += `1: +50 điểm (Thời điểm 1: Trước hoặc khi đang mở Hàng ngang 1)\n`;
    timeMsg += `2: +40 điểm (Thời điểm 2: Sau Hàng ngang 1 / Trước HN 2)\n`;
    timeMsg += `3: +30 điểm (Thời điểm 3: Sau Hàng ngang 2 / Trước HN 3)\n`;
    timeMsg += `4: +20 điểm (Thời điểm 4: Sau Hàng ngang 3 / Trước HN 4)\n`;
    timeMsg += `5: +10 điểm (Thời điểm 5: Sau Hàng ngang 4 / Ô trung tâm)\n\n`;
    timeMsg += `Nhập số 1-5 hoặc nhập trực tiếp số điểm (50, 40, 30, 20, 10):`;

    const timeChoice = prompt(timeMsg, "1");
    if (!timeChoice) return;

    let pts = 0;
    const cleanChoice = timeChoice.trim();
    if (cleanChoice === '1' || cleanChoice === '50') pts = 50;
    else if (cleanChoice === '2' || cleanChoice === '40') pts = 40;
    else if (cleanChoice === '3' || cleanChoice === '30') pts = 30;
    else if (cleanChoice === '4' || cleanChoice === '20') pts = 20;
    else if (cleanChoice === '5' || cleanChoice === '10') pts = 10;
    else {
        alert("Lựa chọn thời điểm không hợp lệ!");
        return;
    }

    if (typeof adjustScore === 'function') {
        adjustScore(tsIdx, pts);
    }
    if (typeof showToast === 'function') {
        showToast(`Đã cộng +${pts} điểm Đáp án vòng thi cho Thí sinh ${tsIdx}!`);
    }
}
window.onClickVSScoreKeyword = onClickVSScoreKeyword;



// Submissions
function submitScene2Answer() {
    const s2Input = document.getElementById('s2_answer_input');
    if ((s2Input && s2Input.disabled) || !s2TimerStartTime || s2TimeLeft <= 0) {
        showToast("Ngoài thời gian quy định - Ô trả lời đang khóa!");
        return;
    }
    const ans = s2Input ? s2Input.value.trim() : "";
    if (!ans) return;

    let timeStr = "00.00";
    if (s2TimerStartTime) {
        let elapsed = (Date.now() - s2TimerStartTime) / 1000;
        let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
        timeStr = formattedSec;
    }

    // Immediate Client-Side Optimistic Feedback
    const badge = document.getElementById('s2_status_badge');
    if (badge) {
        badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
        badge.style.background = '#16a34a';
    }
    const txt = document.getElementById('s2_submitted_text');
    if (txt) txt.innerText = `"${ans}"`;
    const tm = document.getElementById('s2_submitted_time');
    if (tm) tm.innerText = `Thời gian: ${timeStr} lúc ${new Date().toLocaleTimeString()}`;

    const submitPayload = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'PLAYER_SUBMIT_ANSWER',
        contestantId: contestantId,
        roomCode: currentRoomCode,
        auth: currentRoomAuth,
        round: currentS2Round,
        answer: ans,
        time: timeStr,
        timestamp: Date.now()
    };

    // Instant local broadcast to controller and projector
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(submitPayload);
    }
    if (playerChannel) {
        try {
            playerChannel.postMessage(submitPayload);
        } catch(e) {
            console.warn("Error posting submit to playerChannel:", e);
        }
    }
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(submitPayload, '*');
        }
    } catch(e) {}
    try {
        localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload));
    } catch(e) {}

    showToast(`Đã gửi đáp án TS${contestantId}: "${ans}" (${timeStr})`);

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
        }).catch(() => {});
    }
}

function submitScene3Answer(isVongThi = false) {
    const s3Input = document.getElementById('s3_answer_input');
    
    if (!isVongThi) {
        // Horizontal row answer: check if horizontal row timer is running
        if (!s3TimerStartTime || s3TimeLeft <= 0 || (s3Input && s3Input.disabled)) {
            showToast("Hàng ngang đang khóa! Ngoài thời gian trả lời.");
            return;
        }
        const ans = s3Input ? s3Input.value.trim() : "";
        if (!ans) return;

        let timeStr = "00.00";
        if (s3TimerStartTime) {
            let elapsed = (Date.now() - s3TimerStartTime) / 1000;
            let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
            timeStr = formattedSec;
        }

        // Immediate Client-Side Optimistic Feedback
        const badge = document.getElementById('s3_status_badge');
        if (badge) {
            badge.innerText = '🟢 ĐÃ GỬI HÀNG NGANG';
            badge.style.background = '#16a34a';
        }
        const txt = document.getElementById('s3_submitted_text');
        if (txt) txt.innerText = `"${ans}"`;
        const tm = document.getElementById('s3_submitted_time');
        if (tm) tm.innerText = `Thời gian: ${timeStr} lúc ${new Date().toLocaleTimeString()}`;

        const submitPayload = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'PLAYER_SUBMIT_ANSWER',
            contestantId: contestantId,
            roomCode: currentRoomCode,
            auth: currentRoomAuth,
            round: 'VS',
            isVongThi: false,
            answer: ans,
            row: s3SelectedRow,
            time: timeStr,
            timestamp: Date.now()
        };

        // Instant local broadcast
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(submitPayload);
        }
        if (playerChannel) {
            try { playerChannel.postMessage(submitPayload); } catch(e) {}
        }
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(submitPayload, '*');
            }
        } catch(e) {}
        try { localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload)); } catch(e) {}

        showToast(`Đã gửi đáp án Hàng ngang TS${contestantId}: "${ans}" (${timeStr})`);

        if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
            fetch(getApiUrl('/api/action'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitPayload)
            }).catch(() => {});
        }
    } else {
        // Vòng thi (Chướng ngại vật) answer: allowed once until reset
        if (s3HasSubmittedVongThi) {
            showToast("Bạn đã bấm chuông / gửi đáp án Vòng thi rồi! Không thể bấm thêm.");
            return;
        }

        s3HasSubmittedVongThi = true;
        const submitBtn = document.querySelector('.s3-submit-btn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.innerText = '🔒 ĐÃ BẤM CHUÔNG / GỬI ĐÁP ÁN';
        }

        const ans = s3Input ? s3Input.value.trim() : "";
        const finalAnswer = ans;

        let timeStr = "00.00";
        if (s3RoundStartTime) {
            let elapsed = (Date.now() - s3RoundStartTime) / 1000;
            let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
            timeStr = formattedSec;
        }

        // Immediate Client-Side Optimistic Feedback
        const badge = document.getElementById('s3_status_badge');
        if (badge) {
            badge.innerText = ans ? '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG' : '🔔 ĐÃ BẤM CHUÔNG';
            badge.style.background = '#16a34a';
        }
        const txt = document.getElementById('s3_submitted_text');
        if (txt) txt.innerText = ans ? `"${ans}"` : '(Đã bấm chuông)';
        const tm = document.getElementById('s3_submitted_time');
        if (tm) tm.innerText = `Thời gian: ${timeStr} lúc ${new Date().toLocaleTimeString()}`;

        const submitPayload = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'PLAYER_SUBMIT_ANSWER',
            contestantId: contestantId,
            roomCode: currentRoomCode,
            auth: currentRoomAuth,
            round: 'VS',
            isVongThi: true,
            answer: finalAnswer,
            row: s3SelectedRow,
            time: timeStr,
            timestamp: Date.now()
        };

        const ringPayload = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'PLAYER_RING_BELL',
            contestantId: contestantId,
            roomCode: currentRoomCode,
            round: 'VUOT_SONG',
            time: timeStr,
            timestamp: Date.now()
        };

        // Instant local broadcast
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(submitPayload);
            sendSupabaseAction(ringPayload);
        }
        if (playerChannel) {
            try { playerChannel.postMessage(submitPayload); } catch(e) {}
            try { playerChannel.postMessage(ringPayload); } catch(e) {}
        }
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(submitPayload, '*');
                window.opener.postMessage(ringPayload, '*');
            }
        } catch(e) {}
        try { localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload)); } catch(e) {}

        showToast(`Đã gửi đáp án Vòng thi TS${contestantId}: "${finalAnswer}" (${timeStr})`);

        if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
            fetch(getApiUrl('/api/action'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitPayload)
            }).catch(() => {});
        }
    }
}

function startS1Timer(sec) {
    clearInterval(s1TimerInterval);
    s1TimeLeft = sec || 60;
    updateMasterRemainingTime(`${s1TimeLeft}s`);
    const clockEl = document.getElementById('s1_clock_box');
    if (clockEl) clockEl.innerText = s1TimeLeft;

    s1TimerInterval = setInterval(() => {
        s1TimeLeft--;
        if (s1TimeLeft <= 0) {
            clearInterval(s1TimerInterval);
            updateMasterRemainingTime("HẾT GIỜ");
            if (clockEl) clockEl.innerText = "0";
        } else {
            updateMasterRemainingTime(`${s1TimeLeft}s`);
            if (clockEl) clockEl.innerText = s1TimeLeft;
        }
    }, 1000);
}

function startS2Timer(sec, customStartTime = null) {
    clearInterval(s2TimerInterval);
    s2TimerStartTime = customStartTime || Date.now();
    s2TimeLeft = sec;
    document.getElementById('s2_time_box').innerText = `${s2TimeLeft}s`;
    updateMasterRemainingTime(`${s2TimeLeft}s`);

    const s2Input = document.getElementById('s2_answer_input');
    if (s2Input) {
        s2Input.disabled = false;
        s2Input.placeholder = "Câu trả lời...";
        s2Input.focus();
    }

    s2TimerInterval = setInterval(() => {
        s2TimeLeft--;
        if (s2TimeLeft <= 0) {
            clearInterval(s2TimerInterval);
            document.getElementById('s2_time_box').innerText = "HẾT GIỜ";
            updateMasterRemainingTime("HẾT GIỜ");
            if (s2Input) {
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
            }
        } else {
            document.getElementById('s2_time_box').innerText = `${s2TimeLeft}s`;
            updateMasterRemainingTime(`${s2TimeLeft}s`);
        }
    }, 1000);
}

function submitScene4Answer() {
    const s4Input = document.getElementById('s4_answer_input');
    if ((s4Input && s4Input.disabled) || !s4TimerStartTime || s4TimeLeft <= 0) {
        showToast("Ngoài thời gian quy định - Ô trả lời đang khóa!");
        return;
    }
    const ans = s4Input ? s4Input.value.trim() : "";
    if (!ans) return;

    let timeStr = "00.00";
    if (s4TimerStartTime) {
        let elapsed = (Date.now() - s4TimerStartTime) / 1000;
        let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
        timeStr = formattedSec;
    }

    // Immediate Client-Side Optimistic Feedback
    const badge = document.getElementById('s4_status_badge');
    if (badge) {
        badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
        badge.style.background = '#16a34a';
    }
    const txt = document.getElementById('s4_submitted_text');
    if (txt) txt.innerText = `"${ans}"`;
    const tm = document.getElementById('s4_submitted_time');
    if (tm) tm.innerText = `Thời gian: ${timeStr} lúc ${new Date().toLocaleTimeString()}`;

    const submitPayload = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'PLAYER_SUBMIT_ANSWER',
        contestantId: contestantId,
        roomCode: currentRoomCode,
        auth: currentRoomAuth,
        round: 'VQ',
        answer: ans,
        time: timeStr,
        timestamp: Date.now()
    };

    // Instant local broadcast to controller and projector
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(submitPayload);
    }
    if (playerChannel) {
        try {
            playerChannel.postMessage(submitPayload);
        } catch(e) {
            console.warn("Error posting submit to playerChannel:", e);
        }
    }
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(submitPayload, '*');
        }
    } catch(e) {}
    try {
        localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload));
    } catch(e) {}

    showToast(`Đã gửi đáp án TS${contestantId}: "${ans}" (${timeStr})`);

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
        }).catch(() => {});
    }
}

function clearPlayerSubmissionStatus(round) {
    if (!round || round === 'RK') {
        const input = document.getElementById('s2_answer_input');
        if (input) input.value = "";
        const badge = document.getElementById('s2_status_badge');
        if (badge) { badge.innerText = "CHƯA GỬI"; badge.style.background = "#64748b"; }
        const txt = document.getElementById('s2_submitted_text');
        if (txt) txt.innerText = 'Chưa gửi câu trả lời';
        const tm = document.getElementById('s2_submitted_time');
        if (tm) tm.innerText = 'Thời gian: --.--';
    }
    if (!round || round === 'VS') {
        resetS3SubmitBtn();
        const input = document.getElementById('s3_answer_input');
        if (input) {
            input.value = "";
            input.disabled = true;
            input.placeholder = "Nhập đáp án hàng ngang";
        }
        const badge = document.getElementById('s3_status_badge');
        if (badge) { badge.innerText = "CHƯA GỬI"; badge.style.background = "#64748b"; }
        const txt = document.getElementById('s3_submitted_text');
        if (txt) txt.innerText = 'Chưa gửi câu trả lời';
        const tm = document.getElementById('s3_submitted_time');
        if (tm) tm.innerText = 'Thời gian: --.--';
    }
    if (!round || round === 'VQ') {
        const input = document.getElementById('s4_answer_input');
        if (input) input.value = "";
        const badge = document.getElementById('s4_status_badge');
        if (badge) { badge.innerText = "CHƯA GỬI"; badge.style.background = "#64748b"; }
        const txt = document.getElementById('s4_submitted_text');
        if (txt) txt.innerText = 'Chưa gửi câu trả lời';
        const tm = document.getElementById('s4_submitted_time');
        if (tm) tm.innerText = 'Thời gian: --.--';
    }
}

function startS4Timer(sec, forceRestart = false, customStartTime = null) {
    if (s4TimeLeft > 0 && !forceRestart && s4TimerInterval) {
        return;
    }
    clearInterval(s4TimerInterval);
    s4TimerStartTime = customStartTime || Date.now();
    s4TimeLeft = sec;
    if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = `${s4TimeLeft}s`;
    updateMasterRemainingTime(`${s4TimeLeft}s`);

    const s4Input = document.getElementById('s4_answer_input');
    if (s4Input) {
        s4Input.disabled = false;
        s4Input.placeholder = "Câu trả lời...";
        s4Input.focus();
    }

    s4TimerInterval = setInterval(() => {
        s4TimeLeft--;
        if (s4TimeLeft <= 0) {
            clearInterval(s4TimerInterval);
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = "HẾT GIỜ";
            updateMasterRemainingTime("HẾT GIỜ");
            if (s4Input) {
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
            }
        } else {
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = `${s4TimeLeft}s`;
            updateMasterRemainingTime(`${s4TimeLeft}s`);
        }
    }, 1000);
}

function startS3Timer(sec, customStartTime = null) {
    clearInterval(s3TimerInterval);
    s3TimerStartTime = customStartTime || Date.now();
    s3TimeLeft = sec;
    updateMasterRemainingTime(`${s3TimeLeft}s`);

    const s3Input = document.getElementById('s3_answer_input');
    if (s3Input) {
        s3Input.disabled = false;
        s3Input.placeholder = `Nhập đáp án hàng ngang... (Còn lại ${s3TimeLeft}s)`;
        s3Input.focus();
    }

    s3TimerInterval = setInterval(() => {
        s3TimeLeft--;
        if (s3TimeLeft <= 0) {
            clearInterval(s3TimerInterval);
            s3TimerInterval = null;
            updateMasterRemainingTime("HẾT GIỜ");
            if (s3Input) {
                s3Input.disabled = true;
                s3Input.placeholder = "Hết giờ - Ô nhập hàng ngang đã khóa";
            }
        } else {
            updateMasterRemainingTime(`${s3TimeLeft}s`);
            if (s3Input) {
                s3Input.placeholder = `Nhập đáp án hàng ngang... (Còn lại ${s3TimeLeft}s)`;
            }
        }
    }, 1000);
}

function setS1QuestionIndex(idx) {
    s1QIndex = idx;
    for (let i = 1; i <= 10; i++) {
        const btn = document.getElementById(`s1_btn_${i}`);
        if (btn) {
            let classes = ['s1-page-btn'];
            if (i === idx + 1) {
                classes.push('active');
            }
            if (s1QuestionStates[i]) {
                classes.push(s1QuestionStates[i]);
            }
            btn.className = classes.join(' ');
        }
    }
}

function highlightS3Row(rowNum) {
    s3SelectedRow = rowNum;
    for (let i = 1; i <= 4; i++) {
        const numBox = document.getElementById(`s3_num_${i}`);
        if (numBox) {
            if (i === rowNum) numBox.className = 's3-number-box active-row';
            else numBox.className = 's3-number-box';
        }
    }
}

function handlePlayerMessage(data) {
    if (!data) return;

    // Room code auto-sync
    if (data.roomCode && data.roomCode !== currentRoomCode) {
        console.log(`[Sync] Player room code auto-syncing to: ${data.roomCode}`);
        currentRoomCode = data.roomCode;
        localStorage.setItem('ddvq_room_code', data.roomCode);
        const roomCodeInput = document.getElementById('login_room_code_input');
        if (roomCodeInput) roomCodeInput.value = data.roomCode;
    }

    // Vượt Sóng dynamic grid sync
    if (data.type === 'VUOT_SONG_SYNC_GRID' && data.vuotSong) {
        renderPlayerVSGrid(data.vuotSong);
    }
    if (data.type === 'VUOT_SONG_OPEN_ROW_ANSWER' && data.row) {
        playerOpenedRows[data.row] = true;
        renderPlayerVSGrid(data.vuotSong || playerVsData, playerOpenedRows);
    }
    if (data.type === 'VUOT_SONG_OPEN_ALL_ANSWERS') {
        playerOpenedRows = { 1: true, 2: true, 3: true, 4: true, 'center': true, 'keyword': true };
        renderPlayerVSGrid(data.vuotSong || playerVsData, playerOpenedRows);
    }

    // Global contestant score update
    if (data.contestants && Array.isArray(data.contestants)) {
        const myData = data.contestants[contestantId - 1];
        if (myData && myData.score !== undefined) {
            updateContestantScoreDisplay(myData.score);
        }
    }

    // Full State Sync or Update State
    if (data.type === 'FULL_STATE_SYNC' || data.type === 'INITIAL_STATE_SYNC' || data.type === 'UPDATE_STATE' || data.type === 'UPDATE_SCORES' || (!data.type && (data.activeRound || data.roomCode))) {
        applyPlayerGameState(data);
        return;
    }

    if (data.type === 'CLEAR_PLAYER_ANSWERS') {
        clearPlayerSubmissionStatus(data.round);
        return;
    }

    if (data.type === 'RESET_VS_BELL' || data.type === 'VUOT_SONG_RESET_BELL') {
        const targetC = data.contestantId;
        if (targetC === 'ALL' || !targetC || parseInt(targetC) === parseInt(contestantId)) {
            s3HasSubmittedVongThi = false;
            resetS3SubmitBtn();
            clearPlayerSubmissionStatus('VS');
            if (typeof showToast === 'function') {
                showToast("🔔 Nút trả lời Vòng 3 / Bấm chuông đã được mở lại!");
            }
        }
        return;
    }

    if (data.type === 'RESET_S1_DE') {
        const targetC = data.contestantId;
        if (targetC === 'ALL' || !targetC) {
            s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
            s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
        } else {
            const cId = parseInt(targetC);
            if (cId) {
                s1HasSelectedDeForTurn[cId] = false;
                s1ChosenDeMap[cId] = null;
            }
        }
        updateS1RandomDeButtonUI();
        if (typeof showToast === 'function') {
            showToast("Đã mở lại nút chọn bộ đề Xuất Phát!");
        }
        return;
    }

    // --- CHUYỂN VÒNG / TAB THEO CONTROLLER ---
    if (data.type === 'START_ROUND_CLEAN' || data.type === 'SWITCH_VIEW' || data.type === 'SWITCH_ROUND' || data.type === 'CHANGE_ROUND') {
        const roundIdx = data.roundIndex || data.sceneNum || (data.viewNum ? (data.viewNum === 1 ? 1 : data.viewNum === 2 ? 2 : data.viewNum <= 5 ? 3 : 4) : 1);
        let targetRound = data.round || data.activeRound;
        if (!targetRound) {
            if (roundIdx === 1) targetRound = 'XUAT_PHAT';
            else if (roundIdx === 2) targetRound = 'RA_KHOI';
            else if (roundIdx === 3) targetRound = 'VUOT_SONG';
            else if (roundIdx === 4) targetRound = 'VINH_QUANG';
        }
        if (targetRound) {
            window.currentActiveRound = targetRound;
            try {
                localStorage.setItem('ddvq_active_round', targetRound);
                localStorage.removeItem('ddvq_current_timer');
            } catch(e) {}
            autoSwitchScene(roundIdx);
        }

        if (data.type === 'START_ROUND_CLEAN') {
            clearInterval(s1TimerInterval); s1TimerInterval = null;
            clearInterval(s2TimerInterval); s2TimerInterval = null;
            clearInterval(s3TimerInterval); s3TimerInterval = null;
            clearInterval(s4TimerInterval); s4TimerInterval = null;
            updateMasterRemainingTime('--');

            if (roundIdx === 1) {
                currentS1TurnIndex = 0;
                s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
                s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
                updateS1RandomDeButtonUI();
                window.s1IsQuestionActive = false;
                clearPlayerSubmissionStatus('S1');
                try {
                    localStorage.setItem('ddvq_xp_question_shown', 'false');
                    localStorage.removeItem('ddvq_xp_question_text');
                } catch(e) {}
                if (document.getElementById('s1_contestant_name')) document.getElementById('s1_contestant_name').innerText = "Thí sinh";
                if (document.getElementById('s1_score_box')) document.getElementById('s1_score_box').innerText = "Điểm: 0";
                if (document.getElementById('s1_question_text')) document.getElementById('s1_question_text').innerText = "Đang chờ bắt đầu lượt thi Xuất Phát...";
                const s1Input = document.getElementById('s1_answer_input');
                if (s1Input) { s1Input.value = ""; s1Input.disabled = true; s1Input.placeholder = "Đang khóa (Chờ câu hỏi...)"; }
            } else if (roundIdx === 2) {
                clearPlayerSubmissionStatus('RK');
                if (document.getElementById('s2_question_text')) document.getElementById('s2_question_text').innerText = "Đang chờ câu hỏi Ra Khơi...";
                const s2Input = document.getElementById('s2_answer_input');
                if (s2Input) { s2Input.value = ""; s2Input.disabled = true; s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)"; }
            } else if (roundIdx === 3) {
                try {
                    localStorage.setItem('ddvq_vs_question_shown', 'false');
                    localStorage.removeItem('ddvq_vs_question_text');
                } catch(e) {}
                clearPlayerSubmissionStatus('VS');
                if (document.getElementById('s3_question_text')) document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
                const s3Input = document.getElementById('s3_answer_input');
                if (s3Input) { s3Input.value = ""; s3Input.disabled = true; s3Input.placeholder = "Nhập đáp án hàng ngang"; }
            } else if (roundIdx === 4) {
                try {
                    localStorage.setItem('ddvq_vq_question_shown', 'false');
                    localStorage.removeItem('ddvq_vq_question_text');
                } catch(e) {}
                clearPlayerSubmissionStatus('VQ');
                if (document.getElementById('s4_question_text')) document.getElementById('s4_question_text').innerText = "Đang chờ câu hỏi Vinh Quang...";
                const s4Input = document.getElementById('s4_answer_input');
                if (s4Input) { s4Input.value = ""; s4Input.disabled = true; s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)"; }
            }
            showToast(`🚀 Bắt đầu Vòng ${roundIdx}! Màn hình đã được chuẩn bị sẵn sàng.`);
            return;
        }
        return;
    }

    // Tự động chuyển giao diện theo activeRound nhận được
    const msgRound = data.activeRound || data.round;
    if (msgRound && msgRound !== 'HE_THONG') {
        window.currentActiveRound = msgRound;
        try { localStorage.setItem('ddvq_active_round', msgRound); } catch(e) {}
        if (msgRound === 'XUAT_PHAT' && activeSceneNum !== 1) autoSwitchScene(1);
        else if (msgRound === 'RA_KHOI' && activeSceneNum !== 2) autoSwitchScene(2);
        else if (msgRound === 'VUOT_SONG' && activeSceneNum !== 3) autoSwitchScene(3);
        else if ((msgRound === 'VINH_QUANG' || msgRound === 'CAU_HOI_PHU') && activeSceneNum !== 4) autoSwitchScene(4);
    }

    // --- VÒNG 1: XUẤT PHÁT ---
    if (data.type && data.type.startsWith('XUAT_PHAT_')) {
        autoSwitchScene(1);

        if (data.type === 'XUAT_PHAT_SELECT_CONTESTANT') {
            currentS1TurnIndex = parseInt(data.turnIndex !== undefined ? data.turnIndex : (data.contestantId !== undefined ? data.contestantId : currentS1TurnIndex)) || 0;
            const turnName = data.name || (playerContestants[currentS1TurnIndex - 1]?.name) || `Thí sinh ${currentS1TurnIndex}`;
            if (document.getElementById('s1_contestant_name')) {
                document.getElementById('s1_contestant_name').innerText = turnName;
            }
            if (document.getElementById('s1_score_box')) {
                document.getElementById('s1_score_box').innerText = `Điểm: ${data.score || 0}`;
            }
            s1Corrects = 0;
            s1Totals = 0;
            updateS1CorrectCountFromButtons();
            updateS1RandomDeButtonUI();
        } else if (data.turnIndex !== undefined || data.currentXuatPhatTurn !== undefined) {
            currentS1TurnIndex = parseInt(data.turnIndex !== undefined ? data.turnIndex : data.currentXuatPhatTurn) || 0;
        }

        if (data.type === 'XUAT_PHAT_RANDOM_DE') {
            const tIdx = parseInt(data.turnIndex || data.contestantId || currentS1TurnIndex);
            if (tIdx) {
                s1HasSelectedDeForTurn[tIdx] = true;
                if (data.deNumber) s1ChosenDeMap[tIdx] = data.deNumber;
            }
        } else if (data.type === 'XUAT_PHAT_RESET') {
            currentS1TurnIndex = parseInt(data.turnIndex) || 0;
            s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
            s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
            s1QuestionStates = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null };
            s1Corrects = 0;
            s1Totals = 0;
            updateS1CorrectCountFromButtons();
        }

        updateS1RandomDeButtonUI();

        if (data.type === 'XUAT_PHAT_START_TIMER' || data.type === 'XUAT_PHAT_BAT_DAU_CAU_HOI' || data.type === 'XUAT_PHAT_NEXT_QUESTION' || data.type === 'XUAT_PHAT_RIGHT' || data.type === 'XUAT_PHAT_WRONG' || (data.xpQuestionShown === true)) {
            window.s1IsQuestionActive = true;
            try {
                localStorage.setItem('ddvq_xp_question_shown', 'true');
                if (data.questionText) localStorage.setItem('ddvq_xp_question_text', data.questionText);
            } catch(e) {}
            if (data.questionText) {
                const el = document.getElementById('s1_question_text');
                if (el) el.innerText = data.questionText;
                const el2 = document.getElementById('s1_q_text');
                if (el2) el2.innerText = data.questionText;
            }
        } else if (
            data.type === 'XUAT_PHAT_RESET' ||
            data.type === 'XUAT_PHAT_FINISH'
        ) {
            window.s1IsQuestionActive = false;
            try {
                localStorage.setItem('ddvq_xp_question_shown', 'false');
                localStorage.removeItem('ddvq_xp_question_text');
            } catch(e) {}
            const el = document.getElementById('s1_question_text');
            if (el) el.innerText = (data.type === 'XUAT_PHAT_FINISH') ? "Đã hoàn thành lượt thi Xuất Phát" : "Đang chờ bắt đầu lượt thi Xuất Phát...";
            const el2 = document.getElementById('s1_q_text');
            if (el2) el2.innerText = (data.type === 'XUAT_PHAT_FINISH') ? "Đã hoàn thành lượt thi Xuất Phát" : "Đang chờ bắt đầu lượt thi Xuất Phát...";
        } else if (data.xpQuestionShown === false) {
            window.s1IsQuestionActive = false;
            try {
                localStorage.setItem('ddvq_xp_question_shown', 'false');
                localStorage.removeItem('ddvq_xp_question_text');
            } catch(e) {}
            const el = document.getElementById('s1_question_text');
            if (el) el.innerText = "Đang chờ bắt đầu lượt thi Xuất Phát...";
            const el2 = document.getElementById('s1_q_text');
            if (el2) el2.innerText = "Đang chờ bắt đầu lượt thi Xuất Phát...";
        } else if (data.questionText && window.s1IsQuestionActive) {
            const el = document.getElementById('s1_question_text');
            if (el) el.innerText = data.questionText;
            const el2 = document.getElementById('s1_q_text');
            if (el2) el2.innerText = data.questionText;
        }

        if (data.score !== undefined) {
            updateContestantScoreDisplay(data.score);
        }

        if (data.questionIndex !== undefined) {
            setS1QuestionIndex(data.questionIndex - 1);
            updateS1CorrectCountFromButtons();
        }

        if (data.type === 'XUAT_PHAT_START_TIMER' || data.type === 'XUAT_PHAT_BAT_DAU_CAU_HOI') {
            const startTime = data.startTime || Date.now();
            const duration = data.duration || 60;
            const remaining = data.startTime ? Math.max(0, Math.ceil(((startTime + duration * 1000) - Date.now()) / 1000)) : duration;
            startS1Timer(remaining);
            try {
                localStorage.setItem('ddvq_current_timer', JSON.stringify({
                    round: 'XUAT_PHAT',
                    duration: duration,
                    startTime: startTime,
                    targetTime: startTime + duration * 1000
                }));
            } catch(e) {}
        } else if (data.type === 'XUAT_PHAT_RIGHT') {
            s1QuestionStates[s1QIndex + 1] = 'correct';
            setS1QuestionIndex(s1QIndex);
            updateS1CorrectCountFromButtons();
        } else if (data.type === 'XUAT_PHAT_WRONG') {
            s1QuestionStates[s1QIndex + 1] = 'wrong';
            setS1QuestionIndex(s1QIndex);
            updateS1CorrectCountFromButtons();
        } else if (data.type === 'XUAT_PHAT_FINISH') {
            clearInterval(s1TimerInterval);
            s1TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('0s');
            const clockEl = document.getElementById('s1_clock_box');
            if (clockEl) clockEl.innerText = "0";
        } else if (data.type === 'XUAT_PHAT_RESET') {
            clearInterval(s1TimerInterval);
            s1TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('--');
            const clockEl = document.getElementById('s1_clock_box');
            if (clockEl) clockEl.innerText = "60";
            document.getElementById('s1_question_text').innerText = "Đang chờ câu hỏi Xuất Phát...";
            s1QuestionStates = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null };
            for (let i = 1; i <= 10; i++) {
                const btn = document.getElementById(`s1_btn_${i}`);
                if (btn) btn.className = 's1-page-btn';
            }
        }
    }

    // --- VÒNG 2: RA KHỜI ---
    else if (data.type && data.type.startsWith('RA_KHOI_')) {
        autoSwitchScene(2);
        currentS2Round = 'RK';

        if (data.questionText) {
            document.getElementById('s2_question_text').innerText = data.questionText;
        }

        if (data.type === 'RA_KHOI_SHOW_QUESTION' || data.type === 'RA_KHOI_PLAY_CLIP' || data.type === 'RA_KHOI_SELECT_QUESTION') {
            clearPlayerSubmissionStatus('RK');
            s2TimerStartTime = 0;
            clearInterval(s2TimerInterval);
            s2TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            const s2Input = document.getElementById('s2_answer_input');
            if (s2Input) {
                s2Input.value = "";
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
            document.getElementById('s2_time_box').innerText = "Thời gian";
            updateMasterRemainingTime('--');
        } else if (data.type === 'RA_KHOI_START_TIMER') {
            const startTime = data.startTime || Date.now();
            const duration = data.duration || 30;
            const remaining = data.startTime ? Math.max(0, Math.ceil(((startTime + duration * 1000) - Date.now()) / 1000)) : duration;
            startS2Timer(remaining, startTime);
            try {
                localStorage.setItem('ddvq_current_timer', JSON.stringify({
                    round: 'RA_KHOI',
                    duration: duration,
                    startTime: startTime,
                    targetTime: startTime + duration * 1000
                }));
            } catch(e) {}
        } else if (data.type === 'RA_KHOI_RESET') {
            clearInterval(s2TimerInterval);
            s2TimerInterval = null;
            s2TimerStartTime = 0;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            document.getElementById('s2_time_box').innerText = "Thời gian";
            updateMasterRemainingTime('--');
            document.getElementById('s2_question_text').innerText = "Đang chờ câu hỏi Ra Khơi...";
            const s2Input = document.getElementById('s2_answer_input');
            if (s2Input) {
                s2Input.value = "";
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
        }
    }

    // --- VÒNG 3: VƯỢT SÓNG ---
    else if (data.type && data.type.startsWith('VUOT_SONG_')) {
        autoSwitchScene(3);
        if (!s3RoundStartTime) {
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
        }

        if (data.row !== undefined) {
            highlightS3Row(data.row);
        }

        if (data.vuotSong) {
            renderPlayerVSGrid(data.vuotSong);
        }

        if (data.type === 'VUOT_SONG_SHOW_QUESTION') {
            const q = data.questionText || "Nội dung câu hỏi Vượt Sóng...";
            try {
                localStorage.setItem('ddvq_vs_question_shown', 'true');
                localStorage.setItem('ddvq_vs_question_text', q);
            } catch(e) {}
            if (document.getElementById('s3_question_text')) {
                document.getElementById('s3_question_text').innerText = q;
            }
            clearPlayerSubmissionStatus('VS');
            s3TimerStartTime = 0;
            clearInterval(s3TimerInterval);
            s3TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('--');
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Nhập đáp án hàng ngang";
            }
        } else if (data.type === 'VUOT_SONG_SELECT_ROW') {
            try {
                localStorage.setItem('ddvq_vs_question_shown', 'false');
                localStorage.removeItem('ddvq_vs_question_text');
            } catch(e) {}
            if (document.getElementById('s3_question_text')) {
                document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
            }
            clearPlayerSubmissionStatus('VS');
            s3TimerStartTime = 0;
            clearInterval(s3TimerInterval);
            s3TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('--');
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Nhập đáp án hàng ngang";
            }
        } else if (data.type === 'VUOT_SONG_START_TIMER') {
            const startTime = data.startTime || Date.now();
            const duration = data.duration || 20;
            const remaining = data.startTime ? Math.max(0, Math.ceil(((startTime + duration * 1000) - Date.now()) / 1000)) : duration;
            startS3Timer(remaining, startTime);
            try {
                localStorage.setItem('ddvq_current_timer', JSON.stringify({
                    round: 'VUOT_SONG',
                    duration: duration,
                    startTime: startTime,
                    targetTime: startTime + duration * 1000
                }));
            } catch(e) {}
        } else if (data.type === 'VUOT_SONG_RETURN_GRID') {
            autoSwitchScene(3);
            clearInterval(s3TimerInterval);
            s3TimerInterval = null;
            s3TimerStartTime = 0;
            try {
                localStorage.removeItem('ddvq_current_timer');
                localStorage.setItem('ddvq_vs_question_shown', 'false');
            } catch(e) {}
            updateMasterRemainingTime('--');
            if (document.getElementById('s3_question_text')) {
                document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
            }
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Nhập đáp án hàng ngang";
            }
            if (data.row) {
                highlightS3Row(data.row);
            }
            renderPlayerVSGrid(data.vuotSong || playerVsData, playerOpenedRows);
        } else if (data.type === 'VUOT_SONG_RESET') {
            highlightS3Row(0);
            playerOpenedRows = {};
            renderPlayerVSGrid(null, {});
            clearInterval(s3TimerInterval);
            s3TimerInterval = null;
            s3TimerStartTime = 0;
            try {
                localStorage.removeItem('ddvq_current_timer');
                localStorage.setItem('ddvq_vs_question_shown', 'false');
                localStorage.removeItem('ddvq_vs_question_text');
            } catch(e) {}
            updateMasterRemainingTime('--');
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
            if (document.getElementById('s3_question_text')) {
                document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
            }
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Nhập đáp án hàng ngang";
            }
        } else if (data.type === 'RESET_VS_BELL') {
            if (data.contestantId === 'ALL' || data.contestantId === contestantId || data.contestantId == contestantId) {
                s3HasSubmittedVongThi = false;
                resetS3SubmitBtn();
                const badge = document.getElementById('s3_status_badge');
                if (badge) {
                    badge.innerText = 'Chưa gửi';
                    badge.style.background = '#64748b';
                }
                const txt = document.getElementById('s3_submitted_text');
                if (txt) txt.innerText = 'Chưa có';
                const tm = document.getElementById('s3_submitted_time');
                if (tm) tm.innerText = 'Thời gian: --';
                showToast("🔔 Nút chuông / Trả lời Vòng thi đã được cấp lại!");
            }
        }
    }

    // --- VÒNG 4: VINH QUANG ---
    else if (data.type && data.type.startsWith('VINH_QUANG_')) {
        autoSwitchScene(4);
        currentS2Round = 'VQ';

        if (data.type === 'VINH_QUANG_SHOW_QUESTION') {
            const qContent = data.questionText || "Nội dung câu hỏi Vinh Quang...";
            try {
                localStorage.setItem('ddvq_vq_question_shown', 'true');
                localStorage.setItem('ddvq_vq_question_text', qContent);
            } catch(e) {}

            if (document.getElementById('s4_question_text')) {
                document.getElementById('s4_question_text').innerText = qContent;
            }

            clearPlayerSubmissionStatus('VQ');
            s4TimerStartTime = 0;
            clearInterval(s4TimerInterval);
            s4TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('--');
            const s4Input = document.getElementById('s4_answer_input');
            if (s4Input) {
                s4Input.value = "";
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = "Thời gian";
        } else if (data.type === 'VINH_QUANG_START_TIMER' || data.type === 'VINH_QUANG_START_TIMER_5S') {
            const isShown = (data.vqQuestionShown === true) || (localStorage.getItem('ddvq_vq_question_shown') === 'true');
            if (data.questionText && document.getElementById('s4_question_text')) {
                if (isShown) {
                    document.getElementById('s4_question_text').innerText = data.questionText;
                }
            }
            const duration = data.type === 'VINH_QUANG_START_TIMER_5S' ? 5 : (data.duration || 25);
            const startTime = data.startTime || Date.now();
            const remaining = data.startTime ? Math.max(0, Math.ceil(((startTime + duration * 1000) - Date.now()) / 1000)) : duration;
            startS4Timer(remaining, true, startTime);
            try {
                localStorage.setItem('ddvq_current_timer', JSON.stringify({
                    round: 'VINH_QUANG',
                    duration: duration,
                    startTime: startTime,
                    targetTime: startTime + duration * 1000
                }));
            } catch(e) {}
        } else {
            // In all other Vinh Quang events (SELECT_PACK, SHOW_PACKS, HIDE_PACK, HIDE_QUESTION, RESET, etc.):
            // QUESTION IS HIDDEN!
            try {
                localStorage.setItem('ddvq_vq_question_shown', 'false');
                localStorage.removeItem('ddvq_vq_question_text');
            } catch(e) {}

            if (document.getElementById('s4_question_text')) {
                document.getElementById('s4_question_text').innerText = "Đang chờ câu hỏi Vinh Quang...";
            }

            clearPlayerSubmissionStatus('VQ');
            s4TimerStartTime = 0;
            clearInterval(s4TimerInterval);
            s4TimerInterval = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            updateMasterRemainingTime('--');
            const s4Input = document.getElementById('s4_answer_input');
            if (s4Input) {
                s4Input.value = "";
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = "Thời gian";
        }
    }

    // Contestant Name / Score synchronization
    if (data.contestants && Array.isArray(data.contestants)) {
        updatePlayerContestants(data.contestants);
    } else if (data.type === 'UPDATE_CONTESTANTS' || data.type === 'UPDATE_SCORES') {
        if (data.contestants) updatePlayerContestants(data.contestants);
    }

    // Dynamic answer submission confirmation updates
    if (data.type === 'PLAYER_SUBMIT_ANSWER' || data.playerAnswers) {
        updateSubmissionStatusFromState(data);
    }

    // Remote Reload / Kick / Room Credential Change handlers
    if (data.type === 'ROOM_CREDENTIALS_CHANGED' || data.type === 'SET_ROOM_CODE') {
        let isInvalid = false;
        let reason = '';
        if (data.roomCode && currentRoomCode && data.roomCode !== currentRoomCode) {
            isInvalid = true;
            reason = `Mã phòng đã được Ban Tổ Chức đổi thành: <strong>${data.roomCode}</strong>.`;
        } else if (data.slotAuth && contestantId && currentRoomAuth) {
            const expectedAuth = data.slotAuth[contestantId];
            if (expectedAuth && currentRoomAuth !== expectedAuth && currentRoomAuth !== data.roomAuth) {
                isInvalid = true;
                reason = `Mật khẩu xác thực cho Thí sinh ${contestantId} đã được Ban Tổ Chức làm mới.`;
            }
        }
        if (isInvalid) {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            sessionStorage.removeItem('ddvq_active_slot');
            const modal = document.getElementById('room_code_modal');
            const errorBox = document.getElementById('login_error_msg');
            if (modal) modal.style.display = 'flex';
            if (errorBox) {
                errorBox.innerHTML = `🚫 <strong>Phiên thi đấu đã hết hạn:</strong><br>${reason}<br>Vui lòng quét lại mã QR mới nhất từ Ban Tổ Chức để tiếp tục.`;
                errorBox.style.display = 'block';
            }
            showToast('🚫 Mã phòng hoặc Mật khẩu đã được cập nhật lại!');
            return;
        }
    }

    if (data.type === 'RELOAD_CLIENT') {
        const target = data.target || data.role;
        const myRole = `ts${contestantId}`;
        if (!target || target === 'all' || target === 'players' || target === myRole || data.contestantId === contestantId) {
            showToast('🔄 Máy điều khiển yêu cầu Tải lại trang (Reload)...');
            setTimeout(() => {
                window.location.reload();
            }, 250);
        }
    }

    if (data.type === 'KICK_CLIENT') {
        const target = data.target || data.role;
        const myRole = `ts${contestantId}`;
        if (!target || target === 'all' || target === myRole || data.contestantId === contestantId) {
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            sessionStorage.removeItem('ddvq_active_slot');
            localStorage.removeItem('contestant_id');
            const modal = document.getElementById('room_code_modal');
            const errorBox = document.getElementById('login_error_msg');
            if (modal) modal.style.display = 'flex';
            if (errorBox) {
                errorBox.innerHTML = `⚠️ <strong>Thông báo:</strong><br>Bạn đã được mời ra khỏi vị trí Thí sinh ${contestantId} bởi Ban Tổ Chức.`;
                errorBox.style.display = 'block';
            }
            showToast('⚠️ Bạn đã được mời ra khỏi vị trí thí sinh này.');
        }
    }
}

// Initial render of Vượt Sóng grid
renderPlayerVSGrid();

// 1. SSE Real-time Connection fallback (if syncChannel is not present)
if (typeof EventSource !== 'undefined' && !window.syncChannel && typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
    try {
        const ssePath = typeof window.getApiUrl === 'function' ? window.getApiUrl('/api/events') : '/api/events';
        const sse = new EventSource(ssePath);
        sse.onmessage = function(e) {
            try {
                const data = JSON.parse(e.data);
                handlePlayerMessage(data);
            } catch(err) {}
        };
        sse.onerror = function() {
            fetchCurrentState();
        };
    } catch(e) {}
}

// 2. BroadcastChannel
try {
    if (playerChannel) {
        playerChannel.onmessage = function(e) {
            handlePlayerMessage(e.data);
        };
    }
} catch(e) {}

// 3. LocalStorage Listener
window.addEventListener('storage', function(e) {
    if (e.key === 'ddvq_latest_action' && e.newValue) {
        try {
            handlePlayerMessage(JSON.parse(e.newValue));
        } catch(err) {}
    }
});

// 4. Initial & Interval State Polling Fallback (only when WebSocket is not connected)
function fetchCurrentState() {
    if (typeof hasLocalServerBackend === 'function' && !hasLocalServerBackend()) return;
    // Skip polling if WebSocket is already connected and delivering real-time push updates
    if (window.syncChannel && window.syncChannel.isWsConnected) return;
    const apiPath = typeof window.getApiUrl === 'function' ? window.getApiUrl('/api/state') : '/api/state';
    fetch(apiPath)
        .then(res => res.json())
        .then(data => handlePlayerMessage(data))
        .catch(() => {});
}

fetchCurrentState();
// Check occasionally (every 10s) as recovery watchdog when disconnected, instead of hammering every 2s
setInterval(fetchCurrentState, 10000);

function triggerRandomDeFromPlayer() {
    if (!currentS1TurnIndex || currentS1TurnIndex <= 0) {
        if (typeof showToast === 'function') {
            showToast(`⚠️ Vòng thi Xuất Phát chưa bắt đầu lượt thi!`);
        }
        return;
    }

    if (parseInt(currentS1TurnIndex) !== parseInt(contestantId)) {
        if (typeof showToast === 'function') {
            showToast(`⚠️ Chưa đến lượt thi của bạn! (Hiện tại đang là lượt Thí sinh ${currentS1TurnIndex})`);
        }
        return;
    }

    if (s1HasSelectedDeForTurn[contestantId]) {
        if (typeof showToast === 'function') {
            showToast(`🔒 Bạn đã chọn bộ đề rồi, không thể chọn lại!`);
        }
        return;
    }

    const chosenSet = Math.floor(Math.random() * 8) + 1;
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;

    s1HasSelectedDeForTurn[contestantId] = true;
    s1ChosenDeMap[contestantId] = chosenSet;
    updateS1RandomDeButtonUI();

    const payload = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'XUAT_PHAT_RANDOM_DE',
        contestantId: contestantId,
        turnIndex: contestantId,
        deNumber: chosenSet,
        name: myName,
        timestamp: Date.now()
    };

    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    if (playerChannel) {
        try { playerChannel.postMessage(payload); } catch(e) {}
    }
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(payload, '*');
        }
    } catch(e) {}
    try {
        localStorage.setItem('ddvq_latest_action', JSON.stringify(payload));
    } catch(e) {}

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    }

    showToast(`🎲 Đã chọn ngẫu nhiên: Bộ đề ${chosenSet}`);
}

window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
            return;
        }

        const scene1 = document.getElementById('view_scene_1');
        if (scene1 && (scene1.classList.contains('active') || activeSceneNum === 1)) {
            e.preventDefault();
            triggerRandomDeFromPlayer();
        }
    }
});

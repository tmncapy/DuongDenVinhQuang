function getInitialContestantId() {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        return parseInt(window.FIXED_CONTESTANT_ID);
    }
    if (typeof window !== 'undefined' && window.location) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('player1')) return 1;
        if (path.includes('player2')) return 2;
        if (path.includes('player3')) return 3;
        if (path.includes('player4')) return 4;

        const params = new URLSearchParams(window.location.search);
        const slotParam = parseInt(params.get('slot') || params.get('ts') || params.get('id') || params.get('contestant') || '0');
        if (slotParam >= 1 && slotParam <= 4) return slotParam;
    }
    const sessionSlot = (typeof sessionStorage !== 'undefined') ? parseInt(sessionStorage.getItem('ddvq_active_slot') || '0') : 0;
    if (sessionSlot >= 1 && sessionSlot <= 4) return sessionSlot;

    return 1;
}

let contestantId = getInitialContestantId();
let currentRoomCode = localStorage.getItem('ddvq_room_code') || 'DDVQ2026';
let currentRoomAuth = localStorage.getItem('ddvq_room_auth') || '123456';
let playerContestants = [];
let currentS1TurnIndex = 0;
let s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
let s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };

function updateS1RandomDeButtonUI() {
    const btn = document.getElementById('s1_random_btn');
    if (!btn) return;

    const currentTurn = parseInt(currentS1TurnIndex) || 0;
    const myId = parseInt(contestantId) || 1;

    if (!currentTurn || currentTurn <= 0) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.background = '#475569';
        btn.style.borderColor = '#64748b';
        btn.style.boxShadow = 'none';
        btn.innerHTML = `<span>🔒 CHƯA BẮT ĐẦU LƯỢT THI (ĐANG CHỜ MC CHỌN THÍ SINH)</span>`;
        return;
    }

    if (currentTurn !== myId) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.background = '#475569';
        btn.style.borderColor = '#64748b';
        btn.style.boxShadow = 'none';
        btn.innerHTML = `<span>🔒 CHƯA ĐẾN LƯỢT THI (TS ${currentTurn} ĐANG THI)</span>`;
        return;
    }

    if (s1HasSelectedDeForTurn && s1HasSelectedDeForTurn[myId]) {
        btn.disabled = true;
        btn.style.opacity = '0.8';
        btn.style.cursor = 'not-allowed';
        btn.style.background = '#1e3a8a';
        btn.style.borderColor = '#3b82f6';
        btn.style.boxShadow = 'none';
        const deText = (s1ChosenDeMap && s1ChosenDeMap[myId]) ? `BỘ ĐỀ ${s1ChosenDeMap[myId]}` : 'ĐÃ CHỌN';
        btn.innerHTML = `<span>🔒 ĐÃ CHỌN (${deText})</span>`;
    } else {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
        btn.style.borderColor = '#60a5fa';
        btn.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.4)';
        btn.innerHTML = `<span>🎲 CHỌN ĐỀ NGẪU NHIÊN</span><span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; font-size: 12px; border: 1px solid rgba(255,255,255,0.4); margin-left: 8px;">Phím cách (Space)</span>`;
    }
}

function getApiUrl(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function' && window.getApiUrl !== getApiUrl) {
        return window.getApiUrl(path);
    }
    if (!path) return path;
    if (typeof window === 'undefined') return path;

    if (/^(https?:|blob:|data:)/i.test(path)) {
        return path;
    }

    const customHost = (typeof localStorage !== 'undefined' && localStorage.getItem('ddvq_server_host')) || 
        (typeof URLSearchParams !== 'undefined' && window.location ? new URLSearchParams(window.location.search).get('server') : null);

    if (customHost) {
        const cleanCustom = customHost.replace(/\/$/, '');
        const cleanP = path.startsWith('/') ? path : '/' + path;
        return cleanCustom + cleanP;
    }

    if (window.location.protocol === 'file:' || !window.location.host) {
        const cleanP = path.startsWith('/') ? path : '/' + path;
        return 'http://localhost:3000' + cleanP;
    }

    let cleanPath = path;
    if (cleanPath.startsWith('./')) {
        cleanPath = cleanPath.substring(2);
    }

    const basePath = (typeof window.getAppBasePath === 'function') ? window.getAppBasePath() : (window.location.pathname ? window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1) : '/');

    if (basePath && basePath !== '/') {
        if (cleanPath.startsWith('/')) {
            if (cleanPath.startsWith(basePath)) {
                return cleanPath;
            }
            return basePath.replace(/\/$/, '') + cleanPath;
        } else {
            return basePath + cleanPath;
        }
    }

    if (!cleanPath.startsWith('/')) {
        return '/' + cleanPath;
    }
    return cleanPath;
}

function getPlayerSessionId() {
    let sid = null;
    try {
        sid = sessionStorage.getItem('ddvq_player_session_id');
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('ddvq_player_session_id', sid);
        }
    } catch(e) {
        sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    return sid;
}

function parsePlayerUrlParams() {
    if (typeof window === 'undefined' || !window.location) return;
    const urlParams = new URLSearchParams(window.location.search);
    const paramRoom = (urlParams.get('roomid') || urlParams.get('roomId') || urlParams.get('room') || '').trim();
    const paramAuth = (urlParams.get('auth') || urlParams.get('pass') || urlParams.get('password') || '').trim();

    if (paramRoom) {
        currentRoomCode = paramRoom.toUpperCase();
        localStorage.setItem('ddvq_room_code', currentRoomCode);
    }
    if (paramAuth) {
        currentRoomAuth = paramAuth;
        localStorage.setItem('ddvq_room_auth', currentRoomAuth);
    }

    const roomInput = document.getElementById('login_room_code_input');
    if (roomInput) roomInput.value = currentRoomCode;

    const authInput = document.getElementById('login_room_auth_input');
    if (authInput) authInput.value = currentRoomAuth;

    const roomBadge = document.getElementById('modal_room_code_display');
    if (roomBadge) roomBadge.innerText = currentRoomCode;

    const topBadgeText = document.getElementById('player_room_badge_text');
    if (topBadgeText) topBadgeText.innerText = `Phòng: ${currentRoomCode}`;

    const paramSlot = parseInt(urlParams.get('slot') || urlParams.get('ts') || '0');
    if (paramSlot >= 1 && paramSlot <= 4) {
        setTimeout(() => {
            chooseContestantSlot(paramSlot);
        }, 120);
    }
}

function onManualRoomSettingsChange() {
    const roomInput = document.getElementById('login_room_code_input');
    const authInput = document.getElementById('login_room_auth_input');
    if (roomInput) {
        currentRoomCode = roomInput.value.trim().toUpperCase() || 'DDVQ2026';
        roomInput.value = currentRoomCode;
        localStorage.setItem('ddvq_room_code', currentRoomCode);
    }
    if (authInput) {
        currentRoomAuth = authInput.value.trim() || '123456';
        localStorage.setItem('ddvq_room_auth', currentRoomAuth);
    }
    const roomBadge = document.getElementById('modal_room_code_display');
    if (roomBadge) roomBadge.innerText = currentRoomCode;

    const topBadgeText = document.getElementById('player_room_badge_text');
    if (topBadgeText) topBadgeText.innerText = `Phòng: ${currentRoomCode}`;
}

function onSelectContestant(val) {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        contestantId = parseInt(window.FIXED_CONTESTANT_ID);
        const sel = document.getElementById('contestant_select');
        if (sel) sel.value = contestantId;
        return;
    }
    contestantId = parseInt(val) || 1;
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('ddvq_active_slot', contestantId);
    }
    highlightLastChosenSlot();

    const myName = (playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`).toLocaleUpperCase('vi-VN');
    if (document.getElementById('s1_badge_box')) document.getElementById('s1_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s3_badge_box')) document.getElementById('s3_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}: ${myName}`;

    if (currentRoomCode) {
        startHeartbeat();
    }
    updateS1RandomDeButtonUI();
    if (typeof fetchCurrentState === 'function') {
        fetchCurrentState();
    }
}

function chooseContestantSlot(slotId) {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        slotId = parseInt(window.FIXED_CONTESTANT_ID);
    } else if (typeof window !== 'undefined' && window.location) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('player1')) slotId = 1;
        else if (path.includes('player2')) slotId = 2;
        else if (path.includes('player3')) slotId = 3;
        else if (path.includes('player4')) slotId = 4;
        else {
            slotId = parseInt(slotId) || 1;
        }
    } else {
        slotId = parseInt(slotId) || 1;
    }
    contestantId = slotId;

    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('ddvq_active_slot', slotId);
    }

    const sel = document.getElementById('contestant_select');
    if (sel) sel.value = slotId;

    const myName = (playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`).toLocaleUpperCase('vi-VN');
    if (document.getElementById('s1_badge_box')) document.getElementById('s1_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s3_badge_box')) document.getElementById('s3_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}: ${myName}`;

    updateS1RandomDeButtonUI();

    const joinPayload = {
        type: 'CLIENT_JOIN',
        role: `ts${contestantId}`,
        contestantId: contestantId,
        roomCode: currentRoomCode,
        auth: currentRoomAuth,
        sessionId: getPlayerSessionId(),
        name: myName
    };

    const errorBox = document.getElementById('login_error_msg');
    if (errorBox) errorBox.style.display = 'none';

    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(joinPayload);
    }

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(joinPayload)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('ddvq_active_slot', slotId);
                const modal = document.getElementById('room_code_modal');
                if (modal) modal.style.display = 'none';
                showToast(`🏆 Đã vào vị trí Thí sinh ${contestantId}: ${myName}`);
                startHeartbeat();
            } else {
                if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('ddvq_active_slot');
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                const modal = document.getElementById('room_code_modal');
                if (modal) modal.style.display = 'flex';
                if (errorBox) {
                    errorBox.innerHTML = `⚠️ <strong>Không thể vào vị trí:</strong><br>${data.error || `Mật khẩu xác thực không đúng cho Thí sinh ${contestantId}!`}`;
                    errorBox.style.display = 'block';
                    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        })
        .catch((err) => {
            console.error("Join fallback error:", err);
            if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('ddvq_active_slot', slotId);
            const modal = document.getElementById('room_code_modal');
            if (modal) modal.style.display = 'none';
            showToast(`🏆 Đã vào vị trí Thí sinh ${contestantId}: ${myName}`);
            startHeartbeat();
        });
    } else {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('ddvq_active_slot', slotId);
        const modal = document.getElementById('room_code_modal');
        if (modal) modal.style.display = 'none';
        showToast(`🏆 Đã vào vị trí Thí sinh ${contestantId}: ${myName}`);
        startHeartbeat();
    }
}

function reopenSlotSelection() {
    const modal = document.getElementById('room_code_modal');
    if (modal) {
        modal.style.display = 'flex';
        highlightLastChosenSlot();
    }
}

function highlightLastChosenSlot() {
    for (let i = 1; i <= 4; i++) {
        const card = document.getElementById(`slot_card_${i}`);
        if (card) {
            if (i === contestantId) {
                card.style.borderColor = '#60a5fa';
                card.style.boxShadow = '0 0 16px rgba(96, 165, 250, 0.6)';
            } else {
                card.style.borderColor = (i === 1 ? '#3b82f6' : i === 2 ? '#ef4444' : i === 3 ? '#10b981' : '#f59e0b');
                card.style.boxShadow = 'none';
            }
        }
    }
}

// Fallback legacy support
function onClickJoinRoom() {
    chooseContestantSlot(contestantId);
}

let heartbeatInterval = null;
function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 8000);
}

function sendHeartbeat() {
    if (!currentRoomCode) return;
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;
    const roleKey = `ts${contestantId}`;

    const hbPayload = {
        type: 'CLIENT_HEARTBEAT',
        role: roleKey,
        contestantId: contestantId,
        roomCode: currentRoomCode,
        auth: currentRoomAuth,
        sessionId: getPlayerSessionId(),
        name: myName,
        timestamp: Date.now()
    };

    // 0. Supabase, WebSocket & Realtime sync
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(hbPayload);
    }

    // LocalStorage
    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify(hbPayload));
    } catch(e) {}

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hbPayload)
        })
        .then(r => r.json())
        .then(data => {
            if (data && data.success === false) {
                if (heartbeatInterval) clearInterval(heartbeatInterval);
                sessionStorage.removeItem('ddvq_active_slot');
                const modal = document.getElementById('room_code_modal');
                const errorBox = document.getElementById('login_error_msg');
                if (modal) modal.style.display = 'flex';
                if (errorBox) {
                    errorBox.innerHTML = `⚠️ <strong>Ngắt kết nối:</strong><br>${data.error || 'Vị trí này đã bị ngắt kết nối hoặc có người khác đăng nhập.'}`;
                    errorBox.style.display = 'block';
                }
            }
        })
        .catch(() => {});
    }
}

window.addEventListener('DOMContentLoaded', () => {
    parsePlayerUrlParams();

    // 1. Slot auto-restoration:
    // Enter directly without blocking modal
    const savedSlot = getInitialContestantId();

    chooseContestantSlot(savedSlot || 1);
    const modal = document.getElementById('room_code_modal');
    if (modal) modal.style.display = 'none';
    const sel = document.getElementById('contestant_select');
    if (sel) {
        sel.value = savedSlot || 1;
        if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) sel.disabled = true;
    }

    // 2. Instant local round & timer restore from localStorage (zero delay on F5)
    try {
        const savedRound = localStorage.getItem('ddvq_active_round');
        const savedTimerStr = localStorage.getItem('ddvq_current_timer');
        let savedTimer = null;
        if (savedTimerStr) {
            try { savedTimer = JSON.parse(savedTimerStr); } catch(e) {}
        }
        if (savedRound || savedTimer) {
            applyPlayerGameState({
                type: 'FULL_STATE_SYNC',
                activeRound: savedRound || savedTimer?.round,
                currentTimer: savedTimer
            });
        }
    } catch(e) {}

    // 3. Fetch live state from server immediately
    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/state'))
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.contestants) updatePlayerContestants(data.contestants);
                    if (data.roomCode && !new URLSearchParams(window.location.search).get('roomid')) {
                        currentRoomCode = data.roomCode;
                        const roomBadge = document.getElementById('modal_room_code_display');
                        if (roomBadge) roomBadge.innerText = currentRoomCode;
                        const topBadgeText = document.getElementById('player_room_badge_text');
                        if (topBadgeText) topBadgeText.innerText = `Phòng: ${currentRoomCode}`;
                    }
                    if (data.roomAuth && !new URLSearchParams(window.location.search).get('auth')) {
                        currentRoomAuth = data.roomAuth;
                    }
                    applyPlayerGameState(data);
                }
            })
            .catch(() => {});
    }

    // 4. Request current state from Controller/Projector/Server
    const reqMsg = {
        type: 'REQUEST_CURRENT_STATE',
        role: `ts${contestantId}`,
        contestantId: contestantId,
        timestamp: Date.now()
    };
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(reqMsg);
    }
    if (playerChannel) {
        try { playerChannel.postMessage(reqMsg); } catch(e) {}
    }
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(reqMsg, '*');
        }
    } catch(e) {}
});

function applyPlayerGameState(data) {
    if (!data) return;

    // 1. Determine active round
    let round = data.activeRound || data.currentRound;
    if (!round && data.latestAction && data.latestAction.type) {
        const act = data.latestAction.type;
        if (act.startsWith('XUAT_PHAT_')) round = 'XUAT_PHAT';
        else if (act.startsWith('RA_KHOI_')) round = 'RA_KHOI';
        else if (act.startsWith('VUOT_SONG_')) round = 'VUOT_SONG';
        else if (act.startsWith('VINH_QUANG_')) round = 'VINH_QUANG';
        else if (act === 'SWITCH_VIEW') {
            const v = data.latestAction.viewNum;
            if (v === 1) round = 'XUAT_PHAT';
            else if (v === 2) round = 'RA_KHOI';
            else if (v === 3 || v === 4 || v === 5) round = 'VUOT_SONG';
            else if (v === 6 || v === 7) round = 'VINH_QUANG';
        }
    }
    if (!round && data.type) {
        if (data.type.startsWith('XUAT_PHAT_')) round = 'XUAT_PHAT';
        else if (data.type.startsWith('RA_KHOI_')) round = 'RA_KHOI';
        else if (data.type.startsWith('VUOT_SONG_')) round = 'VUOT_SONG';
        else if (data.type.startsWith('VINH_QUANG_')) round = 'VINH_QUANG';
    }
    if (!round) {
        try { round = localStorage.getItem('ddvq_active_round'); } catch(e) {}
    }

    let sceneNum = 0;
    if (round === 'XUAT_PHAT') sceneNum = 1;
    else if (round === 'RA_KHOI') sceneNum = 2;
    else if (round === 'VUOT_SONG') sceneNum = 3;
    else if (round === 'VINH_QUANG') sceneNum = 4;
    else if (round === 'CAU_HOI_PHU') sceneNum = 4;

    if (sceneNum > 0) {
        displaySceneView(sceneNum);
        if (round) {
            try { localStorage.setItem('ddvq_active_round', round); } catch(e) {}
        }
    }

    // 2. Sync contestants and contestant's score
    if (data.contestants && Array.isArray(data.contestants)) {
        updatePlayerContestants(data.contestants);
        const myData = data.contestants[contestantId - 1];
        if (myData && myData.score !== undefined) {
            updateContestantScoreDisplay(myData.score);
        }
    }

    // Sync Xuất Phát turn selected de maps
    if (data.s1HasSelectedDeForTurn) {
        s1HasSelectedDeForTurn = { ...data.s1HasSelectedDeForTurn };
    }
    if (data.s1ChosenDeMap) {
        s1ChosenDeMap = { ...data.s1ChosenDeMap };
    }
    // Update S1 turn index if provided in state
    if (data.currentXuatPhatTurn !== undefined) {
        currentS1TurnIndex = parseInt(data.currentXuatPhatTurn) || 0;
    } else if (data.turnIndex !== undefined && round === 'XUAT_PHAT') {
        currentS1TurnIndex = parseInt(data.turnIndex) || 0;
    }
    updateS1RandomDeButtonUI();

    // 3. Sync Vuot Song grid & row
    if (data.vuotSong) {
        renderPlayerVSGrid(data.vuotSong);
    }
    if (data.vuotSongRow !== undefined && data.vuotSongRow > 0) {
        highlightS3Row(data.vuotSongRow);
    }

    // 4. Sync Question Text & Index
    if (sceneNum === 1 || !sceneNum) {
        const el = document.getElementById('s1_question_text') || document.getElementById('s1_q_text');
        if (el) {
            let isXPShown = false;
            if (data.xpQuestionShown === true) {
                isXPShown = true;
            } else if (data.xpQuestionShown === false) {
                isXPShown = false;
                window.s1IsQuestionActive = false;
                try {
                    localStorage.setItem('ddvq_xp_question_shown', 'false');
                    localStorage.removeItem('ddvq_xp_question_text');
                } catch(e) {}
            } else {
                const hasActiveTimer = !!(data.currentTimer && data.currentTimer.round === 'XUAT_PHAT' && ((data.currentTimer.targetTime && data.currentTimer.targetTime > Date.now()) || data.currentTimer.remaining > 0));
                isXPShown = hasActiveTimer || (window.s1IsQuestionActive === true) || (localStorage.getItem('ddvq_xp_question_shown') === 'true');
            }

            const qText = data.questionText || data.currentQuestion?.questionText || data.currentQuestion?.q || (isXPShown ? localStorage.getItem('ddvq_xp_question_text') : '');
            if (isXPShown && qText) {
                el.innerText = qText;
                window.s1IsQuestionActive = true;
            } else if (!isXPShown) {
                el.innerText = "Đang chờ bắt đầu lượt thi Xuất Phát...";
                window.s1IsQuestionActive = false;
            }
        }
    }
    if (sceneNum === 2) {
        const el = document.getElementById('s2_question_text');
        if (el && qText) el.innerText = qText;
    }
    if (sceneNum === 3) {
        const el = document.getElementById('s3_question_text');
        if (el) {
            const isVSShown = (data.vsQuestionShown === true) || (localStorage.getItem('ddvq_vs_question_shown') === 'true');
            if (isVSShown && qText) {
                el.innerText = qText;
            } else {
                el.innerText = "Đang chờ câu hỏi Vượt Sóng...";
            }
        }
    }
    if (sceneNum === 4) {
        const el = document.getElementById('s4_q_text') || document.getElementById('s4_question_text');
        if (el) {
            const isVQShown = (data.vqQuestionShown === true) || (data.type === 'VINH_QUANG_SHOW_QUESTION') || (data.type === 'VE_DICH_SHOW_QUESTION') || (data.type === 'VINH_QUANG_START_TIMER') || (data.type === 'VINH_QUANG_START_TIMER_5S') || (localStorage.getItem('ddvq_vq_question_shown') === 'true');
            if (isVQShown && qText) {
                el.innerText = qText;
            } else {
                el.innerText = "🔒 [Đang chờ MC phát lệnh HIỆN CÂU HỎI...]";
            }
        }
    }
    const qIdx = data.questionIndex !== undefined ? data.questionIndex : data.currentQuestion?.questionIndex;
    if (qIdx !== undefined) {
        setS1QuestionIndex(qIdx - 1);
    }

    if (data.turnIndex !== undefined || data.currentXuatPhatTurn !== undefined) {
        currentS1TurnIndex = parseInt(data.turnIndex !== undefined ? data.turnIndex : data.currentXuatPhatTurn) || 0;
        updateS1RandomDeButtonUI();
    }

    // 5. Player Answer Submissions
    if (data.playerAnswers) {
        updateSubmissionStatusFromState(data);
    }

    // 6. Active Timer Synchronization ("nếu reload trong lúc tính thời gian thì tính ngay lúc đó luôn")
    const timer = data.currentTimer;
    if (timer && timer.startTime && timer.duration) {
        const now = Date.now();
        const targetTime = timer.targetTime || (timer.startTime + timer.duration * 1000);
        const remainingSec = timer.remaining !== undefined ? timer.remaining : Math.max(0, Math.ceil((targetTime - now) / 1000));
        const timerRound = timer.round || round;

        if (remainingSec > 0) {
            try { localStorage.setItem('ddvq_current_timer', JSON.stringify(timer)); } catch(e) {}

            if (timerRound === 'XUAT_PHAT' || sceneNum === 1) {
                if (!s1TimerInterval || Math.abs(s1TimeLeft - remainingSec) > 2) {
                    startS1Timer(remainingSec);
                }
            } else if (timerRound === 'RA_KHOI' || sceneNum === 2) {
                if (!s2TimerInterval || Math.abs(s2TimerStartTime - timer.startTime) > 1000) {
                    startS2Timer(remainingSec, timer.startTime);
                }
            } else if (timerRound === 'VUOT_SONG' || sceneNum === 3) {
                if (!s3TimerInterval || Math.abs(s3TimerStartTime - timer.startTime) > 1000) {
                    startS3Timer(remainingSec, timer.startTime);
                }
            } else if (timerRound === 'VINH_QUANG' || sceneNum === 4) {
                if (!s4TimerInterval || Math.abs(s4TimerStartTime - timer.startTime) > 1000) {
                    startS4Timer(remainingSec, true, timer.startTime);
                }
            }
        } else {
            // Timer expired
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
            if (timerRound === 'XUAT_PHAT' || sceneNum === 1) {
                clearInterval(s1TimerInterval);
                s1TimerInterval = null;
                const clock = document.getElementById('s1_clock_box');
                if (clock) clock.innerText = "0";
                updateMasterRemainingTime("HẾT GIỜ");
            } else if (timerRound === 'RA_KHOI' || sceneNum === 2) {
                clearInterval(s2TimerInterval);
                s2TimerInterval = null;
                const timeBox = document.getElementById('s2_time_box');
                if (timeBox) timeBox.innerText = "HẾT GIỜ";
                updateMasterRemainingTime("HẾT GIỜ");
                const s2Input = document.getElementById('s2_answer_input');
                if (s2Input) {
                    s2Input.disabled = true;
                    s2Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
                }
            } else if (timerRound === 'VUOT_SONG' || sceneNum === 3) {
                clearInterval(s3TimerInterval);
                s3TimerInterval = null;
                updateMasterRemainingTime("HẾT GIỜ");
                const s3Input = document.getElementById('s3_answer_input');
                if (s3Input) {
                    s3Input.disabled = true;
                    s3Input.placeholder = "Hết giờ - Ô nhập hàng ngang đã khóa";
                }
            } else if (timerRound === 'VINH_QUANG' || sceneNum === 4) {
                clearInterval(s4TimerInterval);
                s4TimerInterval = null;
                const timeBox = document.getElementById('s4_time_box');
                if (timeBox) timeBox.innerText = "HẾT GIỜ";
                updateMasterRemainingTime("HẾT GIỜ");
                const s4Input = document.getElementById('s4_answer_input');
                if (s4Input) {
                    s4Input.disabled = true;
                    s4Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
                }
            }
        }
    } else {
        // No timer running: ensure inputs for all rounds are locked outside answering time
        const s2Input = document.getElementById('s2_answer_input');
        if (s2Input && (!s2TimerInterval || s2TimeLeft <= 0)) {
            s2Input.disabled = true;
            s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
        }
        const s3Input = document.getElementById('s3_answer_input');
        if (s3Input && (!s3TimerInterval || s3TimeLeft <= 0)) {
            s3Input.disabled = true;
            s3Input.placeholder = "Nhập đáp án hàng ngang";
        }
        const s4Input = document.getElementById('s4_answer_input');
        if (s4Input && (!s4TimerInterval || s4TimeLeft <= 0)) {
            s4Input.disabled = true;
            s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
        }
    }
}

function updatePlayerContestants(contestants) {
    if (!contestants || !Array.isArray(contestants)) return;
    playerContestants = contestants;
    try {
        localStorage.setItem('ddvq_contestants', JSON.stringify(contestants));
    } catch(e) {}

    // Update modal 4 slot cards
    for (let i = 1; i <= 4; i++) {
        const cardName = document.getElementById(`slot_name_${i}`);
        if (cardName) {
            const name = (contestants[i - 1]?.name || `Thí sinh ${i}`).toLocaleUpperCase('vi-VN');
            cardName.innerText = name;
        }
    }

    const selectEl = document.getElementById('contestant_select');
    if (selectEl) {
        const currentVal = selectEl.value;
        for (let i = 1; i <= 4; i++) {
            const opt = selectEl.querySelector(`option[value="${i}"]`);
            const name = (contestants[i - 1]?.name || `Thí sinh ${i}`).toLocaleUpperCase('vi-VN');
            if (opt) {
                opt.innerText = `Thí sinh ${i}: ${name}`;
            }
        }
        selectEl.value = currentVal;
    }

    const myName = (contestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`).toLocaleUpperCase('vi-VN');
    if (document.getElementById('s1_badge_box')) document.getElementById('s1_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s3_badge_box')) document.getElementById('s3_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}: ${myName}`;
}

try {
    const saved = localStorage.getItem('ddvq_contestants');
    if (saved) updatePlayerContestants(JSON.parse(saved));
} catch(e) {}

let playerChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        playerChannel = new BroadcastChannel('ddvq_game_channel');
    }
} catch (e) {
    console.warn("BroadcastChannel restricted in player:", e);
}

let autoSync = true;
let activeSceneNum = 1;
let currentS2Round = 'RK';
let s1TimerInterval = null;
let s1TimeLeft = 0;
let s2TimerInterval = null;
let s2TimeLeft = 0;
let s2TimerStartTime = 0;
let s3TimerInterval = null;
let s3TimeLeft = 0;
let s3TimerStartTime = 0;
let s3RoundStartTime = parseInt(localStorage.getItem('s3_round_start_time')) || 0;
let s3HasSubmittedVongThi = false;

function resetS3SubmitBtn() {
    s3HasSubmittedVongThi = false;
    const submitBtn = document.querySelector('.s3-submit-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
        submitBtn.innerText = 'TRẢ LỜI ĐÁP ÁN VÒNG THI';
    }
    const bellBtn = document.getElementById('s3_btn_bell');
    if (bellBtn) {
        bellBtn.disabled = false;
        bellBtn.style.opacity = '1';
        bellBtn.classList.remove('pressed', 'active');
    }
    const bellFeedback = document.getElementById('s3_bell_feedback');
    if (bellFeedback) {
        bellFeedback.style.display = 'none';
        bellFeedback.innerText = '';
    }
    resetS3SubmissionUI();
}
let s4TimerInterval = null;
let s4TimeLeft = 0;
let s4TimerStartTime = 0;
let s1QIndex = 0;
let s1Corrects = 0;
let s1Totals = 0;
let s3SelectedRow = 0;

let playerVsData = null;
let playerOpenedRows = {};
let s1QuestionStates = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null };

function updateS1CorrectCountFromButtons() {
    let corrects = 0;
    let totals = 0;
    for (let i = 1; i <= 10; i++) {
        if (s1QuestionStates[i] === 'correct') {
            corrects++;
            totals++;
        } else if (s1QuestionStates[i] === 'wrong') {
            totals++;
        }
    }
    s1Corrects = corrects;
    s1Totals = totals;
    const correctEl = document.getElementById('s1_correct_count');
    if (correctEl) {
        correctEl.innerText = `${s1Corrects}/${s1Totals}`;
    }
}

function updateMasterRemainingTime(secStr) {
    const el = document.getElementById('player_remaining_seconds');
    if (el) el.innerText = secStr;
}

function updateContestantScoreDisplay(score) {
    const val = score !== undefined ? score : 0;
    const masterScore = document.getElementById('player_master_score_val');
    if (masterScore) masterScore.innerText = val;

    const s1 = document.getElementById('s1_score_box');
    if (s1) s1.innerText = `ĐIỂM: ${val}`;
    const s2 = document.getElementById('s2_score_box');
    if (s2) s2.innerText = `ĐIỂM: ${val}`;
    const s3 = document.getElementById('s3_score_box');
    if (s3) s3.innerText = `ĐIỂM: ${val}`;
    const s4 = document.getElementById('s4_score_box');
    if (s4) s4.innerText = `ĐIỂM: ${val}`;
}

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

function renderPlayerVSGrid(vsData, openedRows) {
    if (vsData) playerVsData = vsData;
    if (openedRows) playerOpenedRows = Object.assign(playerOpenedRows, openedRows);
    if (!playerVsData) {
        try {
            const saved = localStorage.getItem('duong_den_vinh_quang_data');
            if (saved) {
                const p = JSON.parse(saved);
                if (p && p.vuotSong) playerVsData = p.vuotSong;
            }
        } catch(e) {}
    }
    const data = playerVsData || {};

    for (let h = 1; h <= 4; h++) {
        const rowEl = document.getElementById(`s3_row_${h}`);
        if (!rowEl) continue;
        const ans = data[`h${h}`]?.a || data[`h${h}`]?.q || '';
        const cleanAns = ans.replace(/\s+/g, '').toUpperCase();
        const totalChars = cleanAns.length || 0;
        const isOpened = playerOpenedRows[h] || playerOpenedRows[`h${h}`] || false;

        let cellsHtml = '';
        if (totalChars > 0) {
            for (let i = 0; i < totalChars; i++) {
                const char = isOpened ? cleanAns[i] : '';
                const openedClass = isOpened ? 'opened' : '';
                cellsHtml += `<div class="s3-matrix-cell has-length ${openedClass}">${char}</div>`;
            }
        } else {
            for (let i = 0; i < 8; i++) {
                cellsHtml += `<div class="s3-matrix-cell"></div>`;
            }
        }
        rowEl.innerHTML = cellsHtml;
    }

    // Center / Keyword
    const centerEl = document.getElementById('s3_row_center');
    if (centerEl) {
        const kw = data.keyword || data.center?.a || data.center?.q || '';
        const cleanKw = removeVietnameseTones(kw).replace(/\s+/g, '').toUpperCase();
        const kwL = cleanKw.length || 0;
        const isKwOpened = playerOpenedRows['center'] || playerOpenedRows['keyword'] || false;
        let cellsHtml = '';
        if (kwL > 0) {
            for (let i = 0; i < kwL; i++) {
                const char = isKwOpened ? cleanKw[i] : '';
                const openedClass = isKwOpened ? 'opened' : '';
                cellsHtml += `<div class="s3-matrix-cell has-length ${openedClass}" style="border-color: #38bdf8;">${char}</div>`;
            }
        } else {
            for (let i = 0; i < 10; i++) {
                cellsHtml += `<div class="s3-matrix-cell" style="border-color: #38bdf8;"></div>`;
            }
        }
        centerEl.innerHTML = cellsHtml;
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast_box');
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function resetS2SubmissionUI() {
    const badge = document.getElementById('s2_status_badge');
    if (badge) {
        badge.innerText = '🟡 CHƯA GỬI ĐÁP ÁN';
        badge.style.background = '#4b5563';
    }
    const txt = document.getElementById('s2_submitted_text');
    if (txt) txt.innerText = '--';
    const tm = document.getElementById('s2_submitted_time');
    if (tm) tm.innerText = '--';
}

function resetS4SubmissionUI() {
    const badge = document.getElementById('s4_status_badge');
    if (badge) {
        badge.innerText = '🟡 CHƯA GỬI ĐÁP ÁN';
        badge.style.background = '#4b5563';
    }
    const txt = document.getElementById('s4_submitted_text');
    if (txt) txt.innerText = '--';
    const tm = document.getElementById('s4_submitted_time');
    if (tm) tm.innerText = '--';
}

function resetS3SubmissionUI() {
    const badge = document.getElementById('s3_status_badge');
    if (badge) {
        badge.innerText = '🟡 CHƯA GỬI ĐÁP ÁN';
        badge.style.background = '#4b5563';
    }
    const txt = document.getElementById('s3_submitted_text');
    if (txt) txt.innerText = '--';
    const tm = document.getElementById('s3_submitted_time');
    if (tm) tm.innerText = '--';
}

function updateSubmissionStatusFromState(state) {
    if (!state) return;

    // If it's a single PLAYER_SUBMIT_ANSWER action from SSE/Broadcast:
    if (state.type === 'PLAYER_SUBMIT_ANSWER') {
        const tsIdx = state.contestantId || 1;
        if (tsIdx === contestantId) {
            const round = state.round || 'RK';
            if (round === 'VS') {
                const s3Badge = document.getElementById('s3_status_badge');
                if (s3Badge) {
                    if (state.isVongThi || !state.answer) {
                        s3Badge.innerText = state.answer ? '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG' : '🔔 ĐÃ BẤM CHUÔNG';
                    } else {
                        s3Badge.innerText = '🟢 ĐÃ GỬI HÀNG NGANG';
                    }
                    s3Badge.style.background = '#16a34a';
                }
                const s3Txt = document.getElementById('s3_submitted_text');
                if (s3Txt) s3Txt.innerText = state.answer ? `"${state.answer}"` : '(Đã bấm chuông)';
                const s3Tm = document.getElementById('s3_submitted_time');
                if (s3Tm) s3Tm.innerText = `Thời gian: ${state.time || '00.00'} lúc ${new Date().toLocaleTimeString()}`;
            } else if (round === 'VQ') {
                const s4Badge = document.getElementById('s4_status_badge');
                if (s4Badge) {
                    s4Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
                    s4Badge.style.background = '#16a34a';
                }
                const s4Txt = document.getElementById('s4_submitted_text');
                if (s4Txt) s4Txt.innerText = `"${state.answer || ''}"`;
                const s4Tm = document.getElementById('s4_submitted_time');
                if (s4Tm) s4Tm.innerText = `Thời gian: ${state.time || '00.00'} lúc ${new Date().toLocaleTimeString()}`;
            } else if (round === currentS2Round) {
                const s2Badge = document.getElementById('s2_status_badge');
                if (s2Badge) {
                    s2Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
                    s2Badge.style.background = '#16a34a';
                }
                const s2Txt = document.getElementById('s2_submitted_text');
                if (s2Txt) s2Txt.innerText = `"${state.answer || ''}"`;
                const s2Tm = document.getElementById('s2_submitted_time');
                if (s2Tm) s2Tm.innerText = `Thời gian: ${state.time || '00.00'} lúc ${new Date().toLocaleTimeString()}`;
            }
        }
        return;
    }

    // Full state or state sync containing playerAnswers
    const answers = state.playerAnswers || {};
    
    // For Scene 2 (Ra Khơi)
    const s2Key = `ts${contestantId}_RK`;
    const s2Ans = answers[s2Key];
    if (s2Ans && s2Ans.answer) {
        const s2Badge = document.getElementById('s2_status_badge');
        if (s2Badge) {
            s2Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
            s2Badge.style.background = '#16a34a';
        }
        const s2Txt = document.getElementById('s2_submitted_text');
        if (s2Txt) s2Txt.innerText = `"${s2Ans.answer}"`;
        const s2Tm = document.getElementById('s2_submitted_time');
        if (s2Tm) s2Tm.innerText = `Thời gian: ${s2Ans.time || '00.00'} lúc ${s2Ans.timestamp ? new Date(s2Ans.timestamp).toLocaleTimeString() : ''}`;
    } else {
        resetS2SubmissionUI();
    }

    // For Scene 4 (Vinh Quang)
    const s4Key = `ts${contestantId}_VQ`;
    const s4Ans = answers[s4Key];
    if (s4Ans && s4Ans.answer) {
        const s4Badge = document.getElementById('s4_status_badge');
        if (s4Badge) {
            s4Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
            s4Badge.style.background = '#16a34a';
        }
        const s4Txt = document.getElementById('s4_submitted_text');
        if (s4Txt) s4Txt.innerText = `"${s4Ans.answer}"`;
        const s4Tm = document.getElementById('s4_submitted_time');
        if (s4Tm) s4Tm.innerText = `Thời gian: ${s4Ans.time || '00.00'} lúc ${s4Ans.timestamp ? new Date(s4Ans.timestamp).toLocaleTimeString() : ''}`;
    } else {
        resetS4SubmissionUI();
    }

    // For Scene 3 (Vượt Sóng)
    const s3Key = `ts${contestantId}_VS`;
    const s3Ans = answers[s3Key];
    if (s3Ans && (s3Ans.answer || s3Ans.isVongThi)) {
        if (!s3HasSubmittedVongThi) {
            resetS3SubmissionUI();
        } else {
            const s3Badge = document.getElementById('s3_status_badge');
            if (s3Badge) {
                if (s3Ans.isVongThi || !s3Ans.answer) {
                    s3Badge.innerText = s3Ans.answer ? '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG' : '🔔 ĐÃ BẤM CHUÔNG';
                } else {
                    s3Badge.innerText = '🟢 ĐÃ GỬI HÀNG NGANG';
                }
                s3Badge.style.background = '#16a34a';
            }
            const s3Txt = document.getElementById('s3_submitted_text');
            if (s3Txt) s3Txt.innerText = s3Ans.answer ? `"${s3Ans.answer}"` : '(Đã bấm chuông)';
            const s3Tm = document.getElementById('s3_submitted_time');
            if (s3Tm) s3Tm.innerText = `Thời gian: ${s3Ans.time || '00.00'} lúc ${s3Ans.timestamp ? new Date(s3Ans.timestamp).toLocaleTimeString() : ''}`;
        }
    } else {
        resetS3SubmissionUI();
    }
}

function switchScene(sceneVal) {
    if (sceneVal === 'auto') {
        autoSync = true;
        document.getElementById('tab_auto').className = 'scene-tab auto-active';
        document.getElementById('tab_s1').className = 'scene-tab';
        document.getElementById('tab_s2').className = 'scene-tab';
        document.getElementById('tab_s3').className = 'scene-tab';
        if (document.getElementById('tab_s4')) document.getElementById('tab_s4').className = 'scene-tab';
        showToast("Đã bật Tự động đồng bộ Cảnh theo Vòng thi");
        return;
    }

    autoSync = false;
    document.getElementById('tab_auto').className = 'scene-tab';
    document.getElementById('tab_s1').className = sceneVal === 1 ? 'scene-tab active' : 'scene-tab';
    document.getElementById('tab_s2').className = sceneVal === 2 ? 'scene-tab active' : 'scene-tab';
    document.getElementById('tab_s3').className = sceneVal === 3 ? 'scene-tab active' : 'scene-tab';
    if (document.getElementById('tab_s4')) document.getElementById('tab_s4').className = sceneVal === 4 ? 'scene-tab active' : 'scene-tab';

    displaySceneView(sceneVal);
}

function displaySceneView(sceneNum) {
    activeSceneNum = sceneNum;
    const v1 = document.getElementById('view_scene_1');
    const v2 = document.getElementById('view_scene_2');
    const v3 = document.getElementById('view_scene_3');
    const v4 = document.getElementById('view_scene_4');
    if (v1) v1.className = sceneNum === 1 ? 'scene-view active' : 'scene-view';
    if (v2) v2.className = sceneNum === 2 ? 'scene-view active' : 'scene-view';
    if (v3) v3.className = sceneNum === 3 ? 'scene-view active' : 'scene-view';
    if (v4) v4.className = sceneNum === 4 ? 'scene-view active' : 'scene-view';

    const t1 = document.getElementById('tab_s1');
    const t2 = document.getElementById('tab_s2');
    const t3 = document.getElementById('tab_s3');
    const t4 = document.getElementById('tab_s4');
    if (t1) t1.className = sceneNum === 1 ? 'scene-tab active' : 'scene-tab';
    if (t2) t2.className = sceneNum === 2 ? 'scene-tab active' : 'scene-tab';
    if (t3) t3.className = sceneNum === 3 ? 'scene-tab active' : 'scene-tab';
    if (t4) t4.className = sceneNum === 4 ? 'scene-tab active' : 'scene-tab';

    if (sceneNum === 2) {
        const s2Input = document.getElementById('s2_answer_input');
        if (s2Input) {
            if (s2TimerInterval && s2TimeLeft > 0) {
                s2Input.disabled = false;
            } else {
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
        }
    } else if (sceneNum === 3) {
        const s3Input = document.getElementById('s3_answer_input');
        if (s3Input) {
            if (s3TimerInterval && s3TimeLeft > 0) {
                s3Input.disabled = false;
                s3Input.placeholder = `Nhập đáp án hàng ngang... (Còn lại ${s3TimeLeft}s)`;
            } else {
                s3Input.disabled = true;
                s3Input.placeholder = "Nhập đáp án hàng ngang";
            }
        }
        if (!s3RoundStartTime) {
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
        }
    } else if (sceneNum === 4) {
        const s4Input = document.getElementById('s4_answer_input');
        if (s4Input) {
            if (s4TimerInterval && s4TimeLeft > 0) {
                s4Input.disabled = false;
            } else {
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
        }
    }
}

function autoSwitchScene(sceneNum) {
    if (!autoSync) return;
    displaySceneView(sceneNum);
}

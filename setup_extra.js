function getApiUrl(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function' && window.getApiUrl !== getApiUrl) {
        return window.getApiUrl(path);
    }
    if (!path) return path;
    if (typeof window === 'undefined') return path;

    if (/^(https?:|blob:|data:)/i.test(path)) {
        return path;
    }

    let customHost = (typeof localStorage !== 'undefined' && localStorage.getItem('ddvq_server_host')) || 
        (typeof URLSearchParams !== 'undefined' && window.location ? new URLSearchParams(window.location.search).get('server') : null);

    if (customHost) {
        let cleanCustom = customHost.replace(/\/$/, '');
        cleanCustom = cleanCustom.replace(/\/DuongDenVinhQuang-main\/?$/i, '');
        let cleanP = path.startsWith('/') ? path : '/' + path;
        cleanP = cleanP.replace(/^\/_api\//, '/api/').replace(/^_\/api\//, '/api/').replace(/^\/_api$/, '/api');
        return cleanCustom + cleanP;
    }

    if (window.location.protocol === 'file:' || !window.location.host) {
        let cleanP = path.startsWith('/') ? path : '/' + path;
        cleanP = cleanP.replace(/^\/_api\//, '/api/').replace(/^_\/api\//, '/api/').replace(/^\/_api$/, '/api');
        return 'http://localhost:3000' + cleanP;
    }

    let cleanPath = path;
    if (cleanPath.startsWith('./')) {
        cleanPath = cleanPath.substring(2);
    }
    cleanPath = cleanPath.replace(/^\/_api\//, '/api/').replace(/^_\/api\//, '/api/').replace(/^_\/api$/, '/api').replace(/^_api\//, 'api/');

    if (cleanPath.startsWith('/api/') || cleanPath === '/api' || cleanPath.startsWith('api/')) {
        return cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
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
window.getApiUrl = getApiUrl;

let controllerConnectedClients = {
    ts1: { connected: false, name: 'Thí sinh 1', lastSeen: 0 },
    ts2: { connected: false, name: 'Thí sinh 2', lastSeen: 0 },
    ts3: { connected: false, name: 'Thí sinh 3', lastSeen: 0 },
    ts4: { connected: false, name: 'Thí sinh 4', lastSeen: 0 },
    host: { connected: false, name: 'Máy MC', lastSeen: 0 },
    projector: { connected: false, name: 'Máy Chiếu', lastSeen: 0 }
};

function updateClientStatusBadges(connectedClients) {
    if (!connectedClients) return;
    Object.keys(connectedClients).forEach(role => {
        if (connectedClients[role]) {
            controllerConnectedClients[role] = {
                ...controllerConnectedClients[role],
                ...connectedClients[role]
            };
        }
    });

    const roles = ['ts1', 'ts2', 'ts3', 'ts4', 'host', 'projector'];
    const now = Date.now();

    roles.forEach(role => {
        const badge = document.getElementById(`status_badge_${role}`);
        const info = controllerConnectedClients[role];
        const isRecentlyActive = info && (info.connected || (info.lastSeen && (now - info.lastSeen < 8000)));

        if (badge) {
            if (isRecentlyActive) {
                badge.className = 'status-indicator connected';
                badge.innerHTML = '🟢 Đã kết nối';
                badge.style.color = '#16a34a';
                badge.style.background = '#dcfce7';
                badge.style.borderColor = '#86efac';
            } else {
                badge.className = 'status-indicator disconnected';
                badge.innerHTML = '🔴 Chưa kết nối';
                badge.style.color = '#dc2626';
                badge.style.background = '#fee2e2';
                badge.style.borderColor = '#fca5a5';
            }
        }
    });

    if (controllerConnectedClients.projector) {
        const isProjConn = controllerConnectedClients.projector.connected || (controllerConnectedClients.projector.lastSeen && (now - controllerConnectedClients.projector.lastSeen < 8000));
        updateProjectorStatus(isProjConn);
    }
}

function getClientRoleLabel(role) {
    if (role === 'ts1') return 'Thí sinh 1';
    if (role === 'ts2') return 'Thí sinh 2';
    if (role === 'ts3') return 'Thí sinh 3';
    if (role === 'ts4') return 'Thí sinh 4';
    if (role === 'players') return 'Tất cả 4 Thí sinh';
    if (role === 'host') return 'Máy MC (Host)';
    if (role === 'projector') return 'Máy Chiếu';
    if (role === 'graphic') return 'Màn hình Graphic';
    if (role === 'all') return 'Tất cả các máy / vai trò';
    return role;
}

window.reloadClientSlot = function(role) {
    const label = getClientRoleLabel(role);
    const payload = {
        type: 'RELOAD_CLIENT',
        target: role,
        role: role,
        contestantId: (role && role.startsWith('ts')) ? parseInt(role.replace('ts', '')) : null,
        timestamp: Date.now()
    };
    sendToProjector('RELOAD_CLIENT', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast(`🔄 Đã gửi yêu cầu Tải lại (Reload) cho ${label}!`);
};

window.kickClientSlot = function(role) {
    const label = getClientRoleLabel(role);
    const contestantId = (role && role.startsWith('ts')) ? parseInt(role.replace('ts', '')) : null;
    const payload = {
        type: 'KICK_CLIENT',
        target: role,
        role: role,
        contestantId: contestantId,
        timestamp: Date.now()
    };

    // 1. Reset local state in controller immediately
    if (controllerConnectedClients[role]) {
        controllerConnectedClients[role].connected = false;
        controllerConnectedClients[role].lastSeen = 0;
        controllerConnectedClients[role].name = '';
    }
    const badge = document.getElementById(`status_badge_${role}`);
    if (badge) {
        badge.className = 'status-indicator disconnected';
        badge.innerHTML = '🔴 Chưa kết nối';
        badge.style.color = '#dc2626';
        badge.style.background = '#fee2e2';
        badge.style.borderColor = '#fca5a5';
    }

    // 2. Broadcast kick action
    sendToProjector('KICK_CLIENT', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    showToast(`🚫 Đã ngắt kết nối / mời ra slot ${label}!`);
};

function computeSlotAuth(masterAuth, slot) {
    if (!masterAuth) masterAuth = '123456';
    let hash = 5381;
    const str = `${masterAuth}_SLOT_${slot}_DDVQ2026_SECRET`;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const pin = Math.abs(hash % 900000) + 100000;
    return `${pin}`;
}

function getSlotAuth(slot) {
    if (!slot || slot < 1 || slot > 4) {
        const authInput = document.getElementById('room_auth_input');
        return (authInput ? authInput.value.trim() : '') || localStorage.getItem('ddvq_room_auth') || '123456';
    }
    let slotAuths = {};
    try {
        slotAuths = JSON.parse(localStorage.getItem('ddvq_slot_auths') || '{}');
    } catch(e) {}

    if (slotAuths[slot]) {
        return slotAuths[slot];
    }
    const authInput = document.getElementById('room_auth_input');
    const masterAuth = (authInput ? authInput.value.trim() : '') || localStorage.getItem('ddvq_room_auth') || '123456';
    return computeSlotAuth(masterAuth, slot);
}

function getAllSlotAuths() {
    return {
        1: getSlotAuth(1),
        2: getSlotAuth(2),
        3: getSlotAuth(3),
        4: getSlotAuth(4)
    };
}

function updateRoomCodeFromController(isRandomGen = false) {
    const input = document.getElementById('room_code_input');
    const authInput = document.getElementById('room_auth_input');
    if (!input) return;
    const newCode = input.value.trim().toUpperCase() || 'DDVQ2026';
    const newAuth = (authInput ? authInput.value.trim() : '') || '123456';
    input.value = newCode;
    if (authInput) authInput.value = newAuth;
    localStorage.setItem('ddvq_room_code', newCode);
    localStorage.setItem('ddvq_room_auth', newAuth);

    const slotAuths = getAllSlotAuths();
    localStorage.setItem('ddvq_slot_auths', JSON.stringify(slotAuths));

    const badge = document.getElementById('room_code_badge');
    if (badge) badge.innerText = `Đang hoạt động: ${newCode} | Pass MC: ${newAuth}`;

    updateAllLinkPreviews();

    const payload = {
        type: 'SET_ROOM_CODE',
        roomCode: newCode,
        roomAuth: newAuth,
        slotAuth: slotAuths,
        auth: newAuth
    };

    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                if (typeof showToast === 'function') {
                    showToast(isRandomGen ? `🎲 Đã tạo mới & ngẫu nhiên Mã Phòng (${newCode}) và 4 Auth riêng biệt!` : `✅ Đã cập nhật Mã Phòng: ${newCode}`);
                }
            }
        })
        .catch(err => {
            console.error("Room code update error:", err);
        });
    } else {
        if (typeof showToast === 'function') {
            showToast(isRandomGen ? `🎲 Đã tạo mới & ngẫu nhiên Mã Phòng (${newCode}) và 4 Auth riêng biệt!` : `✅ Đã cập nhật Mã Phòng: ${newCode}`);
        }
    }
}

function getPlayerBaseUrl() {
    const sel = document.getElementById('link_domain_select');
    const customInp = document.getElementById('custom_domain_input');
    const val = sel ? sel.value : 'current';

    if (val === 'acestudio') {
        return 'https://acestudio.mooo.com';
    } else if (val === 'render') {
        return 'https://duongdenvinhquang.onrender.com';
    } else if (val === 'current') {
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
            return window.location.origin;
        }
        return 'https://duongdenvinhquang.onrender.com';
    } else if (val === 'custom') {
        let customVal = (customInp ? customInp.value.trim() : '');
        if (!customVal) customVal = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://duongdenvinhquang.onrender.com';
        if (!customVal.startsWith('http://') && !customVal.startsWith('https://')) {
            customVal = 'http://' + customVal;
        }
        return customVal.replace(/\/+$/, '');
    }
    return (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://duongdenvinhquang.onrender.com';
}

function onLinkDomainSelectChange() {
    const sel = document.getElementById('link_domain_select');
    const customInp = document.getElementById('custom_domain_input');
    if (customInp) {
        customInp.style.display = (sel && sel.value === 'custom') ? 'inline-block' : 'none';
    }
    updateRoomCodeFromController();
}

function generateRandomRoomCredentials() {
    // Generate new random 4-digit room code
    const randomCode = 'DDVQ' + Math.floor(1000 + Math.random() * 9000);
    // Generate new random 6-digit master password for MC
    const randomAuth = '' + Math.floor(100000 + Math.random() * 900000);

    // Generate 4 completely distinct random 6-digit PINs for TS1, TS2, TS3, TS4
    const generatedPins = new Set();
    generatedPins.add(randomAuth);
    const newSlotAuths = {};
    for (let i = 1; i <= 4; i++) {
        let pin;
        do {
            pin = '' + Math.floor(100000 + Math.random() * 900000);
        } while (generatedPins.has(pin));
        generatedPins.add(pin);
        newSlotAuths[i] = pin;
    }

    localStorage.setItem('ddvq_slot_auths', JSON.stringify(newSlotAuths));
    localStorage.setItem('ddvq_room_code', randomCode);
    localStorage.setItem('ddvq_room_auth', randomAuth);

    const roomInput = document.getElementById('room_code_input');
    const authInput = document.getElementById('room_auth_input');
    if (roomInput) roomInput.value = randomCode;
    if (authInput) authInput.value = randomAuth;

    // Reset all client status indicators in Controller
    for (let i = 1; i <= 4; i++) {
        const role = `ts${i}`;
        if (controllerConnectedClients[role]) {
            controllerConnectedClients[role].connected = false;
            controllerConnectedClients[role].lastSeen = 0;
            controllerConnectedClients[role].name = '';
        }
        const badge = document.getElementById(`status_badge_${role}`);
        if (badge) {
            badge.className = 'status-indicator disconnected';
            badge.innerHTML = '🔴 Chưa kết nối';
            badge.style.color = '#dc2626';
            badge.style.background = '#fee2e2';
            badge.style.borderColor = '#fca5a5';
        }
    }

    updateRoomCodeFromController(true);

    // Broadcast kick to all old sessions so players cannot use the old room/auth
    const kickPayload = {
        type: 'KICK_CLIENT',
        target: 'all',
        role: 'all',
        timestamp: Date.now()
    };
    sendToProjector('KICK_CLIENT', kickPayload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(kickPayload);
    }
}

function getPlayerDirectLink(slot) {
    const roomInput = document.getElementById('room_code_input');
    const code = (roomInput ? roomInput.value.trim().toUpperCase() : '') || localStorage.getItem('ddvq_room_code') || 'DDVQ2026';
    const baseUrl = getPlayerBaseUrl();
    
    if (slot && parseInt(slot) >= 1 && parseInt(slot) <= 4) {
        const slotNum = parseInt(slot);
        const slotAuth = getSlotAuth(slotNum);
        return `${baseUrl}/player.html?roomid=${encodeURIComponent(code)}&slot=${slotNum}&id=${slotNum}&auth=${encodeURIComponent(slotAuth)}`;
    }
    const authInput = document.getElementById('room_auth_input');
    const masterAuth = (authInput ? authInput.value.trim() : '') || localStorage.getItem('ddvq_room_auth') || '123456';
    return `${baseUrl}/player.html?roomid=${encodeURIComponent(code)}&auth=${encodeURIComponent(masterAuth)}`;
}

function copyPlayerDirectLink(slot) {
    const link = getPlayerDirectLink(slot);
    const label = slot ? `Link Thí sinh ${slot}` : 'Link Mời Thí sinh';
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            if (typeof showToast === 'function') showToast(`✅ Đã sao chép ${label}:\n${link}`);
            else alert(`Đã sao chép ${label}:\n${link}`);
        }).catch(() => {
            prompt(`Sao chép ${label}:`, link);
        });
    } else {
        prompt(`Sao chép ${label}:`, link);
    }
}

function openPlayerDirectLink(slot) {
    const link = getPlayerDirectLink(slot);
    window.open(link, '_blank');
}

function showPlayerQrModal(slot) {
    const link = getPlayerDirectLink(slot);
    const modal = document.getElementById('player_qr_modal');
    const img = document.getElementById('player_qr_img');
    const linkText = document.getElementById('player_qr_link_text');
    const titleText = document.getElementById('player_qr_title');

    if (titleText) {
        titleText.innerText = slot ? `📱 MÃ QR CHO THÍ SINH ${slot}` : '📱 MÃ QR CHO THÍ SINH VÀO THI';
    }
    if (linkText) {
        linkText.innerText = link;
    }
    if (img) {
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(link)}`;
    }
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closePlayerQrModal() {
    const modal = document.getElementById('player_qr_modal');
    if (modal) modal.style.display = 'none';
}

function updateAllLinkPreviews() {
    const linkPreview = document.getElementById('player_direct_link_preview');
    if (linkPreview) {
        linkPreview.innerText = getPlayerDirectLink();
    }
    for (let i = 1; i <= 4; i++) {
        const slotPreview = document.getElementById(`slot_link_preview_${i}`);
        if (slotPreview) {
            slotPreview.innerText = getPlayerDirectLink(i);
        }
        const authBadge = document.getElementById(`slot_auth_badge_${i}`);
        if (authBadge) {
            authBadge.innerText = `Auth: ${getSlotAuth(i)}`;
        }
        const titleEl = document.getElementById(`controller_ts${i}_link_title`);
        if (titleEl && typeof gameData !== 'undefined' && gameData.contestants && gameData.contestants[i - 1]) {
            const name = gameData.contestants[i - 1].name || `Thí sinh ${i}`;
            titleEl.innerText = `👤 TS ${i}: ${name}`;
        }
    }
}

let currentControllerAudio = null;

function playSelectedSoundController() {
    const select = document.getElementById('controller_sound_select');
    if (!select) return;
    const soundFile = select.value;
    if (!soundFile) return;

    if (currentControllerAudio) {
        try { currentControllerAudio.pause(); } catch(e) {}
        currentControllerAudio = null;
    }

    sendToProjector('PLAY_SOUND', { sound: soundFile });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({ type: 'PLAY_SOUND', sound: soundFile, timestamp: Date.now() });
    }
    if (typeof showToast === 'function') showToast(`Đã phát âm thanh trên Máy chiếu: ${soundFile}`);
}

function playCustomSoundController() {
    const inputEl = document.getElementById('controller_custom_sound_url');
    if (!inputEl || !inputEl.value || !inputEl.value.trim()) {
        if (typeof showToast === 'function') showToast("Chưa chọn / tải lên tệp âm thanh bổ sung!");
        return;
    }
    const soundFile = inputEl.value.trim();

    if (currentControllerAudio) {
        try { currentControllerAudio.pause(); } catch(e) {}
        currentControllerAudio = null;
    }

    sendToProjector('PLAY_SOUND', { sound: soundFile });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({ type: 'PLAY_SOUND', sound: soundFile, timestamp: Date.now() });
    }
    if (typeof showToast === 'function') showToast(`Đã phát âm thanh tải lên trên Máy chiếu`);
}

function stopSoundController() {
    if (currentControllerAudio) {
        try { currentControllerAudio.pause(); } catch(e) {}
        currentControllerAudio = null;
    }
    sendToProjector('STOP_SOUND');
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({ type: 'STOP_SOUND', timestamp: Date.now() });
    }
    if (typeof showToast === 'function') showToast('Đã dừng âm thanh trên Máy chiếu');
}

function respondToStateRequest() {
    let timerPayload = null;
    if (window.currentActiveTimer) {
        const remaining = Math.max(0, Math.ceil((window.currentActiveTimer.targetTime - Date.now()) / 1000));
        if (remaining > 0) {
            timerPayload = {
                ...window.currentActiveTimer,
                remaining: remaining
            };
        } else {
            window.currentActiveTimer = null;
            try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
        }
    }

    let qText = '';
    let qIdx = 1;
    if (window.currentActiveRound === 'XUAT_PHAT') {
        const questions = gameData.xuatPhat ? (gameData.xuatPhat[currentXuatPhatDe] || []) : [];
        const currentQ = questions[currentXuatPhatQIndex] || { q: '', a: '' };
        qText = currentQ.q || '';
        qIdx = currentXuatPhatQIndex + 1;
    } else if (window.currentActiveRound === 'RA_KHOI') {
        const qItem = gameData.raKhoi ? (gameData.raKhoi[(typeof currentRKQuestion !== 'undefined' ? currentRKQuestion : 1) - 1] || { q: '', a: '' }) : { q: '', a: '' };
        qText = qItem.q || '';
        qIdx = typeof currentRKQuestion !== 'undefined' ? currentRKQuestion : 1;
    } else if (window.currentActiveRound === 'VUOT_SONG') {
        const row = typeof currentVSRow !== 'undefined' ? currentVSRow : 0;
        if (row >= 1 && row <= 4) {
            qText = gameData.vuotSong?.[`h${row}`]?.q || '';
        } else if (row === 5) {
            qText = gameData.vuotSong?.center?.q || '';
        }
        qIdx = row;
    } else if (window.currentActiveRound === 'VINH_QUANG') {
        const pack = typeof currentVinhQuangPack !== 'undefined' ? currentVinhQuangPack : (typeof currentVQPack !== 'undefined' ? currentVQPack : 20);
        const qIdxVQ = typeof currentVinhQuangIndex !== 'undefined' ? currentVinhQuangIndex : (typeof currentVQQuestionIndex !== 'undefined' ? currentVQQuestionIndex : 0);
        const packList = gameData.vinhQuang ? (gameData.vinhQuang[pack] || []) : [];
        const qItem = packList[qIdxVQ] || { q: '', a: '' };
        qText = (window.vqQuestionIsShown || window.currentActiveTimer?.round === 'VINH_QUANG') ? (currentVQQuestionText || qItem.q || '') : '';
        qIdx = qIdxVQ + 1;
    }

    const statePayload = {
        type: 'FULL_STATE_SYNC',
        activeRound: window.currentActiveRound || 'XUAT_PHAT',
        currentRound: window.currentActiveRound || 'XUAT_PHAT',
        currentTimer: timerPayload,
        questionText: qText,
        questionIndex: qIdx,
        contestants: gameData.contestants,
        vuotSong: gameData.vuotSong,
        vuotSongRow: typeof currentVSRow !== 'undefined' ? currentVSRow : 0,
        scoreboardThumbnailStates: window.scoreboardThumbnailStates,
        timestamp: Date.now()
    };

    sendToProjector('FULL_STATE_SYNC', statePayload);
}

try {
    if (typeof BroadcastChannel !== 'undefined') {
        controllerChannel = new BroadcastChannel('ddvq_game_channel');
        controllerChannel.onmessage = function(event) {
            if (!event.data) return;
            if (event.data.type === 'REQUEST_CURRENT_STATE') {
                respondToStateRequest();
            } else if (event.data.type === 'PROJECTOR_READY' || event.data.type === 'PROJECTOR_PONG') {
                lastProjectorPing = Date.now();
                updateProjectorStatus(true);
            } else if (event.data.type === 'PLAYER_SUBMIT_ANSWER' || event.data.type === 'PLAYER_RING_BELL' || event.data.type === 'RING_BELL') {
                handleIncomingPlayerAnswer(event.data);
            } else if (event.data.type === 'CLIENT_STATUS_UPDATE' && event.data.connectedClients) {
                updateClientStatusBadges(event.data.connectedClients);
            } else if (event.data.type === 'VINH_QUANG_SELECT_PACK_FROM_PROJECTOR') {
                if (typeof onClickVQChonGoiDiem === 'function') {
                    onClickVQChonGoiDiem(event.data.pack);
                }
            } else if (event.data.type === 'CLIENT_HEARTBEAT' || event.data.type === 'CLIENT_JOIN') {
                const role = event.data.role || (event.data.contestantId ? `ts${event.data.contestantId}` : null);
                if (role && controllerConnectedClients[role]) {
                    controllerConnectedClients[role].connected = true;
                    controllerConnectedClients[role].lastSeen = Date.now();
                    if (event.data.name) controllerConnectedClients[role].name = event.data.name;
                    updateClientStatusBadges(controllerConnectedClients);
                }
            }
        };
    }
} catch(e) {
    console.warn("BroadcastChannel restricted:", e);
}

// Server-Sent Events (SSE) fallback if supabase-sync.js has not initialized it
if (typeof EventSource !== 'undefined' && !window.syncChannel && typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
    try {
        const sseSource = new EventSource(getApiUrl('/api/events'));
        sseSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && (data.type === 'PROJECTOR_READY' || data.type === 'PROJECTOR_PONG')) {
                    lastProjectorPing = Date.now();
                    updateProjectorStatus(true);
                } else if (data && (data.type === 'PLAYER_SUBMIT_ANSWER' || data.type === 'PLAYER_RING_BELL' || data.type === 'RING_BELL' || data.playerAnswers)) {
                    handleIncomingPlayerAnswer(data);
                } else if (data && data.type === 'CLIENT_STATUS_UPDATE') {
                    updateClientStatusBadges(data.connectedClients);
                } else if (data && data.connectedClients) {
                    updateClientStatusBadges(data.connectedClients);
                } else if (data && data.roomCode) {
                    localStorage.setItem('ddvq_room_code', data.roomCode);
                    if (data.roomAuth) localStorage.setItem('ddvq_room_auth', data.roomAuth);
                    const input = document.getElementById('room_code_input');
                    const authInput = document.getElementById('room_auth_input');
                    const badge = document.getElementById('room_code_badge');
                    if (input && !input.matches(':focus')) input.value = data.roomCode;
                    if (authInput && data.roomAuth && !authInput.matches(':focus')) authInput.value = data.roomAuth;
                    if (badge) badge.innerText = `Đang hoạt động: ${data.roomCode} | Pass: ${data.roomAuth || '123456'}`;
                    updateAllLinkPreviews();
                }
            } catch(e) {}
        };
    } catch(e) {
        console.warn("SSE connection error:", e);
    }
}

window.addEventListener('storage', function(event) {
    if (event.key === 'ddvq_projector_status' && event.newValue) {
        lastProjectorPing = Date.now();
        updateProjectorStatus(true);
    } else if (event.key === 'ddvq_client_heartbeat' && event.newValue) {
        try {
            const data = JSON.parse(event.newValue);
            if (data && data.role) {
                const role = data.role;
                if (controllerConnectedClients[role]) {
                    controllerConnectedClients[role].connected = true;
                    controllerConnectedClients[role].lastSeen = Date.now();
                    if (data.name) controllerConnectedClients[role].name = data.name;
                    updateClientStatusBadges(controllerConnectedClients);
                }
            }
        } catch(e) {}
    } else if (event.key === 'ddvq_latest_action' && event.newValue) {
        try {
            const data = JSON.parse(event.newValue);
            if (data && (data.type === 'PLAYER_SUBMIT_ANSWER' || data.type === 'PLAYER_RING_BELL' || data.type === 'RING_BELL' || data.playerAnswers)) {
                handleIncomingPlayerAnswer(data);
            }
        } catch(e) {}
    }
});

window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'REQUEST_CURRENT_STATE') {
        respondToStateRequest();
    } else if (event.data.type === 'PROJECTOR_READY' || event.data.type === 'PROJECTOR_PONG') {
        lastProjectorPing = Date.now();
        updateProjectorStatus(true);
    } else if (event.data.type === 'PLAYER_SUBMIT_ANSWER' || event.data.type === 'PLAYER_RING_BELL' || event.data.type === 'RING_BELL') {
        handleIncomingPlayerAnswer(event.data);
    }
});

// Single initial state fetch on controller startup with strict one-time guard
let hasFetchedInitialServerState = false;
let lastStateFetchTimestamp = 0;

function fetchInitialServerState() {
    const now = Date.now();
    if (hasFetchedInitialServerState || (now - lastStateFetchTimestamp < 15000)) return;
    hasFetchedInitialServerState = true;
    lastStateFetchTimestamp = now;

    if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        fetch(getApiUrl('/api/state'))
            .then(res => res.json())
            .then(data => {
                if (data) {
                    if (data.playerAnswers) handleIncomingPlayerAnswer(data);
                    if (data.connectedClients) updateClientStatusBadges(data.connectedClients);
                    if (data.roomCode) {
                        localStorage.setItem('ddvq_room_code', data.roomCode);
                        if (data.roomAuth) localStorage.setItem('ddvq_room_auth', data.roomAuth);
                        const input = document.getElementById('room_code_input');
                        const authInput = document.getElementById('room_auth_input');
                        const badge = document.getElementById('room_code_badge');
                        if (input && !input.matches(':focus')) input.value = data.roomCode;
                        if (authInput && data.roomAuth && !authInput.matches(':focus')) authInput.value = data.roomAuth;
                        if (badge) badge.innerText = `Đang hoạt động: ${data.roomCode} | Pass: ${data.roomAuth || '123456'}`;
                        const linkPreview = document.getElementById('player_direct_link_preview');
                        if (linkPreview && typeof getPlayerDirectLink === 'function') linkPreview.innerText = getPlayerDirectLink();
                    }
                }
            })
            .catch(() => {});
    }
}
setTimeout(fetchInitialServerState, 500);

setInterval(() => {
    if (Date.now() - lastProjectorPing > 8000) {
        updateProjectorStatus(false);
    }
    // Refresh status badges with time-based check locally
    updateClientStatusBadges(controllerConnectedClients);
}, 3000);

function updateProjectorStatus(isConnected) {
    const badge = document.getElementById('projector_status_badge');
    if (badge) {
        if (isConnected) {
            badge.innerHTML = '🟢 Máy chiếu đã kết nối';
            badge.style.color = '#22c55e';
            badge.style.background = 'rgba(34,197,94,0.1)';
            badge.style.borderColor = 'rgba(34,197,94,0.2)';
        } else {
            badge.innerHTML = '🔴 Chưa kết nối máy chiếu';
            badge.style.color = '#ef4444';
            badge.style.background = 'rgba(239,68,68,0.1)';
            badge.style.borderColor = 'rgba(239,68,68,0.2)';
        }
    }
}

function sendToProjector(type, payload = {}) {
    let round = payload.activeRound || payload.round || window.currentActiveRound;
    if (type.startsWith('XUAT_PHAT_')) round = 'XUAT_PHAT';
    else if (type.startsWith('RA_KHOI_')) round = 'RA_KHOI';
    else if (type.startsWith('VUOT_SONG_')) round = 'VUOT_SONG';
    else if (type.startsWith('VINH_QUANG_')) round = 'VINH_QUANG';
    else if (type === 'SWITCH_VIEW') {
        if (payload.viewNum === 1) round = 'XUAT_PHAT';
        else if (payload.viewNum === 2) round = 'RA_KHOI';
        else if (payload.viewNum === 3 || payload.viewNum === 4 || payload.viewNum === 5) round = 'VUOT_SONG';
        else if (payload.viewNum === 6 || payload.viewNum === 7 || payload.viewNum === 8) round = 'VINH_QUANG';
    }
    if (round) {
        window.currentActiveRound = round;
        try { localStorage.setItem('ddvq_active_round', round); } catch(e) {}
    }

    if (type.endsWith('_START_TIMER') || type === 'VINH_QUANG_START_TIMER_5S' || type === 'XUAT_PHAT_BAT_DAU_CAU_HOI') {
        const dur = payload.duration || (type === 'VINH_QUANG_START_TIMER_5S' ? 5 : (round === 'RA_KHOI' ? 30 : (round === 'VUOT_SONG' ? 20 : 60)));
        const startTime = payload.startTime || Date.now();
        payload.startTime = startTime;
        payload.duration = dur;
        window.currentActiveTimer = {
            round: round,
            duration: dur,
            startTime: startTime,
            targetTime: startTime + dur * 1000,
            questionText: payload.questionText || ''
        };
        try { localStorage.setItem('ddvq_current_timer', JSON.stringify(window.currentActiveTimer)); } catch(e) {}
    } else if (
        type.endsWith('_RESET') ||
        type.includes('SHOW_QUESTION') ||
        type.includes('SELECT_ROW') ||
        type.includes('SELECT_PACK') ||
        type === 'STOP_TIMER' ||
        type === 'RESET_ALL_DATA'
    ) {
        window.currentActiveTimer = null;
        try { localStorage.removeItem('ddvq_current_timer'); } catch(e) {}
    }

    const message = {
        type,
        activeRound: round,
        round: round,
        ...payload,
        timestamp: Date.now(),
        id: Math.random().toString(36).substring(2, 9),
        _fromNetwork: true
    };

    if (typeof sendSupabaseAction === 'function') {
        try { sendSupabaseAction(message); } catch(e) {}
    }
    if (controllerChannel) {
        try {
            controllerChannel.postMessage(message);
        } catch(e) {
            console.warn("Error posting to projector channel:", e);
        }
    }

    try {
        localStorage.setItem('ddvq_latest_action', JSON.stringify(message));
    } catch(e) {}

    try {
        if (projectorWindow && !projectorWindow.closed) {
            projectorWindow.postMessage(message, '*');
        } else if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, '*');
        }
    } catch(e) {}

    if (!window.__serverActionApiUnavailable && typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
        const isWsActive = (window.globalSyncChannel && window.globalSyncChannel.isWsConnected);
        if (!isWsActive && !window.__recentActionSentMap?.has(type + '_' + (payload.turnIndex || payload.round || ''))) {
            window.__recentActionSentMap = window.__recentActionSentMap || new Map();
            const actionKey = type + '_' + (payload.turnIndex || payload.round || '');
            window.__recentActionSentMap.set(actionKey, Date.now());
            setTimeout(() => window.__recentActionSentMap?.delete(actionKey), 800);

            try {
                fetch(getApiUrl('/api/action'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(message)
                }).then(res => {
                    if (!res.ok) window.__serverActionApiUnavailable = true;
                }).catch(() => {
                    window.__serverActionApiUnavailable = true;
                });
            } catch(e) {
                window.__serverActionApiUnavailable = true;
            }
        }
    }
}

function promptScore(idx) {
    if (!gameData.contestants || !gameData.contestants[idx - 1]) return;
    const current = gameData.contestants[idx - 1]?.score || 0;
    const newScore = prompt(`Nhập điểm cho Thí sinh ${idx}:`, current);
    if (newScore !== null && !isNaN(parseInt(newScore))) {
        gameData.contestants[idx - 1].score = parseInt(newScore);
        syncContestantsUI();
        saveAllData();
        if (typeof showToast === 'function') {
            showToast(`Đã cập nhật điểm Thí sinh ${idx}: ${newScore}`);
        }
    }
}
window.promptScore = promptScore;

function changeScore(idx, delta) {
    if (!gameData.contestants || !gameData.contestants[idx - 1]) return;
    const current = gameData.contestants[idx - 1]?.score || 0;
    gameData.contestants[idx - 1].score = current + delta;
    syncContestantsUI();
    saveAllData();
    if (typeof showToast === 'function') {
        showToast(`Đã ${delta >= 0 ? '+' + delta : delta} điểm cho Thí sinh ${idx}`);
    }
}
window.changeScore = changeScore;

// Floating upload progress manager
let activeUploadProgressHud = null;

function showUploadProgress(fileName, percent, speedStr, etaStr) {
    let hud = document.getElementById('upload_progress_hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'upload_progress_hud';
        hud.style.position = 'fixed';
        hud.style.bottom = '24px';
        hud.style.right = '24px';
        hud.style.zIndex = '99999';
        hud.style.background = '#0f172a';
        hud.style.color = '#ffffff';
        hud.style.padding = '14px 18px';
        hud.style.borderRadius = '10px';
        hud.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)';
        hud.style.border = '1px solid #38bdf8';
        hud.style.minWidth = '280px';
        hud.style.maxWidth = '360px';
        hud.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        hud.style.transition = 'all 0.3s ease';
        document.body.appendChild(hud);
    }
    hud.style.display = 'block';
    hud.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-weight: 700; font-size: 13px; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                ⚡ TẢI VIDEO TỐC ĐỘ CAO
            </span>
            <span style="font-weight: 800; font-size: 14px; color: #4ade80;">${percent}%</span>
        </div>
        <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            📁 ${fileName}
        </div>
        <div style="width: 100%; height: 8px; background: #334155; border-radius: 4px; overflow: hidden; margin-bottom: 6px;">
            <div style="width: ${percent}%; height: 100%; background: linear-gradient(90deg, #0284c7, #38bdf8, #4ade80); border-radius: 4px; transition: width 0.15s ease;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1;">
            <span>Tốc độ: <strong>${speedStr || '-- MB/s'}</strong></span>
            <span>${etaStr ? 'Còn ' + etaStr : ''}</span>
        </div>
    `;
}

function hideUploadProgress(successMsg) {
    const hud = document.getElementById('upload_progress_hud');
    if (hud) {
        if (successMsg) {
            hud.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #4ade80; font-weight: bold; font-size: 13px;">
                    <span>✅</span> <span>${successMsg}</span>
                </div>
            `;
            setTimeout(() => {
                hud.style.opacity = '0';
                setTimeout(() => { hud.style.display = 'none'; hud.style.opacity = '1'; }, 300);
            }, 2500);
        } else {
            hud.style.display = 'none';
        }
    }
}

// Optimized Parallel Chunked Media Uploader
async function uploadMediaOptimized(file, targetInputId) {
    if (!file) return;

    // Instant local binding for 0ms lag
    const tempBlobUrl = URL.createObjectURL(file);
    const inputEl = document.getElementById(targetInputId);
    if (inputEl) {
        inputEl.value = tempBlobUrl;
        inputEl.dispatchEvent(new Event('change'));
    }
    saveAllData();

    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v|avi|mkv)$/i);

    // Fast path for small files (< 3MB)
    if (file.size <= 3 * 1024 * 1024) {
        showUploadProgress(file.name, 30, 'Đang gửi...', '');
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.url) {
                if (inputEl) {
                    inputEl.value = data.url;
                    inputEl.dispatchEvent(new Event('change'));
                }
                saveAllData();
                hideUploadProgress(`Tải xong ${file.name} (${fileSizeMB} MB)`);
                showToast(`Đã tải lên thành công: ${file.name}`);
                return data.url;
            }
        } catch (err) {
            console.warn('Single upload error, retaining local blob:', err);
            hideUploadProgress(`Đã dùng file cục bộ: ${file.name}`);
            return tempBlobUrl;
        }
    }

    // High performance Chunked Parallel Streaming for large videos / audio
    const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const uploadId = 'up_' + Date.now() + '_' + Math.round(Math.random() * 1e8);
    let uploadedBytes = 0;
    const startTime = Date.now();

    showUploadProgress(file.name, 0, 'Khởi động...', 'tính toán...');

    // Chunk queue worker with 3 concurrent connections
    const CONCURRENCY = 3;
    let nextChunkIndex = 0;
    let completedChunks = 0;
    let hasError = false;

    async function uploadNextChunk() {
        while (nextChunkIndex < totalChunks && !hasError) {
            const chunkIndex = nextChunkIndex++;
            const start = chunkIndex * CHUNK_SIZE;
            const end = Math.min(file.size, start + CHUNK_SIZE);
            const chunkBlob = file.slice(start, end);
            const chunkSize = end - start;

            let attempts = 0;
            let success = false;
            while (attempts < 3 && !success && !hasError) {
                attempts++;
                try {
                    const formData = new FormData();
                    formData.append('chunk', chunkBlob, `chunk_${chunkIndex}`);
                    formData.append('uploadId', uploadId);
                    formData.append('chunkIndex', chunkIndex.toString());
                    formData.append('totalChunks', totalChunks.toString());

                    const res = await fetch('/api/upload-chunk', {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.success) {
                            success = true;
                            uploadedBytes += chunkSize;
                            completedChunks++;

                            const elapsedSec = (Date.now() - startTime) / 1000;
                            const speedBytesSec = elapsedSec > 0 ? (uploadedBytes / elapsedSec) : 0;
                            const speedMBs = (speedBytesSec / 1024 / 1024).toFixed(1) + ' MB/s';
                            const percent = Math.min(99, Math.round((uploadedBytes / file.size) * 100));
                            const remainingBytes = file.size - uploadedBytes;
                            const etaSec = speedBytesSec > 0 ? Math.ceil(remainingBytes / speedBytesSec) : 0;
                            const etaStr = etaSec > 0 ? `${etaSec}s` : '1s';

                            showUploadProgress(file.name, percent, speedMBs, etaStr);
                        }
                    }
                } catch (e) {
                    console.warn(`Chunk ${chunkIndex} attempt ${attempts} error:`, e);
                    if (attempts >= 3) {
                        hasError = true;
                        throw e;
                    }
                    await new Promise(r => setTimeout(r, 400));
                }
            }
        }
    }

    try {
        const workers = Array.from({ length: Math.min(CONCURRENCY, totalChunks) }, () => uploadNextChunk());
        await Promise.all(workers);

        if (hasError || completedChunks < totalChunks) {
            throw new Error("Không thể tải hết các phần của video");
        }

        showUploadProgress(file.name, 99, 'Hoàn tất ghép nối...', '0s');

        // Complete and merge on server
        const completeRes = await fetch('/api/upload-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId: uploadId,
                originalName: file.name,
                totalChunks: totalChunks,
                mediaType: isVideo ? 'rakhoi_video' : 'media'
            })
        });

        const completeData = await completeRes.json();
        if (completeData.success && completeData.url) {
            if (inputEl) {
                inputEl.value = completeData.url;
                inputEl.dispatchEvent(new Event('change'));
            }
            saveAllData();
            hideUploadProgress(`Tải thành công: ${file.name} (${fileSizeMB} MB)`);
            showToast(`⚡ Đã tải lên và tối ưu video thành công: ${file.name}`);
            return completeData.url;
        } else {
            throw new Error(completeData.error || "Lỗi ghép video");
        }
    } catch (err) {
        console.warn("Lỗi upload tối ưu, giữ nguyên link cục bộ:", err);
        hideUploadProgress(`Dùng video cục bộ: ${file.name}`);
        showToast(`Video đã sẵn sàng phát cục bộ: ${file.name}`);
        return tempBlobUrl;
    }
}

function triggerFilePicker(targetInputId, acceptType) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = acceptType || '*/*';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        uploadMediaOptimized(file, targetInputId);
    };
    fileInput.click();
}

// Quick preview modal / popup for any video or media URL
function previewVideoModal(inputIdOrUrl) {
    let url = '';
    const inputEl = document.getElementById(inputIdOrUrl);
    if (inputEl && inputEl.value) {
        url = inputEl.value.trim();
    } else if (typeof inputIdOrUrl === 'string') {
        url = inputIdOrUrl.trim();
    }

    if (!url) {
        showToast('Chưa có đường dẫn hoặc file video để xem thử!');
        return;
    }

    let modal = document.getElementById('video_preview_modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video_preview_modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0, 0, 0, 0.85)';
        modal.style.zIndex = '999999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.backdropFilter = 'blur(6px)';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background: #0f172a; border: 2px solid #38bdf8; border-radius: 12px; padding: 18px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="color: #38bdf8; font-weight: bold; font-size: 15px;">🎬 XEM THỬ VIDEO / MEDIA RA KHƠI</span>
                <button onclick="document.getElementById('video_preview_modal').style.display='none'; const v=document.getElementById('rk_preview_video_tag'); if(v) v.pause();" style="background: #ef4444; color: white; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-weight: bold;">✕ Đóng</button>
            </div>
            <video id="rk_preview_video_tag" src="${url}" controls autoplay style="max-width: 80vw; max-height: 70vh; border-radius: 8px; background: #000000;"></video>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 8px; word-break: break-all;">
                URL: ${url}
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function playIntroVideo(inputIdOrDefault) {
    let src = '';
    const inputEl = document.getElementById(inputIdOrDefault);
    if (inputEl && inputEl.value && inputEl.value.trim()) {
        src = inputEl.value.trim();
    } else if (typeof inputIdOrDefault === 'string') {
        src = inputIdOrDefault.trim();
    }

    if (!src) {
        showToast("Chưa chọn file / URL Ảnh hoặc Video Intro!");
        return;
    }

    const srcLower = src.toLowerCase();
    const isVideo = srcLower.match(/\.(mp4|webm|ogg|mov|m4v)($|\?)/i);
    const mediaType = isVideo ? 'video' : 'image';
    const fullSrc = typeof getApiUrl === 'function' ? getApiUrl(src) : src;

    sendToProjector('PLAY_INTRO_VIDEO', { src: fullSrc, mediaType: mediaType });
    showToast(`Đang phát ${mediaType === 'image' ? 'Ảnh' : 'Video'} Intro trên màn hình máy chiếu!`);
}

function stopIntroVideo() {
    sendToProjector('STOP_INTRO_VIDEO', {});
    showToast("Đã dừng phát Video Intro");
}

window.adjustScore = function(idx, delta) {
    if (!gameData) gameData = {};
    if (!gameData.contestants || !Array.isArray(gameData.contestants)) {
        gameData.contestants = [
            { name: "Thí sinh 1", score: 0 },
            { name: "Thí sinh 2", score: 0 },
            { name: "Thí sinh 3", score: 0 },
            { name: "Thí sinh 4", score: 0 }
        ];
    }
    while (gameData.contestants.length < idx) {
        gameData.contestants.push({ name: `Thí sinh ${gameData.contestants.length + 1}`, score: 0 });
    }
    
    const current = parseInt(gameData.contestants[idx - 1].score) || 0;
    const newScore = current + delta;
    gameData.contestants[idx - 1].score = newScore;
    
    syncContestantsUI();
    saveAllData();
    
    if (typeof showToast === 'function') {
        const contestantName = gameData.contestants[idx - 1].name || `Thí sinh ${idx}`;
        const sign = delta >= 0 ? "+" : "";
        showToast(`Đã điều chỉnh điểm ${contestantName}: ${sign}${delta} (Hiện tại: ${newScore})`);
    }
}

window.adjustScoreAll = function(delta) {
    if (!gameData) gameData = {};
    if (!gameData.contestants || !Array.isArray(gameData.contestants)) {
        gameData.contestants = [
            { name: "Thí sinh 1", score: 0 },
            { name: "Thí sinh 2", score: 0 },
            { name: "Thí sinh 3", score: 0 },
            { name: "Thí sinh 4", score: 0 }
        ];
    }
    for (let i = 1; i <= 4; i++) {
        if (!gameData.contestants[i - 1]) {
            gameData.contestants[i - 1] = { name: `Thí sinh ${i}`, score: 0 };
        }
        gameData.contestants[i - 1].score = (parseInt(gameData.contestants[i - 1].score) || 0) + delta;
    }
    syncContestantsUI();
    saveAllData();
    if (typeof showToast === 'function') {
        showToast(`Đã cộng ${delta} điểm cho cả 4 thí sinh!`);
    }
}

window.promptToAdjustScore = function(delta) {
    if (!gameData || !gameData.contestants) return;
    let msg = `Cộng ${delta} điểm cho thí sinh nào?\n`;
    for (let i = 1; i <= 4; i++) {
        const name = gameData.contestants[i-1]?.name || `Thí sinh ${i}`;
        const currentScore = gameData.contestants[i-1]?.score || 0;
        msg += `Nhấn ${i}: ${name} (${currentScore}đ)\n`;
    }
    const ans = prompt(msg, "1");
    if (ans) {
        const idx = parseInt(ans);
        if (idx >= 1 && idx <= 4) {
            adjustScore(idx, delta);
        } else {
            alert("Số thứ tự không hợp lệ! Vui lòng chọn từ 1 đến 4.");
        }
    }
}

window.vqStars = [false, false, false, false];

window.toggleVQStar = function(idx) {
    const starIndex = idx - 1;
    window.vqStars[starIndex] = !window.vqStars[starIndex];
    const isActive = window.vqStars[starIndex];
    const anyStarActive = window.vqStars.some(s => !!s);
    const btn = document.getElementById(`vq_star_btn_${idx}`);
    if (btn) {
        if (isActive) {
            btn.style.background = "#f1f5f9";
            btn.style.borderColor = "#94a3b8";
            btn.style.color = "#0f172a";
            btn.innerText = "STAR ON";
            showToast(`Thí sinh ${idx} đã chọn NGÔI SAO HY VỌNG!`);
        } else {
            btn.style.background = "#ffffff";
            btn.style.borderColor = "#cbd5e1";
            btn.style.color = "#475569";
            btn.innerText = "STAR OFF";
            showToast(`Đã hủy Ngôi sao hy vọng của Thí sinh ${idx}`);
        }
    }
    sendToProjector('VINH_QUANG_STAR_OF_HOPE', { 
        contestantIndex: idx, 
        active: isActive, 
        hasStar: anyStarActive 
    });
}

window.vqCorrectAnswer = function(idx) {
    let packVal = 20;
    if (typeof currentVQPack !== 'undefined' && currentVQPack) {
        packVal = currentVQPack;
    } else {
        const customVal = prompt("Nhập điểm của câu hỏi Vinh Quang hiện tại (10/20/30):", "20");
        if (customVal !== null && !isNaN(parseInt(customVal))) {
            packVal = parseInt(customVal);
        } else {
            return;
        }
    }
    
    const isStarActive = window.vqStars[idx - 1];
    const pointsToAdd = isStarActive ? packVal * 2 : packVal;
    
    window.adjustScore(idx, pointsToAdd);
    
    if (isStarActive) {
        window.toggleVQStar(idx);
    }
}

window.vqIncorrectAnswer = function(idx) {
    let packVal = 20;
    if (typeof currentVQPack !== 'undefined' && currentVQPack) {
        packVal = currentVQPack;
    } else {
        const customVal = prompt("Nhập điểm của câu hỏi Vinh Quang hiện tại (10/20/30):", "20");
        if (customVal !== null && !isNaN(parseInt(customVal))) {
            packVal = parseInt(customVal);
        } else {
            return;
        }
    }
    
    const isStarActive = window.vqStars[idx - 1];
    const pointsToSubtract = isStarActive ? packVal : Math.round(packVal / 2);
    
    window.adjustScore(idx, -pointsToSubtract);
    
    if (isStarActive) {
        window.toggleVQStar(idx);
    }
}

window.isSummaryShown = false;

function updateTongKetButtonsUI(isShown) {
    const btns = document.querySelectorAll('.btn-tong-ket');
    btns.forEach(btn => {
        if (isShown) {
            btn.innerHTML = 'Ẩn tổng kết';
            btn.style.backgroundColor = '#dc2626';
            btn.style.color = '#ffffff';
            btn.style.borderColor = '#b91c1c';
        } else {
            btn.innerHTML = 'Tổng kết';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
        }
    });
}

function onClickTongKet() {
    if (typeof saveAllData === 'function') saveAllData();
    window.isSummaryShown = !window.isSummaryShown;

    const contestants = [];
    for (let i = 1; i <= 4; i++) {
        const nameInput = document.getElementById(`ts${i}_name`);
        const name = (nameInput && nameInput.value.trim()) || (gameData.contestants && gameData.contestants[i - 1] && gameData.contestants[i - 1].name) || `Thí sinh ${i}`;
        const score = (gameData.contestants && gameData.contestants[i - 1] && typeof gameData.contestants[i - 1].score !== 'undefined') ? gameData.contestants[i - 1].score : 0;
        contestants.push({ id: i, name, score });
    }

    const payload = {
        type: 'TOGGLE_SUMMARY',
        show: window.isSummaryShown,
        contestants: contestants,
        timestamp: Date.now()
    };

    sendToProjector('TOGGLE_SUMMARY', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    updateTongKetButtonsUI(window.isSummaryShown);
}

function onClickPlayIntroVideo(src) {
    playIntroVideo(src);
}

function onClickStopIntroVideo() {
    stopIntroVideo();
}

// Scoreboard Thumbnail State Map (TS1, TS2, TS3, TS4)
window.scoreboardThumbnailStates = (function() {
    const states = { 1: false, 2: false, 3: false, 4: false };
    try {
        for (let c = 1; c <= 4; c++) {
            const savedSelf = localStorage.getItem('ddvq_scoreboard_thumbnail_shown_' + c);
            const savedAll = localStorage.getItem('ddvq_scoreboard_thumbnail_shown');
            if (savedSelf === 'true' || (savedSelf === null && savedAll === 'true')) {
                states[c] = true;
            } else if (savedSelf === 'false') {
                states[c] = false;
            }
        }
    } catch(e) {}
    return states;
})();

function updateScoreboardThumbnailBadges() {
    for (let c = 1; c <= 4; c++) {
        const isShown = !!window.scoreboardThumbnailStates[c];
        const btns = document.querySelectorAll(`#sb_thumb_btn_ts${c}, .sb_thumb_btn_ts${c}`);
        btns.forEach(btn => {
            if (isShown) {
                btn.innerHTML = `TS${c}: Hiện`;
                btn.style.background = '#f1f5f9';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#0f172a';
            } else {
                btn.innerHTML = `TS${c}: Ẩn`;
                btn.style.background = '#ffffff';
                btn.style.borderColor = '#cbd5e1';
                btn.style.color = '#475569';
            }
        });
    }

    const anyShown = Object.values(window.scoreboardThumbnailStates).some(v => !!v);
    const allShown = Object.values(window.scoreboardThumbnailStates).every(v => !!v);
    const tags = document.querySelectorAll('#sb_thumb_status_tag, .sb_thumb_status_tag');
    tags.forEach(tag => {
        if (allShown) {
            tag.innerHTML = 'Trạng thái: Hiện tất cả';
            tag.style.background = '#f1f5f9';
            tag.style.color = '#0f172a';
        } else if (anyShown) {
            tag.innerHTML = 'Trạng thái: Hiện một phần';
            tag.style.background = '#f1f5f9';
            tag.style.color = '#0f172a';
        } else {
            tag.innerHTML = 'Trạng thái: Ẩn tất cả';
            tag.style.background = '#f1f5f9';
            tag.style.color = '#475569';
        }
    });
}

// Toggle Scoreboard Thumbnail (Images/thumbnail.png) for ALL or SPECIFIC contestant
function toggleScoreboardThumbnail(show, contestantId = 'ALL') {
    if (contestantId === 'ALL' || !contestantId) {
        let isShown = false;
        if (show === undefined) {
            const anyHidden = Object.values(window.scoreboardThumbnailStates).some(v => !v);
            isShown = anyHidden;
        } else {
            isShown = show === true;
        }

        for (let c = 1; c <= 4; c++) {
            window.scoreboardThumbnailStates[c] = isShown;
            try { localStorage.setItem('ddvq_scoreboard_thumbnail_shown_' + c, isShown ? 'true' : 'false'); } catch(e){}
        }
        try { localStorage.setItem('ddvq_scoreboard_thumbnail_shown', isShown ? 'true' : 'false'); } catch(e){}

        updateScoreboardThumbnailBadges();

        const payload = {
            type: 'TOGGLE_SCOREBOARD_THUMBNAIL',
            show: isShown,
            contestantId: 'ALL',
            scoreboardThumbnailStates: window.scoreboardThumbnailStates,
            timestamp: Date.now()
        };

        if (typeof sendToProjector === 'function') sendToProjector('TOGGLE_SCOREBOARD_THUMBNAIL', payload);
        if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);
        try { localStorage.setItem('ddvq_latest_action', JSON.stringify(payload)); } catch(e) {}
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                const bc = new BroadcastChannel('ddvq_game_channel');
                bc.postMessage(payload);
            }
        } catch(e) {}

        if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
            fetch(getApiUrl('/api/action'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        }

        if (typeof showToast === 'function') {
            showToast(isShown ? 'Đã HIỂN THỊ Thumbnail cho TẤT CẢ Thí sinh!' : 'Đã ẨN Thumbnail cho TẤT CẢ Thí sinh!');
        }
    } else {
        const cId = parseInt(contestantId);
        if (cId >= 1 && cId <= 4) {
            let isShown = false;
            if (show === undefined) {
                isShown = !window.scoreboardThumbnailStates[cId];
            } else {
                isShown = show === true;
            }

            window.scoreboardThumbnailStates[cId] = isShown;
            try { localStorage.setItem('ddvq_scoreboard_thumbnail_shown_' + cId, isShown ? 'true' : 'false'); } catch(e){}

            updateScoreboardThumbnailBadges();

            const payload = {
                type: 'TOGGLE_SCOREBOARD_THUMBNAIL',
                show: isShown,
                contestantId: cId,
                targetSlot: cId,
                scoreboardThumbnailStates: window.scoreboardThumbnailStates,
                timestamp: Date.now()
            };

            if (typeof sendToProjector === 'function') sendToProjector('TOGGLE_SCOREBOARD_THUMBNAIL', payload);
            if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);
            try { localStorage.setItem('ddvq_latest_action', JSON.stringify(payload)); } catch(e) {}
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('ddvq_game_channel');
                    bc.postMessage(payload);
                }
            } catch(e) {}

            if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
                fetch(getApiUrl('/api/action'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});
            }

            if (typeof showToast === 'function') {
                const contestantName = gameData?.contestants?.[cId - 1]?.name || `Thí sinh ${cId}`;
                showToast(isShown ? `Đã HIỂN THỊ Thumbnail cho ${contestantName} (TS${cId})!` : `Đã ẨN Bảng điểm / Thumbnail của ${contestantName} (TS${cId})!`);
            }
        }
    }
}

// ==========================================
// CÀI ĐẶT ÂM THANH HỆ THỐNG
// ==========================================
window.systemAudioSettings = {
    projectorEnabled: true,
    graphicEnabled: true,
    projectorVolume: 100,
    graphicVolume: 100,
    round3Audio: 'sounds/20sV1.mp3',
    round4Audio: 'sounds/25sV1.mp3'
};

function loadAudioSettings() {
    try {
        const saved = localStorage.getItem('ddvq_audio_settings');
        if (saved) {
            window.systemAudioSettings = Object.assign(window.systemAudioSettings, JSON.parse(saved));
        } else if (typeof gameData !== 'undefined' && gameData && gameData.audioSettings) {
            window.systemAudioSettings = Object.assign(window.systemAudioSettings, gameData.audioSettings);
        }
    } catch(e) {}

    const projCb = document.getElementById('audio_enable_projector');
    if (projCb) projCb.checked = window.systemAudioSettings.projectorEnabled !== false;

    const graphCb = document.getElementById('audio_enable_graphic');
    if (graphCb) graphCb.checked = window.systemAudioSettings.graphicEnabled !== false;

    const projVol = document.getElementById('audio_vol_projector');
    const projVolVal = document.getElementById('audio_vol_proj_val');
    if (projVol) {
        projVol.value = window.systemAudioSettings.projectorVolume ?? 100;
        if (projVolVal) projVolVal.innerText = `${projVol.value}%`;
    }

    const graphVol = document.getElementById('audio_vol_graphic');
    const graphVolVal = document.getElementById('audio_vol_graph_val');
    if (graphVol) {
        graphVol.value = window.systemAudioSettings.graphicVolume ?? 100;
        if (graphVolVal) graphVolVal.innerText = `${graphVol.value}%`;
    }

    const r3Sel = document.getElementById('audio_round3_select');
    if (r3Sel) r3Sel.value = window.systemAudioSettings.round3Audio || 'sounds/20sV1.mp3';

    const r4Sel = document.getElementById('audio_round4_select');
    if (r4Sel) r4Sel.value = window.systemAudioSettings.round4Audio || 'sounds/25sV1.mp3';
}
window.loadAudioSettings = loadAudioSettings;

function onAudioSettingsChange() {
    const projCb = document.getElementById('audio_enable_projector');
    const graphCb = document.getElementById('audio_enable_graphic');
    const projVol = document.getElementById('audio_vol_projector');
    const projVolVal = document.getElementById('audio_vol_proj_val');
    const graphVol = document.getElementById('audio_vol_graphic');
    const graphVolVal = document.getElementById('audio_vol_graph_val');
    const r3Sel = document.getElementById('audio_round3_select');
    const r4Sel = document.getElementById('audio_round4_select');

    if (projVol && projVolVal) projVolVal.innerText = `${projVol.value}%`;
    if (graphVol && graphVolVal) graphVolVal.innerText = `${graphVol.value}%`;

    window.systemAudioSettings = {
        projectorEnabled: projCb ? projCb.checked : true,
        graphicEnabled: graphCb ? graphCb.checked : true,
        projectorVolume: projVol ? parseInt(projVol.value, 10) : 100,
        graphicVolume: graphVol ? parseInt(graphVol.value, 10) : 100,
        round3Audio: r3Sel ? r3Sel.value : 'sounds/20sV1.mp3',
        round4Audio: r4Sel ? r4Sel.value : 'sounds/25sV1.mp3'
    };

    if (typeof gameData !== 'undefined' && gameData) {
        gameData.audioSettings = window.systemAudioSettings;
    }
    try {
        localStorage.setItem('ddvq_audio_settings', JSON.stringify(window.systemAudioSettings));
        if (typeof saveAllData === 'function') saveAllData();
    } catch(e) {}

    const payload = {
        type: 'UPDATE_AUDIO_SETTINGS',
        audioSettings: window.systemAudioSettings,
        timestamp: Date.now()
    };

    if (typeof sendToProjector === 'function') sendToProjector('UPDATE_AUDIO_SETTINGS', payload);
    if (typeof sendSupabaseAction === 'function') sendSupabaseAction(payload);
    try { localStorage.setItem('ddvq_latest_action', JSON.stringify(payload)); } catch(e) {}
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('ddvq_game_channel');
            bc.postMessage(payload);
        }
    } catch(e) {}
}
window.onAudioSettingsChange = onAudioSettingsChange;

// Auto initialize audio settings
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAudioSettings);
    } else {
        loadAudioSettings();
    }
}

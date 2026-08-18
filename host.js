let hostRoomCode = localStorage.getItem('ddvq_room_code') || '';
let hostAutoSync = true;
let hostActiveScene = 1;
let currentHostState = {};

const ONRENDER_BASE_URL_HOST = 'https://ddvq.onrender.com';

function getApiUrl(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function' && window.getApiUrl !== getApiUrl) {
        return window.getApiUrl(path);
    }
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;

    try {
        const customUrl = localStorage.getItem('ddvq_server_url');
        if (customUrl && customUrl.trim()) {
            return customUrl.trim().replace(/\/+$/, '') + cleanPath;
        }
    } catch(e) {}

    if (window.location.protocol === 'file:' || !window.location.host) {
        return ONRENDER_BASE_URL_HOST + cleanPath;
    }
    return cleanPath;
}

function setHostAutoSync(isAuto) {
    hostAutoSync = isAuto;
    const btn = document.getElementById('tab_auto');
    if (btn) {
        if (isAuto) {
            btn.className = 'scene-tab auto-active';
            btn.innerText = '🔄 TỰ ĐỘNG';
            showToast('Chế độ Tự Động Theo Dõi: ĐÃ BẬT');
        } else {
            btn.className = 'scene-tab';
            btn.innerText = '⏸️ THỦ CÔNG';
            showToast('Chế độ Thủ Công: ĐÃ TẮT');
        }
    }
}

function switchHostScene(sceneNum) {
    hostActiveScene = sceneNum;
    for (let i = 1; i <= 5; i++) {
        const tab = document.getElementById(`tab_s${i}`);
        const view = document.getElementById(`host_scene_${i}`);
        if (tab) tab.className = `scene-tab ${i === sceneNum ? 'active' : ''}`;
        if (view) view.className = `scene-view ${i === sceneNum ? 'active' : ''}`;
    }
}

function onClickJoinHostRoom() {
    const input = document.getElementById('host_room_code_input');
    const errorBox = document.getElementById('host_login_error');
    const roomCode = (input ? input.value : '').trim().toUpperCase();

    if (!roomCode) {
        if (errorBox) {
            errorBox.innerText = 'Vui lòng nhập Mã Phòng!';
            errorBox.style.display = 'block';
        }
        return;
    }

    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'CLIENT_JOIN',
            role: 'host',
            roomCode: roomCode,
            name: 'Máy MC (Host)'
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            hostRoomCode = roomCode;
            localStorage.setItem('ddvq_room_code', roomCode);
            const modal = document.getElementById('host_room_code_modal');
            if (modal) modal.style.display = 'none';
            if (errorBox) errorBox.style.display = 'none';
            updateHostBadge(true, roomCode);
            startHostHeartbeat();
        } else {
            if (errorBox) {
                errorBox.innerText = data.error || 'Mã phòng không chính xác!';
                errorBox.style.display = 'block';
            }
        }
    })
    .catch(() => {
        hostRoomCode = roomCode;
        localStorage.setItem('ddvq_room_code', roomCode);
        const modal = document.getElementById('host_room_code_modal');
        if (modal) modal.style.display = 'none';
        updateHostBadge(true, roomCode);
        startHostHeartbeat();
    });
}

function updateHostBadge(isConnected, roomCode) {
    const badge = document.getElementById('host_status_badge');
    if (badge) {
        if (isConnected) {
            badge.innerHTML = `🟢 ĐÃ KẾT NỐI MC (MÃ: ${roomCode || 'DDVQ2026'})`;
            badge.style.background = 'rgba(34,197,94,0.15)';
            badge.style.color = '#4ade80';
            badge.style.borderColor = 'rgba(34,197,94,0.3)';
        } else {
            badge.innerHTML = `🔴 CHƯA KẾT NỐI MÁY MC`;
            badge.style.background = 'rgba(239,68,68,0.15)';
            badge.style.color = '#f87171';
            badge.style.borderColor = 'rgba(239,68,68,0.3)';
        }
    }
}

let hostHeartbeatInterval = null;
function startHostHeartbeat() {
    if (hostHeartbeatInterval) clearInterval(hostHeartbeatInterval);
    sendHostHeartbeat();
    hostHeartbeatInterval = setInterval(sendHostHeartbeat, 2500);
}

function sendHostHeartbeat() {
    if (!hostRoomCode) return;

    const hbData = {
        type: 'CLIENT_HEARTBEAT',
        role: 'host',
        roomCode: hostRoomCode,
        name: 'Máy MC (Host)',
        timestamp: Date.now()
    };

    // 1. API POST
    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hbData)
    }).catch(() => {});

    // 2. BroadcastChannel
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('ddvq_game_channel');
            bc.postMessage({
                type: 'CLIENT_HEARTBEAT',
                role: 'host',
                roomCode: hostRoomCode,
                name: 'Máy MC (Host)',
                timestamp: Date.now()
            });
        }
    } catch(e) {}

    // 3. LocalStorage
    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify({
            role: 'host',
            roomCode: hostRoomCode,
            name: 'Máy MC (Host)',
            timestamp: Date.now()
        }));
    } catch(e) {}
}

window.addEventListener('DOMContentLoaded', () => {
    const savedRoom = localStorage.getItem('ddvq_room_code');
    if (savedRoom) {
        const input = document.getElementById('host_room_code_input');
        if (input) input.value = savedRoom;
        onClickJoinHostRoom();
    }
});

// BroadcastChannel
let hostChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        hostChannel = new BroadcastChannel('ddvq_game_channel');
        hostChannel.onmessage = function(e) {
            if (e.data) processHostAction(e.data);
        };
    }
} catch(e) {}

// SSE EventSource
if (typeof EventSource !== 'undefined') {
    try {
        const sse = new EventSource(getApiUrl('/api/events'));
        sse.onmessage = function(e) {
            try {
                const data = JSON.parse(e.data);
                processHostAction(data);
            } catch(err) {}
        };
    } catch(err) {}
}

// Window storage listener
window.addEventListener('storage', function(e) {
    if (e.key === 'ddvq_latest_action' && e.newValue) {
        try { processHostAction(JSON.parse(e.newValue)); } catch(err) {}
    }
});

function fetchHostState() {
    fetch(getApiUrl('/api/state'))
        .then(r => r.json())
        .then(data => processHostAction(data))
        .catch(() => {});
}

fetchHostState();
setInterval(fetchHostState, 2000);

function processHostAction(data) {
    if (!data) return;

    // Room code auto-sync
    if (data.roomCode && data.roomCode !== hostRoomCode) {
        console.log(`[Sync] Host room code auto-syncing to: ${data.roomCode}`);
        hostRoomCode = data.roomCode;
        localStorage.setItem('ddvq_room_code', data.roomCode);
        const input = document.getElementById('host_room_code_input');
        if (input) input.value = data.roomCode;
    }

    // Merge state
    currentHostState = { ...currentHostState, ...data };

    // Auto round tab switching
    if (hostAutoSync && data.type) {
        if (data.type.startsWith('XUAT_PHAT_')) switchHostScene(1);
        else if (data.type.startsWith('RA_KHOI_')) switchHostScene(2);
        else if (data.type.startsWith('VUOT_SONG_')) switchHostScene(3);
        else if (data.type.startsWith('VINH_QUANG_')) switchHostScene(4);
    }

    renderHostScene1();
    renderHostScene2();
    renderHostScene3();
    renderHostScene4();
    renderHostScene5();
}

function renderHostScene1() {
    const textEl = document.getElementById('h1_q_text');
    const ansEl = document.getElementById('h1_a_text');
    const turnBadge = document.getElementById('h1_turn_badge');
    const deNum = document.getElementById('h1_de_num');
    const deTitle = document.getElementById('h1_de_title');
    const qNum = document.getElementById('h1_q_num');

    const contestants = currentHostState.contestants || [
        { name: 'Thí sinh 1', score: 0 },
        { name: 'Thí sinh 2', score: 0 },
        { name: 'Thí sinh 3', score: 0 },
        { name: 'Thí sinh 4', score: 0 }
    ];

    const currentTsIdx = currentHostState.contestantId || 1;
    const tsName = contestants[currentTsIdx - 1]?.name || `Thí sinh ${currentTsIdx}`;
    if (turnBadge) turnBadge.innerText = `LƯỢT THI: ${tsName.toUpperCase()}`;

    if (textEl) textEl.innerText = currentHostState.questionText || 'Đang chờ câu hỏi Xuất Phát...';
    if (ansEl) ansEl.innerText = currentHostState.answer || currentHostState.answerText || '--';

    const setIndex = currentHostState.deNumber || currentHostState.questionIndex || 1;
    if (deNum) deNum.innerText = setIndex;
    if (deTitle) deTitle.innerText = setIndex;
    if (qNum) qNum.innerText = `${currentHostState.qNum || 1} / 10`;

    // Render table of 10 questions if gameData is present
    const tableBody = document.getElementById('h1_q_table_body');
    if (tableBody && currentHostState.gameData && currentHostState.gameData.XuatPhat) {
        const xuatPhatSets = currentHostState.gameData.XuatPhat;
        const currentSet = xuatPhatSets[setIndex - 1] || [];
        let html = '';
        currentSet.forEach((q, idx) => {
            const isActive = (idx + 1) === (currentHostState.qNum || 1);
            html += `
                <tr class="${isActive ? 'active-q' : ''}">
                    <td><strong>Câu ${idx + 1}</strong></td>
                    <td>${q.q || q.question || '--'}</td>
                    <td><span class="q-ans-badge">${q.a || q.answer || '--'}</span></td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    }
}

function renderHostScene2() {
    const textEl = document.getElementById('h2_q_text');
    const ansEl = document.getElementById('h2_a_text');
    const badge = document.getElementById('h2_q_num_badge');

    if (textEl) textEl.innerText = currentHostState.questionText || 'Đang chờ câu hỏi Ra Khơi...';
    if (ansEl) ansEl.innerText = currentHostState.answer || currentHostState.answerText || '--';
    if (badge) badge.innerText = `CÂU HỎI SỐ ${currentHostState.questionIndex || 1}`;

    renderContestantsAnswersGrid('h2_contestants_grid', 'RK');
}

function renderHostScene3() {
    const textEl = document.getElementById('h3_q_text');
    const ansEl = document.getElementById('h3_a_text');
    const badge = document.getElementById('h3_row_badge');

    if (textEl) textEl.innerText = currentHostState.questionText || 'Đang chờ câu hỏi Vượt Sóng...';
    if (ansEl) ansEl.innerText = currentHostState.answer || currentHostState.answerText || '--';
    if (badge) badge.innerText = `HÀNG NGANG SỐ ${currentHostState.row || currentHostState.selectedRow || 1}`;

    // All rows list for MC
    const listEl = document.getElementById('h3_all_rows_list');
    if (listEl && currentHostState.gameData && currentHostState.gameData.VuotSong) {
        const vsData = currentHostState.gameData.VuotSong;
        let html = '';
        if (vsData.rows && Array.isArray(vsData.rows)) {
            vsData.rows.forEach((r, idx) => {
                html += `
                    <div>
                        <strong style="color: #38bdf8;">Hàng ${idx + 1} (${r.length || 0} chữ):</strong>
                        <span>${r.question || '--'}</span>
                        <strong style="color: #34d399; margin-left: 8px;">➡ ${r.answer || '--'}</strong>
                    </div>
                `;
            });
        }
        if (vsData.keyword) {
            html += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #475569; font-weight: 800; color: #facc15;">🔑 TỪ KHÓA CHƯỚNG NGẠI VẬT: ${vsData.keyword}</div>`;
        }
        listEl.innerHTML = html;
    }

    renderContestantsAnswersGrid('h3_contestants_grid', 'VS');
}

function renderHostScene4() {
    const textEl = document.getElementById('h4_q_text');
    const ansEl = document.getElementById('h4_a_text');
    const badge = document.getElementById('h4_pack_badge');

    if (textEl) textEl.innerText = currentHostState.questionText || 'Đang chờ câu hỏi Vinh Quang...';
    if (ansEl) ansEl.innerText = currentHostState.answer || currentHostState.answerText || '--';
    if (badge) badge.innerText = `GÓI CÂU HỎI: ${currentHostState.pack || 20} ĐIỂM`;

    renderContestantsAnswersGrid('h4_contestants_grid', 'VQ');
}

function renderHostScene5() {
    const listEl = document.getElementById('h5_chp_list');
    if (listEl && currentHostState.gameData && currentHostState.gameData.CauHoiPhu) {
        const chpList = currentHostState.gameData.CauHoiPhu;
        let html = '';
        chpList.forEach((q, idx) => {
            html += `
                <div style="background: #0f172a; border: 1.5px solid #334155; border-radius: 8px; padding: 14px;">
                    <div style="font-size: 14px; font-weight: 800; color: #38bdf8; margin-bottom: 6px;">CÂU HỎI PHỤ SỐ ${idx + 1}</div>
                    <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">${q.q || q.question || '--'}</div>
                    <div style="font-size: 14px; font-weight: bold; color: #34d399; background: #064e3b; padding: 6px 12px; border-radius: 6px; display: inline-block;">ĐÁP ÁN: ${q.a || q.answer || '--'}</div>
                </div>
            `;
        });
        listEl.innerHTML = html;
    }
}

function renderContestantsAnswersGrid(containerId, roundKey) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    const contestants = currentHostState.contestants || [
        { name: 'Thí sinh 1', score: 0 },
        { name: 'Thí sinh 2', score: 0 },
        { name: 'Thí sinh 3', score: 0 },
        { name: 'Thí sinh 4', score: 0 }
    ];

    const playerAnswers = currentHostState.playerAnswers || {};

    let html = '';
    for (let i = 1; i <= 4; i++) {
        const name = contestants[i - 1]?.name || `Thí sinh ${i}`;
        const score = contestants[i - 1]?.score || 0;
        const ansObj = playerAnswers[`ts${i}_${roundKey}`];

        let ansText = '-- (Chưa gửi)';
        let ansTime = '';
        if (ansObj) {
            ansText = ansObj.answer || '--';
            ansTime = ansObj.time ? `Thời gian: ${ansObj.time}s` : '';
        }

        html += `
            <div class="contestant-card">
                <div class="ts-name">
                    <span>TS ${i}: ${name}</span>
                    <span class="ts-score">${score}đ</span>
                </div>
                <div class="ts-answer-display">${ansText}</div>
                <div class="ts-time-display">${ansTime}</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function showToast(msg) {
    console.log("[Host Toast]:", msg);
}

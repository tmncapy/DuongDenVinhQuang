let hostRoomCode = localStorage.getItem('ddvq_room_code') || '';
let hostAutoSync = true;
let hostActiveScene = 1;
let currentHostState = {};
let selectedS1QuestionIndex = 1;

function getApiUrl(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function' && window.getApiUrl !== getApiUrl) {
        return window.getApiUrl(path);
    }
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    const customHost = (typeof localStorage !== 'undefined' && localStorage.getItem('ddvq_server_host')) || 
        (typeof URLSearchParams !== 'undefined' && window.location ? new URLSearchParams(window.location.search).get('server') : null);
    if (customHost) return customHost.replace(/\/$/, '') + cleanPath;
    if (window.location.protocol === 'file:' || !window.location.host) {
        return 'http://localhost:3000' + cleanPath;
    }
    return cleanPath;
}

function setHostAutoSync(isAuto) {
    hostAutoSync = isAuto;
    const btn = document.getElementById('tab_auto');
    if (btn) {
        if (isAuto) {
            btn.className = 'scene-tab auto-active';
            btn.innerText = '⚡ TỰ ĐỘNG';
        } else {
            btn.className = 'scene-tab';
            btn.innerText = '⏸️ THỦ CÔNG';
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
            badge.innerHTML = `🟢 ĐÃ KẾT NỐI MC (DDVQ: ${roomCode || 'DDVQ2026'})`;
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
    hostHeartbeatInterval = setInterval(sendHostHeartbeat, 8000);
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

    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(hbData);
    }

    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify(hbData));
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
        hostRoomCode = data.roomCode;
        localStorage.setItem('ddvq_room_code', data.roomCode);
        const input = document.getElementById('host_room_code_input');
        if (input) input.value = data.roomCode;
    }

    // Save gameData if present
    if (data.gameData) {
        currentHostState.gameData = data.gameData;
        try {
            localStorage.setItem('duong_den_vinh_quang_data', JSON.stringify(data.gameData));
        } catch(e) {}
    }

    // Reload / Kick handler for Host
    if (data.type === 'RELOAD_CLIENT' && (data.target === 'host' || data.target === 'all' || data.role === 'host')) {
        setTimeout(() => { window.location.reload(); }, 300);
        return;
    }
    if (data.type === 'KICK_CLIENT' && (data.target === 'host' || data.target === 'all' || data.role === 'host')) {
        setTimeout(() => { window.location.reload(); }, 300);
        return;
    }

    // Determine current round category
    let newRoundCategory = '';
    if (data.type) {
        if (data.type.startsWith('XUAT_PHAT_')) newRoundCategory = 'XP';
        else if (data.type.startsWith('RA_KHOI_')) newRoundCategory = 'RK';
        else if (data.type.startsWith('VUOT_SONG_')) newRoundCategory = 'VS';
        else if (data.type.startsWith('VINH_QUANG_')) newRoundCategory = 'VQ';
    }

    // If round changed, reset question/answer so previous round's Q&A won't bleed over
    if (newRoundCategory && currentHostState.activeRoundCategory !== newRoundCategory) {
        currentHostState.activeRoundCategory = newRoundCategory;
        currentHostState.questionText = '';
        currentHostState.answerText = '';
        currentHostState.answer = '';
    }

    Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
            currentHostState[key] = data[key];
        }
    });

    if (data.questionText) {
        currentHostState.questionText = data.questionText;
    }

    if (data.answerText || data.answer) {
        const newAns = data.answerText || data.answer;
        currentHostState.answerText = newAns;
        currentHostState.answer = newAns;
    }

    // Synchronize clock/timer
    if (data.timer !== undefined) {
        const clockEl = document.getElementById('host_clock_display');
        if (clockEl) clockEl.innerText = `${data.timer}s`;
        const h2Time = document.getElementById('h2_time_box');
        if (h2Time) h2Time.innerText = `${data.timer}s`;
        const h3Time = document.getElementById('h3_time_box');
        if (h3Time) h3Time.innerText = `${data.timer}s`;
        const h4Time = document.getElementById('h4_time_box');
        if (h4Time) h4Time.innerText = `${data.timer}s`;
    }

    // Auto round tab switching
    if (hostAutoSync && data.type) {
        if (data.type.startsWith('XUAT_PHAT_')) switchHostScene(1);
        else if (data.type.startsWith('RA_KHOI_')) switchHostScene(2);
        else if (data.type.startsWith('VUOT_SONG_')) switchHostScene(3);
        else if (data.type.startsWith('VINH_QUANG_')) switchHostScene(4);
    }

    if (data.questionIndex) {
        selectedS1QuestionIndex = data.questionIndex;
    }

    renderHostScene1();
    renderHostScene2();
    renderHostScene3();
    renderHostScene4();
    renderHostScene5();
}

function getHostGameData() {
    if (currentHostState.gameData) return currentHostState.gameData;
    try {
        const saved = localStorage.getItem('duong_den_vinh_quang_data');
        if (saved) return JSON.parse(saved);
    } catch(e) {}
    return null;
}

function selectHostS1Question(qNum) {
    selectedS1QuestionIndex = qNum;
    renderHostScene1();
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

    const currentTsIdx = currentHostState.turnIndex || currentHostState.contestantId || 1;
    const tsName = contestants[currentTsIdx - 1]?.name || `Thí sinh ${currentTsIdx}`;
    if (turnBadge) turnBadge.innerText = `LƯỢT THI: ${tsName.toUpperCase()}`;

    const setIndex = currentHostState.deIndex || currentHostState.deNumber || 1;
    const qIndex = currentHostState.questionIndex || selectedS1QuestionIndex || 1;

    // Update pagination buttons active state
    for (let i = 1; i <= 10; i++) {
        const btn = document.getElementById(`s1_btn_${i}`);
        if (btn) {
            btn.className = `s1-page-btn ${i === qIndex ? 'active' : ''}`;
        }
    }

    let qText = currentHostState.questionText;
    let ansVal = currentHostState.answerText || currentHostState.answer;

    const gData = getHostGameData();
    if (gData && gData.xuatPhat) {
        const xuatPhatSets = gData.xuatPhat;
        const currentSet = xuatPhatSets[setIndex] || xuatPhatSets[String(setIndex)] || xuatPhatSets[1] || [];
        let qItem = currentSet[qIndex - 1];

        if (qItem) {
            if (!qText || qText === 'Đang chờ câu hỏi Xuất Phát...' || qText.includes('🔒') || qText.includes('Nội dung câu hỏi')) {
                qText = qItem.q || qItem.question || qText;
            }
            if (!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') {
                ansVal = qItem.a || qItem.answer || ansVal;
            }
        }
    }

    if (textEl) textEl.innerText = qText || 'Đang chờ câu hỏi Xuất Phát...';
    let cleanAns1 = ansVal ? ansVal.replace(/^ĐÁP ÁN:\s*/i, '').trim() : '';
    if (ansEl) ansEl.innerText = cleanAns1 || '--';

    if (deNum) deNum.innerText = setIndex;
    if (deTitle) deTitle.innerText = setIndex;
    if (qNum) qNum.innerText = `${qIndex} / 10`;

    // Render table of 10 questions in current set
    const tableBody = document.getElementById('h1_q_table_body');
    if (tableBody && gData && gData.xuatPhat) {
        const xuatPhatSets = gData.xuatPhat;
        const currentSet = xuatPhatSets[setIndex] || xuatPhatSets[setIndex - 1] || xuatPhatSets[String(setIndex)] || [];
        let html = '';
        currentSet.forEach((q, idx) => {
            const isActive = (idx + 1) === qIndex;
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

    const qIndex = currentHostState.questionIndex || 1;
    let qText = currentHostState.questionText;
    let ansVal = currentHostState.answerText || currentHostState.answer;

    const gData = getHostGameData();
    if (gData && gData.raKhoi) {
        let qItem = gData.raKhoi[qIndex - 1];
        if (qText && (!ansVal || ansVal === '--' || ansVal === 'Đáp án')) {
            const matched = gData.raKhoi.find(item => item && item.q && item.q.trim() === qText.trim() && item.a);
            if (matched) qItem = matched;
        }
        if (qItem) {
            if (!qText || qText === 'Đang chờ câu hỏi Ra Khơi...' || qText.includes('🔒') || qText.includes('Nội dung câu hỏi')) {
                qText = qItem.q || qItem.question || qText;
            }
            if (!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') {
                ansVal = qItem.a || qItem.answer || ansVal;
            }
        }
    }

    if (textEl) textEl.innerText = qText || 'Đang chờ câu hỏi Ra Khơi...';
    let cleanAns2 = ansVal ? ansVal.replace(/^ĐÁP ÁN:\s*/i, '').trim() : '';
    if (ansEl) ansEl.innerText = cleanAns2 || '--';
    if (badge) badge.innerText = `CÂU HỎI SỐ ${qIndex}`;

    renderContestantsAnswersGrid('h2_contestants_grid', 'RK');
}

function renderHostScene3() {
    const textEl = document.getElementById('h3_q_text');
    const ansEl = document.getElementById('h3_a_text');
    const badge = document.getElementById('h3_row_badge');

    const rowVal = currentHostState.row || currentHostState.selectedRow || 1;
    let qText = currentHostState.questionText;
    let ansVal = currentHostState.answerText || currentHostState.answer;

    const gData = getHostGameData();
    if (gData && gData.vuotSong) {
        const vsData = gData.vuotSong;
        if (rowVal === 'center') {
            if ((!qText || qText === 'Đang chờ chọn hàng ngang Vượt Sóng...' || qText.includes('🔒')) && vsData.center) {
                qText = vsData.center.q || vsData.center.question || qText;
            }
            if ((!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') && vsData.center) {
                ansVal = vsData.center.a || vsData.center.answer || vsData.keyword || ansVal;
            }
        } else {
            const hKey = `h${rowVal}`;
            if (vsData[hKey]) {
                if (!qText || qText === 'Đang chờ chọn hàng ngang Vượt Sóng...' || qText.includes('🔒')) {
                    qText = vsData[hKey].q || vsData[hKey].question || qText;
                }
                if (!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') {
                    ansVal = vsData[hKey].a || vsData[hKey].answer || ansVal;
                }
            }
        }
    }

    if (textEl) textEl.innerText = qText || 'Đang chờ chọn hàng ngang Vượt Sóng...';
    let cleanAns3 = ansVal ? ansVal.replace(/^ĐÁP ÁN:\s*/i, '').trim() : '';
    if (ansEl) ansEl.innerText = cleanAns3 || '--';
    if (badge) badge.innerText = `HÀNG NGANG SỐ ${rowVal === 'center' ? 'TRUNG TÂM' : rowVal}`;

    renderHostVuotSongMatrix();

    // All rows list for MC
    const listEl = document.getElementById('h3_all_rows_list');
    if (listEl && gData && gData.vuotSong) {
        const vsData = gData.vuotSong;
        let html = '';
        for (let i = 1; i <= 4; i++) {
            const h = vsData[`h${i}`] || {};
            html += `
                <div>
                    <strong style="color: #38bdf8;">Hàng ${i}:</strong>
                    <span>${h.q || '--'}</span>
                    <strong style="color: #34d399; margin-left: 8px;">➡ ${h.a || '--'}</strong>
                </div>
            `;
        }
        if (vsData.center) {
            html += `
                <div style="margin-top: 4px;">
                    <strong style="color: #f43f5e;">Ô Trung Tâm:</strong>
                    <span>${vsData.center.q || '--'}</span>
                    <strong style="color: #34d399; margin-left: 8px;">➡ ${vsData.center.a || '--'}</strong>
                </div>
            `;
        }
        if (vsData.keyword) {
            html += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #475569; font-weight: 800; color: #facc15;">🔑 TỪ KHÓA CHƯỚNG NGẠI VẬT: ${vsData.keyword}</div>`;
        }
        listEl.innerHTML = html;
    }

    renderContestantsAnswersGrid('h3_contestants_grid', 'VS');
}

function renderHostVuotSongMatrix() {
    const gData = getHostGameData();
    const activeRow = currentHostState.row || currentHostState.selectedRow;
    const openedRows = currentHostState.openedRows || {};

    if (!gData || !gData.vuotSong) return;
    const vsData = gData.vuotSong;

    for (let i = 1; i <= 4; i++) {
        const numBox = document.getElementById(`s3_num_${i}`);
        const rowEl = document.getElementById(`s3_row_${i}`);
        if (!numBox || !rowEl) continue;

        if (String(activeRow) === String(i)) {
            numBox.className = 's3-number-box active-row';
        } else {
            numBox.className = 's3-number-box';
        }

        const hData = vsData[`h${i}`] || {};
        const ans = (hData.a || hData.answer || '').trim();
        const isOpened = openedRows[i] || openedRows[`h${i}`];

        let html = '';
        if (ans) {
            for (let c = 0; c < ans.length; c++) {
                const char = ans[c];
                if (char === ' ') continue;
                if (isOpened) {
                    html += `<div class="s3-matrix-cell opened">${char}</div>`;
                } else {
                    html += `<div class="s3-matrix-cell has-length"></div>`;
                }
            }
        }
        rowEl.innerHTML = html;
    }

    // Center row
    const centerRowEl = document.getElementById('s3_row_center');
    if (centerRowEl && vsData.center) {
        const cAns = (vsData.center.a || vsData.center.answer || vsData.keyword || '').trim();
        const isCenterOpened = openedRows['center'];
        let cHtml = '';
        if (cAns) {
            for (let c = 0; c < cAns.length; c++) {
                const char = cAns[c];
                if (char === ' ') continue;
                if (isCenterOpened) {
                    cHtml += `<div class="s3-matrix-cell opened">${char}</div>`;
                } else {
                    cHtml += `<div class="s3-matrix-cell has-length"></div>`;
                }
            }
        }
        centerRowEl.innerHTML = cHtml;
    }
}

function renderHostScene4() {
    const textEl = document.getElementById('h4_q_text');
    const ansEl = document.getElementById('h4_a_text');
    const badge = document.getElementById('h4_pack_badge');

    const pack = currentHostState.pack || 20;
    let qText = currentHostState.questionText;
    let ansVal = currentHostState.answerText || currentHostState.answer;

    const gData = getHostGameData();
    if (gData && gData.vinhQuang && gData.vinhQuang[pack]) {
        const packQuestions = gData.vinhQuang[pack];
        const qIndex = (currentHostState.questionIndex !== undefined) ? currentHostState.questionIndex : 0;
        if (packQuestions[qIndex]) {
            const qItem = packQuestions[qIndex];
            if (!qText || qText === 'Đang chờ câu hỏi Vinh Quang...' || qText.includes('🔒') || qText.includes('Nội dung câu hỏi')) {
                qText = qItem.q || qItem.question || qText;
            }
            if (!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') {
                ansVal = qItem.a || qItem.answer || ansVal;
            }
        } else if (packQuestions[0]) {
            if (!qText || qText === 'Đang chờ câu hỏi Vinh Quang...' || qText.includes('🔒') || qText.includes('Nội dung câu hỏi')) {
                qText = packQuestions[0].q || packQuestions[0].question || qText;
            }
            if (!ansVal || ansVal === '--' || ansVal.includes('🔒') || ansVal === 'Đáp án') {
                ansVal = packQuestions[0].a || packQuestions[0].answer || ansVal;
            }
        }
    }

    if (textEl) textEl.innerText = qText || 'Đang chờ câu hỏi Vinh Quang...';
    let cleanAns4 = ansVal ? ansVal.replace(/^ĐÁP ÁN:\s*/i, '').trim() : '';
    if (ansEl) ansEl.innerText = cleanAns4 || '--';
    if (badge) badge.innerText = `GÓI CÂU HỎI: ${pack} ĐIỂM${currentHostState.subject ? ' - MÔN ' + currentHostState.subject.toUpperCase() : ''}`;

    renderContestantsAnswersGrid('h4_contestants_grid', 'VQ');
}

function renderHostScene5() {
    const listEl = document.getElementById('h5_chp_list');
    const gData = getHostGameData();
    if (listEl && gData) {
        const chpList = gData.cauHoiPhu || gData.CauHoiPhu || [];
        if (chpList.length > 0) {
            let html = '';
            chpList.forEach((q, idx) => {
                html += `
                    <div style="background: #0f172a; border: 1.5px solid #334155; border-radius: 10px; padding: 16px;">
                        <div style="font-size: 14px; font-weight: 800; color: #38bdf8; margin-bottom: 6px;">CÂU HỎI PHỤ SỐ ${idx + 1}</div>
                        <div style="font-size: 16px; font-weight: bold; color: #ffffff; margin-bottom: 10px;">${q.q || q.question || '--'}</div>
                        <div class="answer-display-box" style="margin-bottom: 0;">
                            <span class="ans-label">ĐÁP ÁN:</span>
                            <span class="ans-text">${q.a || q.answer || '--'}</span>
                        </div>
                    </div>
                `;
            });
            listEl.innerHTML = html;
        }
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
        const ansObj = playerAnswers[`ts${i}_${roundKey}`] || playerAnswers[`ts${i}`];

        let ansText = '-- (Chưa gửi)';
        let isSubmitted = false;
        let ansTime = '';

        if (ansObj) {
            ansText = ansObj.answer || '--';
            isSubmitted = true;
            ansTime = ansObj.time ? `Thời gian: ${ansObj.time}s` : '';
        }

        html += `
            <div class="contestant-card">
                <div class="ts-header-line">
                    <span class="ts-title">TS ${i}: ${name}</span>
                    <span class="ts-score-badge">${score}đ</span>
                </div>
                <div class="ts-answer-box ${isSubmitted ? 'submitted' : ''}">${ansText}</div>
                <div class="ts-time-text">${ansTime}</div>
            </div>
        `;
    }
    grid.innerHTML = html;
}

function showToast(msg) {
    console.log("[Host Toast]:", msg);
}

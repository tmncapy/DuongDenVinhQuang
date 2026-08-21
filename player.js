// Check for required URL parameters: ?roomid=... & ?auth=...
(function enforcePlayerAuthentication() {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const roomidParam = urlParams.get('roomid') || urlParams.get('roomCode') || urlParams.get('room');
    const authParam = urlParams.get('auth') || urlParams.get('password') || urlParams.get('pass');
    const idParam = urlParams.get('id') || (window.FIXED_CONTESTANT_ID ? String(window.FIXED_CONTESTANT_ID) : '1');

    if (!roomidParam || !authParam) {
        window.location.replace(`playerLogin.html?id=${encodeURIComponent(idParam)}`);
        return;
    }
    localStorage.setItem('ddvq_room_code', roomidParam);
    localStorage.setItem('ddvq_player_auth', authParam);
    localStorage.setItem('contestant_id', idParam);
})();

let contestantId = (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) ? window.FIXED_CONTESTANT_ID : (parseInt(new URLSearchParams(window.location.search).get('id')) || parseInt(localStorage.getItem('contestant_id')) || 1);
let currentRoomCode = (new URLSearchParams(window.location.search).get('roomid') || localStorage.getItem('ddvq_room_code') || 'DDVQ2026').trim().toUpperCase();
let playerContestants = [];
let playerChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        playerChannel = new BroadcastChannel(`ddvq_game_channel_${currentRoomCode.toLowerCase()}`);
    }
} catch(e) {}

const ONRENDER_BASE_URL_PLAYER = 'https://ddvq.onrender.com';

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
        return ONRENDER_BASE_URL_PLAYER + cleanPath;
    }
    return cleanPath;
}

function onLoginPlayerSelectChange() {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        contestantId = window.FIXED_CONTESTANT_ID;
        localStorage.setItem('contestant_id', contestantId);
        return;
    }
    const sel = document.getElementById('login_player_select');
    if (sel) {
        contestantId = parseInt(sel.value) || 1;
        const mainSel = document.getElementById('contestant_select');
        if (mainSel) mainSel.value = contestantId;
        localStorage.setItem('contestant_id', contestantId);
    }
}

function onSelectContestant(val) {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        contestantId = window.FIXED_CONTESTANT_ID;
        const sel = document.getElementById('contestant_select');
        if (sel) sel.value = contestantId;
        localStorage.setItem('contestant_id', contestantId);
        return;
    }
    contestantId = parseInt(val) || 1;
    localStorage.setItem('contestant_id', contestantId);
    const loginSel = document.getElementById('login_player_select');
    if (loginSel) loginSel.value = contestantId;
    if (currentRoomCode) {
        startHeartbeat();
    }
}

function autoJoinRoomOnLoad() {
    if (!currentRoomCode) return;
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;

    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'CLIENT_JOIN',
            role: `ts${contestantId}`,
            contestantId: contestantId,
            roomCode: currentRoomCode,
            name: myName
        })
    }).then(r => r.json()).then(data => {
        startHeartbeat();
    }).catch(() => {
        startHeartbeat();
    });
}

let heartbeatInterval = null;
function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    sendHeartbeat();
    heartbeatInterval = setInterval(sendHeartbeat, 2500);
}

function sendHeartbeat() {
    if (!currentRoomCode) return;
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;
    const roleKey = `ts${contestantId}`;

    // 1. API POST
    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'CLIENT_HEARTBEAT',
            role: roleKey,
            contestantId: contestantId,
            roomCode: currentRoomCode,
            name: myName
        })
    }).catch(() => {});

    // 2. BroadcastChannel
    try {
        if (playerChannel) {
            playerChannel.postMessage({
                type: 'CLIENT_HEARTBEAT',
                role: roleKey,
                contestantId: contestantId,
                roomCode: currentRoomCode,
                name: myName,
                timestamp: Date.now()
            });
        }
    } catch(e) {}

    // 3. LocalStorage
    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify({
            role: roleKey,
            contestantId: contestantId,
            roomCode: currentRoomCode,
            name: myName,
            timestamp: Date.now()
        }));
    } catch(e) {}
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window !== 'undefined' && window.FIXED_CONTESTANT_ID) {
        contestantId = window.FIXED_CONTESTANT_ID;
        localStorage.setItem('contestant_id', contestantId);
        const sel = document.getElementById('contestant_select');
        if (sel) {
            sel.value = contestantId;
            sel.disabled = true;
        }
    } else {
        const urlId = parseInt(new URLSearchParams(window.location.search).get('id'));
        if (urlId && [1,2,3,4].includes(urlId)) {
            contestantId = urlId;
        } else {
            const savedId = localStorage.getItem('contestant_id');
            if (savedId) contestantId = parseInt(savedId);
        }
        const sel = document.getElementById('contestant_select');
        if (sel) sel.value = contestantId;
    }

    // Lock all inputs for rounds 2, 3, 4 by default on load
    const s2Input = document.getElementById('s2_answer_input');
    if (s2Input) { s2Input.disabled = true; s2Input.placeholder = "Đang khóa (Chờ Controller mở...)"; }
    const s3Input = document.getElementById('s3_answer_input');
    if (s3Input) { s3Input.disabled = true; s3Input.placeholder = "Đang khóa (Chờ Controller mở...)"; }
    const s4Input = document.getElementById('s4_answer_input');
    if (s4Input) { s4Input.disabled = true; s4Input.placeholder = "Đang khóa (Chờ Controller mở...)"; }

    autoJoinRoomOnLoad();
    fetchCurrentState();
});

function updatePlayerContestants(contestants) {
    if (!contestants || !Array.isArray(contestants)) return;
    playerContestants = contestants;
    try {
        localStorage.setItem('ddvq_contestants', JSON.stringify(contestants));
    } catch(e) {}

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
    const myScore = contestants[contestantId - 1]?.score !== undefined ? contestants[contestantId - 1].score : 0;

    if (document.getElementById('s1_badge_box')) document.getElementById('s1_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s3_badge_box')) document.getElementById('s3_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}: ${myName}`;

    if (document.getElementById('s1_score_box')) document.getElementById('s1_score_box').innerText = `ĐIỂM: ${myScore}`;
    if (document.getElementById('s2_score_box')) document.getElementById('s2_score_box').innerText = `ĐIỂM: ${myScore}`;
    if (document.getElementById('s3_score_box')) document.getElementById('s3_score_box').innerText = `ĐIỂM: ${myScore}`;
    if (document.getElementById('s4_score_box')) document.getElementById('s4_score_box').innerText = `ĐIỂM: ${myScore}`;
}

try {
    const saved = localStorage.getItem('ddvq_contestants');
    if (saved) updatePlayerContestants(JSON.parse(saved));
} catch(e) {}

try {
    if (!playerChannel && typeof BroadcastChannel !== 'undefined') {
        playerChannel = new BroadcastChannel(`ddvq_game_channel_${currentRoomCode.toLowerCase()}`);
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
let s4TimerInterval = null;
let s4TimeLeft = 0;
let s4TimerStartTime = 0;
let s1QIndex = 0;
let s3SelectedRow = 0;

let playerVsData = null;
let playerOpenedRows = {};

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

function onSelectContestant(val) {
    contestantId = parseInt(val) || 1;
    localStorage.setItem('contestant_id', contestantId);
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;
    if (document.getElementById('s1_badge_box')) document.getElementById('s1_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s3_badge_box')) document.getElementById('s3_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}: ${myName}`;
    showToast(`Đã chọn Thí sinh ${contestantId}: ${myName}`);
    if (typeof fetchCurrentState === 'function') {
        fetchCurrentState();
    }
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
    document.getElementById('view_scene_1').className = sceneNum === 1 ? 'scene-view active' : 'scene-view';
    document.getElementById('view_scene_2').className = sceneNum === 2 ? 'scene-view active' : 'scene-view';
    document.getElementById('view_scene_3').className = sceneNum === 3 ? 'scene-view active' : 'scene-view';
    if (document.getElementById('view_scene_4')) document.getElementById('view_scene_4').className = sceneNum === 4 ? 'scene-view active' : 'scene-view';

    if (sceneNum === 2) {
        const s2Input = document.getElementById('s2_answer_input');
        if (s2Input && (!s2TimerStartTime || s2TimeLeft <= 0)) {
            s2Input.disabled = true;
            s2Input.placeholder = "Đang khóa (Chờ Controller mở...)";
        }
    } else if (sceneNum === 3) {
        const s3Input = document.getElementById('s3_answer_input');
        if (s3Input && (!s3TimerStartTime || s3TimeLeft <= 0)) {
            s3Input.disabled = true;
            s3Input.placeholder = "Đang khóa (Chờ Controller mở...)";
        }
        if (!s3RoundStartTime) {
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
        }
    } else if (sceneNum === 4) {
        const s4Input = document.getElementById('s4_answer_input');
        if (s4Input && (!s4TimerStartTime || s4TimeLeft <= 0)) {
            s4Input.disabled = true;
            s4Input.placeholder = "Đang khóa (Chờ Controller mở...)";
        }
    }
}

function autoSwitchScene(sceneNum) {
    if (!autoSync) return;
    displaySceneView(sceneNum);
}

// Submissions
function submitScene2Answer() {
    const s2Input = document.getElementById('s2_answer_input');
    if (s2Input && s2Input.disabled) {
        showToast("Ngoài thời gian quy định - Ô trả lời đang khóa!");
        return;
    }
    const ans = s2Input ? s2Input.value.trim() : "";
    if (!ans) return;

    // Clear input field on submit
    if (s2Input) s2Input.value = "";

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
        roomCode: currentRoomCode || 'DDVQ2026',
        contestantId: contestantId,
        round: currentS2Round,
        answer: ans,
        time: timeStr,
        timestamp: Date.now()
    };

    // Instant local broadcast to controller and projector
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

    if (window.location.protocol === 'file:') {
        showToast(`Đã gửi đáp án cục bộ (Offline) TS${contestantId}: "${ans}" (${timeStr})`);
        return;
    }

    const actionUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/action') : '/api/action';
    fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
    }).then(() => {
        showToast(`Đã gửi đáp án TS${contestantId}: "${ans}" (${timeStr})`);
    }).catch(e => {
        console.error(e);
        showToast('Không gửi được câu trả lời. Vui lòng thử lại!');
        if (badge) {
            badge.innerText = '❌ GỬI THẤT BẠI';
            badge.style.background = '#dc2626';
        }
    });
}

function submitScene3Answer(isVongThi = false) {
    const s3Input = document.getElementById('s3_answer_input');
    
    if (!isVongThi) {
        // Horizontal row answer: check if horizontal row timer is running
        if (!s3TimerStartTime || s3TimeLeft <= 0) {
            showToast("Hàng ngang đang khóa! Để gửi Chướng ngại vật, vui lòng nhấn nút TRẢ LỜI ĐÁP ÁN VÒNG THI");
            return;
        }
        const ans = s3Input ? s3Input.value.trim() : "";
        if (!ans) return;

        // Clear input field on submit
        if (s3Input) s3Input.value = "";

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
            roomCode: currentRoomCode || 'DDVQ2026',
            contestantId: contestantId,
            round: 'VS',
            isVongThi: false,
            answer: ans,
            row: s3SelectedRow,
            time: timeStr,
            timestamp: Date.now()
        };

        // Instant local broadcast
        if (playerChannel) {
            try { playerChannel.postMessage(submitPayload); } catch(e) {}
        }
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(submitPayload, '*');
            }
        } catch(e) {}
        try { localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload)); } catch(e) {}

        if (window.location.protocol === 'file:') {
            showToast(`Đã gửi đáp án Hàng ngang cục bộ (Offline) TS${contestantId}: "${ans}" (${timeStr})`);
            return;
        }

        const actionUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/action') : '/api/action';
        fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
        }).then(() => {
            showToast(`Đã gửi đáp án Hàng ngang TS${contestantId}: "${ans}" (${timeStr})`);
        }).catch(e => {
            console.error(e);
            showToast('Không gửi được câu trả lời. Vui lòng thử lại!');
            if (badge) {
                badge.innerText = '❌ GỬI THẤT BẠI';
                badge.style.background = '#dc2626';
            }
        });
    } else {
        // Vòng thi (Chướng ngại vật) answer: always allowed, calculate elapsed time since round started
        const ans = s3Input ? s3Input.value.trim() : "";
        const finalAnswer = ans;

        // Clear input field on submit
        if (s3Input) s3Input.value = "";

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
            roomCode: currentRoomCode || 'DDVQ2026',
            contestantId: contestantId,
            round: 'VS',
            isVongThi: true,
            answer: finalAnswer,
            row: s3SelectedRow,
            time: timeStr,
            timestamp: Date.now()
        };

        // Instant local broadcast
        if (playerChannel) {
            try { playerChannel.postMessage(submitPayload); } catch(e) {}
        }
        try {
            if (window.opener && !window.opener.closed) {
                window.opener.postMessage(submitPayload, '*');
            }
        } catch(e) {}
        try { localStorage.setItem('ddvq_latest_action', JSON.stringify(submitPayload)); } catch(e) {}

        if (window.location.protocol === 'file:') {
            showToast(`Đã gửi đáp án Vòng thi cục bộ (Offline) TS${contestantId}: "${finalAnswer}" (${timeStr})`);
            return;
        }

        const actionUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/action') : '/api/action';
        fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submitPayload)
        }).then(() => {
            showToast(`Đã gửi đáp án Vòng thi TS${contestantId}: "${finalAnswer}" (${timeStr})`);
        }).catch(e => {
            console.error(e);
            showToast('Không gửi được câu trả lời. Vui lòng thử lại!');
            if (badge) {
                badge.innerText = '❌ GỬI THẤT BẠI';
                badge.style.background = '#dc2626';
            }
        });
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

function startS2Timer(sec) {
    clearInterval(s2TimerInterval);
    s2TimerStartTime = Date.now();
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
    if (s4Input && s4Input.disabled) {
        showToast("Ngoài thời gian quy định - Ô trả lời đang khóa!");
        return;
    }
    const ans = s4Input ? s4Input.value.trim() : "";
    if (!ans) return;

    // Clear input field on submit
    if (s4Input) s4Input.value = "";

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
        roomCode: currentRoomCode || 'DDVQ2026',
        contestantId: contestantId,
        round: 'VQ',
        answer: ans,
        time: timeStr,
        timestamp: Date.now()
    };

    // Instant local broadcast to controller and projector
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

    if (window.location.protocol === 'file:') {
        showToast(`Đã gửi đáp án cục bộ (Offline) TS${contestantId}: "${ans}" (${timeStr})`);
        return;
    }

    const actionUrl = typeof getApiUrl === 'function' ? getApiUrl('/api/action') : '/api/action';
    fetch(actionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload)
    }).then(() => {
        showToast(`Đã gửi đáp án TS${contestantId}: "${ans}" (${timeStr})`);
    }).catch(e => {
        console.error(e);
        showToast('Không gửi được câu trả lời. Vui lòng thử lại!');
        if (badge) {
            badge.innerText = '❌ GỬI THẤT BẠI';
            badge.style.background = '#dc2626';
        }
    });
}

function startS4Timer(sec) {
    clearInterval(s4TimerInterval);
    s4TimerStartTime = Date.now();
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

function startS3Timer(sec) {
    clearInterval(s3TimerInterval);
    s3TimerStartTime = Date.now();
    s3TimeLeft = sec;
    updateMasterRemainingTime(`${s3TimeLeft}s`);

    const s3Input = document.getElementById('s3_answer_input');
    if (s3Input) {
        s3Input.disabled = false;
        s3Input.placeholder = `Nhập câu trả lời Hàng ngang... (Còn lại ${s3TimeLeft}s)`;
        s3Input.focus();
    }

    s3TimerInterval = setInterval(() => {
        s3TimeLeft--;
        if (s3TimeLeft <= 0) {
            clearInterval(s3TimerInterval);
            updateMasterRemainingTime("HẾT GIỜ");
            if (s3Input) {
                s3Input.disabled = true;
                s3Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
            }
        } else {
            updateMasterRemainingTime(`${s3TimeLeft}s`);
            if (s3Input) {
                s3Input.placeholder = `Nhập câu trả lời Hàng ngang... (Còn lại ${s3TimeLeft}s)`;
            }
        }
    }, 1000);
}

function setS1QuestionIndex(idx) {
    s1QIndex = idx;
    for (let i = 1; i <= 10; i++) {
        const btn = document.getElementById(`s1_btn_${i}`);
        if (btn) {
            if (i === idx + 1) btn.className = 's1-page-btn active';
            else if (!btn.classList.contains('correct') && !btn.classList.contains('wrong')) btn.className = 's1-page-btn';
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

    // Full State Sync, Update State, or Switch Round
    if (data.type === 'FULL_STATE_SYNC' || data.type === 'UPDATE_STATE' || data.type === 'UPDATE_SCORES' || data.type === 'SWITCH_ROUND') {
        if (data.vuotSong) {
            renderPlayerVSGrid(data.vuotSong);
        }
        const currentActiveRound = data.activeRound || data.round;
        if (currentActiveRound === 'XUAT_PHAT' || currentActiveRound === '1') {
            autoSwitchScene(1);
            s3RoundStartTime = 0;
            localStorage.removeItem('s3_round_start_time');
        } else if (currentActiveRound === 'RA_KHOI' || currentActiveRound === '2') {
            autoSwitchScene(2);
            currentS2Round = 'RK';
            s3RoundStartTime = 0;
            localStorage.removeItem('s3_round_start_time');
        } else if (currentActiveRound === 'VUOT_SONG' || currentActiveRound === '3') {
            autoSwitchScene(3);
            if (!s3RoundStartTime) {
                s3RoundStartTime = Date.now();
                localStorage.setItem('s3_round_start_time', s3RoundStartTime);
            }
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.disabled = false;
                if (!s3TimerStartTime || s3TimeLeft <= 0) {
                    s3Input.placeholder = "Nhập đáp án Chướng ngại vật (Ấn nút màu xanh lá)...";
                }
            }
        } else if (currentActiveRound === 'VINH_QUANG' || currentActiveRound === '4') {
            autoSwitchScene(4);
            currentS2Round = 'VQ';
            s3RoundStartTime = 0;
            localStorage.removeItem('s3_round_start_time');
        }

        if (data.questionText) {
            if (data.activeRound === 'XUAT_PHAT' || !data.activeRound) {
                if (document.getElementById('s1_question_text')) document.getElementById('s1_question_text').innerText = data.questionText;
            }
            if (data.activeRound === 'RA_KHOI') {
                if (document.getElementById('s2_question_text')) document.getElementById('s2_question_text').innerText = data.questionText;
            }
            if (data.activeRound === 'VINH_QUANG') {
                if (document.getElementById('s4_question_text')) document.getElementById('s4_question_text').innerText = data.questionText;
            }
            if (data.activeRound === 'VUOT_SONG') {
                if (document.getElementById('s3_question_text')) document.getElementById('s3_question_text').innerText = data.questionText;
            }
        }
        if (data.questionIndex !== undefined) {
            setS1QuestionIndex(data.questionIndex - 1);
        }
        if (data.playerAnswers) {
            updateSubmissionStatusFromState(data);
        }
        if (data.latestAction && data.latestAction.type) {
            handlePlayerMessage(data.latestAction);
        }
        return;
    }

    // --- VÒNG 1: XUẤT PHÁT ---
    if (data.type && data.type.startsWith('XUAT_PHAT_')) {
        autoSwitchScene(1);

        if (data.questionText) {
            document.getElementById('s1_question_text').innerText = data.questionText;
        }

        if (data.score !== undefined) {
            updateContestantScoreDisplay(data.score);
        }

        if (data.questionIndex !== undefined) {
            setS1QuestionIndex(data.questionIndex - 1);
        }

        if (data.type === 'XUAT_PHAT_START_TIMER' || data.type === 'XUAT_PHAT_BAT_DAU_CAU_HOI') {
            startS1Timer(data.duration || 60);
        } else if (data.type === 'XUAT_PHAT_RIGHT') {
            const btn = document.getElementById(`s1_btn_${s1QIndex + 1}`);
            if (btn) btn.className = 's1-page-btn correct';
        } else if (data.type === 'XUAT_PHAT_WRONG') {
            const btn = document.getElementById(`s1_btn_${s1QIndex + 1}`);
            if (btn) btn.className = 's1-page-btn wrong';
        } else if (data.type === 'XUAT_PHAT_RESET') {
            clearInterval(s1TimerInterval);
            updateMasterRemainingTime('--');
            const clockEl = document.getElementById('s1_clock_box');
            if (clockEl) clockEl.innerText = "60";
            document.getElementById('s1_question_text').innerText = "Đang chờ câu hỏi Xuất Phát...";
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

        if (data.type === 'RA_KHOI_SHOW_QUESTION' || data.type === 'RA_KHOI_PLAY_CLIP') {
            s2TimerStartTime = 0;
            clearInterval(s2TimerInterval);
            const s2Input = document.getElementById('s2_answer_input');
            if (s2Input) {
                s2Input.value = "";
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
            document.getElementById('s2_time_box').innerText = "Thời gian";
            updateMasterRemainingTime('--');
        } else if (data.type === 'RA_KHOI_START_TIMER') {
            s2TimerStartTime = Date.now();
            startS2Timer(data.duration || 30);
        } else if (data.type === 'RA_KHOI_RESET') {
            clearInterval(s2TimerInterval);
            s2TimerStartTime = 0;
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

        if (data.questionText) {
            document.getElementById('s3_question_text').innerText = data.questionText;
        }

        if (data.vuotSong) {
            renderPlayerVSGrid(data.vuotSong);
        }

        if (data.type === 'VUOT_SONG_SELECT_ROW' || data.type === 'VUOT_SONG_SHOW_QUESTION') {
            s3TimerStartTime = 0;
            clearInterval(s3TimerInterval);
            updateMasterRemainingTime('--');
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Đang khóa (Chờ Controller mở...)";
            }
        } else if (data.type === 'VUOT_SONG_START_TIMER') {
            s3TimerStartTime = Date.now();
            startS3Timer(data.duration || 20);
        } else if (data.type === 'VUOT_SONG_RESET') {
            highlightS3Row(0);
            playerOpenedRows = {};
            renderPlayerVSGrid(null, {});
            clearInterval(s3TimerInterval);
            s3TimerStartTime = 0;
            updateMasterRemainingTime('--');
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
            document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = true;
                s3Input.placeholder = "Đang khóa (Chờ Controller mở...)";
            }
        }
    }

    // --- VÒNG 4: VINH QUANG ---
    else if (data.type && data.type.startsWith('VINH_QUANG_')) {
        autoSwitchScene(4);
        currentS2Round = 'VQ';

        if (data.questionText) {
            if (document.getElementById('s4_question_text')) document.getElementById('s4_question_text').innerText = data.questionText;
        }

        if (data.type === 'VINH_QUANG_SHOW_QUESTION') {
            s4TimerStartTime = 0;
            clearInterval(s4TimerInterval);
            updateMasterRemainingTime('--');
            const s4Input = document.getElementById('s4_answer_input');
            if (s4Input) {
                s4Input.value = "";
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = "Thời gian";
        } else if (data.type === 'VINH_QUANG_START_TIMER') {
            s4TimerStartTime = Date.now();
            startS4Timer(data.duration || 25);
        } else if (data.type === 'VINH_QUANG_START_TIMER_5S') {
            s4TimerStartTime = Date.now();
            startS4Timer(5);
        } else if (data.type === 'VINH_QUANG_RESET') {
            clearInterval(s4TimerInterval);
            s4TimerStartTime = 0;
            updateMasterRemainingTime('--');
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = "Thời gian";
            if (document.getElementById('s4_question_text')) document.getElementById('s4_question_text').innerText = "Đang chờ câu hỏi Vinh Quang...";
            const s4Input = document.getElementById('s4_answer_input');
            if (s4Input) {
                s4Input.value = "";
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Chờ thời gian bắt đầu...)";
            }
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
}

// Initial render of Vượt Sóng grid
renderPlayerVSGrid();

// 1. SSE Real-time Connection
if (typeof EventSource !== 'undefined') {
    const ssePath = typeof window.getApiUrl === 'function' ? window.getApiUrl(`/api/events?roomid=${encodeURIComponent(currentRoomCode)}`) : `/api/events?roomid=${encodeURIComponent(currentRoomCode)}`;
    const sse = new EventSource(ssePath);
    sse.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data);
            if (data && data.roomCode && data.roomCode.toUpperCase() !== currentRoomCode) {
                return; // Ignore actions for another room
            }
            handlePlayerMessage(data);
        } catch(err) {}
    };
    sse.onerror = function() {
        fetchCurrentState();
    };
}

// 2. BroadcastChannel
try {
    if (playerChannel) {
        playerChannel.onmessage = function(e) {
            if (e.data && e.data.roomCode && e.data.roomCode.toUpperCase() !== currentRoomCode) return;
            handlePlayerMessage(e.data);
        };
    }
} catch(e) {}

// 3. LocalStorage Listener
window.addEventListener('storage', function(e) {
    if (e.key === 'ddvq_latest_action' && e.newValue) {
        try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.roomCode && parsed.roomCode.toUpperCase() !== currentRoomCode) return;
            handlePlayerMessage(parsed);
        } catch(err) {}
    }
});

// 4. Initial & Interval State Polling Fallback
function fetchCurrentState() {
    const apiPath = typeof window.getApiUrl === 'function' ? window.getApiUrl(`/api/state?roomid=${encodeURIComponent(currentRoomCode)}`) : `/api/state?roomid=${encodeURIComponent(currentRoomCode)}`;
    fetch(apiPath)
        .then(res => res.json())
        .then(data => {
            if (data && data.roomCode && data.roomCode.toUpperCase() !== currentRoomCode) return;
            handlePlayerMessage(data);
        })
        .catch(() => {});
}

fetchCurrentState();
setInterval(fetchCurrentState, 2000);

function triggerRandomDeFromPlayer() {
    const chosenSet = Math.floor(Math.random() * 8) + 1;
    const myName = playerContestants[contestantId - 1]?.name || `Thí sinh ${contestantId}`;

    const payload = {
        id: Math.random().toString(36).substring(2, 9),
        type: 'XUAT_PHAT_RANDOM_DE',
        contestantId: contestantId,
        deNumber: chosenSet,
        name: myName,
        timestamp: Date.now()
    };

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

    try {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    } catch(e) {}

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

// Setup input listeners on page load
document.addEventListener('DOMContentLoaded', () => {
    // Hide legacy modal if present
    const legacyModal = document.getElementById('room_code_modal');
    if (legacyModal) legacyModal.style.display = 'none';

    // S2 Input Enter Handler
    const s2Input = document.getElementById('s2_answer_input');
    if (s2Input) {
        s2Input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitScene2Answer();
            }
        });
    }

    // S3 Input Enter Handler
    const s3Input = document.getElementById('s3_answer_input');
    if (s3Input) {
        s3Input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitScene3Answer(false);
            }
        });
    }

    // S4 Input Enter Handler
    const s4Input = document.getElementById('s4_answer_input');
    if (s4Input) {
        s4Input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitScene4Answer();
            }
        });
    }
});

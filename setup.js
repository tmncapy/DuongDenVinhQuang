// Setup.js - System Tab (Tab 0) & Core State Management
let gameData = {
    xuatPhat: {}, // Turn 1..8 -> [ { q: "", a: "" }, ... 10 items ]
    raKhoi: [
        { q: "", a: "", m: "./cau1.mp4", am: "" },
        { q: "", a: "", m: "./cau2.mp4", am: "" },
        { q: "", a: "", m: "./cau3.mp4", am: "" },
        { q: "", a: "", m: "./cau4.mp4", am: "" }
    ],
    vuotSong: {
        h1: { q: "", a: "" },
        h2: { q: "", a: "" },
        h3: { q: "", a: "" },
        h4: { q: "", a: "" },
        center: { q: "", a: "" },
        keyword: ""
    },
    vinhQuang: {
        10: [],
        20: [],
        30: []
    },
    cauHoiPhu: [
        { q: "", a: "" },
        { q: "", a: "" },
        { q: "", a: "" }
    ],
    intros: {
        opening: './Opening.mp4',
        v1: './V1.mp4',
        v2: './V2.mp4',
        v3: './V3.mp4',
        v4: './V4.mp4'
    },
    contestants: [
        { name: "Thí sinh 1", score: 0 },
        { name: "Thí sinh 2", score: 0 },
        { name: "Thí sinh 3", score: 0 },
        { name: "Thí sinh 4", score: 0 }
    ]
};

let currentXuatPhatTurn = 0;
let editingXuatPhatDe = 1;
let currentVinhQuangPack = 10;

// Safely initialize scoreboardThumbnailStates early
window.scoreboardThumbnailStates = window.scoreboardThumbnailStates || { 1: false, 2: false, 3: false, 4: false };

// Initialize state on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    initXuatPhatTurnData();
    renderXuatPhatTurnUI(1);
    initVinhQuangData();
    renderVinhQuangPackUI(10);
    loadSavedData();
    updateVuotSongState();
    if (typeof setRKQuestionUI === 'function') {
        setRKQuestionUI(1);
    }
    // Restore Scoreboard Thumbnail States
    try {
        for (let c = 1; c <= 4; c++) {
            const savedSelf = localStorage.getItem('ddvq_scoreboard_thumbnail_shown_' + c);
            const savedAll = localStorage.getItem('ddvq_scoreboard_thumbnail_shown');
            if (savedSelf === 'true' || (savedSelf === null && savedAll === 'true')) {
                window.scoreboardThumbnailStates[c] = true;
            } else {
                window.scoreboardThumbnailStates[c] = false;
            }
        }
    } catch(e) {}
    if (typeof updateScoreboardThumbnailBadges === 'function') {
        updateScoreboardThumbnailBadges();
    }
});

// Track current active round and running timer
window.currentActiveRound = localStorage.getItem('ddvq_active_round') || 'XUAT_PHAT';
window.currentActiveTimer = null;
try {
    const tStr = localStorage.getItem('ddvq_current_timer');
    if (tStr) window.currentActiveTimer = JSON.parse(tStr);
} catch(e) {}

// Switch main tabs (Dành riêng cho máy Controller -> đồng bộ màn hình Thí sinh & MC, KHÔNG làm chuyển view hay ẩn đồ họa trên Projector)
function onSwitchTabRound(index) {
    let roundName = 'HE_THONG';
    if (index === 1) roundName = 'XUAT_PHAT';
    else if (index === 2) roundName = 'RA_KHOI';
    else if (index === 3) roundName = 'VUOT_SONG';
    else if (index === 4) roundName = 'VINH_QUANG';
    else if (index === 5) roundName = 'CAU_HOI_PHU';

    window.currentActiveRound = roundName;
    window.currentActiveTimer = null;
    try {
        localStorage.setItem('ddvq_active_round', roundName);
        localStorage.removeItem('ddvq_current_timer');
    } catch(e) {}

    if (typeof syncContestantsUI === 'function') {
        syncContestantsUI();
    }

    if (index === 1) {
        currentXuatPhatTurn = 0;
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`btn_luot_${i}`);
            if (btn) btn.classList.remove('active');
        }
        if (typeof updateTab1Preview === 'function') updateTab1Preview();
    } else if (index === 2) {
        if (typeof setRKQuestionUI === 'function') {
            setRKQuestionUI(typeof currentRKQuestion !== 'undefined' ? currentRKQuestion : 1);
        }
    } else if (index === 3) {
        window.vsRoundStartTime = Date.now();
        try { localStorage.setItem('s3_round_start_time', window.vsRoundStartTime); } catch(e) {}
        if (typeof updateVuotSongState === 'function') updateVuotSongState();
    }

    // Chỉ gửi tín hiệu chuyển vòng cho máy Thí sinh (Player) & Máy MC (Host), không động đến Projector
    const payload = {
        type: 'SWITCH_ROUND_PLAYER_MC',
        round: roundName,
        activeRound: roundName,
        tabIndex: index,
        timestamp: Date.now()
    };
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
}
window.onSwitchTabRound = onSwitchTabRound;

function switchTab(index) {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    tabContents.forEach((content, idx) => {
        if (idx === index) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    onSwitchTabRound(index);
}
window.switchTab = switchTab;

// Bắt đầu vòng thi: Bấm nút tên vòng thi để chuyển cảnh Thí sinh/MC đồng thời ẩn sạch toàn bộ Graphic trên Projector & Graphic
window.startRoundAndCleanGraphics = function(roundIndex) {
    let roundName = 'XUAT_PHAT';
    let viewNum = 1;
    let label = 'Xuất Phát';
    if (roundIndex === 1) {
        roundName = 'XUAT_PHAT';
        viewNum = 1;
        label = 'Xuất Phát';
    } else if (roundIndex === 2) {
        roundName = 'RA_KHOI';
        viewNum = 2;
        label = 'Ra Khơi';
    } else if (roundIndex === 3) {
        roundName = 'VUOT_SONG';
        viewNum = 3;
        label = 'Vượt Sóng';
        window.vsRoundStartTime = Date.now();
        try { localStorage.setItem('s3_round_start_time', window.vsRoundStartTime); } catch(e) {}
    } else if (roundIndex === 4) {
        roundName = 'VINH_QUANG';
        viewNum = 6;
        label = 'Vinh Quang';
    } else if (roundIndex === 5) {
        roundName = 'CAU_HOI_PHU';
        viewNum = 0;
        label = 'Câu Hỏi Phụ';
    }

    window.currentActiveRound = roundName;
    window.currentActiveTimer = null;
    window.xpQuestionIsShown = false;
    window.vsQuestionIsShown = false;
    window.vqQuestionIsShown = false;
    try {
        localStorage.setItem('ddvq_active_round', roundName);
        localStorage.setItem('ddvq_xp_question_shown', 'false');
        localStorage.setItem('ddvq_vs_question_shown', 'false');
        localStorage.setItem('ddvq_vq_question_shown', 'false');
        localStorage.removeItem('ddvq_current_timer');
        localStorage.removeItem('ddvq_xp_question_text');
        localStorage.removeItem('ddvq_vs_question_text');
        localStorage.removeItem('ddvq_vq_question_text');
    } catch(e) {}

    // Gửi tín hiệu chuyển vòng và dọn sạch graphic trên Projector
    const payload = {
        type: 'START_ROUND_CLEAN',
        round: roundName,
        activeRound: roundName,
        roundIndex: roundIndex,
        sceneNum: roundIndex,
        viewNum: viewNum,
        xpQuestionShown: false,
        vsQuestionShown: false,
        vqQuestionShown: false,
        roundStartTime: roundIndex === 3 ? window.vsRoundStartTime : undefined,
        timestamp: Date.now()
    };
    sendToProjector('START_ROUND_CLEAN', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    if (roundIndex === 1) {
        currentXuatPhatTurn = 0;
        if (typeof isXuatPhatStarted !== 'undefined') isXuatPhatStarted = false;
        for (let i = 1; i <= 4; i++) {
            const btn = document.getElementById(`btn_luot_${i}`);
            if (btn) btn.classList.remove('active');
        }
        if (typeof updateTab1Preview === 'function') updateTab1Preview();
        sendToProjector('XUAT_PHAT_RESET', { turnIndex: 0, round: 'XUAT_PHAT', activeRound: 'XUAT_PHAT', xpQuestionShown: false, vqQuestionShown: false });
    } else if (roundIndex === 2) {
        if (typeof setRKQuestionUI === 'function') setRKQuestionUI(1);
        sendToProjector('RA_KHOI_RESET', { round: 'RA_KHOI', activeRound: 'RA_KHOI' });
    } else if (roundIndex === 3) {
        if (typeof updateVuotSongState === 'function') updateVuotSongState();
        sendToProjector('VUOT_SONG_RESET', { round: 'VUOT_SONG', activeRound: 'VUOT_SONG', vsQuestionShown: false, roundStartTime: window.vsRoundStartTime });
    } else if (roundIndex === 4) {
        sendToProjector('VINH_QUANG_RESET', { round: 'VINH_QUANG', activeRound: 'VINH_QUANG', vqQuestionShown: false });
        sendToProjector('VINH_QUANG_HIDE_PACK', { round: 'VINH_QUANG', vqQuestionShown: false });
        sendToProjector('VINH_QUANG_INTRO', { round: 'VINH_QUANG', activeRound: 'VINH_QUANG' });
    } else if (roundIndex === 5) {
        if (typeof onClickCHPReset === 'function') onClickCHPReset();
        sendToProjector('CAU_HOI_PHU_RESET', { round: 'CHP', activeRound: 'CHP' });
    }

    showToast(`🚀 Đã Bắt đầu Vòng ${roundIndex}: ${label}! Đã chuyển tab Player & ẩn toàn bộ Graphic.`);
};

// Show Toast Notification
function showToast(msg) {
    console.log("[Controller Toast]:", msg);
    // Disabled UI toast on controller to prevent lag and button obstruction as requested.
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function safeGetStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn("Storage access restricted:", e);
        return null;
    }
}

function safeSetStorage(key, val) {
    try {
        localStorage.setItem(key, val);
    } catch (e) {
        console.warn("Storage access restricted:", e);
    }
}

function safeRemoveStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn("Storage access restricted:", e);
    }
}

// Seed default questions if empty
function ensureDefaultGameDataSeed() {
    if (!gameData.xuatPhat[1] || !gameData.xuatPhat[1][0] || !gameData.xuatPhat[1][0].q) {
        const defaultXPSet1 = [
            { q: "Thành phố Hồ Chí Minh trước năm 1976 có tên gọi là gì?", a: "Sài Gòn" },
            { q: "Ngôn ngữ chính thức của Việt Nam là gì?", a: "Tiếng Việt" },
            { q: "Hành tinh nào trong Hệ Mặt Trời gần Mặt Trời nhất?", a: "Thủy Tinh" },
            { q: "Sông nào dài nhất chảy hoàn toàn trên lãnh thổ Việt Nam?", a: "Sông Đồng Nai" },
            { q: "Ai là tác giả của tác phẩm Truyện Kiều?", a: "Nguyễn Du" },
            { q: "Kim loại nào có khả năng dẫn điện tốt nhất?", a: "Bạc" },
            { q: "Thủ đô của Nhật Bản là thành phố nào?", a: "Tokyo" },
            { q: "Bác Hồ đọc Tuyên ngôn Độc lập khai sinh nước VNDCCH vào năm nào?", a: "1945" },
            { q: "Đỉnh núi nào được mệnh danh là nóc nhà của Đông Dương?", a: "Fansipan" },
            { q: "Vitamin nào có hàm lượng rất cao trong quả cam, chanh?", a: "Vitamin C" }
        ];
        gameData.xuatPhat[1] = defaultXPSet1;
        for (let t = 2; t <= 8; t++) {
            if (!gameData.xuatPhat[t] || !gameData.xuatPhat[t][0] || !gameData.xuatPhat[t][0].q) {
                gameData.xuatPhat[t] = defaultXPSet1.map((item, idx) => ({
                    q: `Câu hỏi số ${idx + 1} bộ đề ${t}`,
                    a: `Đáp án câu ${idx + 1}`
                }));
            }
        }
    }

    if (!gameData.raKhoi || !gameData.raKhoi[0] || !gameData.raKhoi[0].q) {
        gameData.raKhoi = [
            { q: "Sự kiện lịch sử nào diễn ra vào ngày 30/4/1975?", a: "Giải phóng miền Nam" },
            { q: "Nguyên tố hóa học nào có ký hiệu là Au?", a: "Vàng" },
            { q: "Biển nào có độ mặn cao nhất thế giới?", a: "Biển Chết" },
            { q: "Tập hợp các số tự nhiên được ký hiệu bằng chữ cái nào?", a: "N" }
        ];
    }

    if (!gameData.vuotSong || !gameData.vuotSong.h1 || !gameData.vuotSong.h1.q) {
        gameData.vuotSong = {
            h1: { q: "Loài chim biểu tượng cho hòa bình là chim gì?", a: "BO CHAU" },
            h2: { q: "Thành phố trung tâm kinh tế lớn nhất phía Nam là gì?", a: "TP HO CHI MINH" },
            h3: { q: "Đại dương lớn nhất trên Trái Đất là đại dương nào?", a: "THAI BINH DUONG" },
            h4: { q: "Chất khí chiếm tỷ lệ lớn nhất trong không khí là khí gì?", a: "NITO" },
            center: { q: "Từ khóa chính của chướng ngại vật là gì?", a: "VIET NAM" },
            keyword: "VIET NAM"
        };
    }

    if (!gameData.vinhQuang || !gameData.vinhQuang[10] || !gameData.vinhQuang[10][0] || !gameData.vinhQuang[10][0].q) {
        gameData.vinhQuang = {
            10: [
                { m: "Lịch sử", q: "Kinh đô đầu tiên của nước ta thời Lạc Long Quân là gì?", a: "Phong Châu" },
                { m: "Địa lý", q: "Thành phố nào là thủ đô của Việt Nam?", a: "Hà Nội" }
            ],
            20: [
                { m: "Vật lý", q: "Đơn vị đo cường độ dòng điện trong hệ SI là gì?", a: "Ampe (A)" },
                { m: "Hóa học", q: "Công thức hóa học của nước là gì?", a: "H2O" }
            ],
            30: [
                { m: "Toán học", q: "Số nguyên tố nhỏ nhất là số mấy?", a: "2" },
                { m: "Văn học", q: "Tác giả của Nam quốc sơn hà là ai?", a: "Lý Thường Kiệt" }
            ]
        };
    }
}

// Initialize empty Xuat Phat turns
function initXuatPhatTurnData() {
    for (let turn = 1; turn <= 8; turn++) {
        if (!gameData.xuatPhat[turn]) {
            gameData.xuatPhat[turn] = [];
            for (let i = 0; i < 10; i++) {
                gameData.xuatPhat[turn].push({ q: '', a: '' });
            }
        }
    }
    ensureDefaultGameDataSeed();
}

// Render Xuat Phat 10 rows for editing a set (1..8)
function renderXuatPhatTurnUI(deNum) {
    editingXuatPhatDe = deNum || 1;
    const container = document.getElementById('xuatPhatRows');
    if (!container) return;

    // Highlight tab header
    const tabs = document.querySelectorAll('#xuatPhatTabHeader .kd-tab');
    tabs.forEach((tab, idx) => {
        if (idx + 1 === deNum) tab.classList.add('active');
        else tab.classList.remove('active');
    });

    container.innerHTML = '';
    const questions = gameData.xuatPhat[deNum] || [];

    for (let i = 0; i < 10; i++) {
        const item = questions[i] || { q: '', a: '' };
        const row = document.createElement('div');
        row.className = 'kd-row';
        row.innerHTML = `
            <span style="font-weight: bold; color: #555;">Câu ${i + 1}</span>
            <input type="text" value="${escapeHtml(item.q)}" placeholder="Nội dung câu hỏi ${i + 1}" oninput="updateXuatPhatItem(${deNum}, ${i}, 'q', this.value)">
            <input type="text" value="${escapeHtml(item.a)}" placeholder="Đáp án câu ${i + 1}" oninput="updateXuatPhatItem(${deNum}, ${i}, 'a', this.value)">
        `;
        container.appendChild(row);
    }
}

function switchXuatPhatTurn(deNum) {
    renderXuatPhatTurnUI(deNum);
}

function scrollXuatPhatTabs(direction) {
    let next = editingXuatPhatDe + direction;
    if (next < 1) next = 8;
    if (next > 8) next = 1;
    switchXuatPhatTurn(next);
}

// Debounced State Saving & Broadcasting to prevent input lag
let debouncedSaveTimeout = null;
function debouncedSaveAllData(delay = 250) {
    if (debouncedSaveTimeout) clearTimeout(debouncedSaveTimeout);
    debouncedSaveTimeout = setTimeout(() => {
        saveAllData(false);
    }, delay);
}

function updateXuatPhatItem(turn, index, field, value) {
    if (!gameData.xuatPhat[turn]) gameData.xuatPhat[turn] = [];
    if (!gameData.xuatPhat[turn][index]) gameData.xuatPhat[turn][index] = { q: '', a: '' };
    gameData.xuatPhat[turn][index][field] = value;
    debouncedSaveAllData(300);
}

// Vuot Song Crossword & character counter
let vsSyncTimeout = null;
function updateVuotSongState() {
    if (!gameData.vuotSong || Array.isArray(gameData.vuotSong)) {
        gameData.vuotSong = { h1: {q:"",a:""}, h2: {q:"",a:""}, h3: {q:"",a:""}, h4: {q:"",a:""}, center: {q:"",a:""}, keyword: "" };
    }
    for (let i = 1; i <= 4; i++) {
        const qEl = document.getElementById(`vs_q_${i}`);
        const aEl = document.getElementById(`vs_a_${i}`);
        if (qEl || aEl) {
            const qVal = qEl ? qEl.value : (gameData.vuotSong[`h${i}`]?.q || '');
            let aVal = aEl ? aEl.value : (gameData.vuotSong[`h${i}`]?.a || '');
            if (!aVal.trim() && qVal.trim()) {
                aVal = qVal;
            }
            gameData.vuotSong[`h${i}`] = { q: qVal, a: aVal };
        }

        const aVal = gameData.vuotSong[`h${i}`]?.a || gameData.vuotSong[`h${i}`]?.q || '';
        const boxContainer = document.getElementById(`vs_box_${i}`);
        const countSpan = document.getElementById(`vs_count_${i}`);
        
        if (boxContainer) {
            boxContainer.innerHTML = '';
            const cleanAns = aVal.replace(/\s+/g, '').toUpperCase();
            for (let c of cleanAns) {
                const cell = document.createElement('span');
                cell.className = 'box-cell';
                cell.innerText = c;
                boxContainer.appendChild(cell);
            }
            if (cleanAns.length === 0) {
                boxContainer.innerHTML = '<span style="color:#aaa; font-style:italic;">Chưa có đáp án</span>';
            }
        }
        if (countSpan) {
            const cleanLen = aVal.replace(/\s+/g, '').length;
            countSpan.innerText = `${cleanLen} kí tự`;
        }
    }

    // Center & Keyword
    const qcEl = document.getElementById('vs_q_center');
    const acEl = document.getElementById('vs_a_center');
    if (qcEl || acEl) {
        const qcVal = qcEl ? qcEl.value : (gameData.vuotSong.center?.q || '');
        let acVal = acEl ? acEl.value : (gameData.vuotSong.center?.a || '');
        if (!acVal.trim() && qcVal.trim()) acVal = qcVal;
        gameData.vuotSong.center = { q: qcVal, a: acVal };
    }

    const kwEl = document.getElementById('vs_keyword');
    if (kwEl) {
        gameData.vuotSong.keyword = kwEl.value;
    }
    if (!gameData.vuotSong.keyword && gameData.vuotSong.center?.a) {
        gameData.vuotSong.keyword = gameData.vuotSong.center.a;
    }
    const kwSpan = document.getElementById('vs_keyword_count');
    if (kwSpan) {
        const kwVal = gameData.vuotSong.keyword || gameData.vuotSong.center?.a || gameData.vuotSong.center?.q || '';
        kwSpan.innerText = `${kwVal.replace(/\s+/g, '').length} kí tự`;
    }

    if (vsSyncTimeout) clearTimeout(vsSyncTimeout);
    vsSyncTimeout = setTimeout(() => {
        debouncedSaveAllData(100);
        sendToProjector('VUOT_SONG_SYNC_GRID', { vuotSong: gameData.vuotSong });
    }, 200);
}

// Vinh Quang 3 packs (10, 20, 30 point tiers x 12 questions each)
function initVinhQuangData() {
    if (!gameData.vinhQuang || typeof gameData.vinhQuang !== 'object') {
        gameData.vinhQuang = { 10: [], 20: [], 30: [] };
    }
    for (let pt of [10, 20, 30]) {
        if (!gameData.vinhQuang[pt] || !Array.isArray(gameData.vinhQuang[pt])) {
            gameData.vinhQuang[pt] = [];
        }
        while (gameData.vinhQuang[pt].length < 12) {
            gameData.vinhQuang[pt].push({ m: '', q: '', a: '' });
        }
    }
}

function switchVinhQuangPack(pack) {
    currentVinhQuangPack = pack;
    renderVinhQuangPackUI(pack);
}

function renderVinhQuangPackUI(pack) {
    initVinhQuangData();
    
    // Sync radio buttons in Tab 0 and Tab 4
    document.querySelectorAll('input[name="vq_pack"], input[name="tab0_vq_pack"]').forEach(radio => {
        radio.checked = (parseInt(radio.value) === pack);
    });

    // Render Contestants
    const vqContestants = document.getElementById('vq_contestants');
    if (vqContestants) {
        vqContestants.innerHTML = '';
        for (let i = 1; i <= 4; i++) {
            const contestant = gameData.contestants?.[i-1] || { name: `Thí sinh ${i}`, score: 0 };
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '8px';
            div.innerHTML = `
                <div style="position: relative; width: 75px; height: 56px; background: #fff; border: 3px solid #dc2626; border-radius: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span id="vq_ts${i}_score_disp" style="font-size: 30px; font-weight: bold; color: #dc2626;">${contestant.score || 0}</span>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <div style="display: flex; background: #f59e0b; padding: 4px 8px; border-radius: 2px 2px 0 0; align-items: center; gap: 5px; border: 2px solid #d97706; border-bottom: none;">
                        <input type="text" value="${contestant.name}" style="background: transparent; border: none; font-weight: bold; color: #000; font-size: 14px; flex: 1; outline: none;" readonly>
                    </div>
                    <div style="height: 24px; background: #15803d; border-radius: 0 0 2px 2px; border: 2px solid #166534; border-top: none;"></div>
                </div>
            `;
            vqContestants.appendChild(div);
        }
    }

    const containers = [
        document.getElementById('vinhQuangRows'),
        document.getElementById('tab0_vinhQuangRows')
    ];

    containers.forEach(container => {
        if (!container) return;
        container.innerHTML = '';

        let color = '#0056b3';
        if (pack === 20) color = '#d97706';
        if (pack === 30) color = '#dc2626';

        // Header row for input columns
        const headerRow = document.createElement('div');
        headerRow.style.display = 'grid';
        headerRow.style.gridTemplateColumns = '130px 1.5fr 3fr 1.5fr';
        headerRow.style.gap = '10px';
        headerRow.style.fontWeight = 'bold';
        headerRow.style.color = '#333';
        headerRow.style.marginBottom = '8px';
        headerRow.style.paddingBottom = '4px';
        headerRow.style.borderBottom = '2px solid #cbd5e1';
        headerRow.innerHTML = `
            <span>GÓI ${pack} ĐIỂM</span>
            <span>MÔN HỌC</span>
            <span>NỘI DUNG CÂU HỎI</span>
            <span>ĐÁP ÁN</span>
        `;
        container.appendChild(headerRow);

        const questions = gameData.vinhQuang[pack] || [];

        for (let i = 0; i < 12; i++) {
            const item = questions[i] || { m: '', q: '', a: '' };
            const row = document.createElement('div');
            row.className = 'vq-q-row';
            row.innerHTML = `
                <span style="font-weight: bold; color: ${color}; width: 130px;">Câu ${i + 1}</span>
                <div>
                    <input type="text" value="${escapeHtml(item.m || '')}" placeholder="Môn học (Category...)" oninput="updateVinhQuangItem(${pack}, ${i}, 'm', this.value)">
                </div>
                <div>
                    <input type="text" value="${escapeHtml(item.q || '')}" placeholder="Nội dung câu ${pack}đ - ${i + 1}" oninput="updateVinhQuangItem(${pack}, ${i}, 'q', this.value)">
                </div>
                <div>
                    <input type="text" value="${escapeHtml(item.a || '')}" placeholder="Đáp án câu ${pack}đ - ${i + 1}" oninput="updateVinhQuangItem(${pack}, ${i}, 'a', this.value)">
                </div>
            `;
            container.appendChild(row);
        }
    });
}

function updateVinhQuangItem(pack, index, field, value) {
    initVinhQuangData();
    if (!gameData.vinhQuang[pack][index]) {
        gameData.vinhQuang[pack][index] = { m: '', q: '', a: '' };
    }
    gameData.vinhQuang[pack][index][field] = value;
    debouncedSaveAllData(300);
}

// Excel Upload Handler
function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('excelFileName').value = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            parseExcelWorkbook(workbook);

            const step4 = document.getElementById('step4-check');
            if (step4) {
                step4.className = 'status-check green-check';
                step4.innerText = '✅';
            }

            showToast(`Đã nhập dữ liệu thành công từ file ${file.name}!`);
            saveAllData(true);
        } catch (err) {
            console.error("Excel parse error:", err);
            alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra đúng định dạng mẫu đề!");
        }
    };
    reader.readAsArrayBuffer(file);
}

function parseExcelWorkbook(workbook) {
    const sheetNames = workbook.SheetNames;

    sheetNames.forEach(sheetName => {
        const cleanSheetName = sheetName.trim().toUpperCase();
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

        if (cleanSheetName.includes("XUẤT PHÁT") || cleanSheetName.includes("KHỞI ĐỘNG") || cleanSheetName.includes("XUAT PHAT")) {
            parseXuatPhatSheet(rawRows);
        } else if (cleanSheetName.includes("RA KHƠI") || cleanSheetName.includes("RA KHOI")) {
            parseRaKhoiSheet(rawRows);
        } else if (cleanSheetName.includes("VƯỢT SÓNG") || cleanSheetName.includes("VUOT SONG") || cleanSheetName.includes("VƯỢT CHƯỚNG NGẠI VẬT")) {
            parseVuotSongSheet(rawRows);
        } else if (cleanSheetName.includes("VINH QUANG") || cleanSheetName.includes("VỀ ĐÍCH")) {
            parseVinhQuangSheet(rawRows);
        } else if (cleanSheetName.includes("CÂU HỎI PHỤ") || cleanSheetName.includes("CAU HOI PHU")) {
            parseCauHoiPhuSheet(rawRows);
        }
    });

    renderXuatPhatTurnUI(currentXuatPhatTurn);
    fillRaKhoiInputs();
    fillVuotSongInputs();
    renderVinhQuangPackUI(currentVinhQuangPack);
    fillCauHoiPhuInputs();
    updateVuotSongState();
}

function parseXuatPhatSheet(rows) {
    let currentTurn = 1;
    let currentItemIndex = 0;

    for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const sttDe = row[0] !== undefined && row[0] !== "" ? parseInt(row[0]) : null;
        const questionText = (row[1] || "").toString().trim();
        const answerText = (row[2] || "").toString().trim();

        if (!questionText && !answerText) continue;

        if (sttDe && !isNaN(sttDe)) {
            currentTurn = sttDe;
            currentItemIndex = 0;
        }

        if (!gameData.xuatPhat[currentTurn]) {
            gameData.xuatPhat[currentTurn] = [];
            for (let i = 0; i < 10; i++) gameData.xuatPhat[currentTurn].push({ q: '', a: '' });
        }

        if (currentItemIndex < 10) {
            gameData.xuatPhat[currentTurn][currentItemIndex] = {
                q: questionText,
                a: answerText
            };
            currentItemIndex++;
        }
    }
}

function parseRaKhoiSheet(rows) {
    if (!Array.isArray(gameData.raKhoi)) {
        gameData.raKhoi = [ {q:"",a:""}, {q:"",a:""}, {q:"",a:""}, {q:"",a:""} ];
    }
    let count = 0;
    for (let r = 2; r < rows.length && count < 4; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const qText = (row[1] || "").toString().trim();
        const aText = (row[2] || "").toString().trim();

        if (qText || aText) {
            gameData.raKhoi[count] = { q: qText, a: aText, m: "...", am: "..." };
            count++;
        }
    }
}

function parseVuotSongSheet(rows) {
    if (!gameData.vuotSong || Array.isArray(gameData.vuotSong)) {
        gameData.vuotSong = { h1: {q:"",a:""}, h2: {q:"",a:""}, h3: {q:"",a:""}, h4: {q:"",a:""}, center: {q:"",a:""}, keyword: "" };
    }
    let rowIndex = 1;
    for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const colA = (row[0] || "").toString().trim();
        const qText = (row[1] || "").toString().trim();
        const aText = (row[2] || "").toString().trim();

        if (colA.toUpperCase().includes("TRUNG TÂM") || colA.toUpperCase().includes("TỪ KHÓA") || r === 6) {
            if (r === 6 && !colA.toUpperCase().includes("ĐÁP ÁN VÒNG THI")) {
                gameData.vuotSong.center = { q: qText, a: aText };
            }
        } else if (rowIndex <= 4) {
            gameData.vuotSong[`h${rowIndex}`] = { q: qText, a: aText };
            rowIndex++;
        }

        if (colA.toUpperCase().includes("TỪ KHÓA") || colA.toUpperCase().includes("ĐÁP ÁN VÒNG THI")) {
            gameData.vuotSong.keyword = aText || qText;
        }
    }
}

function parseVinhQuangSheet(rows) {
    initVinhQuangData();
    let questionIndex = 0;
    for (let r = 0; r < rows.length && questionIndex < 12; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const colA = (row[0] || "").toString().trim().toUpperCase();
        const colB = (row[1] || "").toString().trim().toUpperCase();

        // Skip title or header rows
        if (colA.includes("VINH QUANG") || colA.includes("STT") || colA.includes("CÂU") || colA.includes("GÓI") || colB.includes("GÓI 10") || colB.includes("MÔN HỌC")) continue;

        const m10 = (row[1] || "").toString().trim();
        const q10 = (row[2] || "").toString().trim();
        const a10 = (row[3] || "").toString().trim();

        const m20 = (row[4] || "").toString().trim();
        const q20 = (row[5] || "").toString().trim();
        const a20 = (row[6] || "").toString().trim();

        const m30 = (row[7] || "").toString().trim();
        const q30 = (row[8] || "").toString().trim();
        const a30 = (row[9] || "").toString().trim();

        if (m10 || q10 || a10) gameData.vinhQuang[10][questionIndex] = { m: m10, q: q10, a: a10 };
        if (m20 || q20 || a20) gameData.vinhQuang[20][questionIndex] = { m: m20, q: q20, a: a20 };
        if (m30 || q30 || a30) gameData.vinhQuang[30][questionIndex] = { m: m30, q: q30, a: a30 };

        questionIndex++;
    }
}

function parseCauHoiPhuSheet(rows) {
    let count = 0;
    for (let r = 2; r < rows.length && count < 3; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const qText = (row[1] || "").toString().trim();
        const aText = (row[2] || "").toString().trim();

        if (qText || aText) {
            gameData.cauHoiPhu[count] = { q: qText, a: aText };
            count++;
        }
    }
}

function fillRaKhoiInputs() {
    if (!Array.isArray(gameData.raKhoi)) {
        gameData.raKhoi = [
            { q: "", a: "", m: "./cau1.mp4" },
            { q: "", a: "", m: "./cau2.mp4" },
            { q: "", a: "", m: "./cau3.mp4" },
            { q: "", a: "", m: "./cau4.mp4" }
        ];
    }
    for (let i = 1; i <= 4; i++) {
        const item = gameData.raKhoi[i - 1] || { q: '', a: '', m: `./cau${i}.mp4` };
        const qEl = document.getElementById(`rk_q_${i}`);
        const aEl = document.getElementById(`rk_a_${i}`);
        const mEl = document.getElementById(`rk_m_${i}`);
        const amEl = document.getElementById(`rk_am_${i}`);
        if (qEl) qEl.value = item.q || '';
        if (aEl) aEl.value = item.a || '';
        if (mEl) mEl.value = item.m || `./cau${i}.mp4`;
        if (amEl) amEl.value = item.am || '';
    }
}

function fillVuotSongInputs() {
    if (!gameData.vuotSong || Array.isArray(gameData.vuotSong)) {
        gameData.vuotSong = { h1: {q:"",a:""}, h2: {q:"",a:""}, h3: {q:"",a:""}, h4: {q:"",a:""}, center: {q:"",a:""}, keyword: "" };
    }
    for (let i = 1; i <= 4; i++) {
        const item = gameData.vuotSong[`h${i}`] || { q: '', a: '' };
        const qEl = document.getElementById(`vs_q_${i}`);
        const aEl = document.getElementById(`vs_a_${i}`);
        if (qEl) qEl.value = item.q || '';
        if (aEl) aEl.value = item.a || '';
    }
    const cItem = gameData.vuotSong.center || { q: '', a: '' };
    const qc = document.getElementById('vs_q_center');
    const ac = document.getElementById('vs_a_center');
    if (qc) qc.value = cItem.q || '';
    if (ac) ac.value = cItem.a || '';

    const kw = document.getElementById('vs_keyword');
    if (kw) kw.value = gameData.vuotSong.keyword || '';
}

function fillCauHoiPhuInputs() {
    if (!Array.isArray(gameData.cauHoiPhu)) gameData.cauHoiPhu = [];
    for (let i = 1; i <= 3; i++) {
        const item = gameData.cauHoiPhu[i - 1] || { q: '', a: '' };
        const sysQ = document.getElementById(`sys_chp_q_${i}`);
        const sysA = document.getElementById(`sys_chp_a_${i}`);
        if (sysQ) sysQ.value = item.q || '';
        if (sysA) sysA.value = item.a || '';

        const qEl = document.getElementById(`chp_q_${i}`);
        const aEl = document.getElementById(`chp_a_${i}`);
        if (qEl) qEl.value = item.q || '';
        if (aEl) aEl.value = item.a || '';
    }
}

function fillIntroInputs() {
    if (!gameData.intros) return;
    const opEl = document.getElementById('intro_media_opening');
    const v1El = document.getElementById('intro_media_v1');
    const v2El = document.getElementById('intro_media_v2');
    const v3El = document.getElementById('intro_media_v3');
    const v4El = document.getElementById('intro_media_v4');
    if (opEl && gameData.intros.opening) opEl.value = gameData.intros.opening;
    if (v1El && gameData.intros.v1) v1El.value = gameData.intros.v1;
    if (v2El && gameData.intros.v2) v2El.value = gameData.intros.v2;
    if (v3El && gameData.intros.v3) v3El.value = gameData.intros.v3;
    if (v4El && gameData.intros.v4) v4El.value = gameData.intros.v4;

    for (let i = 1; i <= 10; i++) {
        const imgEl = document.getElementById(`intro_media_img${i}`);
        if (imgEl && gameData.intros[`img${i}`]) {
            imgEl.value = gameData.intros[`img${i}`];
        }
    }

    const customSoundEl = document.getElementById('controller_custom_sound_url');
    if (customSoundEl && gameData.intros.customSound) {
        customSoundEl.value = gameData.intros.customSound;
    }
}

function saveAllData(notify = false) {
    try {
        if (!Array.isArray(gameData.raKhoi)) gameData.raKhoi = [];
        for (let i = 1; i <= 4; i++) {
            const qEl = document.getElementById(`rk_q_${i}`);
            const aEl = document.getElementById(`rk_a_${i}`);
            const mEl = document.getElementById(`rk_m_${i}`);
            const amEl = document.getElementById(`rk_am_${i}`);
            if (qEl || aEl || mEl || amEl) {
                const qVal = qEl?.value || '';
                const aVal = aEl?.value || '';
                const mVal = mEl?.value !== undefined ? mEl.value : '';
                const amVal = amEl?.value || '';
                gameData.raKhoi[i - 1] = {
                    q: qVal || gameData.raKhoi[i - 1]?.q || '',
                    a: aVal || gameData.raKhoi[i - 1]?.a || '',
                    m: mVal || gameData.raKhoi[i - 1]?.m || `./cau${i}.mp4`,
                    am: amVal || gameData.raKhoi[i - 1]?.am || ''
                };
            }
        }

        if (!gameData.vuotSong || Array.isArray(gameData.vuotSong)) {
            gameData.vuotSong = { h1: {q:"",a:""}, h2: {q:"",a:""}, h3: {q:"",a:""}, h4: {q:"",a:""}, center: {q:"",a:""}, keyword: "" };
        }
        for (let i = 1; i <= 4; i++) {
            const qEl = document.getElementById(`vs_q_${i}`);
            const aEl = document.getElementById(`vs_a_${i}`);
            if (qEl || aEl) {
                gameData.vuotSong[`h${i}`] = {
                    q: qEl ? qEl.value : (gameData.vuotSong[`h${i}`]?.q || ''),
                    a: aEl ? aEl.value : (gameData.vuotSong[`h${i}`]?.a || '')
                };
            }
        }
        const qcEl = document.getElementById('vs_q_center');
        const acEl = document.getElementById('vs_a_center');
        if (qcEl || acEl) {
            gameData.vuotSong.center = {
                q: qcEl ? qcEl.value : (gameData.vuotSong.center?.q || ''),
                a: acEl ? acEl.value : (gameData.vuotSong.center?.a || '')
            };
        }
        const kwEl = document.getElementById('vs_keyword');
        if (kwEl) {
            gameData.vuotSong.keyword = kwEl.value;
        }

        initVinhQuangData();

        if (!Array.isArray(gameData.cauHoiPhu)) gameData.cauHoiPhu = [];
        for (let i = 1; i <= 3; i++) {
            const qVal = document.getElementById(`chp_q_${i}`)?.value || document.getElementById(`sys_chp_q_${i}`)?.value || '';
            const aVal = document.getElementById(`chp_a_${i}`)?.value || document.getElementById(`sys_chp_a_${i}`)?.value || '';
            if (qVal || aVal) gameData.cauHoiPhu[i - 1] = { q: qVal, a: aVal };
        }

        if (!gameData.intros) {
            gameData.intros = {
                opening: './Opening.mp4',
                v1: './V1.mp4',
                v2: './V2.mp4',
                v3: './V3.mp4',
                v4: './V4.mp4'
            };
        }
        const opEl = document.getElementById('intro_media_opening');
        const v1El = document.getElementById('intro_media_v1');
        const v2El = document.getElementById('intro_media_v2');
        const v3El = document.getElementById('intro_media_v3');
        const v4El = document.getElementById('intro_media_v4');
        if (opEl) gameData.intros.opening = opEl.value;
        if (v1El) gameData.intros.v1 = v1El.value;
        if (v2El) gameData.intros.v2 = v2El.value;
        if (v3El) gameData.intros.v3 = v3El.value;
        if (v4El) gameData.intros.v4 = v4El.value;

        for (let i = 1; i <= 10; i++) {
            const imgEl = document.getElementById(`intro_media_img${i}`);
            if (imgEl) {
                gameData.intros[`img${i}`] = imgEl.value;
            }
        }

        const customSoundEl = document.getElementById('controller_custom_sound_url');
        if (customSoundEl) {
            gameData.intros.customSound = customSoundEl.value;
        }

        safeSetStorage('duong_den_vinh_quang_data', JSON.stringify(gameData));
        const syncPayload = {
            type: 'SYNC_GAME_DATA',
            gameData: gameData,
            timestamp: Date.now()
        };
        sendToProjector('SYNC_GAME_DATA', syncPayload);
        if (typeof sendSupabaseAction === 'function') {
            sendSupabaseAction(syncPayload);
        }
        if (notify) {
            showToast('Đã lưu tất cả dữ liệu câu hỏi vào hệ thống!');
        }
    } catch(e) {
        console.warn("saveAllData error:", e);
    }
}

window.vsSubmissions = window.vsSubmissions || {};

function updateVSBuzzerLabels() {
    window.vsSubmissions = window.vsSubmissions || {};
    
    // Collect all contestants who have buzzed
    const submissions = Object.keys(window.vsSubmissions).map(idxStr => {
        const idx = parseInt(idxStr);
        const sub = window.vsSubmissions[idxStr];
        const timeVal = typeof sub === 'object' ? sub.time : sub;
        const numTime = typeof sub === 'object' ? (sub.numTime || parseFloat(timeVal) || 999) : (parseFloat(timeVal) || 999);
        const timestamp = (typeof sub === 'object' && sub.timestamp) ? sub.timestamp : 0;
        return { idx, timeVal, numTime, timestamp };
    });
    
    // Sort by numTime ascending, then by timestamp
    submissions.sort((a, b) => {
        if (Math.abs(a.numTime - b.numTime) > 0.001) {
            return a.numTime - b.numTime;
        }
        return a.timestamp - b.timestamp;
    });

    const count = submissions.length;

    // Update all 4 contestants' inputs: Red text, followed by (${timeStr}s) and (${rank})
    for (let i = 1; i <= 4; i++) {
        const nameInput = document.getElementById(`ts${i}_name_vs`);
        if (!nameInput) continue;
        
        const rawBase = gameData.contestants?.[i - 1]?.name || `Thí sinh ${i}`;
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
            // Format: Tên Thí Sinh (thời gian bấm) và (thứ tự bấm nếu có nhiều người bấm cùng lúc)
            nameInput.value = `${baseName} (${timeStr}s)${rankSuffix}`;
            nameInput.style.color = '#dc2626';
            nameInput.style.fontWeight = 'bold';
        } else {
            nameInput.value = baseName;
            nameInput.style.color = '#000000';
            nameInput.style.fontWeight = 'bold';
        }
    }
}
window.updateVSBuzzerLabels = updateVSBuzzerLabels;

function markVSContestantSubmitted(tsIdx, timeStr) {
    if (!tsIdx || tsIdx < 1 || tsIdx > 4) return;
    const idx = parseInt(tsIdx);
    
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

    window.vsSubmissions = window.vsSubmissions || {};
    if (!window.vsSubmissions[idx]) {
        window.vsSubmissions[idx] = {
            time: cleanTime,
            numTime: parseFloat(cleanTime) || 999,
            timestamp: Date.now()
        };
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

    const rawBase = gameData.contestants?.[idx - 1]?.name || `Thí sinh ${idx}`;
    const baseName = rawBase.replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
    if (typeof showToast === 'function') {
        showToast(`🔔 ${baseName} đã bấm chuông Vượt Sóng (${cleanTime}s)!`);
    }
}
window.markVSContestantSubmitted = markVSContestantSubmitted;

function syncContestantsUI() {
    if (gameData.contestants && Array.isArray(gameData.contestants)) {
        gameData.contestants.forEach((c, i) => {
            const idx = i + 1;
            const tab0Input = document.getElementById(`ts_name_${idx}`);
            if (tab0Input) tab0Input.value = c.name || `Thí sinh ${idx}`;
            const tab1Input = document.getElementById(`ts${idx}_name`);
            if (tab1Input) tab1Input.value = c.name || `Thí sinh ${idx}`;
            const tab2Input = document.getElementById(`ts${idx}_name_rk`);
            if (tab2Input) tab2Input.value = c.name || `Thí sinh ${idx}`;
            
            const tab3Input = document.getElementById(`ts${idx}_name_vs`);
            if (tab3Input) {
                const baseName = (c.name || `Thí sinh ${idx}`).replace(/\s*\(\d+\)/g, '').replace(/\s*\([\d\.]+(?:s|giây|S)?\)/gi, '').trim();
                if (!window.vsSubmissions || !window.vsSubmissions[idx]) {
                    tab3Input.value = baseName;
                    tab3Input.style.color = '#000';
                    tab3Input.style.fontWeight = 'normal';
                }
            }

            const tab4Input = document.getElementById(`ts${idx}_name_vq`);
            if (tab4Input) tab4Input.value = c.name || `Thí sinh ${idx}`;
            
            const scoreVal = c.score !== undefined ? c.score : 0;
            const disp = document.getElementById(`ts${idx}_score_disp`);
            if (disp) disp.innerText = scoreVal;
            const dispRK = document.getElementById(`ts${idx}_score_disp_rk`);
            if (dispRK) dispRK.innerText = scoreVal;
            const dispVS = document.getElementById(`ts${idx}_score_disp_vs`);
            if (dispVS) dispVS.innerText = scoreVal;
            const dispVQ = document.getElementById(`ts${idx}_score_disp_vq`);
            if (dispVQ) dispVQ.innerText = scoreVal;
        });
        updateVSBuzzerLabels();
        if (typeof updateTab1Preview === 'function') updateTab1Preview();
        try {
            localStorage.setItem('ddvq_contestants', JSON.stringify(gameData.contestants));
        } catch(e) {}
        sendToProjector('UPDATE_SCORES', { contestants: gameData.contestants });
        sendToProjector('UPDATE_CONTESTANTS', { contestants: gameData.contestants });
    }
}

function loadSavedData() {
    try {
        const saved = safeGetStorage('duong_den_vinh_quang_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            gameData = Object.assign(gameData, parsed);
            renderXuatPhatTurnUI(currentXuatPhatTurn);
            fillRaKhoiInputs();
            fillVuotSongInputs();
            renderVinhQuangPackUI(currentVinhQuangPack);
            fillCauHoiPhuInputs();
            fillIntroInputs();
            updateVuotSongState();
            syncContestantsUI();
            if (typeof updateTab1Preview === 'function') updateTab1Preview();
            if (typeof loadAudioSettings === 'function') loadAudioSettings();

            const step4 = document.getElementById('step4-check');
            if (step4) {
                step4.className = 'status-check green-check';
                step4.innerText = '✅';
            }
        }
    } catch(e) {
        console.error('Error loading saved data:', e);
    }
}

function resetAllData() {
    if (confirm("Bạn có chắc chắn muốn xóa và thiết lập lại toàn bộ dữ liệu không?")) {
        if (gameData && gameData.contestants) {
            gameData.contestants.forEach((c, i) => {
                c.score = 0;
            });
        }
        sendToProjector('RESET_ALL_DATA');
        safeRemoveStorage('duong_den_vinh_quang_data');
        location.reload();
    }
}

let updateContestantNameTimeout = null;
function updateContestantName(i, val) {
    if (!gameData.contestants) gameData.contestants = [];
    
    // Preserve raw input while converting to uppercase for Vietnamese text, stripping time suffix if present
    const cleanRaw = (val || '').replace(/\s*\([\d\.]+(?:s|giây)?\)/gi, '').trim();
    const upperVal = cleanRaw.toLocaleUpperCase('vi-VN');

    if (!gameData.contestants[i - 1]) {
        gameData.contestants[i - 1] = { name: upperVal, score: 0 };
    } else {
        gameData.contestants[i - 1].name = upperVal;
    }

    // Synchronize to other tab inputs, but DO NOT modify currently focused input to avoid interrupting IME typing / space
    const activeEl = document.activeElement;
    const inputs = [
        document.getElementById(`ts_name_${i}`),
        document.getElementById(`ts${i}_name`),
        document.getElementById(`ts${i}_name_rk`),
        document.getElementById(`ts${i}_name_vs`),
        document.getElementById(`ts${i}_name_vq`)
    ];

    inputs.forEach(inp => {
        if (inp && inp !== activeEl && inp.value !== upperVal) {
            inp.value = upperVal;
        }
    });

    if (typeof updateTab1Preview === 'function') updateTab1Preview();

    // Debounce disk save and network broadcast to prevent lag while typing
    if (updateContestantNameTimeout) clearTimeout(updateContestantNameTimeout);
    updateContestantNameTimeout = setTimeout(() => {
        saveAllData(false);

        const payload = {
            type: 'UPDATE_SCORES',
            contestants: gameData.contestants,
            gameData: gameData,
            timestamp: Date.now()
        };

        sendToProjector('UPDATE_SCORES', payload);

        try {
            localStorage.setItem('ddvq_latest_action', JSON.stringify(payload));
            localStorage.setItem('ddvq_contestants', JSON.stringify(gameData.contestants));
        } catch(e) {}

        debouncePostServerState({
            contestants: gameData.contestants,
            gameData: gameData
        });
    }, 400);
}

let __postServerStateTimeout = null;
function debouncePostServerState(data) {
    if (__postServerStateTimeout) clearTimeout(__postServerStateTimeout);
    __postServerStateTimeout = setTimeout(() => {
        try {
            if (typeof hasLocalServerBackend === 'function' && hasLocalServerBackend()) {
                fetch(getApiUrl('/api/state'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                }).catch(() => {});
            }
        } catch(e) {}
    }, 600);
}

function updateContestantNames() {
    for (let i = 1; i <= 4; i++) {
        const rawVal = document.getElementById(`ts_name_${i}`)?.value || `Thí sinh ${i}`;
        const val = rawVal.trim().toLocaleUpperCase('vi-VN');
        updateContestantName(i, val);
    }
    showToast('Đã cập nhật và đồng bộ tên thí sinh sang Projector và Máy thí sinh!');
}

function syncDataToProjector() {
    saveAllData();
    updateContestantNames();
    sendToProjector('UPDATE_SCORES', { contestants: gameData.contestants, gameData: gameData });
    debouncePostServerState({
        contestants: gameData.contestants,
        gameData: gameData
    });
    showToast('Đã đồng bộ toàn bộ dữ liệu sang Màn Hình Chiếu!');
}

function exportExcelFile() {
    saveAllData();
    const wb = XLSX.utils.book_new();

    const xpRows = [["XUẤT PHÁT"], ["STT ĐỀ", "NỘI DUNG", "ĐÁP ÁN"]];
    for (let t = 1; t <= 8; t++) {
        const turnData = gameData.xuatPhat[t] || [];
        for (let i = 0; i < 10; i++) {
            const q = turnData[i]?.q || '';
            const a = turnData[i]?.a || '';
            xpRows.push([i === 0 ? t : "", q, a]);
        }
    }
    const wsXP = XLSX.utils.aoa_to_sheet(xpRows);
    XLSX.utils.book_append_sheet(wb, wsXP, "XUẤT PHÁT");

    const rkRows = [
        ["RA KHƠI"],
        ["CÂU", "NỘI DUNG", "ĐÁP ÁN", "GIẢI THÍCH"],
        [1, gameData.raKhoi[0]?.q || "", gameData.raKhoi[0]?.a || "", ""],
        [2, gameData.raKhoi[1]?.q || "", gameData.raKhoi[1]?.a || "", ""],
        [3, gameData.raKhoi[2]?.q || "", gameData.raKhoi[2]?.a || "", ""],
        [4, gameData.raKhoi[3]?.q || "", gameData.raKhoi[3]?.a || "", ""]
    ];
    const wsRK = XLSX.utils.aoa_to_sheet(rkRows);
    XLSX.utils.book_append_sheet(wb, wsRK, "RA KHƠI");

    const vsRows = [
        ["VƯỢT SÓNG"],
        ["CÂU", "NỘI DUNG", "ĐÁP ÁN", "GIẢI THÍCH"],
        [1, gameData.vuotSong.h1?.q || "", gameData.vuotSong.h1?.a || "", ""],
        [2, gameData.vuotSong.h2?.q || "", gameData.vuotSong.h2?.a || "", ""],
        [3, gameData.vuotSong.h3?.q || "", gameData.vuotSong.h3?.a || "", ""],
        [4, gameData.vuotSong.h4?.q || "", gameData.vuotSong.h4?.a || "", ""],
        ["ĐÁP ÁN VÒNG THI", gameData.vuotSong.center?.q || "", gameData.vuotSong.keyword || "", ""]
    ];
    const wsVS = XLSX.utils.aoa_to_sheet(vsRows);
    XLSX.utils.book_append_sheet(wb, wsVS, "VƯỢT SÓNG");

    initVinhQuangData();
    const vqRows = [
        ["VINH QUANG"],
        ["", "GÓI 10 ĐIỂM", "", "", "GÓI 20 ĐIỂM", "", "", "GÓI 30 ĐIỂM", "", ""],
        ["CÂU", "MÔN HỌC", "NỘI DUNG", "ĐÁP ÁN", "MÔN HỌC", "NỘI DUNG", "ĐÁP ÁN", "MÔN HỌC", "NỘI DUNG", "ĐÁP ÁN"]
    ];
    for (let i = 0; i < 12; i++) {
        const item10 = gameData.vinhQuang[10][i] || { m: "", q: "", a: "" };
        const item20 = gameData.vinhQuang[20][i] || { m: "", q: "", a: "" };
        const item30 = gameData.vinhQuang[30][i] || { m: "", q: "", a: "" };
        vqRows.push([
            i + 1,
            item10.m, item10.q, item10.a,
            item20.m, item20.q, item20.a,
            item30.m, item30.q, item30.a
        ]);
    }
    const wsVQ = XLSX.utils.aoa_to_sheet(vqRows);
    XLSX.utils.book_append_sheet(wb, wsVQ, "VINH QUANG");

    const chpRows = [
        ["CÂU HỎI PHỤ"],
        ["CÂU", "NỘI DUNG", "ĐÁP ÁN"]
    ];
    gameData.cauHoiPhu.forEach((item, idx) => {
        chpRows.push([idx + 1, item.q, item.a]);
    });
    const wsCHP = XLSX.utils.aoa_to_sheet(chpRows);
    XLSX.utils.book_append_sheet(wb, wsCHP, "CÂU HỎI PHỤ");

    XLSX.writeFile(wb, "Bo_De_Duong_Den_Vinh_Quang.xlsx");
    showToast("Đã xuất file Excel thành công!");
}

/* CONTROLLER - PROJECTOR CONNECTION */
let controllerChannel = null;
let projectorWindow = null;
let lastProjectorPing = 0;

const processedPlayerAnswersCache = new Map();

function handleIncomingPlayerAnswer(data) {
    if (!data) return;

    if (data.type === 'PLAYER_RING_BELL' || data.type === 'RING_BELL') {
        const tsIdx = parseInt(data.contestantId) || 1;
        const round = (data.round || window.currentActiveRound || '').toUpperCase();
        if (round === 'VS' || round === 'VUOT_SONG' || round === 'VCNV' || round === 'CNV' || window.currentActiveRound === 'VUOT_SONG') {
            if (typeof markVSContestantSubmitted === 'function') {
                markVSContestantSubmitted(tsIdx, data.time || null);
            }
        }
        return;
    }

    if (data.type === 'PLAYER_SUBMIT_ANSWER') {
        const tsIdx = data.contestantId || 1;
        const ans = (data.answer || '').toString().trim();
        const rawTime = (data.time || '').toString();
        const cleanTime = rawTime.replace(/s|giây/gi, '').trim();
        const round = data.round || 'GEN';
        const dedupeKey = `${tsIdx}_${round}_${ans}_${cleanTime}_${data.id || ''}`;

        const lastProcessed = processedPlayerAnswersCache.get(dedupeKey);
        const now = Date.now();
        if (lastProcessed && (now - lastProcessed < 300)) {
            return; // Duplicate submission from multi-channel delivery within 300ms
        }
        processedPlayerAnswersCache.set(dedupeKey, now);
        if (processedPlayerAnswersCache.size > 100) {
            const oldestKey = processedPlayerAnswersCache.keys().next().value;
            processedPlayerAnswersCache.delete(oldestKey);
        }

        if (data.round === 'RK' || data.round === 'RA_KHOI' || data.round === 'TANG_TOC' || !data.round) {
            const inputAns = document.getElementById(`ts${tsIdx}_ans_rk`);
            if (inputAns && inputAns.value !== ans) inputAns.value = ans;
            const inputTime = document.getElementById(`ts${tsIdx}_extra_rk`);
            if (inputTime && inputTime.value !== (cleanTime || '00.00')) inputTime.value = cleanTime || '00.00';

            const rawBase = gameData.contestants?.[tsIdx - 1]?.name || `Thí sinh ${tsIdx}`;
            if (typeof showToast === 'function' && (data.round === 'RK' || data.round === 'RA_KHOI' || data.round === 'TANG_TOC')) {
                showToast(`🔔 ${rawBase} đã bấm chuông / gửi đáp án Ra Khơi (${cleanTime || '00.00'}s): ${ans || 'Đã gửi'}`);
            }
        }
        if (data.round === 'VS' || data.round === 'VUOT_SONG' || !data.round) {
            const inputAns = document.getElementById(`ts${tsIdx}_ans_vs`);
            const inputTime = document.getElementById(`ts${tsIdx}_extra_vs`);
            if (data.isVongThi === true) {
                // Thời gian màu đỏ: kể từ lúc bắt đầu vòng thi đến lúc bấm nút trả lời đáp án vòng thi
                if (typeof markVSContestantSubmitted === 'function') {
                    markVSContestantSubmitted(tsIdx, cleanTime || '00.00');
                } else if (typeof window.markVSContestantSubmitted === 'function') {
                    window.markVSContestantSubmitted(tsIdx, cleanTime || '00.00');
                }
                const cleanAns = (ans || '').replace(/^\[CNV\]\s*/i, '').trim();
                if (cleanAns && cleanAns !== 'Bấm chuông' && inputAns && !inputAns.value) {
                    inputAns.value = cleanAns;
                }
            } else {
                // Thí sinh trả lời câu hỏi hàng ngang (và nhấn Enter):
                // Thời gian trong ô màu trắng: tính từ lúc 20s trả lời câu hỏi hàng ngang
                // BẢNG ĐIỂM KHÔNG NHẤP NHÁY
                if (inputTime && inputTime.value !== (cleanTime || '00.00')) inputTime.value = cleanTime || '00.00';
                if (inputAns && inputAns.value !== ans) inputAns.value = ans;
            }
        }
        if (data.round === 'VQ' || data.round === 'VINH_QUANG') {
            const inputExtra = document.getElementById(`ts${tsIdx}_extra_vq`);
            if (inputExtra && inputExtra.value !== (cleanTime || '00.00')) inputExtra.value = cleanTime || '00.00';
            const inputAns = document.getElementById(`ts${tsIdx}_ans_vq`);
            if (inputAns && inputAns.value !== ans) inputAns.value = ans;
        }
        if (data.round === 'CHP' || data.round === 'CAU_HOI_PHU') {
            const inputExtra = document.getElementById(`ts${tsIdx}_extra_chp`);
            if (inputExtra && inputExtra.value !== (cleanTime || '00.00')) inputExtra.value = cleanTime || '00.00';
            const inputAns = document.getElementById(`ts${tsIdx}_ans_chp`);
            if (inputAns && inputAns.value !== ans) inputAns.value = ans;
        }

        // Forward to projector only once if not loop-forwarded
        if (!data._forwarded && !data._fromNetwork) {
            try {
                sendToProjector('PLAYER_SUBMIT_ANSWER', { ...data, _forwarded: true });
            } catch(e) {}
        }
    } else if (data.playerAnswers && typeof data.playerAnswers === 'object') {
        Object.values(data.playerAnswers).forEach(ansObj => {
            if (ansObj && ansObj.contestantId) {
                const tsIdx = ansObj.contestantId;
                const ans = (ansObj.answer || '').toString().trim();
                const rawTime = (ansObj.time || '').toString();
                const cleanTime = rawTime.replace(/s|giây/gi, '').trim();

                if (ansObj.round === 'RK' || ansObj.round === 'RA_KHOI' || ansObj.round === 'TANG_TOC' || !ansObj.round) {
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_rk`);
                    if (inputAns && inputAns.value !== ans) inputAns.value = ans;
                    const inputTime = document.getElementById(`ts${tsIdx}_extra_rk`);
                    if (inputTime && inputTime.value !== (cleanTime || '00.00')) inputTime.value = cleanTime || '00.00';
                }
                if (ansObj.round === 'VS' || ansObj.round === 'VUOT_SONG' || !ansObj.round) {
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_vs`);
                    const inputTime = document.getElementById(`ts${tsIdx}_extra_vs`);
                    if (ansObj.isVongThi === true) {
                        if (typeof markVSContestantSubmitted === 'function') {
                            markVSContestantSubmitted(tsIdx, cleanTime || '00.00');
                        }
                        const cleanAns = (ans || '').replace(/^\[CNV\]\s*/i, '').trim();
                        if (cleanAns && cleanAns !== 'Bấm chuông' && inputAns && !inputAns.value) {
                            inputAns.value = cleanAns;
                        }
                    } else {
                        if (inputTime && inputTime.value !== (cleanTime || '00.00')) inputTime.value = cleanTime || '00.00';
                        if (inputAns && inputAns.value !== ans) inputAns.value = ans;
                    }
                }
                if (ansObj.round === 'VQ' || ansObj.round === 'VINH_QUANG' || !ansObj.round) {
                    const inputExtra = document.getElementById(`ts${tsIdx}_extra_vq`);
                    if (inputExtra && inputExtra.value !== (cleanTime || '00.00')) inputExtra.value = cleanTime || '00.00';
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_vq`);
                    if (inputAns && inputAns.value !== ans) inputAns.value = ans;
                }
            }
        });
    }
}
window.handleIncomingPlayerAnswer = handleIncomingPlayerAnswer;

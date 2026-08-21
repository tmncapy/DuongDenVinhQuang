// Setup.js - System Tab (Tab 0) & Core State Management
let gameData = {
    xuatPhat: {}, // Turn 1..8 -> [ { q: "", a: "" }, ... 10 items ]
    raKhoi: [
        { q: "", a: "", m: "", am: "" },
        { q: "", a: "", m: "", am: "" },
        { q: "", a: "", m: "", am: "" },
        { q: "", a: "", m: "", am: "" }
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
    contestants: [
        { name: "Thí sinh 1", score: 0 },
        { name: "Thí sinh 2", score: 0 },
        { name: "Thí sinh 3", score: 0 },
        { name: "Thí sinh 4", score: 0 }
    ]
};

let currentXuatPhatTurn = 1;
let editingXuatPhatDe = 1;
let currentVinhQuangPack = 10;

// Initialize state on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    initXuatPhatTurnData();
    renderXuatPhatTurnUI(1);
    initVinhQuangData();
    renderVinhQuangPackUI(10);
    loadSavedData();
    updateVuotSongState();
    if (typeof selectRKQuestion === 'function') {
        selectRKQuestion(1);
    }
});

// Switch main tabs
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

    syncContestantsUI();

    if (index === 1) {
        if (typeof updateTab1Preview === 'function') updateTab1Preview();
        sendToProjector('SWITCH_ROUND', { activeRound: 'XUAT_PHAT', round: 'XUAT_PHAT', viewNum: 1, contestants: gameData.contestants });
    } else if (index === 2) {
        if (typeof selectRKQuestion === 'function') selectRKQuestion(typeof currentRKQuestion !== 'undefined' ? currentRKQuestion : 1);
        sendToProjector('SWITCH_ROUND', { activeRound: 'RA_KHOI', round: 'RA_KHOI', viewNum: 2, contestants: gameData.contestants });
    } else if (index === 3) {
        if (typeof updateVuotSongState === 'function') updateVuotSongState();
        sendToProjector('SWITCH_ROUND', { activeRound: 'VUOT_SONG', round: 'VUOT_SONG', viewNum: 3, contestants: gameData.contestants });
    } else if (index === 4) {
        sendToProjector('SWITCH_ROUND', { activeRound: 'VINH_QUANG', round: 'VINH_QUANG', viewNum: 6, contestants: gameData.contestants });
    }
}

// Show Toast Notification
function showToast(msg, duration = 3000) {
    if (!msg) return;
    console.log("[Toast]:", msg);
    if (typeof document === 'undefined') return;

    let toast = document.getElementById('ddvq_floating_toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ddvq_floating_toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '25px';
        toast.style.right = '25px';
        toast.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        toast.style.color = '#ffffff';
        toast.style.padding = '12px 22px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '14px';
        toast.style.fontWeight = 'bold';
        toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
        toast.style.zIndex = '999999';
        toast.style.transition = 'all 0.3s ease';
        toast.style.pointerEvents = 'none';
        toast.style.border = '1px solid rgba(255,255,255,0.2)';
        toast.style.maxWidth = '80vw';
        toast.style.lineHeight = '1.4';
        toast.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(toast);
    }

    toast.innerText = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    toast.style.display = 'block';

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (toast.style.opacity === '0') {
                toast.style.display = 'none';
            }
        }, 300);
    }, duration);
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

function updateXuatPhatItem(turn, index, field, value) {
    if (!gameData.xuatPhat[turn]) gameData.xuatPhat[turn] = [];
    if (!gameData.xuatPhat[turn][index]) gameData.xuatPhat[turn][index] = { q: '', a: '' };
    gameData.xuatPhat[turn][index][field] = value;
    saveAllData();
}

// Vuot Song Crossword & character counter
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

    saveAllData();
    sendToProjector('VUOT_SONG_SYNC_GRID', { vuotSong: gameData.vuotSong });
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
    saveAllData();
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
            showToast("Lỗi khi đọc file Excel. Vui lòng kiểm tra đúng định dạng mẫu đề!", 4000);
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
    if (typeof updateTab1Preview === 'function') updateTab1Preview();
}

function parseXuatPhatSheet(rows) {
    let currentTurn = 1;
    let currentItemIndex = 0;

    for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const sttDeRaw = row[0] !== undefined && row[0] !== "" ? row[0].toString().trim() : "";
        const questionText = (row[1] || "").toString().trim();
        const answerText = (row[2] || "").toString().trim();

        if (!questionText && !answerText) continue;

        if (sttDeRaw) {
            const parsedNum = parseInt(sttDeRaw);
            if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 12) {
                currentTurn = parsedNum;
                currentItemIndex = 0;
            }
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
        gameData.raKhoi = [ {q:"",a:"",m:"",am:""}, {q:"",a:"",m:"",am:""}, {q:"",a:"",m:"",am:""}, {q:"",a:"",m:"",am:""} ];
    }
    let count = 0;
    for (let r = 2; r < rows.length && count < 4; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const qText = (row[1] || "").toString().trim();
        const aText = (row[2] || "").toString().trim();

        if (qText || aText) {
            gameData.raKhoi[count] = {
                q: qText,
                a: aText,
                m: gameData.raKhoi[count]?.m || "",
                am: gameData.raKhoi[count]?.am || ""
            };
            count++;
        }
    }
}

function parseVuotSongSheet(rows) {
    if (!gameData.vuotSong || Array.isArray(gameData.vuotSong)) {
        gameData.vuotSong = { h1: {q:"",a:""}, h2: {q:"",a:""}, h3: {q:"",a:""}, h4: {q:"",a:""}, center: {q:"",a:""}, keyword: "" };
    }
    let hangNgangIndex = 1;
    for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const colA = (row[0] || "").toString().trim();
        const qText = (row[1] || "").toString().trim();
        const aText = (row[2] || "").toString().trim();

        if (!qText && !aText) continue;

        const upperA = colA.toUpperCase();
        if (upperA.includes("ĐÁP ÁN VÒNG THI") || upperA.includes("TỪ KHÓA") || upperA.includes("TRUNG TÂM") || upperA.includes("HÀNG DỌC") || upperA.includes("CHƯỚNG NGẠI VẬT") || r === 6) {
            gameData.vuotSong.center = { q: qText, a: aText };
            gameData.vuotSong.keyword = aText || qText;
        } else if (hangNgangIndex <= 4) {
            gameData.vuotSong[`h${hangNgangIndex}`] = { q: qText, a: aText };
            hangNgangIndex++;
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

        if (m10 || q10 || a10 || m20 || q20 || a20 || m30 || q30 || a30) {
            questionIndex++;
        }
    }
}

function parseCauHoiPhuSheet(rows) {
    if (!Array.isArray(gameData.cauHoiPhu)) gameData.cauHoiPhu = [];
    let count = 0;
    for (let r = 2; r < rows.length && count < 5; r++) {
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
        gameData.raKhoi = [ {q:"",a:"",m:""}, {q:"",a:"",m:""}, {q:"",a:"",m:""}, {q:"",a:"",m:""} ];
    }
    for (let i = 1; i <= 4; i++) {
        const item = gameData.raKhoi[i - 1] || { q: '', a: '', m: '' };
        const qEl = document.getElementById(`rk_q_${i}`);
        const aEl = document.getElementById(`rk_a_${i}`);
        const mEl = document.getElementById(`rk_m_${i}`);
        const amEl = document.getElementById(`rk_am_${i}`);
        if (qEl) qEl.value = item.q || '';
        if (aEl) aEl.value = item.a || '';
        if (mEl) mEl.value = item.m || '';
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
    for (let i = 1; i <= 3; i++) {
        const item = gameData.cauHoiPhu[i - 1] || { q: '', a: '' };
        const qEl = document.getElementById(`chp_q_${i}`);
        const aEl = document.getElementById(`chp_a_${i}`);
        if (qEl) qEl.value = item.q || '';
        if (aEl) aEl.value = item.a || '';
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
                const mVal = mEl?.value || '';
                const amVal = amEl?.value || '';
                gameData.raKhoi[i - 1] = {
                    q: qVal || gameData.raKhoi[i - 1]?.q || '',
                    a: aVal || gameData.raKhoi[i - 1]?.a || '',
                    m: mVal || gameData.raKhoi[i - 1]?.m || '',
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
            const qVal = document.getElementById(`chp_q_${i}`)?.value || '';
            const aVal = document.getElementById(`chp_a_${i}`)?.value || '';
            if (qVal || aVal) gameData.cauHoiPhu[i - 1] = { q: qVal, a: aVal };
        }

        safeSetStorage('duong_den_vinh_quang_data', JSON.stringify(gameData));
        if (notify) {
            showToast('Đã lưu tất cả dữ liệu câu hỏi vào hệ thống!');
        }
    } catch(e) {
        console.warn("saveAllData error:", e);
    }
}

function syncContestantsUI() {
    if (gameData.contestants && Array.isArray(gameData.contestants)) {
        const activeEl = document.activeElement;
        gameData.contestants.forEach((c, i) => {
            const idx = i + 1;
            const scoreVal = c.score !== undefined ? c.score : 0;
            const nameVal = c.name || `Thí sinh ${idx}`;

            const nameInputs = [
                document.getElementById(`ts_name_${idx}`),
                document.getElementById(`ts${idx}_name`),
                document.getElementById(`ts${idx}_name_rk`),
                document.getElementById(`ts${idx}_name_vs`),
                document.getElementById(`ts${idx}_name_vq`)
            ];
            nameInputs.forEach(inp => {
                if (inp && inp !== activeEl && inp.value !== nameVal) {
                    inp.value = nameVal;
                }
            });

            const scoreDisps = [
                document.getElementById(`ts${idx}_score_disp`),
                document.getElementById(`ts${idx}_score_disp_rk`),
                document.getElementById(`ts${idx}_score_disp_vs`),
                document.getElementById(`ts${idx}_score_disp_vq`),
                document.getElementById(`vq_ts${idx}_score_disp`)
            ];
            scoreDisps.forEach(disp => {
                if (disp) disp.innerText = scoreVal;
            });
        });

        if (typeof updateTab1Preview === 'function') {
            updateTab1Preview();
        }

        const payload = {
            type: 'UPDATE_SCORES',
            contestants: gameData.contestants,
            gameData: gameData,
            timestamp: Date.now()
        };

        sendToProjector('UPDATE_SCORES', payload);

        try {
            localStorage.setItem('ddvq_contestants', JSON.stringify(gameData.contestants));
            localStorage.setItem('ddvq_latest_action', JSON.stringify(payload));
        } catch(e) {}
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
            updateVuotSongState();
            syncContestantsUI();
            if (typeof updateTab1Preview === 'function') updateTab1Preview();

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
    if (gameData && gameData.contestants) {
        gameData.contestants.forEach((c) => {
            c.score = 0;
        });
    }
    sendToProjector('RESET_ALL_DATA');
    safeRemoveStorage('duong_den_vinh_quang_data');
    showToast('Đã xóa và đặt lại toàn bộ dữ liệu hệ thống!', 3000);
    setTimeout(() => {
        location.reload();
    }, 500);
}

function updateContestantName(i, val) {
    if (!gameData.contestants) gameData.contestants = [];
    
    // Preserve raw input while converting to uppercase for Vietnamese text
    const upperVal = (val || '').toLocaleUpperCase('vi-VN');

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

    saveAllData(false);

    if (typeof updateTab1Preview === 'function') updateTab1Preview();

    const payload = {
        type: 'UPDATE_CONTESTANTS',
        contestants: gameData.contestants,
        gameData: gameData,
        timestamp: Date.now()
    };

    sendToProjector('UPDATE_CONTESTANTS', payload);
    sendToProjector('UPDATE_SCORES', payload);

    try {
        if (typeof BroadcastChannel !== 'undefined' && controllerChannel) {
            controllerChannel.postMessage(payload);
        }
    } catch(e) {}

    try {
        localStorage.setItem('ddvq_latest_action', JSON.stringify(payload));
        localStorage.setItem('ddvq_contestants', JSON.stringify(gameData.contestants));
    } catch(e) {}

    try {
        fetch(getApiUrl('/api/state'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contestants: gameData.contestants,
                gameData: gameData
            })
        }).catch(() => {});

        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(() => {});
    } catch(e) {}
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
    try {
        fetch('/api/state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contestants: gameData.contestants,
                gameData: gameData
            })
        }).catch(() => {});
    } catch(e) {}
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

function handleIncomingPlayerAnswer(data) {
    if (!data) return;
    if (data.type === 'PLAYER_SUBMIT_ANSWER') {
        const tsIdx = data.contestantId || 1;
        const ans = data.answer || '';
        const rawTime = data.time || '';
        const cleanTime = rawTime.toString().replace(/s|giây/gi, '').trim();

        if (data.round === 'RK' || !data.round) {
            const inputAns = document.getElementById(`ts${tsIdx}_ans_rk`);
            if (inputAns) inputAns.value = ans;
            const inputTime = document.getElementById(`ts${tsIdx}_extra_rk`);
            if (inputTime) inputTime.value = cleanTime || '00.00';
        }
        if (data.round === 'VS' || !data.round) {
            const inputAns = document.getElementById(`ts${tsIdx}_ans_vs`);
            const inputTime = document.getElementById(`ts${tsIdx}_extra_vs`);
            if (inputTime) inputTime.value = cleanTime || '00.00';
            if (inputAns) {
                inputAns.value = ans;
            }
        }
        if (data.round === 'VQ' || !data.round) {
            const inputExtra = document.getElementById(`ts${tsIdx}_extra_vq`);
            if (inputExtra) inputExtra.value = cleanTime || '00.00';
            const inputAns = document.getElementById(`ts${tsIdx}_ans_vq`);
            if (inputAns) inputAns.value = ans;
        }
        if (typeof showToast === 'function') {
            if (data.isVongThi && !ans) {
                showToast(`TS${tsIdx} bấm chuông Vượt Sóng (${cleanTime || '00.00'})`);
            } else {
                showToast(`TS${tsIdx} gửi: "${ans}" (${cleanTime || '00.00'})`);
            }
        }
        // Forward to projector immediately (especially useful under file:/// protocol)
        try {
            sendToProjector('PLAYER_SUBMIT_ANSWER', data);
        } catch(e) {}
    } else if (data.playerAnswers && typeof data.playerAnswers === 'object') {
        Object.values(data.playerAnswers).forEach(ansObj => {
            if (ansObj && ansObj.contestantId) {
                const tsIdx = ansObj.contestantId;
                const ans = ansObj.answer || '';
                const rawTime = ansObj.time || '';
                const cleanTime = rawTime.toString().replace(/s|giây/gi, '').trim();

                if (ansObj.round === 'RK' || !ansObj.round) {
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_rk`);
                    if (inputAns) inputAns.value = ans;
                    const inputTime = document.getElementById(`ts${tsIdx}_extra_rk`);
                    if (inputTime) inputTime.value = cleanTime || '00.00';
                }
                if (ansObj.round === 'VS' || !ansObj.round) {
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_vs`);
                    const inputTime = document.getElementById(`ts${tsIdx}_extra_vs`);
                    if (inputTime) inputTime.value = cleanTime || '00.00';
                    if (inputAns) {
                        inputAns.value = ans;
                    }
                }
                if (ansObj.round === 'VQ' || !ansObj.round) {
                    const inputExtra = document.getElementById(`ts${tsIdx}_extra_vq`);
                    if (inputExtra) inputExtra.value = cleanTime || '00.00';
                    const inputAns = document.getElementById(`ts${tsIdx}_ans_vq`);
                    if (inputAns) inputAns.value = ans;
                }
            }
        });
    }
}

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

    const onrenderBase = (typeof window !== 'undefined' && window.ONRENDER_BASE_URL) || 'https://ddvq.onrender.com';
    if (window.location.protocol === 'file:' || !window.location.host) {
        return onrenderBase + cleanPath;
    }
    return cleanPath;
}

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

// ROOM CODE & CONTESTANT PASSWORD GENERATOR & MANAGER
function generateRandomRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRandom4DigitPass() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function randomizeRoomCodeAndPasswords() {
    const newRoomCode = generateRandomRoomCode();
    const p1 = generateRandom4DigitPass();
    const p2 = generateRandom4DigitPass();
    const p3 = generateRandom4DigitPass();
    const p4 = generateRandom4DigitPass();

    const roomInput = document.getElementById('room_code_input');
    const p1Input = document.getElementById('pass_ts1_input');
    const p2Input = document.getElementById('pass_ts2_input');
    const p3Input = document.getElementById('pass_ts3_input');
    const p4Input = document.getElementById('pass_ts4_input');

    if (roomInput) roomInput.value = newRoomCode;
    if (p1Input) p1Input.value = p1;
    if (p2Input) p2Input.value = p2;
    if (p3Input) p3Input.value = p3;
    if (p4Input) p4Input.value = p4;

    saveAndApplyRoomAuth();
}

function saveAndApplyRoomAuth() {
    const roomInput = document.getElementById('room_code_input');
    const p1Input = document.getElementById('pass_ts1_input');
    const p2Input = document.getElementById('pass_ts2_input');
    const p3Input = document.getElementById('pass_ts3_input');
    const p4Input = document.getElementById('pass_ts4_input');

    const roomCode = (roomInput ? roomInput.value.trim() : '') || localStorage.getItem('ddvq_room_code') || generateRandomRoomCode();
    const pass1 = (p1Input ? p1Input.value.trim() : '') || '1111';
    const pass2 = (p2Input ? p2Input.value.trim() : '') || '2222';
    const pass3 = (p3Input ? p3Input.value.trim() : '') || '3333';
    const pass4 = (p4Input ? p4Input.value.trim() : '') || '4444';

    const passwords = { ts1: pass1, ts2: pass2, ts3: pass3, ts4: pass4 };

    localStorage.setItem('ddvq_room_code', roomCode);
    localStorage.setItem('ddvq_player_passwords', JSON.stringify(passwords));

    const badge = document.getElementById('room_code_badge');
    if (badge) badge.innerText = `Đang hoạt động: ${roomCode}`;

    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'SET_ROOM_AUTH',
            roomCode: roomCode,
            newRoomCode: roomCode,
            passwords: passwords,
            playerPasswords: passwords
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            showToast(`✅ Đã thiết lập phòng: ${roomCode}\nMật khẩu: TS1(${pass1}), TS2(${pass2}), TS3(${pass3}), TS4(${pass4})`);
        }
    })
    .catch(err => {
        console.warn("Error setting room auth on server:", err);
        showToast(`Đã lưu cục bộ phòng: ${roomCode}`);
    });
}

function renderRoomAuthUI() {
    const connTop = document.querySelector('.conn-top');
    if (!connTop) return;

    let savedRoom = localStorage.getItem('ddvq_room_code') || generateRandomRoomCode();
    let savedPass = { ts1: '1111', ts2: '2222', ts3: '3333', ts4: '4444' };
    try {
        const p = localStorage.getItem('ddvq_player_passwords');
        if (p) savedPass = { ...savedPass, ...JSON.parse(p) };
    } catch(e) {}

    connTop.style.cssText = 'display: flex; flex-direction: column; gap: 10px; background: #eef2ff; padding: 12px; border-radius: 8px; border: 1.5px solid #a5b4fc; margin-bottom: 12px;';
    connTop.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #c7d2fe; padding-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span style="font-weight: bold; color: #1e3a8a; font-size: 13px;">🔑 TẠO MÃ PHÒNG (6 CHỮ SỐ):</span>
                <input type="text" id="room_code_input" maxlength="6" value="${savedRoom}" style="padding: 6px 10px; border: 2px solid #3b82f6; border-radius: 6px; font-weight: bold; font-size: 16px; width: 110px; text-align: center; color: #1e3a8a; letter-spacing: 2px; background: #fff;" placeholder="6 số">
                <button type="button" class="btn" onclick="randomizeRoomCodeAndPasswords()" style="background: #f59e0b; color: #fff; border: 1px solid #d97706; font-weight: bold; padding: 6px 12px; border-radius: 6px; cursor: pointer;">🎲 Tạo ngẫu nhiên</button>
                <button type="button" class="btn btn-primary" onclick="saveAndApplyRoomAuth()" style="padding: 6px 14px; font-weight: bold; background: #2563eb; border-radius: 6px;">🔒 Lưu & Cập nhật</button>
            </div>
            <span id="room_code_badge" style="background: #10b981; color: white; padding: 5px 12px; border-radius: 12px; font-weight: bold; font-size: 13px;">Đang hoạt động: ${savedRoom}</span>
        </div>

        <div>
            <div style="font-size: 12px; font-weight: bold; color: #374151; margin-bottom: 6px;">🔐 MẬT KHẨU ĐĂNG NHẬP 4 THÍ SINH (4 CHỮ SỐ):</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px;">
                <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <span style="font-size: 11px; font-weight: bold; color: #dc2626;">TS1:</span>
                    <input type="text" id="pass_ts1_input" maxlength="4" value="${savedPass.ts1 || '1111'}" style="width: 100%; border: none; font-weight: bold; font-size: 14px; color: #1e3a8a; text-align: center; outline: none;" onchange="saveAndApplyRoomAuth()">
                </div>
                <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <span style="font-size: 11px; font-weight: bold; color: #dc2626;">TS2:</span>
                    <input type="text" id="pass_ts2_input" maxlength="4" value="${savedPass.ts2 || '2222'}" style="width: 100%; border: none; font-weight: bold; font-size: 14px; color: #1e3a8a; text-align: center; outline: none;" onchange="saveAndApplyRoomAuth()">
                </div>
                <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <span style="font-size: 11px; font-weight: bold; color: #dc2626;">TS3:</span>
                    <input type="text" id="pass_ts3_input" maxlength="4" value="${savedPass.ts3 || '3333'}" style="width: 100%; border: none; font-weight: bold; font-size: 14px; color: #1e3a8a; text-align: center; outline: none;" onchange="saveAndApplyRoomAuth()">
                </div>
                <div style="display: flex; align-items: center; gap: 4px; background: #ffffff; padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">
                    <span style="font-size: 11px; font-weight: bold; color: #dc2626;">TS4:</span>
                    <input type="text" id="pass_ts4_input" maxlength="4" value="${savedPass.ts4 || '4444'}" style="width: 100%; border: none; font-weight: bold; font-size: 14px; color: #1e3a8a; text-align: center; outline: none;" onchange="saveAndApplyRoomAuth()">
                </div>
            </div>
        </div>
    `;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderRoomAuthUI);
} else {
    renderRoomAuthUI();
}

function updateRoomCodeFromController() {
    saveAndApplyRoomAuth();
}

let currentControllerAudio = null;

function playSelectedSoundController() {
    const select = document.getElementById('controller_sound_select');
    if (!select) return;
    const soundFile = select.value;
    if (!soundFile) return;

    if (currentControllerAudio) {
        currentControllerAudio.pause();
        currentControllerAudio.currentTime = 0;
    }

    try {
        currentControllerAudio = new Audio(`sounds/${soundFile}`);
        currentControllerAudio.play().catch(e => console.warn("Audio play blocked locally:", e));
    } catch(e) {}

    sendToProjector('PLAY_SOUND', { sound: soundFile });
    if (typeof showToast === 'function') showToast(`Đang phát âm thanh: ${soundFile}`);
}

function stopSoundController() {
    if (currentControllerAudio) {
        currentControllerAudio.pause();
        currentControllerAudio.currentTime = 0;
        currentControllerAudio = null;
    }
    sendToProjector('STOP_SOUND');
    if (typeof showToast === 'function') showToast('Đã dừng âm thanh!');
}

let currentRoom = (localStorage.getItem('ddvq_room_code') || 'DDVQ2026').trim().toUpperCase();

try {
    if (typeof BroadcastChannel !== 'undefined') {
        controllerChannel = new BroadcastChannel(`ddvq_game_channel_${currentRoom.toLowerCase()}`);
        controllerChannel.onmessage = function(event) {
            if (!event.data) return;
            if (event.data.type === 'PROJECTOR_READY' || event.data.type === 'PROJECTOR_PONG') {
                lastProjectorPing = Date.now();
                updateProjectorStatus(true);
            } else if (event.data.type === 'PLAYER_SUBMIT_ANSWER') {
                handleIncomingPlayerAnswer(event.data);
            } else if (event.data.type === 'CLIENT_STATUS_UPDATE' && event.data.connectedClients) {
                updateClientStatusBadges(event.data.connectedClients);
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

// Server-Sent Events (SSE) for cross-device real-time sync (Mobile, PC, Projector)
if (typeof EventSource !== 'undefined') {
    try {
        const sseUrl = getApiUrl('/api/events' + (currentRoom ? `?roomid=${encodeURIComponent(currentRoom)}` : ''));
        const sseSource = new EventSource(sseUrl);
        sseSource.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data && (data.type === 'PROJECTOR_READY' || data.type === 'PROJECTOR_PONG')) {
                    lastProjectorPing = Date.now();
                    updateProjectorStatus(true);
                } else if (data && (data.type === 'PLAYER_SUBMIT_ANSWER' || data.playerAnswers)) {
                    handleIncomingPlayerAnswer(data);
                } else if (data && data.type === 'CLIENT_STATUS_UPDATE') {
                    updateClientStatusBadges(data.connectedClients);
                } else if (data && data.connectedClients) {
                    updateClientStatusBadges(data.connectedClients);
                } else if (data && data.roomCode) {
                    localStorage.setItem('ddvq_room_code', data.roomCode);
                    const input = document.getElementById('room_code_input');
                    const badge = document.getElementById('room_code_badge');
                    if (input && !input.matches(':focus')) input.value = data.roomCode;
                    if (badge) badge.innerText = `Đang hoạt động: ${data.roomCode}`;
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
            if (data && (data.type === 'PLAYER_SUBMIT_ANSWER' || data.playerAnswers)) {
                handleIncomingPlayerAnswer(data);
            }
        } catch(e) {}
    }
});

window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'PROJECTOR_READY' || event.data.type === 'PROJECTOR_PONG') {
        lastProjectorPing = Date.now();
        updateProjectorStatus(true);
    } else if (event.data.type === 'PLAYER_SUBMIT_ANSWER') {
        handleIncomingPlayerAnswer(event.data);
    }
});

setInterval(() => {
    if (Date.now() - lastProjectorPing > 5000) {
        updateProjectorStatus(false);
    }

    const currentRoom = localStorage.getItem('ddvq_room_code') || '';
    const stateUrl = currentRoom ? `/api/state?roomid=${encodeURIComponent(currentRoom)}` : '/api/state';

    // Always attempt fetching state from server
    fetch(getApiUrl(stateUrl))
        .then(res => res.json())
        .then(data => {
            if (data) {
                if (data.playerAnswers) handleIncomingPlayerAnswer(data);
                if (data.connectedClients) updateClientStatusBadges(data.connectedClients);
                if (data.roomCode && !currentRoom) {
                    localStorage.setItem('ddvq_room_code', data.roomCode);
                    const input = document.getElementById('room_code_input');
                    const badge = document.getElementById('room_code_badge');
                    if (input && !input.matches(':focus') && !input.value) input.value = data.roomCode;
                    if (badge) badge.innerText = `Đang hoạt động: ${data.roomCode}`;
                }
            }
        })
        .catch(() => {});

    // Refresh status badges with time-based check
    updateClientStatusBadges(controllerConnectedClients);
}, 1500);

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
    const roomCode = (localStorage.getItem('ddvq_room_code') || 'DDVQ2026').trim().toUpperCase();
    const message = { type, roomCode, ...payload, timestamp: Date.now(), id: Math.random().toString(36).substring(2, 9) };
    if (controllerChannel) {
        try {
            controllerChannel.postMessage(message);
        } catch(e) {
            console.warn("Error posting to projector channel:", e);
        }
    }
    try {
        localStorage.setItem(`ddvq_latest_action_${roomCode}`, JSON.stringify(message));
        localStorage.setItem('ddvq_latest_action', JSON.stringify(message));
    } catch(e) {}
    try {
        if (projectorWindow && !projectorWindow.closed) {
            projectorWindow.postMessage(message, '*');
        } else if (window.opener && !window.opener.closed) {
            window.opener.postMessage(message, '*');
        }
    } catch(e) {}
    try {
        fetch(getApiUrl('/api/action'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        }).catch(() => {});
    } catch(e) {}
}

function updateContestantName(idx, val) {
    const rawVal = val !== undefined ? val : '';
    if (!gameData.contestants) gameData.contestants = [];
    if (!gameData.contestants[idx - 1]) {
        gameData.contestants[idx - 1] = { name: rawVal, score: 0 };
    } else {
        gameData.contestants[idx - 1].name = rawVal;
    }

    const inputs = [
        document.getElementById(`ts_name_${idx}`),
        document.getElementById(`ts${idx}_name`),
        document.getElementById(`ts${idx}_name_rk`),
        document.getElementById(`ts${idx}_name_vs`),
        document.getElementById(`ts${idx}_name_vq`)
    ];
    inputs.forEach(inp => {
        if (inp && inp !== document.activeElement && inp.value !== rawVal) {
            inp.value = rawVal;
        }
    });
    saveAllData();
    if (typeof currentXuatPhatTurn !== 'undefined' && currentXuatPhatTurn === idx) {
        if (typeof updateTab1Preview === 'function') updateTab1Preview();
    }

    // Debounced or direct broadcast
    const payload = {
        type: 'UPDATE_CONTESTANTS',
        contestants: gameData.contestants,
        timestamp: Date.now()
    };
    sendToProjector('UPDATE_CONTESTANTS', payload);
}

function promptScore(idx) {
    if (!gameData.contestants) gameData.contestants = [];
    while (gameData.contestants.length < idx) {
        gameData.contestants.push({ name: `Thí sinh ${gameData.contestants.length + 1}`, score: 0 });
    }
    const contestant = gameData.contestants[idx - 1];
    const currentScore = contestant && contestant.score !== undefined ? contestant.score : 0;
    const contestantName = (contestant && contestant.name) ? contestant.name : `Thí sinh ${idx}`;

    const existing = document.getElementById('custom_score_edit_modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'custom_score_edit_modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100000;';

    modal.innerHTML = `
        <div style="background: #ffffff; border-radius: 12px; width: 90%; max-width: 420px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); border: 2px solid #3b82f6; overflow: hidden; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="background: linear-gradient(135deg, #1e40af, #2563eb); color: white; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between;">
                <div style="font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    <span>✏️</span>
                    <span>CHỈNH SỬA ĐIỂM</span>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 3px 10px; border-radius: 6px; font-size: 13px; font-weight: bold;">
                    ${contestantName}
                </div>
            </div>
            
            <div style="padding: 20px;">
                <div style="margin-bottom: 14px; font-size: 14px; color: #475569;">
                    Điểm số hiện tại: <strong style="color: #dc2626; font-size: 18px;">${currentScore}</strong>
                </div>

                <label style="display: block; font-size: 13px; font-weight: bold; color: #1e293b; margin-bottom: 6px;">
                    Nhập điểm số mới (phải chia hết cho 5):
                </label>
                <div style="position: relative; margin-bottom: 8px;">
                    <input type="number" id="custom_score_input_val" step="5" value="${currentScore}" style="width: 100%; padding: 10px 14px; font-size: 22px; font-weight: bold; color: #1e3a8a; background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; outline: none; text-align: center;">
                </div>

                <div id="custom_score_error_msg" style="display: none; background: #fee2e2; color: #b91c1c; border: 1px solid #f87171; padding: 8px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; margin-bottom: 12px;"></div>

                <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; justify-content: center;">
                    <button type="button" class="quick-score-btn" data-delta="-20" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">-20</button>
                    <button type="button" class="quick-score-btn" data-delta="-10" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">-10</button>
                    <button type="button" class="quick-score-btn" data-delta="-5" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">-5</button>
                    <button type="button" class="quick-score-btn" data-delta="5" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">+5</button>
                    <button type="button" class="quick-score-btn" data-delta="10" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">+10</button>
                    <button type="button" class="quick-score-btn" data-delta="20" style="padding: 4px 8px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 12px; font-weight: bold; cursor: pointer;">+20</button>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button id="custom_score_cancel_btn" type="button" style="padding: 9px 20px; background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer;">Đóng</button>
                    <button id="custom_score_save_btn" type="button" style="padding: 9px 24px; background: #16a34a; color: white; border: 1px solid #15803d; border-radius: 6px; font-weight: bold; font-size: 14px; cursor: pointer; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.3);">Lưu</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const inputEl = document.getElementById('custom_score_input_val');
    const errorEl = document.getElementById('custom_score_error_msg');
    const saveBtn = document.getElementById('custom_score_save_btn');
    const cancelBtn = document.getElementById('custom_score_cancel_btn');

    if (inputEl) {
        inputEl.focus();
        inputEl.select();
    }

    modal.querySelectorAll('.quick-score-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (inputEl) {
                const cur = parseInt(inputEl.value, 10) || 0;
                const delta = parseInt(btn.getAttribute('data-delta'), 10) || 0;
                inputEl.value = Math.max(0, cur + delta);
                if (errorEl) errorEl.style.display = 'none';
            }
        });
    });

    function doSave() {
        const valStr = inputEl ? inputEl.value.trim() : '';
        if (valStr === '') {
            if (errorEl) {
                errorEl.innerText = 'Vui lòng nhập số điểm!';
                errorEl.style.display = 'block';
            }
            return;
        }
        const val = parseInt(valStr, 10);
        if (isNaN(val)) {
            if (errorEl) {
                errorEl.innerText = 'Điểm phải là một số nguyên hợp lệ!';
                errorEl.style.display = 'block';
            }
            return;
        }
        if (val % 5 !== 0) {
            if (errorEl) {
                errorEl.innerText = `Số điểm (${val}) phải chia hết cho 5! (Ví dụ: 0, 5, 10, 15, 20...)`;
                errorEl.style.display = 'block';
            }
            return;
        }

        gameData.contestants[idx - 1].score = val;

        syncContestantsUI();
        saveAllData();

        sendToProjector('XUAT_PHAT_SELECT_CONTESTANT', {
            name: gameData.contestants[idx - 1].name,
            score: val
        });

        showToast(`Đã lưu điểm cho ${contestantName}: ${val}`);
        modal.remove();
    }

    if (saveBtn) saveBtn.addEventListener('click', doSave);
    if (cancelBtn) cancelBtn.addEventListener('click', () => modal.remove());

    if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSave();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                modal.remove();
            }
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function triggerFilePicker(targetInputId, acceptType) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = acceptType || '*/*';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        showToast(`Đang tải lên file: ${file.name}...`);

        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            const base64Result = uploadEvent.target.result;
            const inputEl = document.getElementById(targetInputId);
            if (inputEl) {
                inputEl.value = base64Result;
                inputEl.dispatchEvent(new Event('change'));
            }
            saveAllData();
            showToast(`Đã tải lên thành công: ${file.name}`);
        };
        reader.onerror = function() {
            const blobUrl = URL.createObjectURL(file);
            const inputEl = document.getElementById(targetInputId);
            if (inputEl) {
                inputEl.value = blobUrl;
                inputEl.dispatchEvent(new Event('change'));
            }
            saveAllData();
            showToast(`Đã chọn file thành công: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };
    fileInput.click();
}

window.adjustScore = function(idx, delta) {
    if (!gameData.contestants || !gameData.contestants[idx - 1]) return;
    const current = gameData.contestants[idx - 1].score || 0;
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

window.vqStars = [false, false, false, false];

window.toggleVQStar = function(idx) {
    const starIndex = idx - 1;
    window.vqStars[starIndex] = !window.vqStars[starIndex];
    const btn = document.getElementById(`vq_star_btn_${idx}`);
    if (btn) {
        if (window.vqStars[starIndex]) {
            btn.style.background = "#f59e0b";
            btn.style.borderColor = "#d97706";
            btn.style.color = "#ffffff";
            btn.innerText = "⭐ STAR ON";
            sendToProjector('VINH_QUANG_STAR_OF_HOPE', { contestantIndex: idx });
            showToast(`Thí sinh ${idx} đã chọn NGÔI SAO HY VỌNG!`);
        } else {
            btn.style.background = "#e2e8f0";
            btn.style.borderColor = "#cbd5e1";
            btn.style.color = "#475569";
            btn.innerText = "⭐ STAR OFF";
            showToast(`Đã hủy Ngôi sao hy vọng của Thí sinh ${idx}`);
        }
    }
}

window.vqCorrectAnswer = function(idx) {
    let packVal = 20;
    if (typeof currentVQPack !== 'undefined' && currentVQPack) {
        packVal = currentVQPack;
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
    }
    
    const isStarActive = window.vqStars[idx - 1];
    const pointsToSubtract = isStarActive ? packVal : Math.round(packVal / 2);
    
    window.adjustScore(idx, -pointsToSubtract);
    
    if (isStarActive) {
        window.toggleVQStar(idx);
    }
}

function onClickTongKet() {
    let summary = "📊 TỔNG KẾT ĐIỂM SỐ CÁC THÍ SINH:\n";
    if (gameData.contestants) {
        gameData.contestants.forEach((ts, idx) => {
            summary += `• ${ts.name || 'Thí sinh ' + (idx+1)}: ${ts.score || 0} điểm\n`;
        });
    }
    showToast(summary, 5000);
}

function onClickPlayIntroVideo(src) {
    sendToProjector('PLAY_INTRO_VIDEO', { src: src });
    showToast(`Đang yêu cầu phát video: ${src}`);
}

function onClickStopIntroVideo() {
    sendToProjector('STOP_INTRO_VIDEO');
    showToast('Đã dừng phát video.');
}

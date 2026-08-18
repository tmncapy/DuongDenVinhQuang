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

    if (index === 1 && typeof updateTab1Preview === 'function') {
        updateTab1Preview();
    }
    if (index === 2 && typeof selectRKQuestion === 'function') {
        selectRKQuestion(typeof currentRKQuestion !== 'undefined' ? currentRKQuestion : 1);
    }
    if (index === 3) {
        if (typeof updateVuotSongState === 'function') updateVuotSongState();
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
        gameData.contestants.forEach((c, i) => {
            const idx = i + 1;
            const tab0Input = document.getElementById(`ts_name_${idx}`);
            if (tab0Input) tab0Input.value = c.name || `Thí sinh ${idx}`;
            const tab1Input = document.getElementById(`ts${idx}_name`);
            if (tab1Input) tab1Input.value = c.name || `Thí sinh ${idx}`;
            const tab2Input = document.getElementById(`ts${idx}_name_rk`);
            if (tab2Input) tab2Input.value = c.name || `Thí sinh ${idx}`;
            const tab3Input = document.getElementById(`ts${idx}_name_vs`);
            if (tab3Input) tab3Input.value = c.name || `Thí sinh ${idx}`;
            const tab4Input = document.getElementById(`ts${idx}_name_vq`);
            if (tab4Input) tab4Input.value = c.name || `Thí sinh ${idx}`;
            
            const disp = document.getElementById(`ts${idx}_score_disp`);
            if (disp) disp.innerText = c.score || 0;
            const dispRK = document.getElementById(`ts${idx}_score_disp_rk`);
            if (dispRK) dispRK.innerText = c.score || 0;
            const dispVS = document.getElementById(`ts${idx}_score_disp_vs`);
            if (dispVS) dispVS.innerText = c.score || 0;
            const dispVQ = document.getElementById(`ts${idx}_score_disp_vq`);
            if (dispVQ) dispVQ.innerText = c.score || 0;
        });
        sendToProjector('UPDATE_SCORES', { contestants: gameData.contestants });
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

function updateRoomCodeFromController() {
    const input = document.getElementById('room_code_input');
    if (!input) return;
    const newCode = input.value.trim().toUpperCase() || 'DDVQ2026';
    input.value = newCode;

    fetch(getApiUrl('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            type: 'SET_ROOM_CODE',
            roomCode: newCode
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            const badge = document.getElementById('room_code_badge');
            if (badge) badge.innerText = `Đang hoạt động: ${newCode}`;
            if (typeof showToast === 'function') showToast(`Đã cập nhật Mã Phòng mới: ${newCode}`);
        }
    })
    .catch(err => {
        console.error("Room code update error:", err);
    });
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

try {
    if (typeof BroadcastChannel !== 'undefined') {
        controllerChannel = new BroadcastChannel('ddvq_game_channel');
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
        const sseSource = new EventSource(getApiUrl('/api/events'));
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

    // Always attempt fetching state from server
    fetch(getApiUrl('/api/state'))
        .then(res => res.json())
        .then(data => {
            if (data) {
                if (data.playerAnswers) handleIncomingPlayerAnswer(data);
                if (data.connectedClients) updateClientStatusBadges(data.connectedClients);
                if (data.roomCode) {
                    localStorage.setItem('ddvq_room_code', data.roomCode);
                    const input = document.getElementById('room_code_input');
                    const badge = document.getElementById('room_code_badge');
                    if (input && !input.matches(':focus')) input.value = data.roomCode;
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
    const message = { type, ...payload, timestamp: Date.now(), id: Math.random().toString(36).substring(2, 9) };
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
    try {
        fetch('/api/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        }).catch(() => {});
    } catch(e) {}
}

function updateContestantName(idx, val) {
    val = (val || `Thí sinh ${idx}`).trim();
    if (!gameData.contestants) gameData.contestants = [];
    if (!gameData.contestants[idx - 1]) gameData.contestants[idx - 1] = { name: val, score: 0 };
    else gameData.contestants[idx - 1].name = val;

    const inputs = [
        document.getElementById(`ts_name_${idx}`),
        document.getElementById(`ts${idx}_name`),
        document.getElementById(`ts${idx}_name_rk`),
        document.getElementById(`ts${idx}_name_vs`),
        document.getElementById(`ts${idx}_name_vq`)
    ];
    inputs.forEach(inp => { if (inp && inp.value !== val) inp.value = val; });
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
    if (!gameData.contestants || !gameData.contestants[idx - 1]) return;
    const current = gameData.contestants[idx - 1]?.score || 0;
    // Provide quick modal-free score adjuster: increment by 10
    const newScore = current + 10;
    gameData.contestants[idx - 1].score = newScore;
    const disps = [
        document.getElementById(`ts${idx}_score_disp`),
        document.getElementById(`ts${idx}_score_disp_rk`),
        document.getElementById(`ts${idx}_score_disp_vq`)
    ];
    disps.forEach(disp => { if (disp) disp.innerText = gameData.contestants[idx - 1].score; });
    saveAllData();
    if (typeof updateTab1Preview === 'function') updateTab1Preview();
    sendToProjector('XUAT_PHAT_SELECT_CONTESTANT', {
        name: gameData.contestants[idx - 1].name,
        score: gameData.contestants[idx - 1].score
    });
    showToast(`Đã tăng điểm Thí sinh ${idx} lên: ${newScore}`);
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
    
    const disps = [
        document.getElementById(`ts${idx}_score_disp`),
        document.getElementById(`ts${idx}_score_disp_rk`),
        document.getElementById(`ts${idx}_score_disp_vs`),
        document.getElementById(`ts${idx}_score_disp_vq`)
    ];
    disps.forEach(disp => { if (disp) disp.innerText = newScore; });
    
    saveAllData();
    if (typeof updateTab1Preview === 'function') updateTab1Preview();
    sendToProjector('UPDATE_SCORES', { contestants: gameData.contestants });
    
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

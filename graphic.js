// Graphic.js - Màn hình hiển thị Graphic (Chroma key green background)
function showPopup(message) {
    const msgEl = document.getElementById('popup-message');
    const popEl = document.getElementById('custom-popup');
    if (msgEl) msgEl.innerText = message;
    if (popEl) popEl.style.display = 'flex';
}

function closePopup() {
    const popEl = document.getElementById('custom-popup');
    if (popEl) popEl.style.display = 'none';
}

window.alert = function(msg) { showPopup(msg); };
window.prompt = function(msg) { showPopup(msg); return null; };
window.confirm = function(msg) { showPopup(msg); return false; };

let currentViewIndex = 1;

function switchView(viewNum) {
    currentViewIndex = viewNum;
    for (let i = 1; i <= 8; i++) {
        const viewEl = document.getElementById(`view-file-${i}`);
        const btnEl = document.getElementById(`btn-view-${i}`);
        if (viewEl) viewEl.classList.remove('active-view');
        if (btnEl) btnEl.classList.remove('active-view-btn');
    }
    const activeView = document.getElementById(`view-file-${viewNum}`);
    const activeBtn = document.getElementById(`btn-view-${viewNum}`);
    if (activeView) activeView.classList.add('active-view');
    if (activeBtn) activeBtn.classList.add('active-view-btn');
}

function scaleStage() {
    const wrapper = document.querySelector('.stage-wrapper');
    if (!wrapper) return;
    const targetWidth = 1920;
    const targetHeight = 1080;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const scale = Math.min(windowWidth / targetWidth, windowHeight / targetHeight);

    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.left = `${(windowWidth - targetWidth * scale) / 2}px`;
    wrapper.style.top = `${(windowHeight - targetHeight * scale) / 2}px`;
}

window.addEventListener('resize', scaleStage);
window.addEventListener('DOMContentLoaded', () => {
    scaleStage();
    let vsData = null;
    try {
        const saved = localStorage.getItem('duong_den_vinh_quang_data');
        if (saved) {
            const parsed = JSON.parse(saved);
            vsData = parsed.vuotSong;
        }
    } catch(e) {}
    syncVuotSongGrid(vsData);
});

/* VIEW 1 LOGIC */
let score1 = 0, timeLeft1 = 60, timerInterval1 = null, isRolling1 = false, currentQuestionIndex1 = 1;
let soundShowTitle1 = new Audio('sounds/ShowTitle.mp3');
let soundRandomSet1 = new Audio('sounds/RandomSet.mp3');
let soundBeginQues1 = new Audio('sounds/BeginQues.mp3');
let sound60s1 = new Audio('sounds/60s.mp3');
let soundTick1 = new Audio('sounds/Tick.mp3');
let soundTimeUp1 = new Audio('sounds/TImeUp.mp3');
let soundRight1 = new Audio('sounds/right.mp3');
let soundWrong1 = new Audio('sounds/wrong.mp3');
let soundRKAnswer = new Audio('sounds/Answer.mp3');
let soundRKTimer = new Audio('sounds/25sV1.mp3');
let soundChooseQues = new Audio('sounds/ChooseQues.mp3');
let soundRightV3 = new Audio('sounds/RightV3.mp3');
let soundActivate = new Audio('sounds/Activate.mp3');

let isAudioUnlocked = false;

function unlockAudio() {
    if (isAudioUnlocked) return;
    isAudioUnlocked = true;

    const allAudios = [
        soundShowTitle1, soundRandomSet1, soundBeginQues1, sound60s1, 
        soundTick1, soundTimeUp1, soundRight1, soundWrong1, soundRKAnswer, soundRKTimer, soundChooseQues, soundRightV3,
        soundActivate,
        document.getElementById('vongThiAudio2'),
        document.getElementById('soundRKAnswer2'),
        document.getElementById('vongThiAudio4'),
        document.getElementById('soundVSAnswer'),
        document.getElementById('vongThiAudio7'),
        document.getElementById('audioVQAnswer')
    ];

    allAudios.forEach(aud => {
        if (aud) {
            try {
                aud.load();
                let p = aud.play();
                if (p && typeof p.then === 'function') {
                    p.then(() => {
                        aud.pause();
                        aud.currentTime = 0;
                    }).catch(() => {});
                }
            } catch(e) {}
        }
    });
}

['click', 'keydown', 'pointerdown', 'touchstart', 'mousemove', 'wheel'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: true, capture: true });
});
window.addEventListener('DOMContentLoaded', unlockAudio);

function safePlay(audio) {
    if (!audio) return;
    try {
        audio.currentTime = 0;
        let p = audio.play();
        if (p && typeof p.then === 'function') {
            p.catch(e => {
                console.log("Audio play blocked, attempting silent unlock and retry:", e);
                unlockAudio();
                try {
                    audio.currentTime = 0;
                    audio.play().catch(err => console.log("Retry play failed:", err));
                } catch(err) {}
            });
        }
    } catch(e) {
        console.log("Audio exception:", e);
    }
}

function safePause(audio) {
    if (!audio) return;
    try {
        audio.pause();
        audio.currentTime = 0;
    } catch(e) {}
}

function stopAllAudio1() {
    safePause(soundShowTitle1);
    safePause(soundRandomSet1);
    safePause(soundBeginQues1);
    safePause(sound60s1);
    safePause(soundTick1);
    safePause(soundTimeUp1);
    safePause(soundRight1);
    safePause(soundWrong1);
}

function updateBlink1() {
    document.querySelectorAll('#view-file-1 .ket-qua-cau').forEach(el => el.classList.remove('blinking'));
    let currentBox = document.getElementById('kq1-' + currentQuestionIndex1);
    if (currentBox) currentBox.classList.add('blinking');
}

function xuatPhat1() { 
    const xp = document.getElementById('xuatPhatContainer');
    const cl = document.getElementById('contestantList1');
    if (xp) xp.style.display = 'none'; 
    if (cl) cl.style.display = 'flex'; 
}

function chonThiSinh1(name) { 
    const cl = document.getElementById('contestantList1');
    const ri = document.getElementById('randomImg1');
    const dn = document.getElementById('displayContestantName1');
    const qn = document.getElementById('quesContestantName1');
    const nb = document.getElementById('numberBox1');
    const bd = document.getElementById('btnBamDe1');

    if (cl) cl.style.display = 'none'; 
    if (ri) ri.style.display = 'block'; 
    if (dn) { dn.style.display = 'flex'; dn.innerText = name; }
    if (qn) qn.innerText = name; 
    if (nb) nb.style.display = 'flex'; 
    if (bd) bd.style.display = 'block'; 
}

function triggerQuestionMotion(text) {
    const qEl = document.getElementById('questionText1');
    if (!qEl) return;
    if (text !== undefined && text !== null) {
        qEl.innerText = text;
    }
    qEl.classList.remove('animate-question-slide');
    void qEl.offsetWidth; // trigger reflow
    qEl.classList.add('animate-question-slide');
}

function bamDe1(targetDe) {
    if (isRolling1) return;
    isRolling1 = true;
    const bd = document.getElementById('btnBamDe1');
    if (bd) bd.style.display = 'none';
    safePlay(soundRandomSet1);

    let startTime = Date.now();
    let rollInterval = setInterval(() => {
        const nb = document.getElementById('numberBox1');
        if (nb) nb.innerText = Math.floor(Math.random() * 8) + 1;
        if (Date.now() - startTime >= 5000) { 
            clearInterval(rollInterval);
            if (targetDe !== undefined && targetDe !== null) {
                if (nb) nb.innerText = targetDe;
            }
            isRolling1 = false;
        }
    }, 100);
}

function batDauCauHoi1(qText) {
    const txt = qText || "Nội dung câu hỏi số 1";
    triggerQuestionMotion(txt);
    let firstBox = document.getElementById('kq1-1');
    if (firstBox) firstBox.classList.remove('inactive');
    updateBlink1();

    clearInterval(timerInterval1);
    safePlay(soundBeginQues1);
    safePlay(sound60s1);

    timeLeft1 = 60;
    const timer1El = document.getElementById('timer1');
    if (timer1El) timer1El.innerText = "60";
    let targetTime = Date.now() + 60000;
    timerInterval1 = setInterval(() => {
        let prevTime = timeLeft1;
        timeLeft1 = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        if (timer1El) timer1El.innerText = timeLeft1 < 10 ? ('0' + timeLeft1) : timeLeft1;

        if (timeLeft1 <= 5 && timeLeft1 > 0 && timeLeft1 !== prevTime) {
            safePlay(soundTick1);
        }

        if (timeLeft1 === 0) {
            clearInterval(timerInterval1);
            safePlay(soundTimeUp1);
        }
    }, 200);
}

function traLoiDung1(skipScoreAdd = false) {
    safePlay(soundRight1);
    if (!skipScoreAdd) {
        score1 += 10; 
        const s1 = document.getElementById('score1');
        if (s1) s1.innerText = score1;
    }
    let el = document.getElementById('kq1-' + currentQuestionIndex1);
    if(el) { el.classList.remove('blinking'); el.style.backgroundColor = '#3b82f6'; }
    const ab = document.getElementById('answerBox1');
    if (ab) ab.style.display = 'flex';
}

function traLoiSai1() {
    safePlay(soundWrong1);
    let el = document.getElementById('kq1-' + currentQuestionIndex1);
    if(el) { el.classList.remove('blinking'); el.style.backgroundColor = '#ef4444'; }
    const ab = document.getElementById('answerBox1');
    if (ab) ab.style.display = 'flex';
}

function chuyenCau1() {
    const ab = document.getElementById('answerBox1');
    if (ab) ab.style.display = 'none';
    if(currentQuestionIndex1 < 10) {
        currentQuestionIndex1++;
        let nextBox = document.getElementById('kq1-' + currentQuestionIndex1);
        if(nextBox) nextBox.classList.remove('inactive');
        const q1 = document.getElementById('questionText1');
        if (q1) q1.innerText = "Nội dung câu hỏi số " + currentQuestionIndex1;
        updateBlink1();
    }
}

/* VIEW 3 LOGIC */
let windowCurrentVsData = null;

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

function ensureVSGridSynced() {
    const rowsContainer = document.getElementById('file3-rows-container');
    if (!rowsContainer || rowsContainer.children.length === 0) {
        syncVuotSongGrid(windowCurrentVsData);
    }
}

function syncVuotSongGrid(vsData) {
    if (vsData) {
        windowCurrentVsData = vsData;
    } else if (!windowCurrentVsData) {
        try {
            const saved = localStorage.getItem('duong_den_vinh_quang_data');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.vuotSong) {
                    windowCurrentVsData = parsed.vuotSong;
                }
            }
        } catch(e) {}
    }
    const dataToUse = vsData || windowCurrentVsData;

    const rowsContainer = document.getElementById('file3-rows-container');
    const keysContainer = document.getElementById('file3-keys-container');
    if (!rowsContainer || !keysContainer) return;

    const startX_Row = 237.2, startY_Row = 157.7, deltaX_Row = 99.2, deltaY_Row = 102.7;
    const widthRow = 95.6, heightRow = 75.7;
    let rowHtml = '';

    for (let h = 1; h <= 4; h++) {
        const baseY = startY_Row + (h - 1) * deltaY_Row;
        const ans = dataToUse ? (dataToUse[`h${h}`]?.a || dataToUse[`h${h}`]?.q || '') : '';
        const cleanAns = ans.replace(/\s+/g, '').toUpperCase();
        const totalChars = cleanAns.length;

        if (totalChars === 0) continue;

        const isMultiLine = totalChars > 15;
        const tileHeight = isMultiLine ? 44 : heightRow;
        const fontSize = isMultiLine ? '26px' : '40px';

        for (let i = 0; i < totalChars; i++) {
            const lineInRow = Math.floor(i / 15);
            const colInLine = i % 15;
            const currentX = startX_Row + colInLine * deltaX_Row;
            const currentY = isMultiLine ? (baseY + lineInRow * 46) : baseY;

            rowHtml += `<div class="game-item row-${h}-item" style="left: ${currentX}px; top: ${currentY}px; width: ${widthRow}px; height: ${tileHeight}px; font-size: ${fontSize}; background-image: url('Images/LetterDefault.png');"></div>`;
        }
    }
    rowsContainer.innerHTML = rowHtml;

    const startY_Key = 565.5, deltaX_Key = 98.5;
    const widthKey = 86.7, heightKey = 75.7;
    let keyHtml = '';
    const kw = dataToUse ? (dataToUse.keyword || dataToUse.center?.a || '') : '';
    const cleanKw = removeVietnameseTones(kw).replace(/\s+/g, '').toUpperCase();
    const kwL = cleanKw.length;

    if (kwL > 0) {
        if (kwL <= 15) {
            const computedStartX_Key = (1920 - (kwL * deltaX_Key - (deltaX_Key - widthKey))) / 2;
            for (let cot = 0; cot < kwL; cot++) {
                let currentX = computedStartX_Key + cot * deltaX_Key;
                keyHtml += `<div class="game-item key-item" style="left: ${currentX}px; top: ${startY_Key}px; width: ${widthKey}px; height: ${heightKey}px; background-image: url('Images/LetterKey.png');"></div>`;
            }
        } else {
            for (let i = 0; i < kwL; i++) {
                const lineIndex = Math.floor(i / 15);
                const colInLine = i % 15;
                const lineCharCount = Math.min(15, kwL - lineIndex * 15);
                const computedStartX = (1920 - (lineCharCount * deltaX_Key - (deltaX_Key - widthKey))) / 2;
                const currentX = computedStartX + colInLine * deltaX_Key;
                const currentY = startY_Key + lineIndex * 46;

                keyHtml += `<div class="game-item key-item" style="left: ${currentX}px; top: ${currentY}px; width: ${widthKey}px; height: 44px; font-size: 26px; background-image: url('Images/LetterKey.png');"></div>`;
            }
        }
    }
    keysContainer.innerHTML = keyHtml;
}

/* VIEW 4 LOGIC */
let countdown4, timeLeft4 = 20, isRunning4 = false;
function startCountdown4() {
    if (isRunning4) return;
    isRunning4 = true;
    const clockElement = document.getElementById('clock4');
    const audio = document.getElementById('vongThiAudio4');
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(e));
    }
    countdown4 = setInterval(() => {
        timeLeft4--;
        if (clockElement) clockElement.textContent = timeLeft4 < 10 ? ('0' + Math.max(0, timeLeft4)) : timeLeft4;
        if (timeLeft4 <= 0) { clearInterval(countdown4); if (clockElement) clockElement.textContent = "00"; isRunning4 = false; }
    }, 1000);
}

/* VIEW 6 LOGIC */
let isSelected6 = false;
let lastRequestedScore6 = null;

function setPackBackgroundImage(score) {
    const pageWrapper = document.querySelector('#view-file-6 #pageWrapper');
    const view6 = document.getElementById('view-file-6');
    if (!pageWrapper && !view6) return;

    lastRequestedScore6 = score;

    const primaryUrl = `Images/chosse${score}.png`;
    const secondaryUrl = `Images/choose${score}.png`;
    const fallbackUrl = `Images/choosepack.png`;

    const applyBg = (url, targetScore) => {
        if (lastRequestedScore6 !== targetScore) return;
        if (pageWrapper) pageWrapper.style.backgroundImage = `url('${url}')`;
        if (view6) view6.style.backgroundImage = `url('${url}')`;
    };

    const img = new Image();
    img.onload = function() {
        applyBg(primaryUrl, score);
    };
    img.onerror = function() {
        const img2 = new Image();
        img2.onload = function() {
            applyBg(secondaryUrl, score);
        };
        img2.onerror = function() {
            applyBg(fallbackUrl, score);
        };
        img2.src = secondaryUrl;
    };
    img.src = primaryUrl;
}

function showPack6() {
    isSelected6 = false;
    lastRequestedScore6 = null;
    switchView(6);
    const view6 = document.getElementById('view-file-6');
    const pageWrapper = document.querySelector('#view-file-6 #pageWrapper');
    if (pageWrapper) {
        pageWrapper.classList.add('no-transition');
        pageWrapper.style.backgroundImage = "url('Images/pack.png')";
        pageWrapper.classList.remove('fly-down');
        // Force reflow
        void pageWrapper.offsetWidth;
        pageWrapper.classList.remove('no-transition');
    }
    if (view6) {
        view6.style.backgroundImage = "url('Images/pack.png')";
    }
    const items = document.querySelectorAll('#view-file-6 .pack-item');
    items.forEach(it => it.classList.remove('selected'));
    const subjectTitleEl = document.getElementById('subjectTitle6');
    if (subjectTitleEl) {
        subjectTitleEl.innerText = '';
        subjectTitleEl.classList.remove('show');
    }
    const subjectContainer = document.querySelector('#view-file-6 .subject-container');
    if (subjectContainer) {
        subjectContainer.classList.remove('show');
    }
}

function resetVQProjector() {
    isSelected6 = false;
    lastRequestedScore6 = null;
    
    // 1. Reset View 6 (Packs view) to empty/fly-down state
    const view6 = document.getElementById('view-file-6');
    const pageWrapper = document.querySelector('#view-file-6 #pageWrapper');
    if (pageWrapper) {
        pageWrapper.classList.add('no-transition');
        pageWrapper.style.backgroundImage = "url('Images/pack.png')";
        pageWrapper.classList.add('fly-down'); // hide instantly
        // Force reflow
        void pageWrapper.offsetWidth;
        pageWrapper.classList.remove('no-transition');
    }
    if (view6) {
        view6.style.backgroundImage = "url('Images/pack.png')";
    }
    const items = document.querySelectorAll('#view-file-6 .pack-item');
    items.forEach(it => it.classList.remove('selected'));
    const subjectTitleEl = document.getElementById('subjectTitle6');
    if (subjectTitleEl) {
        subjectTitleEl.innerText = '';
        subjectTitleEl.classList.remove('show');
    }
    const subjectContainer = document.querySelector('#view-file-6 .subject-container');
    if (subjectContainer) {
        subjectContainer.classList.remove('show');
    }

    // 2. Reset View 7 (Vinh Quang question view)
    if (countdown7) {
        clearInterval(countdown7);
    }
    isRunning7 = false;
    const qEl7 = document.getElementById('vq_question_text');
    const rEl7 = document.getElementById('vq_round_title');
    if (qEl7) qEl7.innerText = "";
    if (rEl7) rEl7.innerText = "VINH QUANG";
    const clockEl7 = document.getElementById('clock7');
    if (clockEl7) clockEl7.innerText = "25";

    // 3. Reset View 8 (Vinh Quang answers view)
    for (let i = 1; i <= 4; i++) {
        const scoreEl = document.getElementById(`vq_score_ts${i}`);
        const nameEl = document.getElementById(`vq_name_ts${i}`);
        const ansEl = document.getElementById(`vq_ans_ts${i}`);
        if (scoreEl) scoreEl.innerText = '0';
        if (nameEl) nameEl.innerText = `THÍ SINH ${i}`;
        if (ansEl) ansEl.innerText = '';
    }

    // 4. Switch to view 6
    switchView(6);
}

function selectPack6(element, score, subjectName) {
    isSelected6 = true;
    switchView(6);
    const pageWrapper = document.querySelector('#view-file-6 #pageWrapper');
    if (pageWrapper) {
        pageWrapper.classList.add('no-transition');
        pageWrapper.classList.remove('fly-down');
        // Force reflow
        void pageWrapper.offsetWidth;
        pageWrapper.classList.remove('no-transition');
    }

    setPackBackgroundImage(score);

    const items = document.querySelectorAll('#view-file-6 .pack-item');
    items.forEach(it => it.classList.remove('selected'));
    const target = element || document.getElementById(`vq_pack_item_${score}`);
    if (target) target.classList.add('selected');

    const subjectTitleEl = document.getElementById('subjectTitle6');
    if (subjectTitleEl) {
        subjectTitleEl.innerText = subjectName ? subjectName.toUpperCase() : `MÔN HỌC GÓI ${score} ĐIỂM`;
        subjectTitleEl.classList.add('show');
    }
    const subjectContainer = document.querySelector('#view-file-6 .subject-container');
    if (subjectContainer) {
        subjectContainer.classList.add('show');
    }

    const chooseAudio = document.getElementById('audioChoose6');
    if (chooseAudio) {
        safePlay(chooseAudio);
    } else {
        safePlay(soundShowTitle1);
    }
}

function hidePack6() {
    const closeAudio = document.getElementById('audioClose6');
    if (closeAudio) {
        closeAudio.currentTime = 0;
        closeAudio.play().catch(e => console.log(e));
    }
    const pageWrapper = document.querySelector('#view-file-6 #pageWrapper');
    if (pageWrapper) {
        pageWrapper.classList.add('fly-down');
    }
}

window.addEventListener('keydown', function(event) {
    if (currentViewIndex === 6 && event.code === 'Space' && isSelected6) {
        event.preventDefault();
        hidePack6();
    }
});

/* VIEW 7 LOGIC */
let countdown7, timeLeft7 = 25, isRunning7 = false;
function startCountdown7(duration = 25) {
    if (isRunning7) clearInterval(countdown7);
    isRunning7 = true;
    timeLeft7 = duration;
    const clockElement = document.getElementById('clock7');
    if (clockElement) clockElement.textContent = timeLeft7 < 10 ? ('0' + timeLeft7) : timeLeft7;
    const audio = document.getElementById('vongThiAudio7');
    if (audio) {
        audio.currentTime = 0;
        safePlay(audio);
    } else {
        try {
            const vqAudio = new Audio('sounds/25sV1.mp3');
            safePlay(vqAudio);
        } catch(e) {}
    }
    countdown7 = setInterval(() => {
        timeLeft7--;
        if (clockElement) clockElement.textContent = timeLeft7 < 10 ? ('0' + Math.max(0, timeLeft7)) : timeLeft7;
        if (timeLeft7 <= 0) { 
            clearInterval(countdown7); 
            if (clockElement) clockElement.textContent = "00"; 
            isRunning7 = false; 
            try {
                safePlay(soundTimeUp1);
            } catch(e) {}
        }
    }, 1000);
}

/* CONTROLLER - GRAPHIC CONNECTION */
let projectorChannel = null;
const graphicRoomCode = (new URLSearchParams(window.location.search).get('roomid') || localStorage.getItem('ddvq_room_code') || 'DDVQ2026').trim().toUpperCase();

try {
    if (typeof BroadcastChannel !== 'undefined') {
        projectorChannel = new BroadcastChannel(`ddvq_game_channel_${graphicRoomCode.toLowerCase()}`);
        projectorChannel.onmessage = function(event) {
            const data = event.data;
            if (!data || !data.type) return;
            if (data.roomCode && data.roomCode.toUpperCase() !== graphicRoomCode) return;
            handleProjectorMessage(data);
        };
    }
} catch(e) {
    console.warn("BroadcastChannel restricted in graphic:", e);
}

// Server-Sent Events (SSE) for cross-device synchronization (Mobile, PC, Projector/Graphic)
if (typeof EventSource !== 'undefined') {
    try {
        const ssePath = typeof window.getApiUrl === 'function' ? window.getApiUrl(`/api/events?roomid=${encodeURIComponent(graphicRoomCode)}`) : `/api/events?roomid=${encodeURIComponent(graphicRoomCode)}`;
        const projSse = new EventSource(ssePath);
        projSse.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data) {
                    if (data.roomCode && data.roomCode.toUpperCase() !== graphicRoomCode) {
                        return; // Ignore messages from another room
                    }
                    if (data.type && data.type !== 'PING' && data.type !== 'PROJECTOR_READY') {
                        if (data.id && data.id !== lastProcessedActionId) {
                            lastProcessedActionId = data.id;
                            handleProjectorMessage(data);
                        } else if (!data.id) {
                            handleProjectorMessage(data);
                        }
                    }
                }
            } catch(e) {}
        };
    } catch(e) {
        console.warn("SSE graphic connection error:", e);
    }
}

let projectorContestants = [];

function updateProjectorContestants(contestants) {
    if (!contestants || !Array.isArray(contestants)) return;
    projectorContestants = contestants;
    for (let i = 1; i <= 4; i++) {
        const ts = contestants[i - 1] || { name: `Thí sinh ${i}`, score: 0 };
        const name = ts.name || `Thí sinh ${i}`;
        const score = ts.score !== undefined ? ts.score : 0;

        // View 1: Xuất Phát (active turn)
        if (typeof currentXuatPhatTurn !== 'undefined' && i === currentXuatPhatTurn) {
            score1 = score;
            const score1El = document.getElementById('score1');
            if (score1El) score1El.innerText = score;
        }

        // View 2: Ra Khơi
        const rkName = document.getElementById(`ten_ts${i}`);
        if (rkName) rkName.innerText = name;

        // View 5: Vượt Sóng
        const vsName = document.getElementById(`vs_ans_name_${i}`);
        if (vsName) vsName.innerText = name;

        // View 8: Vinh Quang
        const vqName = document.getElementById(`vq_name_ts${i}`);
        if (vqName) vqName.innerText = name;
        const vqScore = document.getElementById(`vq_score_ts${i}`);
        if (vqScore) vqScore.innerText = score;
    }
}

// Initial state fetch for graphic screen
function loadInitialProjectorState() {
    try {
        const savedContestants = localStorage.getItem('ddvq_contestants');
        if (savedContestants) {
            updateProjectorContestants(JSON.parse(savedContestants));
        }
    } catch(e) {}

    const apiPath = typeof window.getApiUrl === 'function' ? window.getApiUrl('/api/state') : '/api/state';
    fetch(apiPath)
        .then(res => res.json())
        .then(state => {
            if (state && state.contestants) {
                updateProjectorContestants(state.contestants);
            }
        })
        .catch(() => {});
}
window.addEventListener('DOMContentLoaded', loadInitialProjectorState);
loadInitialProjectorState();

function notifyControllerReady() {
    const msg = { type: 'PROJECTOR_READY', timestamp: Date.now() };
    if (projectorChannel) {
        try { projectorChannel.postMessage(msg); } catch(e) {}
    }
    try {
        localStorage.setItem('ddvq_projector_status', Date.now().toString());
    } catch(e) {}
    try {
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(msg, '*');
        }
    } catch(e) {}
    try {
        const actionUrl = typeof window.getApiUrl === 'function' ? window.getApiUrl('/api/action') : (typeof getApiUrlProj === 'function' ? getApiUrlProj('/api/action') : '/api/action');
        fetch(actionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(msg)
        }).catch(() => {});
    } catch(e) {}
}
notifyControllerReady();
setInterval(notifyControllerReady, 3000);

window.addEventListener('storage', function(event) {
    if (event.key === 'ddvq_latest_action' && event.newValue) {
        try {
            const data = JSON.parse(event.newValue);
            if (data && data.type) {
                handleProjectorMessage(data);
            }
        } catch(e) {
            console.warn("Storage parse error:", e);
        }
    }
});

window.addEventListener('message', function(event) {
    const data = event.data;
    if (data && data.type) {
        handleProjectorMessage(data);
    }
});

let lastProcessedActionId = '';
setInterval(() => {
    try {
        const raw = localStorage.getItem('ddvq_latest_action');
        if (raw) {
            const data = JSON.parse(raw);
            if (data && data.id && data.id !== lastProcessedActionId) {
                lastProcessedActionId = data.id;
                handleProjectorMessage(data);
            }
        }
    } catch(e) {}
}, 150);

function handleProjectorMessage(data) {
    if (data.type === 'SWITCH_VIEW') {
        if (data.viewNum) switchView(data.viewNum);
    } else if (data.type === 'SWITCH_ROUND') {
        if (data.viewNum) switchView(data.viewNum);
        else if (data.activeRound === 'XUAT_PHAT' || data.round === 'XUAT_PHAT') switchView(1);
        else if (data.activeRound === 'RA_KHOI' || data.round === 'RA_KHOI') switchView(2);
        else if (data.activeRound === 'VUOT_SONG' || data.round === 'VUOT_SONG') switchView(3);
        else if (data.activeRound === 'VINH_QUANG' || data.round === 'VINH_QUANG') switchView(6);
    } else if (data.type === 'XUAT_PHAT_INTRO') {
        switchView(1);
        stopAllAudio1();
        safePlay(soundShowTitle1);
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.add('active');
        if (scq) scq.classList.remove('active');
        const xp = document.getElementById('xuatPhatContainer');
        const cl = document.getElementById('contestantList1');
        const ri = document.getElementById('randomImg1');
        const dn = document.getElementById('displayContestantName1');
        const nb = document.getElementById('numberBox1');
        const bd = document.getElementById('btnBamDe1');

        if (xp) xp.style.display = 'block';
        if (cl) cl.style.display = 'none';
        if (ri) ri.style.display = 'none';
        if (dn) dn.style.display = 'none';
        if (nb) nb.style.display = 'none';
        if (bd) bd.style.display = 'none';
    } else if (data.type === 'XUAT_PHAT_LUAT') {
        switchView(1);
        stopAllAudio1();
        safePlay(soundShowTitle1);
        showPopup('VÒNG THI XUẤT PHÁT:\nMỗi thí sinh khởi động với các câu hỏi trong vòng 60 giây. Trả lời đúng mỗi câu được 10 điểm, trả lời sai không bị trừ điểm.');
    } else if (data.type === 'XUAT_PHAT_SELECT_CONTESTANT') {
        switchView(1);
        const name = data.name || "Thí sinh";
        chonThiSinh1(name);
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
    } else if (data.type === 'XUAT_PHAT_SHOW_GRAPHIC_CHON_DE') {
        switchView(1);
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.add('active');
        if (scq) scq.classList.remove('active');
        const xp = document.getElementById('xuatPhatContainer');
        const cl = document.getElementById('contestantList1');
        const ri = document.getElementById('randomImg1');
        const dn = document.getElementById('displayContestantName1');
        const qn = document.getElementById('quesContestantName1');
        const nb = document.getElementById('numberBox1');
        const bd = document.getElementById('btnBamDe1');

        if (xp) xp.style.display = 'none';
        if (cl) cl.style.display = 'none';
        if (ri) ri.style.display = 'block';
        if (dn) dn.style.display = 'flex';
        if (data.name) {
            if (dn) dn.innerText = data.name;
            if (qn) qn.innerText = data.name;
        }
        if (nb) nb.style.display = 'flex';
        if (bd) bd.style.display = 'block';
    } else if (data.type === 'XUAT_PHAT_SHOW_GRAPHIC_CAU_HOI') {
        switchView(1);
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.remove('active');
        if (scq) scq.classList.add('active');
        const qn = document.getElementById('quesContestantName1');
        if (data.name && qn) {
            qn.innerText = data.name;
        }
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
        const qEl = document.getElementById('questionText1');
        if (qEl) {
            qEl.innerText = "";
            qEl.classList.remove('animate-question-slide');
        }
        const ab = document.getElementById('answerBox1');
        if (ab) ab.style.display = 'none';
        for (let i = 1; i <= 10; i++) {
            let box = document.getElementById('kq1-' + i);
            if (box) {
                box.className = 'ket-qua-cau inactive';
                box.style.backgroundColor = '';
            }
        }
        document.querySelectorAll('#view-file-1 .ket-qua-cau').forEach(el => el.classList.remove('blinking'));
    } else if (data.type === 'XUAT_PHAT_RANDOM_DE') {
        switchView(1);
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.add('active');
        if (scq) scq.classList.remove('active');
        const ri = document.getElementById('randomImg1');
        const dn = document.getElementById('displayContestantName1');
        const qn = document.getElementById('quesContestantName1');
        const nb = document.getElementById('numberBox1');

        if (ri) ri.style.display = 'block';
        if (dn) dn.style.display = 'flex';
        if (data.name) {
            if (dn) dn.innerText = data.name;
            if (qn) qn.innerText = data.name;
        }
        if (nb) nb.style.display = 'flex';
        bamDe1(data.deNumber);
    } else if (data.type === 'XUAT_PHAT_START_TIMER') {
        switchView(1);
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.remove('active');
        if (scq) scq.classList.add('active');
        if (data.questionIndex) {
            currentQuestionIndex1 = data.questionIndex;
        }
        const qn = document.getElementById('quesContestantName1');
        if (data.contestantName && qn) {
            qn.innerText = data.contestantName;
        }
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
        batDauCauHoi1(data.questionText);
    } else if (data.type === 'XUAT_PHAT_RIGHT') {
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
        const ab = document.getElementById('answerBox1');
        if (data.answerText && ab) {
            ab.innerText = data.answerText;
        }
        traLoiDung1(data.score !== undefined);
    } else if (data.type === 'XUAT_PHAT_WRONG') {
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
        const ab = document.getElementById('answerBox1');
        if (data.answerText && ab) {
            ab.innerText = data.answerText;
        }
        traLoiSai1();
    } else if (data.type === 'XUAT_PHAT_FINISH') {
        clearInterval(timerInterval1);
        stopAllAudio1();
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.remove('active');
        if (scq) scq.classList.remove('active');
    } else if (data.type === 'XUAT_PHAT_NEXT_QUESTION') {
        if (data.questionIndex) {
            currentQuestionIndex1 = data.questionIndex;
        }
        if (data.score !== undefined) {
            score1 = data.score;
            const s1 = document.getElementById('score1');
            if (s1) s1.innerText = score1;
        }
        const ab = document.getElementById('answerBox1');
        if (ab) ab.style.display = 'none';
        let nextBox = document.getElementById('kq1-' + currentQuestionIndex1);
        if (nextBox) nextBox.classList.remove('inactive');
        const txt = data.questionText || ("Nội dung câu hỏi số " + currentQuestionIndex1);
        triggerQuestionMotion(txt);
        updateBlink1();
    } else if (data.type === 'XUAT_PHAT_RESET') {
        clearInterval(timerInterval1);
        stopAllAudio1();
        timeLeft1 = 60;
        const timer1El = document.getElementById('timer1');
        if (timer1El) timer1El.innerText = "60";
        score1 = data.score !== undefined ? data.score : 0;
        const s1 = document.getElementById('score1');
        if (s1) s1.innerText = score1;
        currentQuestionIndex1 = 1;
        const ab = document.getElementById('answerBox1');
        if (ab) ab.style.display = 'none';
        const scd = document.getElementById('scene-chon-de');
        const scq = document.getElementById('scene-cau-hoi1');
        if (scd) scd.classList.add('active');
        if (scq) scq.classList.remove('active');
        const xp = document.getElementById('xuatPhatContainer');
        const cl = document.getElementById('contestantList1');
        const ri = document.getElementById('randomImg1');
        const dn = document.getElementById('displayContestantName1');
        const nb = document.getElementById('numberBox1');
        const bd = document.getElementById('btnBamDe1');

        if (xp) xp.style.display = 'block';
        if (cl) cl.style.display = 'none';
        if (ri) ri.style.display = 'none';
        if (dn) dn.style.display = 'none';
        if (nb) nb.style.display = 'none';
        if (bd) bd.style.display = 'none';

        for (let i = 1; i <= 10; i++) {
            let box = document.getElementById('kq1-' + i);
            if (box) {
                box.className = 'ket-qua-cau inactive';
                box.style.backgroundColor = '';
            }
        }
    } else if (data.type === 'XUAT_PHAT_STOP_SOUND') {
        stopAllAudio1();
    } else if (data.type === 'RA_KHOI_PLAY_CLIP' || data.type === 'RA_KHOI_SHOW_VIDEO' || data.type === 'RA_KHOI_INTRO') {
        handleRKPlayClip(data);
    } else if (data.type === 'RA_KHOI_START_TIMER') {
        switchView(2);
        startRKTimer30s(data.duration || 30);
    } else if (data.type === 'RA_KHOI_SHOW_CONTESTANT_ANSWERS') {
        handleRKShowContestantAnswers(data);
    } else if (data.type === 'RA_KHOI_SHOW_ANSWER') {
        switchView(2);
        safePlay(soundRKAnswer);
    } else if (data.type === 'RA_KHOI_RESET') {
        switchView(2);
        if (rkTimerIntervalProj) clearInterval(rkTimerIntervalProj);
        if (rkAutoTimerTimeout) clearTimeout(rkAutoTimerTimeout);
        rkTimerAlreadyTriggered = false;
        const clockEl = document.getElementById('rk_clock_box');
        if (clockEl) clockEl.innerText = "30";
        const video = document.getElementById('rk_video_player');
        if (video) { video.pause(); video.currentTime = 0; }
        const qScene = document.getElementById('rk-scene-question');
        const aScene = document.getElementById('rk-scene-answers');
        if (qScene) qScene.style.display = 'flex';
        if (aScene) aScene.style.display = 'none';
    } else if (data.type === 'PLAYER_SUBMIT_ANSWER') {
        if (data.round === 'VS' && data.isVongThi) {
            safePlay(soundActivate);
        }
    } else if (data.type === 'VUOT_SONG_SELECT_ROW') {
        flashVuotSongRow(data.row);
    } else if (data.type === 'VUOT_SONG_SHOW_QUESTION') {
        handleVSShowQuestion(data);
    } else if (data.type === 'VUOT_SONG_START_TIMER') {
        handleVSStartTimer(data);
    } else if (data.type === 'VUOT_SONG_SHOW_CONTESTANT_ANSWERS') {
        handleVSShowAnswers(data);
    } else if (data.type === 'VUOT_SONG_SYNC_GRID') {
        syncVuotSongGrid(data.vuotSong);
    } else if (data.type === 'VUOT_SONG_RESET') {
        handleVSReset();
    } else if (data.type === 'VUOT_SONG_OPEN_ROW_ANSWER') {
        handleVSOpenRowAnswer(data);
    } else if (data.type === 'VUOT_SONG_OPEN_KEYWORD_LETTERS') {
        handleVSOpenKeywordLetters(data);
    } else if (data.type === 'VUOT_SONG_OPEN_ALL_ANSWERS') {
        handleVSOpenAllAnswers(data);
    } else if (data.type === 'VINH_QUANG_SHOW_PACKS' || data.type === 'VINH_QUANG_SHOW_PACK_SELECTION') {
        showPack6();
    } else if (data.type === 'VINH_QUANG_SELECT_PACK') {
        switchView(6);
        const pack = data.pack || 10;
        const elem = document.getElementById(`vq_pack_item_${pack}`);
        selectPack6(elem, pack.toString(), data.subject || `Gói ${pack} Điểm`);
    } else if (data.type === 'VINH_QUANG_HIDE_PACK' || data.type === 'VINH_QUANG_FLY_OUT') {
        switchView(6);
        hidePack6();
    } else if (data.type === 'VINH_QUANG_RESET') {
        resetVQProjector();
    } else if (data.type === 'VINH_QUANG_SHOW_QUESTION') {
        switchView(7);
        safePlay(soundBeginQues1);
        const qEl = document.getElementById('vq_question_text');
        const rEl = document.getElementById('vq_round_title');
        const pEl = document.getElementById('vq_selected_pack_title');
        if (qEl) qEl.innerText = data.questionText || "Nội dung câu hỏi Vinh Quang...";
        if (rEl) rEl.innerText = "VINH QUANG";
        if (pEl) {
            const packTxt = data.pack ? `GÓI ${data.pack} ĐIỂM` : (data.subject ? data.subject.toUpperCase() : "");
            pEl.innerText = packTxt;
        }
        const clockEl = document.getElementById('clock7');
        if (clockEl) clockEl.innerText = "25";
    } else if (data.type === 'VINH_QUANG_START_TIMER' || data.type === 'VINH_QUANG_25S') {
        switchView(7);
        startCountdown7(data.duration || 25);
    } else if (data.type === 'VINH_QUANG_STAR_OF_HOPE') {
        safePlay(soundChooseQues);
    } else if (data.type === 'VINH_QUANG_SHOW_ANSWERS') {
        switchView(8);
        const ansAudio = document.getElementById('audioVQAnswer') || document.getElementById('soundRKAnswer');
        if (ansAudio) {
            ansAudio.currentTime = 0;
            ansAudio.play().catch(e => console.log(e));
        } else {
            safePlay(soundRKAnswer);
        }
        const contestants = data.contestants || [];
        for (let i = 1; i <= 4; i++) {
            const ts = contestants[i - 1] || {};
            const scoreEl = document.getElementById(`vq_score_ts${i}`);
            const nameEl = document.getElementById(`vq_name_ts${i}`);
            const ansEl = document.getElementById(`vq_ans_ts${i}`);
            if (scoreEl) scoreEl.innerText = ts.score !== undefined ? ts.score : '0';
            if (nameEl) nameEl.innerText = ts.name || `THÍ SINH ${i}`;
            if (ansEl) ansEl.innerText = ts.answer || '';
        }
    } else if (data.type === 'UPDATE_CONTESTANTS' || data.type === 'UPDATE_SCORES' || data.type === 'FULL_STATE_SYNC' || data.type === 'UPDATE_STATE') {
        if (data.contestants && Array.isArray(data.contestants)) {
            updateProjectorContestants(data.contestants);
        }
    } else if (data.type === 'RESET_ALL_DATA') {
        clearInterval(timerInterval1);
        stopAllAudio1();
        timeLeft1 = 60;
        score1 = 0;
        const s1 = document.getElementById('score1');
        if (s1) s1.innerText = "0";
        const q1 = document.getElementById('questionText1');
        if (q1) q1.innerText = "";
        const ab1 = document.getElementById('answerBox1');
        if (ab1) ab1.style.display = 'none';

        if (rkTimerIntervalProj) clearInterval(rkTimerIntervalProj);
        if (rkAutoTimerTimeout) clearTimeout(rkAutoTimerTimeout);
        const clockEl2 = document.getElementById('rk_clock_box');
        if (clockEl2) clockEl2.innerText = "30";
        const video2 = document.getElementById('rk_video_player');
        if (video2) { video2.pause(); video2.currentTime = 0; }
        const qTitle2 = document.getElementById('rk_question_title');
        if (qTitle2) qTitle2.innerText = "";
        const qText2 = document.getElementById('rk_question_text');
        if (qText2) qText2.innerText = "";
        for (let i = 1; i <= 4; i++) {
            const t = document.getElementById('thoi_gian_ts' + i);
            const n = document.getElementById('ten_ts' + i);
            const a = document.getElementById('dap_an_ts' + i);
            if (t) t.innerText = "";
            if (n) n.innerText = "";
            if (a) a.innerText = "";
        }

        handleVSReset();
        resetVQProjector();
        switchView(1);
    }
}

function handleVSOpenRowAnswer(data) {
    switchView(3);
    ensureVSGridSynced();
    const rowsContainer = document.getElementById('file3-rows-container');
    if (!rowsContainer || !data.row) return;

    if (data.row === 'center' || data.row === 'keyword') {
        const kwItems = document.querySelectorAll('#file3-keys-container .key-item');
        const rawKw = data.answer || (windowCurrentVsData?.keyword) || (windowCurrentVsData?.center?.a) || '';
        const kwAns = removeVietnameseTones(rawKw).replace(/\s+/g, '').toUpperCase();
        kwItems.forEach((item, index) => {
            if (index < kwAns.length) {
                item.innerText = kwAns[index];
                item.style.backgroundImage = "url('Images/LetterKeyOpen.png')";
            } else {
                item.innerText = "";
            }
        });
        if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
        return;
    }

    const items = rowsContainer.querySelectorAll(`.row-${data.row}-item`);
    let ans = (data.answer || '').replace(/\s+/g, '').toUpperCase();
    if (!ans && windowCurrentVsData && windowCurrentVsData[`h${data.row}`]) {
        ans = (windowCurrentVsData[`h${data.row}`].a || '').replace(/\s+/g, '').toUpperCase();
    }
    
    items.forEach((item, index) => {
        item.style.backgroundImage = "url('Images/LetterDefault.png')";
        if (index < ans.length) {
            item.innerText = ans[index];
        } else {
            item.innerText = "";
        }
    });
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
}

function handleVSOpenKeywordLetters(data) {
    switchView(3);
    ensureVSGridSynced();
    const keysContainer = document.getElementById('file3-keys-container');
    if (!keysContainer) return;

    const rawKw = data.keyword || windowCurrentVsData?.keyword || windowCurrentVsData?.center?.a || '';
    const kwAns = removeVietnameseTones(rawKw).replace(/\s+/g, '').toUpperCase();
    const revealed = data.revealedIndices || [];
    const kwItems = keysContainer.querySelectorAll('.key-item');

    kwItems.forEach((item, index) => {
        if (index < kwAns.length) {
            if (revealed.includes(index)) {
                item.innerText = kwAns[index];
                item.style.backgroundImage = "url('Images/LetterKeyOpen.png')";
            } else {
                item.innerText = "";
                item.style.backgroundImage = "url('Images/LetterKey.png')";
            }
        } else {
            item.innerText = "";
        }
    });

    safePlay(soundChooseQues);
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
}

function handleVSOpenAllAnswers(data) {
    switchView(3);
    safePlay(soundRightV3);
    if (data.vuotSong) windowCurrentVsData = data.vuotSong;
    ensureVSGridSynced();
    const rowsContainer = document.getElementById('file3-rows-container');
    const keysContainer = document.getElementById('file3-keys-container');
    
    const vsData = data.vuotSong || windowCurrentVsData;
    if (rowsContainer && vsData) {
        for (let h = 1; h <= 4; h++) {
            const items = rowsContainer.querySelectorAll(`.row-${h}-item`);
            const ans = (vsData[`h${h}`]?.a || '').replace(/\s+/g, '').toUpperCase();
            items.forEach((item, index) => {
                item.style.backgroundImage = "url('Images/LetterDefault.png')";
                if (index < ans.length) {
                    item.innerText = ans[index];
                } else {
                    item.innerText = "";
                }
            });
        }
    }

    if (keysContainer && vsData && (vsData.keyword || vsData.center?.a)) {
        const kwItems = keysContainer.querySelectorAll('.key-item');
        const rawKw = vsData.keyword || vsData.center?.a || '';
        const kwAns = removeVietnameseTones(rawKw).replace(/\s+/g, '').toUpperCase();
        kwItems.forEach((item, index) => {
            if (index < kwAns.length) {
                item.innerText = kwAns[index];
                item.style.backgroundImage = "url('Images/LetterKeyOpen.png')";
            } else {
                item.innerText = "";
            }
        });
    }
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
}

function handleVSReset() {
    switchView(3);
    ensureVSGridSynced();
    const rowsContainer = document.getElementById('file3-rows-container');
    const keysContainer = document.getElementById('file3-keys-container');
    if (rowsContainer) {
        const items = rowsContainer.querySelectorAll('.game-item');
        items.forEach(item => {
            item.style.backgroundImage = "url('Images/LetterDefault.png')";
            item.innerText = "";
        });
    }
    if (keysContainer) {
        const kwItems = keysContainer.querySelectorAll('.key-item');
        kwItems.forEach(item => {
            item.innerText = "";
            item.style.backgroundImage = "url('Images/LetterKey.png')";
        });
    }
    for (let h = 1; h <= 4; h++) {
        const ind = document.getElementById(`vs_ind_${h}`);
        if (ind) {
            ind.style.backgroundImage = `url('Images/c${h}.png')`;
        }
    }
    if (window.vsFlashInterval) {
        clearInterval(window.vsFlashInterval);
    }
    if (countdown4) clearInterval(countdown4);
    isRunning4 = false;
    const qBox4 = document.querySelector('#view-file-4 .question-box');
    if (qBox4) qBox4.innerText = "";
    const clockEl4 = document.getElementById('clock4');
    if (clockEl4) clockEl4.innerText = "20";
    for (let i = 1; i <= 4; i++) {
        const timeEl = document.getElementById(`vs_time_ts${i}`);
        const nameEl = document.getElementById(`vs_name_ts${i}`);
        const ansEl = document.getElementById(`vs_ans_ts${i}`);
        if (timeEl) timeEl.innerText = "";
        if (nameEl) nameEl.innerText = "";
        if (ansEl) ansEl.innerText = "";
    }
}

function flashVuotSongRow(row) {
    switchView(3);
    ensureVSGridSynced();
    safePlay(soundChooseQues);
    for (let h = 1; h <= 4; h++) {
        const ind = document.getElementById(`vs_ind_${h}`);
        if (ind) {
            if (h === row) {
                ind.style.backgroundImage = `url('Images/c${h}c.png')`;
            } else {
                ind.style.backgroundImage = `url('Images/c${h}.png')`;
            }
        }
    }

    if (row === 'center' || typeof row !== 'number') return;
    const rowsContainer = document.getElementById('file3-rows-container');
    if (!rowsContainer) return;
    const items = rowsContainer.querySelectorAll(`.row-${row}-item`);
    
    let count = 0;
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
    window.vsFlashInterval = setInterval(() => {
        count++;
        const useChoose = (count % 2 === 1);
        const bg = useChoose ? "url('Images/LetterChoose.png')" : "url('Images/LetterDefault.png')";
        items.forEach(item => {
            item.style.backgroundImage = bg;
        });
        if (count >= 10) {
            clearInterval(window.vsFlashInterval);
            items.forEach(item => {
                item.style.backgroundImage = "url('Images/LetterChoose.png')";
            });
        }
    }, 100);
}

function handleVSShowQuestion(data) {
    switchView(4);
    safePlay(soundBeginQues1);
    const qEl = document.querySelector('#view-file-4 .question-box');
    if (qEl) {
        qEl.innerText = data.questionText || "Nội dung câu hỏi Vượt Sóng...";
        qEl.classList.remove('animate-question-slide');
        void qEl.offsetWidth; // trigger reflow
        qEl.classList.add('animate-question-slide');
    }
    timeLeft4 = 20;
    const clockEl = document.getElementById('clock4');
    if (clockEl) clockEl.innerText = "20";
    isRunning4 = false;
}

function handleVSStartTimer(data) {
    switchView(4);
    startCountdown4();
}

function handleVSShowAnswers(data) {
    switchView(5);
    const audio = document.getElementById('soundVSAnswer');
    if (audio) { audio.currentTime = 0; audio.play().catch(e => console.log(e)); }
    const contestants = data.contestants || [];
    for (let i = 1; i <= 4; i++) {
        const ts = contestants[i - 1] || {};
        const nameEl = document.getElementById(`vs_ans_name_${i}`);
        const valEl = document.getElementById(`vs_ans_val_${i}`);
        const timeEl = document.getElementById(`vs_ans_time_${i}`);
        if (nameEl) nameEl.innerText = ts.name || `Thí sinh ${i}`;

        let ans = ts.answer || '';
        let time = ts.time || ts.vs_time || ts.rk_time || '';

        // Clean any attached prefixes just in case
        ans = ans.replace(/^[🔔\s]*(\[CNV\]|\[Bấm chuông\])?\s*/gi, '').trim();

        const match = ans.match(/\(([\d\.]+)(?:s|giây)?\)/i);
        if (match) {
            if (!time || time === '00.00') {
                time = match[1];
            }
            ans = ans.replace(/\(([\d\.]+)(?:s|giây)?\)/i, '').trim();
        }

        time = (time || '00.00').toString().replace(/s|giây/gi, '').trim();
        const num = parseFloat(time);
        if (!isNaN(num)) {
            time = num < 10 ? '0' + num.toFixed(2) : num.toFixed(2);
        } else {
            time = '00.00';
        }

        if (valEl) valEl.innerText = ans;
        if (timeEl) timeEl.innerText = time;
    }
}

// Ra Khoi Helper Functions
let rkTimerIntervalProj = null;
let rkAutoTimerTimeout = null;
let rkTimerAlreadyTriggered = false;

function startRKTimer30s(duration = 30) {
    if (rkTimerIntervalProj) clearInterval(rkTimerIntervalProj);
    let timeLeft = duration;
    const clockEl = document.getElementById('rk_clock_box');
    if (clockEl) clockEl.innerText = timeLeft;

    // Stop any existing music - Ra Khoi 30s timer does not play background music
    const audio = document.getElementById('vongThiAudio2');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    rkTimerIntervalProj = setInterval(() => {
        timeLeft--;
        if (clockEl) clockEl.innerText = timeLeft < 10 ? ('0' + Math.max(0, timeLeft)) : timeLeft;
        if (timeLeft <= 0) {
            clearInterval(rkTimerIntervalProj);
            if (clockEl) clockEl.innerText = "00";
            try {
                safePlay(soundTimeUp1);
            } catch(e) {}
        }
    }, 1000);
}

function playRKVideoExplicitly() {
    const video = document.getElementById('rk_video_player');
    const overlay = document.getElementById('rk_video_play_overlay');
    if (video) {
        video.play().then(() => {
            if (overlay) overlay.style.display = 'none';
        }).catch(err => {
            console.warn("Explicit play failed:", err);
        });
    }
}

function handleRKPlayClip(data) {
    switchView(2);
    const qScene = document.getElementById('rk-scene-question');
    const aScene = document.getElementById('rk-scene-answers');
    if (qScene) qScene.style.display = 'flex';
    if (aScene) aScene.style.display = 'none';

    const headerTitle = document.getElementById('rk_ques_header_title');
    if (headerTitle) headerTitle.innerText = `VÒNG THI RA KHƠI - CÂU HỎI THỨ ${data.questionIndex || 1}`;

    const qText = document.getElementById('rk_question_text');
    if (qText) qText.innerText = data.questionText || `Nội dung câu hỏi đoạn băng số ${data.questionIndex || 1}...`;

    const clockEl = document.getElementById('rk_clock_box');
    if (clockEl) clockEl.innerText = "30";

    const video = document.getElementById('rk_video_player');
    const placeholder = document.getElementById('rk_video_placeholder');
    const placeholderText = document.getElementById('rk_placeholder_text');
    const overlay = document.getElementById('rk_video_play_overlay');

    if (rkTimerIntervalProj) clearInterval(rkTimerIntervalProj);
    if (rkAutoTimerTimeout) clearTimeout(rkAutoTimerTimeout);
    rkTimerAlreadyTriggered = false;

    if (data.mediaUrl && data.mediaUrl.trim() !== '' && data.mediaUrl.trim() !== '...') {
        if (video) {
            video.src = data.mediaUrl;
            video.load();
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';

            video.play().then(() => {
                if (overlay) overlay.style.display = 'none';
            }).catch(err => {
                console.warn("Video autoplay blocked or error:", err);
                if (overlay) overlay.style.display = 'flex';
            });

            video.ontimeupdate = null;
        }
    } else {
        if (video) video.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        if (placeholder) placeholder.style.display = 'flex';
        if (placeholderText) placeholderText.innerText = `Đang phát đoạn băng câu ${data.questionIndex || 1}...`;
    }
}

function handleRKShowContestantAnswers(data) {
    switchView(2);
    const qScene = document.getElementById('rk-scene-question');
    const aScene = document.getElementById('rk-scene-answers');
    if (qScene) qScene.style.display = 'none';
    if (aScene) aScene.style.display = 'block';

    safePlay(soundRKAnswer);

    const video = document.getElementById('rk_video_player');
    if (video) video.pause();

    const contestants = data.contestants || [];
    for (let i = 1; i <= 4; i++) {
        const ts = contestants[i - 1] || {};
        const tenEl = document.getElementById(`ten_ts${i}`);
        const tgEl = document.getElementById(`thoi_gian_ts${i}`);
        const daEl = document.getElementById(`dap_an_ts${i}`);

        if (tenEl) tenEl.innerText = ts.name || `THÍ SINH ${i}`;

        let ans = ts.rk_answer || ts.answer || `ĐÁP ÁN TS${i}`;
        let time = ts.rk_time || ts.time || '';

        const match = ans.match(/\(([\d\.]+)(?:s|giây)?\)/i);
        if (match) {
            if (!time || time === '00.00') {
                time = match[1];
            }
            ans = ans.replace(/\(([\d\.]+)(?:s|giây)?\)/i, '').trim();
        }

        time = (time || '00.00').toString().replace(/s|giây/gi, '').trim();
        const num = parseFloat(time);
        if (!isNaN(num)) {
            time = num < 10 ? '0' + num.toFixed(2) : num.toFixed(2);
        } else {
            time = '00.00';
        }

        if (tgEl) tgEl.innerText = time;
        if (daEl) daEl.innerText = ans;
    }
}

const ONRENDER_BASE_URL_GRAPHIC = 'https://ddvq.onrender.com';

function getApiUrlProj(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function') {
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
        return ONRENDER_BASE_URL_GRAPHIC + cleanPath;
    }
    return cleanPath;
}

function sendProjectorHeartbeat() {
    const projRoomCode = localStorage.getItem('ddvq_room_code') || 'DDVQ2026';

    const hbData = {
        type: 'CLIENT_HEARTBEAT',
        role: 'projector',
        roomCode: projRoomCode,
        name: 'Máy Chiếu (Graphic)',
        timestamp: Date.now()
    };

    fetch(getApiUrlProj('/api/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hbData)
    }).catch(() => {});

    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('ddvq_game_channel');
            bc.postMessage({
                type: 'CLIENT_HEARTBEAT',
                role: 'projector',
                roomCode: projRoomCode,
                name: 'Máy Chiếu (Graphic)',
                timestamp: Date.now()
            });
        }
    } catch(e) {}

    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify({
            role: 'projector',
            roomCode: projRoomCode,
            name: 'Máy Chiếu (Graphic)',
            timestamp: Date.now()
        }));
        localStorage.setItem('ddvq_projector_status', Date.now().toString());
    } catch(e) {}
}

sendProjectorHeartbeat();
setInterval(sendProjectorHeartbeat, 2500);

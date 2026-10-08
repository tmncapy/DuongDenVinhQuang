let currentCustomAudio = null;
function playCustomSound(soundFile) {
    if (currentCustomAudio) {
        try { currentCustomAudio.pause(); } catch(e) {}
    }
    if (typeof screenAudioSettings !== 'undefined' && !screenAudioSettings.enabled) return;
    try {
        let src = soundFile;
        if (!src.includes('/') && !src.startsWith('http')) {
            src = `sounds/${src}`;
        }
        if (typeof getApiUrl === 'function') {
            src = getApiUrl(src);
        }
        currentCustomAudio = new Audio(src);
        if (typeof screenAudioSettings !== 'undefined') {
            currentCustomAudio.volume = screenAudioSettings.volume;
            currentCustomAudio.muted = !screenAudioSettings.enabled;
        }
        currentCustomAudio.play().catch(e => console.warn("Audio play blocked on projector:", e));
    } catch(e) {
        console.error("Error playing custom sound:", e);
    }
}

function stopCustomSound() {
    if (currentCustomAudio) {
        try {
            currentCustomAudio.pause();
            currentCustomAudio.currentTime = 0;
        } catch(e) {}
        currentCustomAudio = null;
    }
}

function handleVSOpenRowAnswer(data) {
    switchView(3);
    ensureVSGridSynced();
    const rowsContainer = document.getElementById('file3-rows-container');
    if (!rowsContainer || !data.row) return;

    if (!window.vsOpenedRows) {
        window.vsOpenedRows = { 1: false, 2: false, 3: false, 4: false, center: false, keyword: false };
    }

    if (data.row === 'center' || data.row === 'keyword') {
        window.vsOpenedRows.center = true;
        window.vsOpenedRows.keyword = true;
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

    window.vsOpenedRows[data.row] = true;
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
    window.vsRevealedIndices = Array.from(new Set([...(window.vsRevealedIndices || []), ...revealed]));
    const kwItems = keysContainer.querySelectorAll('.key-item');

    kwItems.forEach((item, index) => {
        if (index < kwAns.length) {
            if (window.vsRevealedIndices.includes(index) || (window.vsOpenedRows && (window.vsOpenedRows.keyword || window.vsOpenedRows.center))) {
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

    if (typeof soundOpenLetter !== 'undefined' && soundOpenLetter) {
        safePlay(soundOpenLetter);
    } else {
        safePlay(soundChooseQues);
    }
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);
}

function handleVSOpenAllAnswers(data) {
    switchView(3);
    safePlay(soundRightV3);
    if (data.vuotSong) windowCurrentVsData = data.vuotSong;
    window.vsOpenedRows = { 1: true, 2: true, 3: true, 4: true, center: true, keyword: true };
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
    window.currentSelectedVSRow = null;
    window.vsOpenedRows = { 1: false, 2: false, 3: false, 4: false, center: false, keyword: false };
    window.vsRevealedIndices = [];
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

function handleVSReturnGrid(data) {
    switchView(3);
    ensureVSGridSynced();

    const vqAudio4 = document.getElementById('vongThiAudio4');
    if (vqAudio4) { try { vqAudio4.pause(); vqAudio4.currentTime = 0; } catch(e) {} }
    const ansAudio5 = document.getElementById('soundVSAnswer');
    if (ansAudio5) { try { ansAudio5.pause(); ansAudio5.currentTime = 0; } catch(e) {} }
    if (countdown4) clearInterval(countdown4);
    isRunning4 = false;
    if (window.vsFlashInterval) clearInterval(window.vsFlashInterval);

    const selectedRow = data && data.row ? data.row : (window.currentSelectedVSRow || null);
    if (selectedRow) {
        window.currentSelectedVSRow = selectedRow;
    }

    // 1. Maintain indicators (selected row highlighted with c{h}c.png)
    for (let h = 1; h <= 4; h++) {
        const ind = document.getElementById(`vs_ind_${h}`);
        if (ind) {
            if (selectedRow && (h === selectedRow || h == selectedRow)) {
                ind.style.backgroundImage = `url('Images/c${h}c.png')`;
            } else {
                ind.style.backgroundImage = `url('Images/c${h}.png')`;
            }
        }
    }

    // 2. Maintain row answers & selected row appearance
    const rowsContainer = document.getElementById('file3-rows-container');
    if (rowsContainer && windowCurrentVsData) {
        for (let h = 1; h <= 4; h++) {
            const items = rowsContainer.querySelectorAll(`.row-${h}-item`);
            const isOpened = !!(window.vsOpenedRows && window.vsOpenedRows[h]);
            const isSelected = !!(selectedRow && (h === selectedRow || h == selectedRow));
            const ans = (windowCurrentVsData[`h${h}`]?.a || windowCurrentVsData[`h${h}`]?.q || '').replace(/\s+/g, '').toUpperCase();

            items.forEach((item, index) => {
                if (isOpened) {
                    item.style.backgroundImage = "url('Images/LetterDefault.png')";
                    item.innerText = index < ans.length ? ans[index] : "";
                } else if (isSelected) {
                    item.style.backgroundImage = "url('Images/LetterChoose.png')";
                    item.innerText = "";
                } else {
                    item.style.backgroundImage = "url('Images/LetterDefault.png')";
                    item.innerText = "";
                }
            });
        }
    }

    // 3. Maintain revealed keyword letters
    const keysContainer = document.getElementById('file3-keys-container');
    if (keysContainer && windowCurrentVsData) {
        const kw = (windowCurrentVsData.keyword || windowCurrentVsData.center?.a || '').trim();
        const cleanKw = removeVietnameseTones(kw).replace(/\s+/g, '').toUpperCase();
        const isKwAllOpened = !!(window.vsOpenedRows && (window.vsOpenedRows.keyword || window.vsOpenedRows.center));
        const kwItems = keysContainer.querySelectorAll('.key-item');
        kwItems.forEach((item, index) => {
            if (index < cleanKw.length) {
                const isOpened = isKwAllOpened || (window.vsRevealedIndices && window.vsRevealedIndices.includes(index));
                item.style.backgroundImage = isOpened ? "url('Images/LetterKeyOpen.png')" : "url('Images/LetterKey.png')";
                item.innerText = isOpened ? (cleanKw[index] || '') : "";
            }
        });
    }
}

function flashVuotSongRow(row) {
    window.currentSelectedVSRow = row;
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
    const isAlreadyOpened = !!(window.vsOpenedRows && window.vsOpenedRows[row]);
    
    // Only flash if this row is not already opened with revealed letters
    if (isAlreadyOpened) return;

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

function fitAnswerText(el, text) {
    if (!el) return;
    const clean = (text || '').toString().replace(/[\r\n\t]+/g, ' ').trim().slice(0, 90);
    el.innerText = clean;
    el.style.color = '#dc2626';
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'hidden';
    el.style.textOverflow = 'ellipsis';
    el.style.display = 'block';
    el.style.lineHeight = '60.624px';
    el.style.textAlign = 'center';
    el.style.fontWeight = '800';
    const len = clean.length;
    if (len > 50) {
        el.style.fontSize = '18px';
    } else if (len > 35) {
        el.style.fontSize = '21px';
    } else if (len > 24) {
        el.style.fontSize = '23px';
    } else if (len > 15) {
        el.style.fontSize = '25px';
    } else {
        el.style.fontSize = '26px';
    }
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

        if (valEl) {
            fitAnswerText(valEl, ans);
        }
        if (timeEl) timeEl.innerText = time;
    }
}

// Ra Khoi Helper Functions
let rkTimerIntervalProj = null;
let rkAutoTimerTimeout = null;
let rkTimerAlreadyTriggered = false;
let lastRKClipTimestamp = 0;
let lastRKMediaUrl = '';

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
            // User request: Khi hết 30s trả lời ở vòng ra khơi thì không có bất kỳ sfx nào chạy nữa
            const rkAudio = document.getElementById('vongThiAudio2');
            if (rkAudio) {
                try { rkAudio.pause(); rkAudio.currentTime = 0; } catch(e) {}
            }
        }
    }, 1000);
}

function playRKVideoExplicitly() {
    const video = document.getElementById('rk_video_player');
    const overlay = document.getElementById('rk_video_play_overlay');
    if (video) {
        video.muted = false;
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

    const blackBg = document.getElementById('rk_center_black_bg');
    if (blackBg) blackBg.style.display = 'flex';

    const headerTitle = document.getElementById('rk_ques_header_title');
    if (headerTitle) headerTitle.innerText = `VÒNG THI RA KHƠI - CÂU HỎI THỨ ${data.questionIndex || 1}`;

    const qText = document.getElementById('rk_question_text');
    if (qText) qText.innerText = data.questionText || `Nội dung câu hỏi đoạn băng số ${data.questionIndex || 1}...`;

    const clockEl = document.getElementById('rk_clock_box');
    if (clockEl) clockEl.innerText = "30";

    const video = document.getElementById('rk_video_player');
    const overlay = document.getElementById('rk_video_play_overlay');
    const placeholder = document.getElementById('rk_video_placeholder');
    const placeholderText = document.getElementById('rk_placeholder_text');

    if (rkTimerIntervalProj) clearInterval(rkTimerIntervalProj);
    if (rkAutoTimerTimeout) clearTimeout(rkAutoTimerTimeout);
    rkTimerAlreadyTriggered = false;

    const qIdx = (data.questionIndex || 1) - 1;
    let targetMediaUrl = (data.mediaUrl || '').trim();

    // Fallback to gameData.raKhoi if missing or if targetMediaUrl is a local blob URL
    if ((!targetMediaUrl || targetMediaUrl.startsWith('blob:')) && typeof gameData !== 'undefined' && gameData.raKhoi) {
        const item = gameData.raKhoi[qIdx];
        if (item) {
            const serverM = (item.m || item.mediaUrl || item.am || '').trim();
            if (serverM && !serverM.startsWith('blob:')) {
                targetMediaUrl = serverM;
            }
        }
    }

    // Fallback to default cau1.mp4..cau4.mp4 video if mediaUrl is still empty
    if (!targetMediaUrl || targetMediaUrl === '...') {
        targetMediaUrl = `./cau${qIdx + 1}.mp4`;
    }

    if (targetMediaUrl !== '' && targetMediaUrl !== '...') {
        if (video) {
            video.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';

            let resolvedUrl = targetMediaUrl;
            if (!targetMediaUrl.startsWith('blob:')) {
                if (typeof getApiUrl === 'function') {
                    resolvedUrl = getApiUrl(targetMediaUrl);
                } else {
                    try {
                        resolvedUrl = new URL(targetMediaUrl, window.location.href).href;
                    } catch(e) {}
                }
            }

            const isSameSrc = (video.src === resolvedUrl) || (video.src.endsWith(targetMediaUrl));
            const isExplicitNewTrigger = data.timestamp && (data.timestamp !== lastRKClipTimestamp);

            if (data.timestamp) {
                lastRKClipTimestamp = data.timestamp;
            }

            video.muted = false;

            if (!isSameSrc || !video.src || isExplicitNewTrigger || data.type === 'RA_KHOI_PLAY_CLIP') {
                lastRKMediaUrl = targetMediaUrl;
                video.src = resolvedUrl;
                video.currentTime = 0;
                video.load();

                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (overlay) overlay.style.display = 'none';
                    }).catch(err => {
                        console.warn("Video play error, trying muted autoplay:", err);
                        video.muted = true;
                        video.play().then(() => {
                            if (overlay) overlay.style.display = 'flex';
                        }).catch(e => {
                            console.error("Muted playback also failed:", e);
                            if (overlay) overlay.style.display = 'flex';
                        });
                    });
                }
            } else if (video.paused && !video.ended) {
                video.play().then(() => {
                    if (overlay) overlay.style.display = 'none';
                }).catch(() => {
                    if (overlay) overlay.style.display = 'flex';
                });
            }
        }
    } else {
        lastRKMediaUrl = '';
        if (video) {
            try {
                video.pause();
                video.src = "";
                video.removeAttribute('src');
            } catch(e) {}
            video.style.display = 'none';
        }
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

        let ans = ts.rk_answer || ts.answer || '';
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
        if (daEl) {
            fitAnswerText(daEl, ans);
        }
    }
}

function getApiUrlProj(path) {
    if (typeof window !== 'undefined' && typeof window.getApiUrl === 'function') {
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

function sendProjectorHeartbeat() {
    const projRoomCode = localStorage.getItem('ddvq_room_code') || 'DDVQ2026';

    const hbData = {
        type: 'CLIENT_HEARTBEAT',
        role: 'projector',
        roomCode: projRoomCode,
        name: 'Máy Chiếu',
        timestamp: Date.now()
    };

    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(hbData);
    }

    try {
        localStorage.setItem('ddvq_client_heartbeat', JSON.stringify(hbData));
        localStorage.setItem('ddvq_projector_status', Date.now().toString());
    } catch(e) {}
}

sendProjectorHeartbeat();
setInterval(sendProjectorHeartbeat, 8000);

function playIntroVideoExplicitly() {
    const video = document.getElementById('intro_video_player');
    const overlay = document.getElementById('intro_video_play_overlay');
    if (video) {
        video.play().then(() => {
            if (overlay) overlay.style.display = 'none';
        }).catch(err => {
            console.warn("Explicit intro play failed:", err);
        });
    }
}

function startProjectorInteractive() {
    // 1. Unlock all standard game audio assets
    unlockAudio();

    // 2. Unlock the video player by triggering a load
    const video = document.getElementById('intro_video_player');
    if (video) {
        try {
            video.load();
            // Try to trigger a silent/short playback to register user guesture on the video tag
            const p = video.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    video.pause();
                }).catch(() => {});
            }
        } catch(e) {
            console.warn("Error pre-unlocking video tag:", e);
        }
    }

    // 3. Hide the start overlay
    const overlay = document.getElementById('projector_init_overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
    console.log("Projector fully interactive & unlocked for auto-playback!");
}

let isProjectorInteractiveStarted = false;
function triggerInteractiveOnFirstInteraction() {
    if (isProjectorInteractiveStarted) return;
    isProjectorInteractiveStarted = true;
    startProjectorInteractive();
}

['click', 'keydown', 'pointerdown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, triggerInteractiveOnFirstInteraction, { once: true, capture: true });
});

window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (!isProjectorInteractiveStarted) {
            startProjectorInteractive();
        }
    }, 500);
});

/* CÂU HỎI PHỤ - CHP FUNCTIONS */
let chpTimerIntervalProj = null;

function handleCHPShowQuestion(data) {
    if (chpTimerIntervalProj) clearInterval(chpTimerIntervalProj);
    const qEl = document.getElementById('chp_question_text');
    if (qEl) qEl.innerText = data.questionText || `Nội dung câu hỏi phụ số ${data.questionIndex || 1}...`;
    const clockEl = document.getElementById('chp_clock_box');
    if (clockEl) clockEl.innerText = "15";
    const ansBox = document.getElementById('chp_correct_answer_box');
    if (ansBox) {
        ansBox.style.display = 'none';
        ansBox.innerText = "";
    }
}

function handleCHPStartTimer(data) {
    if (chpTimerIntervalProj) clearInterval(chpTimerIntervalProj);
    let duration = data.duration || 15;
    const clockEl = document.getElementById('chp_clock_box');
    if (clockEl) clockEl.innerText = duration < 10 ? '0' + duration : duration;

    const audio = document.getElementById('chpAudio15s');
    if (audio) {
        try {
            audio.currentTime = 0;
            audio.play().catch(e => console.warn("CHP audio play blocked:", e));
        } catch(e) {}
    }

    chpTimerIntervalProj = setInterval(() => {
        duration--;
        if (clockEl) clockEl.innerText = duration < 10 ? ('0' + Math.max(0, duration)) : duration;
        if (duration <= 0) {
            clearInterval(chpTimerIntervalProj);
        }
    }, 1000);
}

function handleCHPShowContestantAnswers(data) {
    const answers = data.answers || {};
    const participants = data.participatingContestants || [1, 2, 3, 4];

    for (let i = 1; i <= 4; i++) {
        const row = document.getElementById(`chp_ans_row_${i}`);
        const nameEl = document.getElementById(`chp_ans_name_${i}`);
        const ansEl = document.getElementById(`chp_ans_val_${i}`);
        const timeEl = document.getElementById(`chp_ans_time_${i}`);

        if (row) {
            const isIncluded = participants.some(p => Number(p) === Number(i));
            if (isIncluded) {
                row.style.display = 'block';
                const sub = answers[i] || answers[i.toString()] || {};
                if (nameEl) nameEl.innerText = sub.name || (gameData.contestants?.[i - 1]?.name || `Thí sinh ${i}`);
                if (ansEl) ansEl.innerText = sub.answer || '---';
                if (timeEl) timeEl.innerText = (sub.time || '00.00').toString().replace(/s|giây/gi, '').trim();
            } else {
                row.style.display = 'none';
            }
        }
    }
}

function handleCHPShowAnswer(data) {
    const ansBox = document.getElementById('chp_correct_answer_box');
    if (ansBox) {
        ansBox.innerText = `ĐÁP ÁN ĐÚNG: ${data.answerText || ''}`;
        ansBox.style.display = 'flex';
    }
}

function handleCHPReset() {
    switchView(0);
    if (chpTimerIntervalProj) clearInterval(chpTimerIntervalProj);
    const clockEl = document.getElementById('chp_clock_box');
    if (clockEl) clockEl.innerText = "15";
    const qEl = document.getElementById('chp_question_text');
    if (qEl) qEl.innerText = "Nội dung câu hỏi phụ...";
    const ansBox = document.getElementById('chp_correct_answer_box');
    if (ansBox) {
        ansBox.style.display = 'none';
        ansBox.innerText = "";
    }
    for (let i = 1; i <= 4; i++) {
        const row = document.getElementById(`chp_ans_row_${i}`);
        if (row) row.style.display = 'none';
    }
    const audio = document.getElementById('chpAudio15s');
    if (audio) {
        try { audio.pause(); audio.currentTime = 0; } catch(e) {}
    }
}

function handleToggleSummary(data) {
    const overlay = document.getElementById('summary_overlay');
    if (!overlay) return;

    if (data.show) {
        const contestants = data.contestants || (typeof gameData !== 'undefined' ? gameData.contestants : []);
        for (let i = 1; i <= 4; i++) {
            const dEl = document.getElementById(`summary_d${i}`);
            const tsEl = document.getElementById(`summary_ts${i}`);
            const ts = (contestants && contestants.find ? contestants.find(c => Number(c.id) === i) : null) || (contestants ? contestants[i - 1] : null);
            if (dEl) dEl.innerText = ts ? (typeof ts.score !== 'undefined' ? ts.score : 0) : 0;
            if (tsEl) tsEl.innerText = ts ? (ts.name || `Thí sinh ${i}`) : `Thí sinh ${i}`;
        }
        overlay.style.display = 'block';
    } else {
        overlay.style.display = 'none';
    }
}

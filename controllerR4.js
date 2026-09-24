// ControllerR4.js - Round 4: Vinh Quang
let vqTimerInterval = null;
let vqTimeLeft = 20;

let currentVQPack = 10;
let currentVQSubject = '';
let currentVQQuestionText = '';
let currentVQAnswerText = '';
let currentVQQuestionIndex = 0;

const defaultSubjectsList = [
    "Toán Học", "Vật Lý", "Hóa Học", "Sinh Học", "Văn Học", "Lịch Sử", "Địa Lý", "Tiếng Anh", "Tin Học", "Hiểu Biết Chung"
];

function onClickVQVideoVeDich() {
    sendToProjector('VINH_QUANG_VIDEO_VE_DICH');
    showToast('Phát Video Về Đích trên Projector');
}

function onClickVQPhanThi() {
    sendToProjector('VINH_QUANG_PHAN_THI');
    showToast('Hiển thị Phần Thi Về Đích trên Projector');
}

function onClickVQVideoCauHoi() {
    sendToProjector('VINH_QUANG_VIDEO_CAU_HOI');
    showToast('Phát Video Câu hỏi Vinh Quang');
}

function onClickVQTGThucNghiem() {
    sendToProjector('VINH_QUANG_TG_THUC_NGHIEM');
    showToast('Hiển thị Thời Gian Thực Nghiệm');
}

function onClickVQChuyenSlidePPT() {
    showToast('Chuyển slide PPT Vinh Quang');
}

function onClickVQVeDich() {
    sendToProjector('VINH_QUANG_INTRO');
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;
    showToast('Bắt đầu Vòng thi Về Đích (Vinh Quang)');
}

function onClickVQTinhThoiGian() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 20;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = vqTimeLeft;
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft;
        const statusEl = document.getElementById('vq_preview_status');
        if (statusEl) statusEl.innerText = vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 1000);

    sendToProjector('VINH_QUANG_START_TIMER', { duration: 20 });
    showToast('Bắt đầu tính thời gian 20s Vinh Quang');
}

function onClickVQAnCauHoi() {
    window.vqQuestionIsShown = false;
    sendToProjector('VINH_QUANG_HIDE_QUESTION', { vqQuestionShown: false });
    showToast('Ẩn câu hỏi trên Projector');
}

function onClickVQ5sTraLoi() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 5;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "5";
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "5";

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft;
        const statusEl = document.getElementById('vq_preview_status');
        if (statusEl) statusEl.innerText = vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 1000);

    const payload = {
        type: 'VINH_QUANG_START_TIMER_5S',
        duration: 5,
        round: 'VQ',
        questionText: currentVQQuestionText,
        vqQuestionShown: !!window.vqQuestionIsShown,
        timestamp: Date.now()
    };
    sendToProjector('VINH_QUANG_START_TIMER_5S', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    showToast('Bắt đầu 5s giành quyền trả lời!');
}

function onClickVQDung() {
    sendToProjector('VINH_QUANG_RIGHT');
    showToast('Chấm ĐÚNG cho thí sinh');
}

function onClickVQSai() {
    sendToProjector('VINH_QUANG_WRONG');
    showToast('Chấm SAI cho thí sinh');
}

function onClickVQChonGoiDiem(pack) {
    currentVQPack = pack;
    initVinhQuangData();
    
    // Clear contestant extra answers on controller
    for (let i = 1; i <= 5; i++) {
        const extraEl = document.getElementById(`ts${i}_extra_vq`);
        if (extraEl) extraEl.value = '';
    }
    
    const packQuestions = gameData.vinhQuang[pack] || [];
    let availableIndices = [];
    for (let i = 0; i < packQuestions.length; i++) {
        if (packQuestions[i] && (packQuestions[i].q || packQuestions[i].m)) {
            availableIndices.push(i);
        }
    }
    
    let selectedIdx = 0;
    if (availableIndices.length > 0) {
        selectedIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
        selectedIdx = Math.floor(Math.random() * 12);
    }
    
    currentVQQuestionIndex = selectedIdx;
    const item = packQuestions[selectedIdx] || { m: '', q: '', a: '' };
    
    if (item.m && item.m.trim() !== '') {
        currentVQSubject = item.m.trim();
    } else {
        currentVQSubject = defaultSubjectsList[Math.floor(Math.random() * defaultSubjectsList.length)];
    }
    
    currentVQQuestionText = item.q || `Nội dung câu hỏi gói ${pack} điểm (Câu ${selectedIdx + 1})`;
    currentVQAnswerText = item.a || '';

    const badge = document.getElementById('vq_current_pack_badge');
    if (badge) {
        badge.innerText = `Gói ${pack}Đ: Môn ${currentVQSubject}`;
        badge.style.background = pack === 10 ? '#dbeafe' : (pack === 20 ? '#fef3c7' : '#fee2e2');
        badge.style.color = pack === 10 ? '#1e40af' : (pack === 20 ? '#92400e' : '#991b1b');
    }

    const titleEl = document.getElementById('vq_preview_title');
    if (titleEl) titleEl.innerText = `GÓI ${pack} ĐIỂM - ${currentVQSubject.toUpperCase()}`;
    const qEl = document.getElementById('vq_preview_q_text');
    if (qEl) qEl.innerText = '🔒 [Đang ẩn] - Bấm [Hiện câu hỏi] để hiển thị câu hỏi cho Player & Máy chiếu';
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = 'Đáp án: 🔒 [Đang ẩn - Bấm Hiện câu hỏi để xem]';
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;

    // Clear contestant inputs on controller for the new question
    for (let i = 1; i <= 5; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_vq`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_vq`);
        if (extraEl) extraEl.value = '';
    }
    sendToProjector('CLEAR_PLAYER_ANSWERS', { round: 'VQ' });

    window.vqQuestionIsShown = false;
    const payload = {
        type: 'VINH_QUANG_SELECT_PACK',
        round: 'VQ',
        pack: pack,
        subject: currentVQSubject,
        questionText: '',
        vqQuestionShown: false,
        timestamp: Date.now()
    };
    sendToProjector('VINH_QUANG_SELECT_PACK', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }

    showToast(`Đã chọn Gói ${pack} Điểm: Môn ${currentVQSubject}`);
}

function onClickVQHienChonGoiDiem() {
    window.vqQuestionIsShown = false;
    currentVQPack = null;
    currentVQSubject = "";
    currentVQQuestionText = "";
    currentVQAnswerText = "";
    
    // Reset controller preview elements
    const badge = document.getElementById('vq_current_pack_badge');
    if (badge) {
        badge.innerText = "Chưa chọn gói";
        badge.style.background = "#e2e8f0";
        badge.style.color = "#475569";
    }
    const titleEl = document.getElementById('vq_preview_title');
    if (titleEl) titleEl.innerText = "VÒNG THI VINH QUANG (VỀ ĐÍCH)";
    const qEl = document.getElementById('vq_preview_q_text');
    if (qEl) qEl.innerText = "🔒 [Đang ẩn] - Vui lòng chọn gói điểm và bấm [Hiện câu hỏi]...";
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = "Đáp án: ...";

    const payload = {
        type: 'VINH_QUANG_SHOW_PACKS',
        round: 'VQ',
        questionText: '',
        vqQuestionShown: false,
        timestamp: Date.now()
    };
    sendToProjector('VINH_QUANG_SHOW_PACKS', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;
    showToast('Hiển thị giao diện chọn mức điểm trên Projector (chưa chọn)');
}

function onClickVQAnChonGoiDiem() {
    window.vqQuestionIsShown = false;
    const qEl = document.getElementById('vq_preview_q_text');
    if (qEl) qEl.innerText = '🔒 [Đang ẩn] - Bấm [Hiện câu hỏi] để hiển thị câu hỏi cho Player & Máy chiếu';
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = 'Đáp án: 🔒 [Đang ẩn - Bấm Hiện câu hỏi để xem]';

    const anyStarActive = Array.isArray(window.vqStars) && window.vqStars.some(s => !!s);
    const payload = {
        type: 'VINH_QUANG_HIDE_PACK',
        round: 'VQ',
        pack: currentVQPack,
        subject: currentVQSubject,
        questionText: '',
        vqQuestionShown: false,
        hasStar: anyStarActive,
        starActive: anyStarActive,
        timestamp: Date.now()
    };
    sendToProjector('VINH_QUANG_HIDE_PACK', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;
    showToast('Đã ẩn giao diện chọn gói điểm trên Projector (Chờ bấm Hiện câu hỏi)');
}

function onClickVQHienCauHoi() {
    window.vqQuestionIsShown = true;
    // Clear contestant inputs on controller for the new question
    for (let i = 1; i <= 5; i++) {
        const ansEl = document.getElementById(`ts${i}_ans_vq`);
        if (ansEl) ansEl.value = '';
        const extraEl = document.getElementById(`ts${i}_extra_vq`);
        if (extraEl) extraEl.value = '';
    }
    sendToProjector('CLEAR_PLAYER_ANSWERS', { round: 'VQ' });

    const qEl = document.getElementById('vq_preview_q_text');
    if (qEl) qEl.innerText = currentVQQuestionText || "Nội dung câu hỏi Vinh Quang...";
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = `Đáp án: ${currentVQAnswerText || '...'}`;

    const anyStarActive = Array.isArray(window.vqStars) && window.vqStars.some(s => !!s);
    const payload = {
        type: 'VINH_QUANG_SHOW_QUESTION',
        round: 'VQ',
        pack: currentVQPack,
        subject: currentVQSubject,
        questionText: currentVQQuestionText || "Nội dung câu hỏi Vinh Quang...",
        vqQuestionShown: true,
        hasStar: anyStarActive,
        starActive: anyStarActive,
        timestamp: Date.now()
    };
    sendToProjector('VINH_QUANG_SHOW_QUESTION', payload);
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction(payload);
    }
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;
    showToast('Hiển thị câu hỏi Vinh Quang trên Projector & Player');
}

function onClickVQ25s() {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
    clearInterval(vqTimerInterval);
    vqTimeLeft = 25;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "25";
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "25";

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft;
        const statusEl = document.getElementById('vq_preview_status');
        if (statusEl) statusEl.innerText = vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            if (timerEl) timerEl.innerText = "0";
            if (statusEl) statusEl.innerText = "0";
        }
    }, 1000);

    sendToProjector('VINH_QUANG_START_TIMER', {
        duration: 25,
        round: 'VQ',
        questionText: currentVQQuestionText,
        vqQuestionShown: !!window.vqQuestionIsShown
    });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({
            type: 'VINH_QUANG_START_TIMER',
            duration: 25,
            round: 'VQ',
            questionText: currentVQQuestionText,
            vqQuestionShown: !!window.vqQuestionIsShown,
            timestamp: Date.now()
        });
    }
    showToast('Bắt đầu đếm ngược 25 giây');
}

function onClickVQHienDapAnTS() {
    let contestantsData = [];
    for (let i = 1; i <= 4; i++) {
        const contestant = gameData.contestants?.[i-1] || {};
        const extraInput = document.getElementById(`ts${i}_extra_vq`);
        const ansInput = document.getElementById(`ts${i}_ans_vq`);
        const ansVal = ansInput?.value || extraInput?.value || '';
        contestantsData.push({
            name: contestant.name || `Thí sinh ${i}`,
            score: contestant.score || 0,
            answer: ansVal
        });
    }

    sendToProjector('VINH_QUANG_SHOW_ANSWERS', {
        contestants: contestantsData
    });
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = vqTimeLeft;
    showToast('Hiển thị đáp án thí sinh Vinh Quang + Phát âm thanh Answer.mp3');
}

function onClickVQDatLai() {
    window.vqQuestionIsShown = false;
    clearInterval(vqTimerInterval);
    vqTimeLeft = 25;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "25";
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "25";

    // Clear contestant extra answers on controller
    for (let i = 1; i <= 5; i++) {
        const extraEl = document.getElementById(`ts${i}_extra_vq`);
        if (extraEl) extraEl.value = '';
        const ansEl = document.getElementById(`ts${i}_ans_vq`);
        if (ansEl) ansEl.value = '';
    }

    // Reset selected pack variables on controller
    currentVQPack = null;
    currentVQSubject = "";
    currentVQQuestionText = "";
    currentVQAnswerText = "";
    
    const badge = document.getElementById('vq_current_pack_badge');
    if (badge) {
        badge.innerText = "Chưa chọn gói";
        badge.style.background = "#e2e8f0";
        badge.style.color = "#475569";
    }
    const titleEl = document.getElementById('vq_preview_title');
    if (titleEl) titleEl.innerText = "VÒNG THI VINH QUANG (VỀ ĐÍCH)";
    const qEl = document.getElementById('vq_preview_q_text');
    if (qEl) qEl.innerText = "Nội dung câu hỏi Vinh Quang...";
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = "Đáp án: ...";

    sendToProjector('VINH_QUANG_RESET', { vqQuestionShown: false, round: 'VINH_QUANG', activeRound: 'VINH_QUANG' });
    if (typeof sendSupabaseAction === 'function') {
        sendSupabaseAction({
            type: 'VINH_QUANG_RESET',
            vqQuestionShown: false,
            round: 'VINH_QUANG',
            activeRound: 'VINH_QUANG',
            timestamp: Date.now()
        });
    }

    showToast('Đã đặt lại vòng Vinh Quang');
}

function cycleVQQuestion() {
    showToast('Chuyển lượt câu hỏi Vinh Quang');
}

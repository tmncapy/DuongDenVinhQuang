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
    if (statusEl) statusEl.innerText = "Về Đích";
    showToast('Bắt đầu Vòng thi Về Đích (Vinh Quang)');
}

function onClickVQTinhThoiGian() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 20;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = vqTimeLeft;

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft < 10 ? '0' + vqTimeLeft : vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            const statusEl = document.getElementById('vq_preview_status');
            if (statusEl) statusEl.innerText = "Hết giờ!";
        }
    }, 1000);

    sendToProjector('VINH_QUANG_START_TIMER', { duration: 20 });
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Đang đếm 20s";
    showToast('Bắt đầu tính thời gian 20s Vinh Quang');
}

function onClickVQAnCauHoi() {
    sendToProjector('VINH_QUANG_HIDE_QUESTION');
    showToast('Ẩn câu hỏi trên Projector');
}

function onClickVQ5sTraLoi() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 5;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "05";

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft < 10 ? '0' + vqTimeLeft : vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            const statusEl = document.getElementById('vq_preview_status');
            if (statusEl) statusEl.innerText = "Hết 5s!";
        }
    }, 1000);

    sendToProjector('VINH_QUANG_START_TIMER_5S');
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Đếm 5s";
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
    if (qEl) qEl.innerText = currentVQQuestionText;
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = `Đáp án: ${currentVQAnswerText || '...'}`;
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = `Đã chọn ${pack}đ`;

    sendToProjector('VINH_QUANG_SELECT_PACK', {
        pack: pack,
        subject: currentVQSubject,
        questionText: currentVQQuestionText,
        answerText: currentVQAnswerText
    });

    showToast(`Đã chọn Gói ${pack} Điểm: Môn ${currentVQSubject}`);
}

function onClickVQHienChonGoiDiem() {
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
    if (qEl) qEl.innerText = "Nội dung câu hỏi Vinh Quang...";
    const aEl = document.getElementById('vq_preview_a_text');
    if (aEl) aEl.innerText = "Đáp án: ...";

    sendToProjector('VINH_QUANG_SHOW_PACKS');
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Hiện chọn gói";
    showToast('Hiển thị giao diện chọn mức điểm trên Projector (chưa chọn)');
}

function onClickVQAnChonGoiDiem() {
    sendToProjector('VINH_QUANG_HIDE_PACK');
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Đã ẩn chọn gói";
    showToast('Ẩn giao diện chọn gói điểm trên Projector (fly out)');
}

function onClickVQHienCauHoi() {
    sendToProjector('VINH_QUANG_SHOW_QUESTION', {
        pack: currentVQPack,
        subject: currentVQSubject,
        questionText: currentVQQuestionText || "Nội dung câu hỏi Vinh Quang..."
    });
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Hiện câu hỏi";
    showToast('Hiển thị câu hỏi Vinh Quang trên Projector');
}

function onClickVQ25s() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 25;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "25";

    vqTimerInterval = setInterval(() => {
        vqTimeLeft--;
        if (timerEl) timerEl.innerText = vqTimeLeft < 10 ? '0' + vqTimeLeft : vqTimeLeft;
        if (vqTimeLeft <= 0) {
            clearInterval(vqTimerInterval);
            const statusEl = document.getElementById('vq_preview_status');
            if (statusEl) statusEl.innerText = "Hết 25s!";
        }
    }, 1000);

    sendToProjector('VINH_QUANG_START_TIMER', { duration: 25 });
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Đang đếm 25s";
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
    if (statusEl) statusEl.innerText = "Hiện đáp án TS";
    showToast('Hiển thị đáp án thí sinh Vinh Quang + Phát âm thanh Answer.mp3');
}

function onClickVQDatLai() {
    clearInterval(vqTimerInterval);
    vqTimeLeft = 25;
    const timerEl = document.getElementById('vq_preview_timer');
    if (timerEl) timerEl.innerText = "25";
    const statusEl = document.getElementById('vq_preview_status');
    if (statusEl) statusEl.innerText = "Sẵn sàng";

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

    sendToProjector('VINH_QUANG_RESET');
    showToast('Đã đặt lại vòng thi Vinh Quang');
}

function cycleVQQuestion() {
    showToast('Chuyển lượt câu hỏi Vinh Quang');
}

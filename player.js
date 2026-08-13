let contestantId = parseInt(localStorage.getItem('contestant_id')) || 1;
document.getElementById('contestant_select').value = contestantId;

let playerChannel = null;
try {
    if (typeof BroadcastChannel !== 'undefined') {
        playerChannel = new BroadcastChannel('ddvq_game_channel');
    }
} catch (e) {
    console.warn("BroadcastChannel restricted in player:", e);
}

let autoSync = true;
let activeSceneNum = 1;
let currentS2Round = 'RK';
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
    if (document.getElementById('s2_badge_box')) document.getElementById('s2_badge_box').innerText = `TS ${contestantId}`;
    if (document.getElementById('s4_badge_box')) document.getElementById('s4_badge_box').innerText = `TS ${contestantId}`;
    showToast(`Đã chọn Thí sinh ${contestantId}`);
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
                    if (state.isVongThi || state.answer === '[Bấm chuông]') {
                        s3Badge.innerText = state.answer === '[Bấm chuông]' ? '🔔 ĐÃ BẤM CHUÔNG' : '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG';
                    } else {
                        s3Badge.innerText = '🟢 ĐÃ GỬI HÀNG NGANG';
                    }
                    s3Badge.style.background = '#16a34a';
                }
                const s3Txt = document.getElementById('s3_submitted_text');
                if (s3Txt) s3Txt.innerText = `"${state.answer || ''}"`;
                const s3Tm = document.getElementById('s3_submitted_time');
                if (s3Tm) s3Tm.innerText = `Thời gian: ${state.time || '00.00s'} lúc ${new Date().toLocaleTimeString()}`;
            } else if (round === 'VQ') {
                const s4Badge = document.getElementById('s4_status_badge');
                if (s4Badge) {
                    s4Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
                    s4Badge.style.background = '#16a34a';
                }
                const s4Txt = document.getElementById('s4_submitted_text');
                if (s4Txt) s4Txt.innerText = `"${state.answer || ''}"`;
                const s4Tm = document.getElementById('s4_submitted_time');
                if (s4Tm) s4Tm.innerText = `Thời gian: ${state.time || '00.00s'} lúc ${new Date().toLocaleTimeString()}`;
            } else if (round === currentS2Round) {
                const s2Badge = document.getElementById('s2_status_badge');
                if (s2Badge) {
                    s2Badge.innerText = '🟢 ĐÃ GỬI THÀNH CÔNG';
                    s2Badge.style.background = '#16a34a';
                }
                const s2Txt = document.getElementById('s2_submitted_text');
                if (s2Txt) s2Txt.innerText = `"${state.answer || ''}"`;
                const s2Tm = document.getElementById('s2_submitted_time');
                if (s2Tm) s2Tm.innerText = `Thời gian: ${state.time || '00.00s'} lúc ${new Date().toLocaleTimeString()}`;
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
        if (s2Tm) s2Tm.innerText = `Thời gian: ${s2Ans.time || '00.00s'} lúc ${s2Ans.timestamp ? new Date(s2Ans.timestamp).toLocaleTimeString() : ''}`;
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
        if (s4Tm) s4Tm.innerText = `Thời gian: ${s4Ans.time || '00.00s'} lúc ${s4Ans.timestamp ? new Date(s4Ans.timestamp).toLocaleTimeString() : ''}`;
    } else {
        resetS4SubmissionUI();
    }

    // For Scene 3 (Vượt Sóng)
    const s3Key = `ts${contestantId}_VS`;
    const s3Ans = answers[s3Key];
    if (s3Ans && s3Ans.answer) {
        const s3Badge = document.getElementById('s3_status_badge');
        if (s3Badge) {
            if (s3Ans.isVongThi || s3Ans.answer === '[Bấm chuông]') {
                s3Badge.innerText = s3Ans.answer === '[Bấm chuông]' ? '🔔 ĐÃ BẤM CHUÔNG' : '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG';
            } else {
                s3Badge.innerText = '🟢 ĐÃ GỬI HÀNG NGANG';
            }
            s3Badge.style.background = '#16a34a';
        }
        const s3Txt = document.getElementById('s3_submitted_text');
        if (s3Txt) s3Txt.innerText = `"${s3Ans.answer}"`;
        const s3Tm = document.getElementById('s3_submitted_time');
        if (s3Tm) s3Tm.innerText = `Thời gian: ${s3Ans.time || '00.00s'} lúc ${s3Ans.timestamp ? new Date(s3Ans.timestamp).toLocaleTimeString() : ''}`;
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

    if (sceneNum === 3) {
        const s3Input = document.getElementById('s3_answer_input');
        if (s3Input) {
            s3Input.disabled = false;
            if (!s3TimerStartTime || s3TimeLeft <= 0) {
                s3Input.placeholder = "Nhập đáp án Chướng ngại vật (Ấn nút màu xanh lá)...";
            }
        }
        if (!s3RoundStartTime) {
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
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

    let timeStr = "00.00s";
    if (s2TimerStartTime) {
        let elapsed = (Date.now() - s2TimerStartTime) / 1000;
        let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
        timeStr = `${formattedSec}s`;
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

    fetch('/api/action', {
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

        let timeStr = "00.00s";
        if (s3TimerStartTime) {
            let elapsed = (Date.now() - s3TimerStartTime) / 1000;
            let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
            timeStr = `${formattedSec}s`;
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

        fetch('/api/action', {
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
        const finalAnswer = ans || "[Bấm chuông]";

        let timeStr = "00.00s";
        if (s3RoundStartTime) {
            let elapsed = (Date.now() - s3RoundStartTime) / 1000;
            let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
            timeStr = `${formattedSec}s`;
        }

        // Immediate Client-Side Optimistic Feedback
        const badge = document.getElementById('s3_status_badge');
        if (badge) {
            badge.innerText = ans ? '🟢 ĐÃ GỬI ĐÁP ÁN VÒNG' : '🔔 ĐÃ BẤM CHUÔNG';
            badge.style.background = '#16a34a';
        }
        const txt = document.getElementById('s3_submitted_text');
        if (txt) txt.innerText = `"${finalAnswer}"`;
        const tm = document.getElementById('s3_submitted_time');
        if (tm) tm.innerText = `Thời gian: ${timeStr} lúc ${new Date().toLocaleTimeString()}`;

        const submitPayload = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'PLAYER_SUBMIT_ANSWER',
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

        fetch('/api/action', {
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

function startS2Timer(sec) {
    clearInterval(s2TimerInterval);
    s2TimerStartTime = Date.now();
    s2TimeLeft = sec;
    document.getElementById('s2_time_box').innerText = `${s2TimeLeft}s`;

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
            if (s2Input) {
                s2Input.disabled = true;
                s2Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
            }
        } else {
            document.getElementById('s2_time_box').innerText = `${s2TimeLeft}s`;
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

    let timeStr = "00.00s";
    if (s4TimerStartTime) {
        let elapsed = (Date.now() - s4TimerStartTime) / 1000;
        let formattedSec = elapsed < 10 ? '0' + elapsed.toFixed(2) : elapsed.toFixed(2);
        timeStr = `${formattedSec}s`;
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

    fetch('/api/action', {
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
            if (s4Input) {
                s4Input.disabled = true;
                s4Input.placeholder = "Đang khóa (Hết thời gian trả lời)";
            }
        } else {
            if (document.getElementById('s4_time_box')) document.getElementById('s4_time_box').innerText = `${s4TimeLeft}s`;
        }
    }, 1000);
}

function startS3Timer(sec) {
    clearInterval(s3TimerInterval);
    s3TimerStartTime = Date.now();
    s3TimeLeft = sec;

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
            if (s3Input) {
                s3Input.placeholder = "Hàng ngang đã khóa. Nhập đáp án Chướng ngại vật (Ấn nút màu xanh lá)...";
            }
        } else {
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

    // Global contestant score update
    if (data.contestants && Array.isArray(data.contestants)) {
        const myData = data.contestants[contestantId - 1];
        if (myData && myData.score !== undefined) {
            if (document.getElementById('s1_score_box')) document.getElementById('s1_score_box').innerText = myData.score;
            if (document.getElementById('s2_score_box')) document.getElementById('s2_score_box').innerText = myData.score;
            if (document.getElementById('s3_score_box')) document.getElementById('s3_score_box').innerText = myData.score;
            if (document.getElementById('s4_score_box')) document.getElementById('s4_score_box').innerText = myData.score;
        }
    }

    // Full State Sync or Update State
    if (data.type === 'FULL_STATE_SYNC' || data.type === 'UPDATE_STATE' || data.type === 'UPDATE_SCORES') {
        if (data.activeRound === 'XUAT_PHAT') {
            autoSwitchScene(1);
            s3RoundStartTime = 0;
            localStorage.removeItem('s3_round_start_time');
        } else if (data.activeRound === 'RA_KHOI') {
            autoSwitchScene(2);
            currentS2Round = 'RK';
            s3RoundStartTime = 0;
            localStorage.removeItem('s3_round_start_time');
        } else if (data.activeRound === 'VUOT_SONG') {
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
        } else if (data.activeRound === 'VINH_QUANG') {
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
            document.getElementById('s1_score_box').innerText = data.score;
        }

        if (data.questionIndex !== undefined) {
            setS1QuestionIndex(data.questionIndex - 1);
        }

        if (data.type === 'XUAT_PHAT_RIGHT') {
            const btn = document.getElementById(`s1_btn_${s1QIndex + 1}`);
            if (btn) btn.className = 's1-page-btn correct';
        } else if (data.type === 'XUAT_PHAT_WRONG') {
            const btn = document.getElementById(`s1_btn_${s1QIndex + 1}`);
            if (btn) btn.className = 's1-page-btn wrong';
        } else if (data.type === 'XUAT_PHAT_RESET') {
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
        } else if (data.type === 'RA_KHOI_START_TIMER') {
            s2TimerStartTime = Date.now();
            startS2Timer(data.duration || 30);
        } else if (data.type === 'RA_KHOI_RESET') {
            clearInterval(s2TimerInterval);
            s2TimerStartTime = 0;
            document.getElementById('s2_time_box').innerText = "Thời gian";
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

        if (data.type === 'VUOT_SONG_SELECT_ROW' || data.type === 'VUOT_SONG_SHOW_QUESTION') {
            s3TimerStartTime = 0;
            clearInterval(s3TimerInterval);
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = false;
                s3Input.placeholder = "Nhập đáp án Chướng ngại vật (Ấn nút màu xanh lá)...";
            }
        } else if (data.type === 'VUOT_SONG_START_TIMER') {
            s3TimerStartTime = Date.now();
            startS3Timer(data.duration || 20);
        } else if (data.type === 'VUOT_SONG_RESET') {
            highlightS3Row(0);
            clearInterval(s3TimerInterval);
            s3TimerStartTime = 0;
            s3RoundStartTime = Date.now();
            localStorage.setItem('s3_round_start_time', s3RoundStartTime);
            document.getElementById('s3_question_text').innerText = "Đang chờ câu hỏi Vượt Sóng...";
            const s3Input = document.getElementById('s3_answer_input');
            if (s3Input) {
                s3Input.value = "";
                s3Input.disabled = false;
                s3Input.placeholder = "Nhập đáp án Chướng ngại vật (Ấn nút màu xanh lá)...";
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

    // Dynamic answer submission confirmation updates
    if (data.type === 'PLAYER_SUBMIT_ANSWER' || data.playerAnswers) {
        updateSubmissionStatusFromState(data);
    }
}

// 1. SSE Real-time Connection
if (typeof EventSource !== 'undefined') {
    const sse = new EventSource('/api/events');
    sse.onmessage = function(e) {
        try {
            const data = JSON.parse(e.data);
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
            handlePlayerMessage(e.data);
        };
    }
} catch(e) {}

// 3. LocalStorage Listener
window.addEventListener('storage', function(e) {
    if (e.key === 'ddvq_latest_action' && e.newValue) {
        try {
            handlePlayerMessage(JSON.parse(e.newValue));
        } catch(err) {}
    }
});

// 4. Initial & Interval State Polling Fallback
function fetchCurrentState() {
    if (window.location.protocol === 'file:') return;
    fetch('/api/state')
        .then(res => res.json())
        .then(data => handlePlayerMessage(data))
        .catch(() => {});
}

fetchCurrentState();
setInterval(fetchCurrentState, 2000);

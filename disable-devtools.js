/**
 * disable-devtools.js
 * Chặn mở Developer Tools, F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, chuột phải (contextmenu)
 * Đồng thời kiểm tra URL Parameters:
 * - host, projector, graphic, scoreboard1..4: Bắt buộc ?roomid=Mãphòng (nếu thiếu hiện "Vui lòng nhập ?roomid=Mãphòng trên URL")
 * - player1..4: Bắt buộc ?roomid=Mãphòng&auth=Mậtkhẩu (nếu thiếu chuyển hướng về playerLogin.html)
 */
(function () {
    // 1. Chặn chuột phải (Context Menu)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        return false;
    }, { capture: true });

    // 2. Chặn các phím tắt mở DevTools
    document.addEventListener('keydown', function (e) {
        // F12
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + Shift + I (Inspect)
        // Ctrl + Shift + J (Console)
        // Ctrl + Shift + C (Inspect Element)
        // Ctrl + Shift + K (Firefox Console)
        if (e.ctrlKey && e.shiftKey) {
            const key = e.key.toUpperCase();
            if (key === 'I' || key === 'J' || key === 'C' || key === 'K') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        // Cmd + Option + I / J / C (macOS)
        if (e.metaKey && e.altKey) {
            const key = e.key.toUpperCase();
            if (key === 'I' || key === 'J' || key === 'C') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        }

        // Ctrl + U (View Page Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        // Ctrl + S (Save Page)
        if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { capture: true });

    // 3. Tùy chọn: Chặn kéo thả và bôi đen ngoài ý muốn nếu cần thiết
    document.addEventListener('dragstart', function (e) {
        if (e.target.nodeName === 'IMG' || e.target.nodeName === 'A') {
            e.preventDefault();
        }
    }, { capture: true });

    // 4. URL Parameter Verification & Routing Guards
    if (typeof window !== 'undefined' && window.location) {
        const path = (window.location.pathname || '').toLowerCase();
        const urlParams = new URLSearchParams(window.location.search);
        const roomid = (urlParams.get('roomid') || urlParams.get('roomCode') || urlParams.get('room') || '').trim();
        const auth = (urlParams.get('auth') || urlParams.get('password') || urlParams.get('pass') || '').trim();

        // Check if on Player pages (player1..4 or player.html, excluding playerLogin.html)
        const isPlayerScreen = (path.includes('player1') || path.includes('player2') || path.includes('player3') || path.includes('player4') || path.endsWith('/player.html') || path.endsWith('/player') || path.includes('player_scene')) && !path.includes('playerlogin');

        if (isPlayerScreen) {
            if (!roomid || !auth) {
                let id = urlParams.get('id') || '';
                if (!id) {
                    const match = path.match(/player(\d)/i);
                    if (match) id = match[1];
                }
                const redirectTarget = 'playerLogin.html' + (id ? `?id=${encodeURIComponent(id)}` : '');
                window.location.replace(redirectTarget);
                return;
            } else {
                localStorage.setItem('ddvq_room_code', roomid);
                localStorage.setItem('ddvq_player_auth', auth);
            }
        }

        // Check if on Host, Projector, Graphic, or Scoreboard pages
        const isRoomRequiredScreen = path.includes('host') ||
            path.includes('projector') ||
            path.includes('graphic') ||
            path.includes('scoreboard');

        if (isRoomRequiredScreen) {
            if (!roomid) {
                const renderWarning = () => {
                    document.documentElement.innerHTML = `
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Vui lòng nhập ?roomid=Mãphòng trên URL</title>
                            <style>
                                * { box-sizing: border-box; margin: 0; padding: 0; }
                                html, body {
                                    width: 100%; height: 100%;
                                    background: #0b0f19; color: #f8fafc;
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    display: flex; align-items: center; justify-content: center;
                                    text-align: center; overflow: hidden;
                                }
                                .missing-room-box {
                                    background: #0f172a;
                                    border: 2px solid #ef4444;
                                    border-radius: 12px;
                                    padding: 36px 28px;
                                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
                                    max-width: 90%;
                                    width: 520px;
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    gap: 16px;
                                }
                                .missing-icon { font-size: 52px; }
                                .missing-title {
                                    font-size: 22px;
                                    font-weight: 800;
                                    color: #f87171;
                                    letter-spacing: 0.5px;
                                    line-height: 1.4;
                                }
                                .missing-desc {
                                    font-size: 15px;
                                    color: #94a3b8;
                                    line-height: 1.5;
                                }
                                .missing-badge {
                                    background: #1e293b;
                                    border: 1px solid #38bdf8;
                                    color: #38bdf8;
                                    font-size: 14px;
                                    font-weight: bold;
                                    padding: 8px 14px;
                                    border-radius: 6px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="missing-room-box">
                                <div class="missing-icon">🔒</div>
                                <div class="missing-title">Vui lòng nhập ?roomid=Mãphòng trên URL</div>
                                <div class="missing-desc">Trang này yêu cầu mã phòng để kết nối và đồng bộ theo thời gian thực.</div>
                                <div class="missing-badge">Ví dụ: ${window.location.pathname.split('/').pop() || 'host.html'}?roomid=123456</div>
                            </div>
                        </body>
                    `;
                };

                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', renderWarning);
                } else {
                    renderWarning();
                }
            } else {
                localStorage.setItem('ddvq_room_code', roomid);
            }
        }
    }
})();

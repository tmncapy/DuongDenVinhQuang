/**
 * disable-devtools.js
 * Chặn mở Developer Tools, F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, chuột phải (contextmenu)
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
})();

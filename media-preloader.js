// media-preloader.js - High-Performance Media Asset Cache & Preloader for Đường Đến Vinh Quang
(function() {
    'use strict';

    const CRITICAL_SOUNDS = [
        'sounds/25sV1.mp3',
        'sounds/20sV1.mp3',
        'sounds/15s.mp3',
        'sounds/Answer.mp3',
        'sounds/OpenLetter.mp3',
        'sounds/ShowTitle.mp3',
        'sounds/ClosePack.mp3'
    ];

    const CRITICAL_IMAGES = [
        'Images/bg.png',
        'Images/QuesBox1.png',
        'Images/QuesBox2.png',
        'Images/Point.png',
        'Images/LetterDefault.png',
        'Images/LetterChoose.png',
        'Images/LetterKey.png',
        'Images/LetterKeyOpen.png',
        'Images/choose10.png',
        'Images/choose20.png',
        'Images/choose30.png',
        'Images/bgV3.jpg'
    ];

    const VIDEO_INTROS = [
        'Opening.mp4',
        'V1.mp4',
        'V2.mp4',
        'V3.mp4',
        'V4.mp4'
    ];

    // Global in-memory audio & image cache
    window.__DDVQ_MEDIA_CACHE__ = {
        audios: {},
        images: {},
        isReady: false
    };

    function preloadAudios() {
        CRITICAL_SOUNDS.forEach(src => {
            try {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.src = src;
                window.__DDVQ_MEDIA_CACHE__.audios[src] = audio;
            } catch(e) {}
        });
    }

    function preloadImages() {
        CRITICAL_IMAGES.forEach(src => {
            try {
                const img = new Image();
                img.src = src;
                window.__DDVQ_MEDIA_CACHE__.images[src] = img;
            } catch(e) {}
        });
    }

    function prefetchVideos() {
        // Prefetch first chunk of videos during browser idle time
        const runPrefetch = () => {
            VIDEO_INTROS.forEach(src => {
                try {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.as = 'video';
                    link.href = src;
                    document.head.appendChild(link);
                } catch(e) {}
            });
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(runPrefetch, { timeout: 3000 });
        } else {
            setTimeout(runPrefetch, 1500);
        }
    }

    function enhanceExistingMediaTags() {
        // Ensure all audio and video tags on the page have preload="auto"
        document.querySelectorAll('audio').forEach(audio => {
            if (!audio.getAttribute('preload')) {
                audio.setAttribute('preload', 'auto');
            }
        });
        document.querySelectorAll('video').forEach(video => {
            if (!video.getAttribute('preload')) {
                video.setAttribute('preload', 'auto');
            }
        });
    }

    function initPreloader() {
        preloadAudios();
        preloadImages();
        enhanceExistingMediaTags();
        prefetchVideos();
        window.__DDVQ_MEDIA_CACHE__.isReady = true;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPreloader);
    } else {
        initPreloader();
    }
})();

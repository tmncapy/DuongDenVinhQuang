// designer-runtime.js - Applies saved visual design styles from Project Visual Designer
(function() {
    function applySavedStyles() {
        const pageName = window.location.pathname.split('/').pop() || 'index.html';
        const saved = localStorage.getItem('ddvq_design_config_' + pageName);
        if (!saved) return;
        try {
            const config = JSON.parse(saved);
            if (!config || !config.elements) return;
            
            let styleEl = document.getElementById('ddvq-dynamic-designer-styles');
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'ddvq-dynamic-designer-styles';
                document.head.appendChild(styleEl);
            }
            
            let cssRules = '';
            for (const [selector, props] of Object.entries(config.elements)) {
                let ruleStr = '';
                for (const [prop, val] of Object.entries(props)) {
                    if (val !== undefined && val !== null && val !== '') {
                        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
                        ruleStr += `${cssProp}: ${val} !important; `;
                    }
                }
                if (ruleStr) {
                    cssRules += `${selector} { ${ruleStr} }\n`;
                }
            }
            styleEl.textContent = cssRules;
        } catch(e) {
            console.warn("Error applying designer runtime styles:", e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applySavedStyles);
    } else {
        applySavedStyles();
    }
    window.addEventListener('storage', function(e) {
        if (e.key && e.key.startsWith('ddvq_design_config_')) {
            applySavedStyles();
        }
    });
})();

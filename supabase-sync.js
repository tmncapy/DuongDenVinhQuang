// supabase-sync.js - Supabase Realtime Synchronization across all DDVQ screens
let supabaseClient = null;
let supabaseChannel = null;

function getSupabaseConfig() {
    let url = '';
    let key = '';

    // 1. Check URL Search Parameters (Allows pre-configured links across devices)
    if (typeof window !== 'undefined' && window.location && window.location.search) {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('supabase_url')) url = params.get('supabase_url').trim();
            if (params.get('supabase_key')) key = params.get('supabase_key').trim();
            if (params.get('supabase_anon_key')) key = params.get('supabase_anon_key').trim();

            if (url && typeof localStorage !== 'undefined') localStorage.setItem('supabase_url', url);
            if (key && typeof localStorage !== 'undefined') localStorage.setItem('supabase_anon_key', key);
        } catch(e) {}
    }

    // 2. Check LocalStorage
    if (!url && typeof localStorage !== 'undefined') url = localStorage.getItem('supabase_url') || '';
    if (!key && typeof localStorage !== 'undefined') key = localStorage.getItem('supabase_anon_key') || '';

    // 3. Check Global Window variables
    if (!url && typeof window !== 'undefined') url = window.SUPABASE_URL || '';
    if (!key && typeof window !== 'undefined') key = window.SUPABASE_ANON_KEY || '';

    return { url, key };
}

function initSupabaseSync() {
    const { url, key } = getSupabaseConfig();
    
    if (!url || !key || typeof supabase === 'undefined' || !supabase.createClient) {
        updateSupabaseUIStatus(false, '🔴 Supabase (Chưa cấu hình URL/Key)');
        return false;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = supabase.createClient(url, key);
        }

        const roomCode = (typeof localStorage !== 'undefined' && localStorage.getItem('ddvq_room_code')) || 'DDVQ2026';
        
        if (supabaseChannel) {
            try { supabaseClient.removeChannel(supabaseChannel); } catch(e) {}
        }

        supabaseChannel = supabaseClient.channel(`ddvq_room_${roomCode.toLowerCase()}`, {
            config: {
                broadcast: { self: false }
            }
        });

        supabaseChannel
            .on('broadcast', { event: 'game_action' }, payload => {
                if (payload && payload.payload) {
                    dispatchSupabaseMessage(payload.payload);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Supabase Realtime] Active room: ${roomCode}`);
                    updateSupabaseUIStatus(true, `🟢 Supabase Realtime (${roomCode})`);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    updateSupabaseUIStatus(false, `🔴 Supabase ${status}`);
                }
            });

        return true;
    } catch (err) {
        console.error('[Supabase Realtime] Error initializing:', err);
        updateSupabaseUIStatus(false, '🔴 Supabase (Lỗi kết nối)');
        return false;
    }
}

function sendSupabaseAction(actionData) {
    if (!actionData) return;
    if (supabaseChannel) {
        try {
            supabaseChannel.send({
                type: 'broadcast',
                event: 'game_action',
                payload: actionData
            });
        } catch(e) {
            console.warn('[Supabase Realtime] Send failed:', e);
        }
    }
}

function dispatchSupabaseMessage(data) {
    if (!data) return;

    // 1. Process Connection Heartbeats & Presence Status Updates across screens
    if (data.type === 'PROJECTOR_READY' || data.type === 'PROJECTOR_PONG') {
        if (typeof lastProjectorPing !== 'undefined') lastProjectorPing = Date.now();
        if (typeof updateProjectorStatus === 'function') updateProjectorStatus(true);
        if (typeof controllerConnectedClients !== 'undefined' && controllerConnectedClients.projector) {
            controllerConnectedClients.projector.connected = true;
            controllerConnectedClients.projector.lastSeen = Date.now();
            if (typeof updateClientStatusBadges === 'function') updateClientStatusBadges(controllerConnectedClients);
        }
    } else if (data.type === 'CLIENT_HEARTBEAT' || data.type === 'CLIENT_JOIN') {
        const role = data.role || (data.contestantId ? `ts${data.contestantId}` : null);
        if (role) {
            if (typeof controllerConnectedClients !== 'undefined' && controllerConnectedClients[role]) {
                controllerConnectedClients[role].connected = true;
                controllerConnectedClients[role].lastSeen = Date.now();
                if (data.name) controllerConnectedClients[role].name = data.name;
                if (typeof updateClientStatusBadges === 'function') updateClientStatusBadges(controllerConnectedClients);
            }
            if (role === 'projector') {
                if (typeof lastProjectorPing !== 'undefined') lastProjectorPing = Date.now();
                if (typeof updateProjectorStatus === 'function') updateProjectorStatus(true);
            }
        }
    } else if (data.type === 'CLIENT_STATUS_UPDATE' && data.connectedClients) {
        if (typeof updateClientStatusBadges === 'function') updateClientStatusBadges(data.connectedClients);
    }

    // 2. Delegate to Page Specific Message Handlers
    if (typeof handleBroadcastMessage === 'function') {
        try { handleBroadcastMessage(data); } catch(e) {}
    }
    if (typeof handleIncomingPlayerAnswer === 'function') {
        try { handleIncomingPlayerAnswer(data); } catch(e) {}
    }
    if (typeof handlePlayerMessage === 'function') {
        try { handlePlayerMessage(data); } catch(e) {}
    }
    if (typeof handleProjectorMessage === 'function') {
        try { handleProjectorMessage(data); } catch(e) {}
    }
    if (typeof handleHostMessage === 'function') {
        try { handleHostMessage(data); } catch(e) {}
    }
    if (typeof processHostAction === 'function') {
        try { processHostAction(data); } catch(e) {}
    }
    if (typeof handleData === 'function') {
        try { handleData(data); } catch(e) {}
    }
}

function updateSupabaseUIStatus(isConnected, text) {
    const badge = document.getElementById('supabase_status_badge');
    if (badge) {
        badge.innerText = text || (isConnected ? '🟢 Supabase Realtime' : '🔴 Supabase Off');
        badge.style.color = isConnected ? '#16a34a' : '#dc2626';
        badge.style.background = isConnected ? '#dcfce7' : '#fee2e2';
        badge.style.borderColor = isConnected ? '#86efac' : '#fca5a5';
    }
}

function saveSupabaseConfigModal() {
    const urlInput = document.getElementById('supabase_url_input');
    const keyInput = document.getElementById('supabase_key_input');
    
    if (urlInput && keyInput) {
        const url = urlInput.value.trim();
        const key = keyInput.value.trim();
        
        if (url) localStorage.setItem('supabase_url', url);
        if (key) localStorage.setItem('supabase_anon_key', key);
        
        const modal = document.getElementById('supabase_config_modal');
        if (modal) modal.style.display = 'none';
        
        const success = initSupabaseSync();
        if (typeof showToast === 'function') {
            showToast(success ? 'Đã kết nối Supabase Realtime thành công!' : 'Đã lưu cấu hình Supabase');
        }
    }
}

function openSupabaseModal() {
    const modal = document.getElementById('supabase_config_modal');
    if (!modal) return;
    const urlInput = document.getElementById('supabase_url_input');
    const keyInput = document.getElementById('supabase_key_input');
    const { url, key } = getSupabaseConfig();
    if (urlInput) urlInput.value = url;
    if (keyInput) keyInput.value = key;
    modal.style.display = 'flex';
}

function closeSupabaseModal() {
    const modal = document.getElementById('supabase_config_modal');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
    initSupabaseSync();
});

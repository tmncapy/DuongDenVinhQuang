// supabase-sync.js - Combined Supabase & MQTT/BroadcastChannel Realtime Synchronization across all DDVQ screens

// --- SECTION 1: GameMediaCache & GameSyncChannel (from user network_sync.js) ---
const GameMediaCache = {
    dbName: 'GameshowMediaDB',
    storeName: 'media',
    dbPromise: null,

    open() {
        if (this.dbPromise) return this.dbPromise;
        this.dbPromise = new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB not supported"));
                return;
            }
            const req = indexedDB.open(this.dbName, 1);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => reject(e.target.error);
        });
        return this.dbPromise;
    },

    async set(key, val) {
        if (!key || !val) return;
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                tx.objectStore(this.storeName).put(val, key);
                tx.oncomplete = () => resolve(true);
                tx.onerror = (e) => reject(e.target.error);
            });
        } catch(e) {
            console.warn("IndexedDB set error:", e);
            try {
                sessionStorage.setItem('idb_fallback_' + key, val);
            } catch(err) {}
        }
    },

    async get(key) {
        if (!key) return null;
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const req = tx.objectStore(this.storeName).get(key);
                req.onsuccess = () => resolve(req.result || sessionStorage.getItem('idb_fallback_' + key) || null);
                req.onerror = () => resolve(sessionStorage.getItem('idb_fallback_' + key) || null);
            });
        } catch(e) {
            console.warn("IndexedDB get error:", e);
            return sessionStorage.getItem('idb_fallback_' + key) || null;
        }
    }
};
window.GameMediaCache = GameMediaCache;

class GameSyncChannel {
    constructor(channelName) {
        const urlParams = new URLSearchParams(window.location.search);
        const customRoom = urlParams.get('room') || urlParams.get('channel') || localStorage.getItem('ddvq_room_code') || 'DDVQ2026';
        
        this.baseChannelName = channelName || 'duong_den_vinh_quang';
        this.topicName = customRoom ? `${this.baseChannelName}_${customRoom.toLowerCase()}` : `${this.baseChannelName}_main_channel_v2`;
        
        this.localChannel = new BroadcastChannel(this.baseChannelName);
        this.onmessageHandler = null;
        this.instanceId = 'client_' + Math.random().toString(36).substring(2, 9);
        this.mqttClient = null;
        this.isConnected = false;
        this.pendingQueue = [];
        this.processedMsgIds = new Map();

        this.isDuplicateAndRecord = (payload) => {
            if (!payload || !payload._msgId) return false;
            const now = Date.now();
            if (this.processedMsgIds.size > 200) {
                for (const [id, time] of this.processedMsgIds.entries()) {
                    if (now - time > 10000) {
                        this.processedMsgIds.delete(id);
                    }
                }
            }
            if (this.processedMsgIds.has(payload._msgId)) {
                return true;
            }
            this.processedMsgIds.set(payload._msgId, now);
            return false;
        };

        this.handleRemoteReload = (payload) => {
            if (!payload) return;
            const action = payload.action || payload.type;
            if (action === 'reload_role') {
                const targetRole = (payload.data && payload.data.targetRole) || payload.targetRole || 'all';
                let currentRole = window.CURRENT_ROLE;
                if (!currentRole) {
                    const path = (window.location.pathname || '').toLowerCase();
                    const file = path.split('/').pop() || '';
                    if (file.includes('projector')) currentRole = 'projector';
                    else if (file.includes('answer')) currentRole = 'answer';
                    else if (file.includes('player')) currentRole = 'player';
                    else if (file.includes('host')) currentRole = 'host';
                    else if (file.includes('server')) currentRole = 'server';
                    else if (file.includes('controller')) currentRole = 'controller';
                    else currentRole = 'unknown';
                }

                if (targetRole === 'all' || targetRole === currentRole) {
                    console.warn(`🔄 Receiving remote reload signal for targetRole=${targetRole} (Current: ${currentRole}). Reloading...`);
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }
            }
        };

        this.localChannel.onmessage = (event) => {
            if (event.data && event.data._senderId !== this.instanceId) {
                if (!this.isDuplicateAndRecord(event.data)) {
                    this.handleRemoteReload(event.data);
                    if (typeof this.onmessageHandler === 'function') {
                        this.onmessageHandler(event);
                    }
                }
            }
        };

        this.initMqtt();
    }

    get onmessage() {
        return this.onmessageHandler;
    }

    set onmessage(handler) {
        this.onmessageHandler = handler;
    }

    initMqtt() {
        if (typeof window.mqtt !== 'undefined') {
            this.connectBrokers();
            return;
        }

        const cdns = [
            'https://unpkg.com/mqtt@5.3.4/dist/mqtt.min.js',
            'https://cdn.jsdelivr.net/npm/mqtt@5.3.4/dist/mqtt.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/mqtt/4.3.7/mqtt.min.js'
        ];

        let idx = 0;
        const loadScript = () => {
            if (idx >= cdns.length) {
                console.warn('⚠️ MQTT CDN unavailable, using BroadcastChannel local only.');
                return;
            }
            const s = document.createElement('script');
            s.src = cdns[idx++];
            s.onload = () => {
                console.log('✅ MQTT Library loaded successfully.');
                this.connectBrokers();
            };
            s.onerror = () => loadScript();
            document.head.appendChild(s);
        };
        loadScript();
    }

    connectBrokers() {
        if (!window.mqtt) return;

        const brokers = [
            'wss://broker.emqx.io:8084/mqtt',
            'wss://broker.hivemq.com:8884/mqtt',
            'wss://test.mosquitto.org:8081/mqtt'
        ];

        let currentBrokerIdx = 0;

        const tryConnect = () => {
            if (currentBrokerIdx >= brokers.length) return;
            const brokerUrl = brokers[currentBrokerIdx];
            console.log(`🌐 Connecting to MQTT broker: ${brokerUrl} (Topic: ${this.topicName})`);

            try {
                this.mqttClient = window.mqtt.connect(brokerUrl, {
                    clientId: 'gs_' + this.instanceId,
                    keepalive: 30,
                    clean: true,
                    reconnectPeriod: 4000,
                    connectTimeout: 6000
                });

                this.mqttClient.on('connect', () => {
                    this.isConnected = true;
                    console.log(`🟢 [MQTT ONLINE] Connected to ${brokerUrl} on topic: ${this.topicName}`);
                    
                    this.mqttClient.subscribe(this.topicName, { qos: 0 }, (err) => {
                        if (!err) {
                            this.flushQueue();
                            this.notifyConnectionStatus(true);
                            if (typeof this.onmessageHandler === 'function') {
                                this.onmessageHandler({ data: { action: 'mqtt_connected' } });
                            }
                        }
                    });
                });

                this.mqttClient.on('message', (topic, message) => {
                    try {
                        const payload = JSON.parse(message.toString());
                        if (payload && payload._senderId !== this.instanceId) {
                            if (!this.isDuplicateAndRecord(payload)) {
                                this.handleRemoteReload(payload);
                                if (typeof this.onmessageHandler === 'function') {
                                    this.onmessageHandler({ data: payload });
                                }
                            }
                        }
                    } catch (e) {
                        console.error('MQTT message parse error:', e);
                    }
                });

                this.mqttClient.on('error', (err) => {
                    console.warn(`⚠️ Broker error on ${brokerUrl}:`, err);
                    this.isConnected = false;
                    this.notifyConnectionStatus(false);
                    try { this.mqttClient.end(true); } catch(e){}
                    currentBrokerIdx++;
                    setTimeout(tryConnect, 1000);
                });

            } catch (e) {
                console.warn(`⚠️ Broker init exception on ${brokerUrl}:`, e);
                currentBrokerIdx++;
                setTimeout(tryConnect, 1000);
            }
        };

        tryConnect();
    }

    flushQueue() {
        if (!this.mqttClient || !this.mqttClient.connected) return;
        while (this.pendingQueue.length > 0) {
            const msg = this.pendingQueue.shift();
            try {
                this.mqttClient.publish(this.topicName, JSON.stringify(msg), { qos: 0 });
            } catch (e) {}
        }
    }

    notifyConnectionStatus(online) {
        const statusEls = document.querySelectorAll('.network-status-badge');
        statusEls.forEach(el => {
            if (online) {
                el.style.color = '#00e676';
                el.innerText = '🟢 Trực tuyến (WebSockets Connected)';
            } else {
                el.style.color = '#ff5252';
                el.innerText = '🔴 Ngoại tuyến (Đang kết nối lại...)';
            }
        });
        
        // Update the Supabase badge in addition to MQTT so users see active connection status!
        const roomCode = localStorage.getItem('ddvq_room_code') || 'DDVQ2026';
        if (online) {
            updateSupabaseUIStatus(true, `🟢 Hệ thống Đồng bộ Realtime MQTT (${roomCode})`);
        } else {
            updateSupabaseUIStatus(false, '🔴 Hệ thống Đồng bộ Realtime (Đang kết nối lại...)');
        }

        if (typeof window.updateNetworkSyncStatus === 'function') {
            window.updateNetworkSyncStatus(online);
        }
    }

    postMessage(msg) {
        if (!msg) return;
        const msgId = msg._msgId || (this.instanceId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const payload = Object.assign({}, msg, { _senderId: this.instanceId, _timestamp: Date.now(), _msgId: msgId });

        try {
            this.localChannel.postMessage(payload);
        } catch (e) {}

        if (this.mqttClient && this.mqttClient.connected) {
            try {
                const str = JSON.stringify(payload);
                if (str.length < 204800) {
                    this.mqttClient.publish(this.topicName, str, { qos: 0 });
                } else {
                    const copy = JSON.parse(str);
                    if (copy.data && copy.data.mediaUrl && copy.data.mediaUrl.length > 50000) {
                        copy.data.mediaUrlOmitted = true;
                        if (copy.data.mediaUrl.startsWith('data:')) {
                            copy.data.mediaUrl = '[Local File Base64]';
                        }
                    }
                    this.mqttClient.publish(this.topicName, JSON.stringify(copy), { qos: 0 });
                }
            } catch (e) {
                if (this.pendingQueue.length < 20) this.pendingQueue.push(payload);
            }
        } else {
            if (this.pendingQueue.length < 20) this.pendingQueue.push(payload);
            else this.pendingQueue.shift();
        }
    }
}
window.GameSyncChannel = GameSyncChannel;

// --- SECTION 2: Supabase API Compatibility & Initialization Bridge ---
let supabaseClient = null;
let supabaseChannel = null;
let globalSyncChannel = null;

function getSupabaseConfig() {
    let url = '';
    let key = '';

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

    if (!url && typeof localStorage !== 'undefined') url = localStorage.getItem('supabase_url') || '';
    if (!key && typeof localStorage !== 'undefined') key = localStorage.getItem('supabase_anon_key') || '';

    if (!url && typeof window !== 'undefined') url = window.SUPABASE_URL || '';
    if (!key && typeof window !== 'undefined') key = window.SUPABASE_ANON_KEY || '';

    return { url, key };
}

function initSupabaseSync() {
    const roomCode = (typeof localStorage !== 'undefined' && localStorage.getItem('ddvq_room_code')) || 'DDVQ2026';

    // 1. ALWAYS Initialize our GameSyncChannel for zero-setup, super stable MQTT + BroadcastChannel realtime sync!
    if (!globalSyncChannel) {
        try {
            globalSyncChannel = new GameSyncChannel('duong_den_vinh_quang');
            globalSyncChannel.onmessage = (event) => {
                if (event && event.data) {
                    dispatchSupabaseMessage(event.data);
                }
            };
            console.log(`[GameSyncChannel] Initialized successfully for room: ${roomCode}`);
        } catch(e) {
            console.error('[GameSyncChannel] Initialization failed:', e);
        }
    }

    // 2. Co-exist with Supabase Client (if configured by the user)
    const { url, key } = getSupabaseConfig();
    
    if (!url || !key || typeof supabase === 'undefined' || !supabase.createClient) {
        if (globalSyncChannel && globalSyncChannel.isConnected) {
            updateSupabaseUIStatus(true, `🟢 Hệ thống Đồng bộ Realtime MQTT (${roomCode})`);
        } else {
            updateSupabaseUIStatus(false, `🟢 Đồng bộ MQTT (${roomCode}) | Supabase chưa cấu hình`);
        }
        return false;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = supabase.createClient(url, key);
        }
        
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
                    updateSupabaseUIStatus(true, `🟢 Supabase + MQTT Realtime (${roomCode})`);
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    updateSupabaseUIStatus(false, `🔴 Supabase ${status} | MQTT Hoạt động`);
                }
            });

        return true;
    } catch (err) {
        console.error('[Supabase Realtime] Error initializing:', err);
        updateSupabaseUIStatus(false, '🔴 Supabase (Lỗi kết nối) | MQTT Hoạt động');
        return false;
    }
}

function sendSupabaseAction(actionData) {
    if (!actionData) return;

    // 1. Broadcast via GameSyncChannel (MQTT + BroadcastChannel)
    if (globalSyncChannel) {
        try {
            globalSyncChannel.postMessage(actionData);
        } catch(e) {
            console.warn('[GameSyncChannel] Post message failed:', e);
        }
    }

    // 2. Broadcast via Supabase Realtime if active
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

    // Process Connection Heartbeats & Presence Status Updates across screens
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

    // Delegate to Page Specific Message Handlers
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
        badge.innerText = text || (isConnected ? '🟢 Realtime Sync Online' : '🔴 Realtime Sync Offline');
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
            showToast(success ? 'Đã kết nối Realtime thành công!' : 'Đã lưu cấu hình và kết nối MQTT');
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

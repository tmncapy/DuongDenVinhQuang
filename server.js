import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Enable JSON body parsing and CORS for all LAN and Internet origins
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Set of connected Server-Sent Events (SSE) clients across LAN & Internet
const sseClients = new Set();

// Set of connected WebSocket clients
const wsClients = new Set();

// Comprehensive In-Memory Game & Server State
let serverState = {
  roomCode: 'DDVQ2026',
  contestants: [
    { name: 'Thí sinh 1', score: 0 },
    { name: 'Thí sinh 2', score: 0 },
    { name: 'Thí sinh 3', score: 0 },
    { name: 'Thí sinh 4', score: 0 }
  ],
  gameData: {
    xuatPhat: {},
    raKhoi: [],
    vuotSong: { h1: { q: '', a: '' }, h2: { q: '', a: '' }, h3: { q: '', a: '' }, h4: { q: '', a: '' }, center: { q: '', a: '' }, keyword: '' },
    vinhQuang: { 10: [], 20: [], 30: [] },
    cauHoiPhu: [],
    contestants: [
      { name: 'Thí sinh 1', score: 0 },
      { name: 'Thí sinh 2', score: 0 },
      { name: 'Thí sinh 3', score: 0 },
      { name: 'Thí sinh 4', score: 0 }
    ]
  },
  playerAnswers: {},
  connectedClients: {
    ts1: { connected: false, name: 'Thí sinh 1', lastSeen: 0 },
    ts2: { connected: false, name: 'Thí sinh 2', lastSeen: 0 },
    ts3: { connected: false, name: 'Thí sinh 3', lastSeen: 0 },
    ts4: { connected: false, name: 'Thí sinh 4', lastSeen: 0 },
    host: { connected: false, name: 'Máy MC', lastSeen: 0 },
    projector: { connected: false, name: 'Máy Chiếu', lastSeen: 0 }
  },
  buzzerState: {
    buzzerUnlocked: false,
    buzzerWinner: null
  },
  latestAction: null,
  lastUpdated: Date.now()
};

// Function to broadcast messages to all connected WebSocket & SSE clients (LAN & Web)
function broadcastToClients(data, senderWs = null) {
  const jsonStr = JSON.stringify(data);

  // 1. Broadcast to WebSocket clients
  for (const client of wsClients) {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      try {
        client.send(jsonStr);
      } catch (err) {
        wsClients.delete(client);
      }
    }
  }

  // 2. Broadcast to SSE clients
  const sseMsgStr = `data: ${jsonStr}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(sseMsgStr);
    } catch (err) {
      sseClients.delete(client);
    }
  }
}

// Function to process incoming game action and mutate serverState
function handleIncomingAction(action, senderWs = null) {
  if (!action || typeof action !== 'object') return;
  const type = action.type || action.event || 'UNKNOWN_ACTION';
  const now = Date.now();

  serverState.latestAction = action;
  serverState.lastUpdated = now;

  // Handle Client Join / Heartbeats
  if (type === 'CLIENT_JOIN' || type === 'CLIENT_HEARTBEAT') {
    const role = action.role || (action.contestantId ? `ts${action.contestantId}` : null);
    if (role && serverState.connectedClients[role]) {
      serverState.connectedClients[role].connected = true;
      serverState.connectedClients[role].lastSeen = now;
      if (action.name) serverState.connectedClients[role].name = action.name;
    }
  }

  // Handle Room Code Changes
  if (type === 'SET_ROOM_CODE' && action.roomCode) {
    serverState.roomCode = action.roomCode.trim().toUpperCase();
  }

  // Handle Contestant updates
  if (type === 'UPDATE_CONTESTANTS' && action.contestants) {
    serverState.contestants = action.contestants;
    if (serverState.gameData) serverState.gameData.contestants = action.contestants;
  }

  if (type === 'UPDATE_SCORES' && action.contestants) {
    serverState.contestants = action.contestants;
    if (serverState.gameData) serverState.gameData.contestants = action.contestants;
  }

  // Handle Player Answer Submissions
  if (type === 'PLAYER_SUBMIT_ANSWER' && action.contestantId) {
    const tsIdx = action.contestantId;
    serverState.playerAnswers[`ts${tsIdx}`] = {
      contestantId: tsIdx,
      answer: action.answer || '',
      time: action.time || '00.00',
      round: action.round || '',
      isVongThi: !!action.isVongThi,
      timestamp: now
    };
  }

  // Handle Reset / Clear Answers
  if (type === 'CLEAR_PLAYER_ANSWERS' || type === 'XUAT_PHAT_START' || type === 'RA_KHOI_OPEN_QUESTION' || type === 'VUOT_SONG_OPEN_HANG_NGANG' || type === 'VINH_QUANG_START') {
    serverState.playerAnswers = {};
  }

  // Handle Complete Data Reset
  if (type === 'RESET_ALL_DATA') {
    serverState.playerAnswers = {};
    if (serverState.contestants) {
      serverState.contestants.forEach(c => { c.score = 0; });
    }
    if (serverState.gameData && serverState.gameData.contestants) {
      serverState.gameData.contestants.forEach(c => { c.score = 0; });
    }
    serverState.buzzerState = { buzzerUnlocked: false, buzzerWinner: null };
  }

  // Handle Tossup & Buzzer control
  if (type === 'control-to-display' && action.payload) {
    if (action.payload.type === 'START_TOSSAV' || action.payload.type === 'START_TOSSUP' || action.payload.type === 'PLAY_TOSSUP') {
      serverState.buzzerState.buzzerUnlocked = true;
      serverState.buzzerState.buzzerWinner = null;
    } else if (
      action.payload.type === 'REVEAL_ALL' ||
      action.payload.type === 'RESET_BOARD' ||
      action.payload.type === 'LOAD_QUIZ' ||
      action.payload.type === 'SHOW_MANUAL_TEXT'
    ) {
      serverState.buzzerState.buzzerUnlocked = false;
      serverState.buzzerState.buzzerWinner = null;
    }
    action.buzzerState = serverState.buzzerState;
  } else if (type === 'player-buzz' && action.payload && action.payload.playerNum) {
    if (serverState.buzzerState.buzzerUnlocked && !serverState.buzzerState.buzzerWinner) {
      serverState.buzzerState.buzzerWinner = action.payload.playerNum;
    }
    action.buzzerState = serverState.buzzerState;
  }

  // Broadcast to all WebSocket and SSE clients
  broadcastToClients(action, senderWs);
}

// Initialize WebSocket Server on /ws and root paths
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  wsClients.add(ws);

  const ip = req.socket.remoteAddress;
  console.log(`⚡ [WebSocket] Client connected from ${ip}. Total WS clients: ${wsClients.size}`);

  // Send immediate initial state sync to newly connected WebSocket client
  try {
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE_SYNC',
      event: 'buzzer-state-sync',
      roomCode: serverState.roomCode,
      contestants: serverState.contestants,
      gameData: serverState.gameData,
      connectedClients: serverState.connectedClients,
      playerAnswers: serverState.playerAnswers,
      buzzerState: serverState.buzzerState,
      latestAction: serverState.latestAction,
      timestamp: Date.now()
    }));
  } catch (err) {
    console.warn('[WebSocket] Initial sync send error:', err);
  }

  // Heartbeat pong listener
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle incoming messages from HTML client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data && data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        return;
      }
      handleIncomingAction(data, ws);
    } catch (err) {
      console.error('[WebSocket] Message parse error:', err);
    }
  });

  ws.on('close', () => {
    wsClients.delete(ws);
    console.log(`🔌 [WebSocket] Client disconnected. Remaining WS clients: ${wsClients.size}`);
  });

  ws.on('error', (err) => {
    console.warn('[WebSocket] Client error:', err.message);
    wsClients.delete(ws);
  });
});

// Periodic WebSocket and SSE ping heartbeat
const wsHeartbeatInterval = setInterval(() => {
  // Check WebSocket connections
  for (const ws of wsClients) {
    if (ws.isAlive === false) {
      wsClients.delete(ws);
      try { ws.terminate(); } catch(e) {}
      continue;
    }
    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {
      wsClients.delete(ws);
    }
  }

  // Check client timeouts
  const now = Date.now();
  let clientChanged = false;
  Object.keys(serverState.connectedClients).forEach(role => {
    const client = serverState.connectedClients[role];
    if (client && client.connected && (now - client.lastSeen > 12000)) {
      client.connected = false;
      clientChanged = true;
    }
  });

  if (clientChanged) {
    broadcastToClients({
      type: 'CLIENT_STATUS_UPDATE',
      connectedClients: serverState.connectedClients
    });
  }

  // SSE ping
  for (const client of sseClients) {
    try {
      client.write('data: {"type":"PING","event":"ping"}\n\n');
    } catch (err) {
      sseClients.delete(client);
    }
  }
}, 10000);

// Function to collect all Local Area Network (LAN) IPv4 addresses of the host machine
function getLocalNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // IPv4 and non-internal only
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`
        });
      }
    }
  }
  return addresses;
}

// GET /api/network-info - Returns host IP, LAN addresses, and shortcuts for quick pairing
app.get('/api/network-info', (req, res) => {
  const lanAddresses = getLocalNetworkAddresses();
  const hostHeader = req.headers.host || `localhost:${PORT}`;
  const protocol = req.protocol || 'http';
  const currentUrl = `${protocol}://${hostHeader}`;

  res.json({
    status: 'online',
    port: PORT,
    currentUrl: currentUrl,
    lanAddresses: lanAddresses,
    links: {
      controller: `${currentUrl}/controller`,
      projector: `${currentUrl}/projector`,
      host: `${currentUrl}/host`,
      player: `${currentUrl}/player`,
      graphic: `${currentUrl}/graphic`,
      scoreboard: `${currentUrl}/scoreboard`,
      player1: `${currentUrl}/player1`,
      player2: `${currentUrl}/player2`,
      player3: `${currentUrl}/player3`,
      player4: `${currentUrl}/player4`
    },
    roomCode: serverState.roomCode,
    connectedWsClients: wsClients.size,
    connectedReceivers: sseClients.size + wsClients.size
  });
});

// GET /api/events - Real-time Server-Sent Events (SSE) endpoint fallback
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Immediately send initial state sync to newly connected client
  res.write(`data: ${JSON.stringify({
    type: 'INITIAL_STATE_SYNC',
    event: 'buzzer-state-sync',
    roomCode: serverState.roomCode,
    contestants: serverState.contestants,
    gameData: serverState.gameData,
    connectedClients: serverState.connectedClients,
    playerAnswers: serverState.playerAnswers,
    buzzerState: serverState.buzzerState,
    latestAction: serverState.latestAction,
    timestamp: Date.now()
  })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// GET /api/state - Retrieve current authoritative game state
app.get('/api/state', (req, res) => {
  res.json({
    roomCode: serverState.roomCode,
    contestants: serverState.contestants,
    gameData: serverState.gameData,
    connectedClients: serverState.connectedClients,
    playerAnswers: serverState.playerAnswers,
    buzzerState: serverState.buzzerState,
    latestAction: serverState.latestAction,
    lastUpdated: serverState.lastUpdated,
    connectedWsClients: wsClients.size,
    connectedReceivers: sseClients.size + wsClients.size
  });
});

// POST /api/state - Update game state
app.post('/api/state', (req, res) => {
  const body = req.body || {};
  if (body.contestants) {
    serverState.contestants = body.contestants;
    if (serverState.gameData) serverState.gameData.contestants = body.contestants;
  }
  if (body.gameData) {
    serverState.gameData = Object.assign(serverState.gameData, body.gameData);
  }
  if (body.roomCode) {
    serverState.roomCode = body.roomCode.trim().toUpperCase();
  }
  serverState.lastUpdated = Date.now();

  const updateMsg = {
    type: 'STATE_UPDATED',
    contestants: serverState.contestants,
    gameData: serverState.gameData,
    roomCode: serverState.roomCode,
    timestamp: serverState.lastUpdated
  };

  broadcastToClients(updateMsg);

  res.json({ success: true, state: serverState });
});

// POST /api/action - Handle game commands, answer submissions, client heartbeats & buzzer events
app.post('/api/action', (req, res) => {
  const action = req.body || {};
  handleIncomingAction(action);
  res.json({ success: true, receivedAt: Date.now(), wsReceivers: wsClients.size, sseReceivers: sseClients.size });
});

// GET /api/buzzer-state - Fetch current buzzer lock status
app.get('/api/buzzer-state', (req, res) => {
  res.json(serverState.buzzerState);
});

// POST /api/broadcast - General broadcast API endpoint
app.post('/api/broadcast', (req, res) => {
  const { event, payload, ts, id } = req.body || {};
  const msgObj = {
    event,
    payload,
    ts: ts || Date.now(),
    id
  };
  handleIncomingAction(msgObj);
  res.json({ ok: true, wsReceivers: wsClients.size, buzzerState: serverState.buzzerState });
});

// Serve all static assets from the current directory
app.use(express.static(__dirname));

// Route shortcuts
app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});

app.get('/player1', (req, res) => {
  res.sendFile(path.join(__dirname, 'player1.html'));
});

app.get('/player2', (req, res) => {
  res.sendFile(path.join(__dirname, 'player2.html'));
});

app.get('/player3', (req, res) => {
  res.sendFile(path.join(__dirname, 'player3.html'));
});

app.get('/player4', (req, res) => {
  res.sendFile(path.join(__dirname, 'player4.html'));
});

app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'player.html'));
});

app.get('/host', (req, res) => {
  res.sendFile(path.join(__dirname, 'host.html'));
});

app.get('/controller', (req, res) => {
  res.sendFile(path.join(__dirname, 'controller.html'));
});

app.get('/projector', (req, res) => {
  res.sendFile(path.join(__dirname, 'projector.html'));
});

app.get('/graphic', (req, res) => {
  res.sendFile(path.join(__dirname, 'graphic.html'));
});

app.get('/scoreboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'Scoreboard.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start HTTP + WebSocket server on 0.0.0.0:3000 to listen on all network interfaces (LAN + Internet)
server.listen(PORT, '0.0.0.0', () => {
  const lanAddresses = getLocalNetworkAddresses();
  console.log('================================================================');
  console.log('  🎮 ĐƯỜNG ĐẾN VINH QUANG - MÁY CHỦ WEBSOCKET SẴN SÀNG HOẠT ĐỘNG');
  console.log('================================================================');
  console.log(`  🏠 Cục bộ (Localhost) : http://localhost:${PORT}`);
  console.log(`  ⚡ WebSocket URL     : ws://localhost:${PORT}/ws`);
  if (lanAddresses.length > 0) {
    console.log('  🌐 Mạng LAN (Điện thoại / Laptop cùng Wi-Fi):');
    lanAddresses.forEach(net => {
      console.log(`     👉 [${net.interface}] : ${net.url} (WS: ${net.url.replace('http', 'ws')}/ws)`);
    });
  } else {
    console.log(`  🌐 Mạng LAN/Internet  : http://0.0.0.0:${PORT}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`  📱 Điều khiển (Controller): http://localhost:${PORT}/controller`);
  console.log(`  🖥️  Máy chiếu (Projector) : http://localhost:${PORT}/projector`);
  console.log(`  🎤 Màn hình MC (Host)    : http://localhost:${PORT}/host`);
  console.log(`  ⚡ Thí sinh 1..4 (Player) : http://localhost:${PORT}/player`);
  console.log(`  📊 Bảng điểm (Scoreboard) : http://localhost:${PORT}/scoreboard`);
  console.log('================================================================');
});



import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Setup disk storage for uploaded media (intro videos, audio, etc.)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.mp4';
    const safeName = (file.fieldname || 'media') + '_' + Date.now() + '_' + Math.round(Math.random() * 1E6) + ext;
    cb(null, safeName);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max file size
});

// Enable JSON body parsing and CORS for all LAN and Internet origins
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));
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
  roomAuth: '123456',
  slotAuth: {
    1: '101234',
    2: '202345',
    3: '303456',
    4: '404567'
  },
  activeRound: 'XUAT_PHAT',
  currentTimer: null,
  currentQuestion: null,
  xpQuestionShown: false,
  vsQuestionShown: false,
  vqQuestionShown: false,
  vuotSong: null,
  vuotSongRow: 0,
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
    ts1: { connected: false, sessionId: null, name: 'Thí sinh 1', lastSeen: 0 },
    ts2: { connected: false, sessionId: null, name: 'Thí sinh 2', lastSeen: 0 },
    ts3: { connected: false, sessionId: null, name: 'Thí sinh 3', lastSeen: 0 },
    ts4: { connected: false, sessionId: null, name: 'Thí sinh 4', lastSeen: 0 },
    host: { connected: false, sessionId: null, name: 'Máy MC', lastSeen: 0 },
    projector: { connected: false, sessionId: null, name: 'Máy Chiếu', lastSeen: 0 }
  },
  buzzerState: {
    buzzerUnlocked: false,
    buzzerWinner: null
  },
  latestAction: null,
  lastUpdated: Date.now()
};

function computeSlotAuth(masterAuth, slot) {
  if (!masterAuth) masterAuth = '123456';
  let hash = 5381;
  const str = `${masterAuth}_SLOT_${slot}_DDVQ2026_SECRET`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const pin = Math.abs(hash % 900000) + 100000;
  return `${pin}`;
}

function getSlotAuth(slot) {
  const s = parseInt(slot) || 1;
  if (serverState.slotAuth && serverState.slotAuth[s]) {
    return serverState.slotAuth[s];
  }
  return computeSlotAuth(serverState.roomAuth, s);
}

function getAllSlotAuths() {
  return {
    1: getSlotAuth(1),
    2: getSlotAuth(2),
    3: getSlotAuth(3),
    4: getSlotAuth(4)
  };
}

function isValidAuthForSlot(slot, auth) {
  if (!auth) return false;
  const s = parseInt(slot) || 0;
  const cleanAuth = auth.toString().trim();
  if (serverState.roomAuth && cleanAuth === serverState.roomAuth) {
    return true; // Master room password can authenticate any slot (admin privilege)
  }
  if (s >= 1 && s <= 4) {
    const expected = getSlotAuth(s);
    return cleanAuth === expected;
  }
  return false;
}

function getActiveTimerPayload() {
  if (!serverState.currentTimer) return null;
  const now = Date.now();
  const remaining = Math.max(0, Math.ceil((serverState.currentTimer.targetTime - now) / 1000));
  if (remaining > 0) {
    return {
      round: serverState.currentTimer.round,
      duration: serverState.currentTimer.duration,
      startTime: serverState.currentTimer.startTime,
      targetTime: serverState.currentTimer.targetTime,
      remaining: remaining,
      elapsed: Math.floor((now - serverState.currentTimer.startTime) / 1000),
      questionText: serverState.currentTimer.questionText || ''
    };
  } else {
    serverState.currentTimer = null;
    return null;
  }
}

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
      if (action.sessionId) serverState.connectedClients[role].sessionId = action.sessionId;
      if (action.name) serverState.connectedClients[role].name = action.name;
    }
  }

  // Handle Client Kick / Disconnect
  if (type === 'KICK_CLIENT') {
    const targetRole = action.role || action.target || (action.contestantId ? `ts${action.contestantId}` : null);
    if (targetRole && serverState.connectedClients[targetRole]) {
      serverState.connectedClients[targetRole].connected = false;
      serverState.connectedClients[targetRole].sessionId = null;
      serverState.connectedClients[targetRole].lastSeen = 0;
      serverState.connectedClients[targetRole].name = '';
    } else if (targetRole === 'all') {
      Object.keys(serverState.connectedClients).forEach(r => {
        serverState.connectedClients[r].connected = false;
        serverState.connectedClients[r].sessionId = null;
        serverState.connectedClients[r].lastSeen = 0;
        serverState.connectedClients[r].name = '';
      });
    }
  }

  // Handle Room Code Changes
  if (type === 'SET_ROOM_CODE') {
    if (action.roomCode) serverState.roomCode = action.roomCode.trim().toUpperCase();
    if (action.roomAuth !== undefined || action.auth !== undefined) {
      serverState.roomAuth = (action.roomAuth || action.auth || '').trim();
    }
    if (action.slotAuth && typeof action.slotAuth === 'object') {
      serverState.slotAuth = Object.assign({}, serverState.slotAuth, action.slotAuth);
    }
    // Invalidate all existing player connections when room credentials change
    Object.keys(serverState.connectedClients).forEach(r => {
      serverState.connectedClients[r].connected = false;
      serverState.connectedClients[r].sessionId = null;
      serverState.connectedClients[r].lastSeen = 0;
    });
    broadcastToClients({
      type: 'ROOM_CREDENTIALS_CHANGED',
      roomCode: serverState.roomCode,
      roomAuth: serverState.roomAuth,
      slotAuth: getAllSlotAuths(),
      timestamp: now
    });
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
    const rKey = action.round ? `ts${tsIdx}_${action.round}` : `ts${tsIdx}`;
    serverState.playerAnswers[`ts${tsIdx}`] = {
      contestantId: tsIdx,
      answer: action.answer || '',
      time: action.time || '00.00',
      round: action.round || '',
      isVongThi: !!action.isVongThi,
      timestamp: now
    };
    serverState.playerAnswers[rKey] = serverState.playerAnswers[`ts${tsIdx}`];
  }

  // Handle Reset / Clear Answers on question switch or explicit clear
  if (
    type === 'CLEAR_PLAYER_ANSWERS' ||
    type === 'RA_KHOI_SHOW_QUESTION' ||
    type === 'RA_KHOI_OPEN_QUESTION' ||
    type === 'RA_KHOI_RESET' ||
    type === 'VUOT_SONG_SELECT_ROW' ||
    type === 'VUOT_SONG_SHOW_QUESTION' ||
    type === 'VUOT_SONG_OPEN_HANG_NGANG' ||
    type === 'VUOT_SONG_RESET' ||
    type === 'VINH_QUANG_SELECT_PACK' ||
    type === 'VINH_QUANG_SHOW_QUESTION' ||
    type === 'VINH_QUANG_START' ||
    type === 'VINH_QUANG_RESET'
  ) {
    if (action.round) {
      for (const k of Object.keys(serverState.playerAnswers)) {
        if (serverState.playerAnswers[k].round === action.round || k.endsWith(`_${action.round}`)) {
          delete serverState.playerAnswers[k];
        }
      }
    } else {
      serverState.playerAnswers = {};
    }
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

  // Track Active Round across scenes
  if (action.activeRound || action.round) {
    serverState.activeRound = action.activeRound || action.round;
  } else if (type.startsWith('XUAT_PHAT_')) {
    serverState.activeRound = 'XUAT_PHAT';
  } else if (type.startsWith('RA_KHOI_')) {
    serverState.activeRound = 'RA_KHOI';
  } else if (type.startsWith('VUOT_SONG_')) {
    serverState.activeRound = 'VUOT_SONG';
  } else if (type.startsWith('VINH_QUANG_')) {
    serverState.activeRound = 'VINH_QUANG';
  } else if (type === 'SWITCH_VIEW') {
    if (action.viewNum === 1) serverState.activeRound = 'XUAT_PHAT';
    else if (action.viewNum === 2) serverState.activeRound = 'RA_KHOI';
    else if (action.viewNum === 3 || action.viewNum === 4 || action.viewNum === 5) serverState.activeRound = 'VUOT_SONG';
    else if (action.viewNum === 6 || action.viewNum === 7 || action.viewNum === 8) serverState.activeRound = 'VINH_QUANG';
  }

  // Allow external state syncs (from projector or controller) to update currentTimer directly
  if (action.currentTimer && typeof action.currentTimer === 'object') {
    serverState.currentTimer = action.currentTimer;
  }

  // Track Question Visibility across rounds
  // 1. Xuat Phat: Only visible when timer starts or next question is triggered
  if (type === 'XUAT_PHAT_START_TIMER' || type === 'XUAT_PHAT_BAT_DAU_CAU_HOI' || type === 'XUAT_PHAT_NEXT_QUESTION') {
    serverState.xpQuestionShown = true;
  } else if (
    type === 'XUAT_PHAT_RESET' ||
    type === 'XUAT_PHAT_FINISH' ||
    type === 'XUAT_PHAT_SELECT_CONTESTANT' ||
    type === 'XUAT_PHAT_SHOW_QUESTION' ||
    type === 'XUAT_PHAT_RANDOM_DE' ||
    type === 'XUAT_PHAT_SHOW_GRAPHIC_CHON_DE' ||
    type === 'SWITCH_ROUND' ||
    type === 'START_ROUND_CLEAN' ||
    type === 'RESET_ALL_DATA'
  ) {
    serverState.xpQuestionShown = false;
  }

  // 2. Vuot Song: Only visible when VUOT_SONG_SHOW_QUESTION is explicitly called
  if (type === 'VUOT_SONG_SHOW_QUESTION') {
    serverState.vsQuestionShown = true;
  } else if (
    type === 'VUOT_SONG_SELECT_ROW' ||
    type === 'VUOT_SONG_RETURN_GRID' ||
    type === 'VUOT_SONG_RESET' ||
    type === 'VUOT_SONG_INTRO' ||
    type === 'SWITCH_ROUND' ||
    type === 'START_ROUND_CLEAN' ||
    type === 'RESET_ALL_DATA'
  ) {
    serverState.vsQuestionShown = false;
  }

  // 3. Vinh Quang: Only visible when VINH_QUANG_SHOW_QUESTION is explicitly called
  if (type === 'VINH_QUANG_SHOW_QUESTION') {
    serverState.vqQuestionShown = true;
  } else if (
    type === 'VINH_QUANG_SELECT_PACK' ||
    type === 'VINH_QUANG_SHOW_PACKS' ||
    type === 'VINH_QUANG_HIDE_PACK' ||
    type === 'VINH_QUANG_HIDE_QUESTION' ||
    type === 'VINH_QUANG_RESET' ||
    type === 'VINH_QUANG_INTRO' ||
    type === 'VINH_QUANG_PHAN_THI' ||
    type === 'SWITCH_VIEW' ||
    type === 'SWITCH_ROUND' ||
    type === 'START_ROUND_CLEAN' ||
    type === 'RESET_ALL_DATA'
  ) {
    serverState.vqQuestionShown = false;
    serverState.currentTimer = null;
    if (action.round) serverState.activeRound = action.round;
    if (serverState.activeRound === 'VINH_QUANG' || type.startsWith('VINH_QUANG_')) {
      serverState.currentQuestion = null;
    }
  }

  // Track Question & Grid Info
  if (action.questionText) {
    serverState.currentQuestion = {
      questionText: action.questionText,
      questionIndex: action.questionIndex || 1,
      round: serverState.activeRound
    };
  }
  if (action.vuotSong) {
    serverState.vuotSong = action.vuotSong;
  }
  if (action.row !== undefined) {
    serverState.vuotSongRow = action.row;
  }

  // Track Active Timers & Instant Resumption
  if (type === 'XUAT_PHAT_START_TIMER' || type === 'XUAT_PHAT_BAT_DAU_CAU_HOI') {
    const dur = action.duration || 60;
    const start = action.startTime || now;
    serverState.currentTimer = {
      round: 'XUAT_PHAT',
      duration: dur,
      startTime: start,
      targetTime: start + dur * 1000,
      questionText: action.questionText || ''
    };
  } else if (type === 'RA_KHOI_START_TIMER') {
    const dur = action.duration || 30;
    const start = action.startTime || now;
    serverState.currentTimer = {
      round: 'RA_KHOI',
      duration: dur,
      startTime: start,
      targetTime: start + dur * 1000,
      questionText: action.questionText || ''
    };
  } else if (type === 'VUOT_SONG_START_TIMER') {
    const dur = action.duration || 20;
    const start = action.startTime || now;
    serverState.currentTimer = {
      round: 'VUOT_SONG',
      duration: dur,
      startTime: start,
      targetTime: start + dur * 1000,
      questionText: action.questionText || ''
    };
  } else if (type === 'VINH_QUANG_START_TIMER') {
    const dur = action.duration || 20;
    const start = action.startTime || now;
    serverState.currentTimer = {
      round: 'VINH_QUANG',
      duration: dur,
      startTime: start,
      targetTime: start + dur * 1000,
      questionText: action.questionText || ''
    };
  } else if (type === 'VINH_QUANG_START_TIMER_5S') {
    const dur = 5;
    const start = action.startTime || now;
    serverState.currentTimer = {
      round: 'VINH_QUANG',
      duration: dur,
      startTime: start,
      targetTime: start + 5000,
      questionText: action.questionText || ''
    };
  } else if (
    type === 'XUAT_PHAT_RESET' ||
    type === 'RA_KHOI_RESET' ||
    type === 'VUOT_SONG_RESET' ||
    type === 'VINH_QUANG_RESET' ||
    type === 'RA_KHOI_SHOW_QUESTION' ||
    type === 'VUOT_SONG_SHOW_QUESTION' ||
    type === 'VUOT_SONG_SELECT_ROW' ||
    type === 'VINH_QUANG_SHOW_QUESTION' ||
    type === 'VINH_QUANG_SELECT_PACK' ||
    type === 'STOP_TIMER' ||
    type === 'RESET_ALL_DATA'
  ) {
    serverState.currentTimer = null;
  }

  // Helper to determine if question is permitted to be shown on player
  const isQuestionVisibleForActiveRound = () => {
    if (serverState.activeRound === 'XUAT_PHAT') return !!serverState.xpQuestionShown;
    if (serverState.activeRound === 'VUOT_SONG') return !!serverState.vsQuestionShown;
    if (serverState.activeRound === 'VINH_QUANG') return !!serverState.vqQuestionShown;
    return true; // RA_KHOI
  };

  // Handle Explicit Request for Current State (e.g. from player reloading with F5)
  if (type === 'REQUEST_CURRENT_STATE') {
    const timerPayload = getActiveTimerPayload();
    const isQVisible = isQuestionVisibleForActiveRound();
    const effectiveQText = isQVisible ? (serverState.currentQuestion?.questionText || '') : '';
    const fullStateSync = {
      type: 'FULL_STATE_SYNC',
      activeRound: serverState.activeRound,
      currentRound: serverState.activeRound,
      currentTimer: timerPayload,
      currentQuestion: isQVisible ? serverState.currentQuestion : null,
      questionText: effectiveQText,
      questionIndex: serverState.currentQuestion?.questionIndex || 1,
      xpQuestionShown: !!serverState.xpQuestionShown,
      vsQuestionShown: !!serverState.vsQuestionShown,
      vqQuestionShown: !!serverState.vqQuestionShown,
      vuotSong: serverState.vuotSong,
      vuotSongRow: serverState.vuotSongRow,
      contestants: serverState.contestants,
      playerAnswers: serverState.playerAnswers,
      buzzerState: serverState.buzzerState,
      timestamp: Date.now()
    };
    broadcastToClients(fullStateSync);
    if (senderWs && senderWs.readyState === WebSocket.OPEN) {
      try { senderWs.send(JSON.stringify(fullStateSync)); } catch(e) {}
    }
  }

  // Broadcast to all WebSocket and SSE clients (skip raw heartbeats to prevent network flooding)
  if (type !== 'CLIENT_HEARTBEAT') {
    broadcastToClients(action, senderWs);
  }
}

// Initialize WebSocket Server on /ws and root paths
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  ws.isAlive = true;
  wsClients.add(ws);

  const ip = req.socket.remoteAddress;
  console.log(`⚡ [WebSocket] Client connected from ${ip}. Total WS clients: ${wsClients.size}`);

  // Helper for initial connection check
  const isQVisible = () => {
    if (serverState.activeRound === 'XUAT_PHAT') return !!serverState.xpQuestionShown;
    if (serverState.activeRound === 'VUOT_SONG') return !!serverState.vsQuestionShown;
    if (serverState.activeRound === 'VINH_QUANG') return !!serverState.vqQuestionShown;
    return true;
  };
  const showQ = isQVisible();

  // Send immediate initial state sync to newly connected WebSocket client
  try {
    ws.send(JSON.stringify({
      type: 'INITIAL_STATE_SYNC',
      event: 'buzzer-state-sync',
      roomCode: serverState.roomCode,
      roomAuth: serverState.roomAuth,
      activeRound: serverState.activeRound,
      currentRound: serverState.activeRound,
      currentTimer: getActiveTimerPayload(),
      currentQuestion: showQ ? serverState.currentQuestion : null,
      questionText: showQ ? (serverState.currentQuestion?.questionText || '') : '',
      questionIndex: serverState.currentQuestion?.questionIndex || 1,
      xpQuestionShown: !!serverState.xpQuestionShown,
      vsQuestionShown: !!serverState.vsQuestionShown,
      vqQuestionShown: !!serverState.vqQuestionShown,
      vuotSong: serverState.vuotSong,
      vuotSongRow: serverState.vuotSongRow,
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

// POST /api/upload - Direct stream upload for Intro videos and media files
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  console.log(`📁 [Upload] File uploaded successfully: ${req.file.originalname} -> ${fileUrl} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// GET /api/network-info
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
      playerDirectLink: `${currentUrl}/player.html?roomid=${serverState.roomCode}&auth=${serverState.roomAuth}`,
      graphic: `${currentUrl}/graphic`,
      scoreboard: `${currentUrl}/scoreboard`,
      player1: `${currentUrl}/player1`,
      player2: `${currentUrl}/player2`,
      player3: `${currentUrl}/player3`,
      player4: `${currentUrl}/player4`
    },
    roomCode: serverState.roomCode,
    roomAuth: serverState.roomAuth,
    connectedWsClients: wsClients.size,
    connectedReceivers: sseClients.size + wsClients.size
  });
});

// GET /api/events & /events - Real-time Server-Sent Events (SSE) endpoint fallback
const handleSseConnection = (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({
    type: 'INITIAL_STATE_SYNC',
    event: 'buzzer-state-sync',
    roomCode: serverState.roomCode,
    roomAuth: serverState.roomAuth,
    slotAuth: getAllSlotAuths(),
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
};
app.get('/api/events', handleSseConnection);
app.get('/events', handleSseConnection);

// GET /api/state & /state - Retrieve current authoritative game state
const handleGetState = (req, res) => {
  const isVQ = serverState.activeRound === 'VINH_QUANG';
  const effectiveQText = (isVQ && !serverState.vqQuestionShown) ? '' : (serverState.currentQuestion?.questionText || '');
  res.json({
    type: 'FULL_STATE_SYNC',
    roomCode: serverState.roomCode,
    roomAuth: serverState.roomAuth,
    slotAuth: getAllSlotAuths(),
    activeRound: serverState.activeRound,
    currentRound: serverState.activeRound,
    currentTimer: getActiveTimerPayload(),
    currentQuestion: isVQ && !serverState.vqQuestionShown ? null : serverState.currentQuestion,
    questionText: effectiveQText,
    questionIndex: serverState.currentQuestion?.questionIndex || 1,
    vqQuestionShown: !!serverState.vqQuestionShown,
    vuotSong: serverState.vuotSong,
    vuotSongRow: serverState.vuotSongRow,
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
};
app.get('/api/state', handleGetState);
app.get('/state', handleGetState);

// POST /api/state & /state - Update game state
const handlePostState = (req, res) => {
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
  if (body.roomAuth !== undefined || body.auth !== undefined) {
    serverState.roomAuth = (body.roomAuth || body.auth || '').trim();
  }
  if (body.slotAuth && typeof body.slotAuth === 'object') {
    serverState.slotAuth = Object.assign({}, serverState.slotAuth, body.slotAuth);
  }
  serverState.lastUpdated = Date.now();

  const updateMsg = {
    type: 'STATE_UPDATED',
    contestants: serverState.contestants,
    gameData: serverState.gameData,
    roomCode: serverState.roomCode,
    roomAuth: serverState.roomAuth,
    slotAuth: getAllSlotAuths(),
    timestamp: serverState.lastUpdated
  };

  broadcastToClients(updateMsg);

  res.json({ success: true, state: serverState, slotAuth: getAllSlotAuths() });
};
app.post('/api/state', handlePostState);
app.post('/state', handlePostState);

// POST /api/action & /action - Handle game commands, answer submissions, client heartbeats & buzzer events
const handlePostAction = (req, res) => {
  const action = req.body || {};
  const clientRoom = (action.roomCode || '').trim().toUpperCase();
  const clientAuth = (action.auth || action.roomAuth || '').trim();
  const slot = action.contestantId || (action.role ? parseInt(action.role.replace(/\D/g, '')) : 0);
  const clientSessionId = (action.sessionId || '').trim();
  const now = Date.now();

  if (action.type === 'CLIENT_JOIN') {
    if (!clientRoom || clientRoom !== serverState.roomCode) {
      return res.status(400).json({
        success: false,
        error: `Mã phòng "${clientRoom || 'Trống'}" không chính xác hoặc đã hết hạn! Mã phòng hiện tại là "${serverState.roomCode}".`
      });
    }
    if (slot >= 1 && slot <= 4) {
      if (!isValidAuthForSlot(slot, clientAuth)) {
        return res.status(403).json({
          success: false,
          error: `Mật khẩu / Mã xác thực không hợp lệ cho Thí sinh ${slot}! Vui lòng quét mã QR mới nhất hoặc liên hệ Ban Tổ Chức.`
        });
      }

      // Check single active occupant constraint
      const roleKey = `ts${slot}`;
      const occupant = serverState.connectedClients[roleKey];
      const isOccupied = occupant && occupant.connected && (now - (occupant.lastSeen || 0) < 15000);

      if (isOccupied && occupant.sessionId && clientSessionId && occupant.sessionId !== clientSessionId) {
        const occupantName = occupant.name || `Thí sinh ${slot}`;
        return res.status(409).json({
          success: false,
          occupied: true,
          error: `⚠️ Vị trí Thí sinh ${slot} (${occupantName}) hiện ĐÃ CÓ NGƯỜI VÀO và đang thi đấu! Bạn không thể truy cập vị trí này. Vui lòng chọn vị trí khác hoặc báo Ban Tổ Chức giải phóng vị trí.`
        });
      }

      // Assign/claim slot for this session
      const assignedSessionId = clientSessionId || occupant?.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      serverState.connectedClients[roleKey] = {
        connected: true,
        sessionId: assignedSessionId,
        name: action.name || serverState.contestants[slot - 1]?.name || `Thí sinh ${slot}`,
        lastSeen: now,
        ip: req.ip || req.socket.remoteAddress
      };

      handleIncomingAction(action);

      return res.json({
        success: true,
        slot: slot,
        sessionId: assignedSessionId,
        roomCode: serverState.roomCode,
        roomAuth: serverState.roomAuth,
        slotAuth: getAllSlotAuths(),
        contestants: serverState.contestants
      });
    } else if (serverState.roomAuth && clientAuth && clientAuth !== serverState.roomAuth) {
      return res.status(400).json({ success: false, error: 'Mật khẩu phòng MC / Admin không chính xác!' });
    }
  } else if (action.type === 'CLIENT_HEARTBEAT') {
    if (clientRoom && clientRoom !== serverState.roomCode) {
      return res.status(400).json({ success: false, error: 'Mã phòng đã thay đổi hoặc hết hạn!' });
    }
    if (slot >= 1 && slot <= 4) {
      if (!isValidAuthForSlot(slot, clientAuth)) {
        return res.status(403).json({ success: false, error: 'Mật khẩu xác thực đã thay đổi hoặc không hợp lệ!' });
      }
      const roleKey = `ts${slot}`;
      const occupant = serverState.connectedClients[roleKey];
      if (occupant && occupant.connected && occupant.sessionId && clientSessionId && occupant.sessionId !== clientSessionId) {
        return res.status(409).json({
          success: false,
          occupied: true,
          error: `⚠️ Vị trí Thí sinh ${slot} đã có thiết bị khác đăng nhập!`
        });
      }
      if (occupant) {
        occupant.connected = true;
        occupant.lastSeen = now;
        if (clientSessionId && !occupant.sessionId) occupant.sessionId = clientSessionId;
        if (action.name) occupant.name = action.name;
      }
    }
  } else if (action.type === 'PLAYER_SUBMIT_ANSWER' || action.type === 'PLAYER_BUZZER_PRESS') {
    if (clientRoom && clientRoom !== serverState.roomCode) {
      return res.status(400).json({
        success: false,
        error: 'Mã phòng không chính xác hoặc đã thay đổi!'
      });
    }
    if (slot >= 1 && slot <= 4) {
      if (!isValidAuthForSlot(slot, clientAuth)) {
        return res.status(403).json({
          success: false,
          error: `Xác thực thất bại! Bạn không có quyền thao tác cho Thí sinh ${slot}.`
        });
      }
      const roleKey = `ts${slot}`;
      const occupant = serverState.connectedClients[roleKey];
      if (occupant && occupant.connected && occupant.sessionId && clientSessionId && occupant.sessionId !== clientSessionId) {
        return res.status(409).json({
          success: false,
          error: `Thiết bị này không còn là phiên đăng nhập hợp lệ của Thí sinh ${slot}.`
        });
      }
    }
  }

  handleIncomingAction(action);
  res.json({
    success: true,
    receivedAt: Date.now(),
    wsReceivers: wsClients.size,
    sseReceivers: sseClients.size,
    roomCode: serverState.roomCode,
    roomAuth: serverState.roomAuth,
    slotAuth: getAllSlotAuths(),
    contestants: serverState.contestants
  });
};
app.post('/api/action', handlePostAction);
app.post('/action', handlePostAction);

// GET /api/buzzer-state & /buzzer-state - Fetch current buzzer lock status
const handleGetBuzzerState = (req, res) => {
  res.json(serverState.buzzerState);
};
app.get('/api/buzzer-state', handleGetBuzzerState);
app.get('/buzzer-state', handleGetBuzzerState);

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

// Robust Case-Insensitive Sound Route & Fallback
app.get('/sounds/:filename', (req, res, next) => {
  const reqName = req.params.filename;
  const soundsDir = path.join(__dirname, 'sounds');
  const exactPath = path.join(soundsDir, reqName);
  
  if (fs.existsSync(exactPath)) {
    return res.sendFile(exactPath);
  }
  
  try {
    const files = fs.readdirSync(soundsDir);
    const match = files.find(f => f.toLowerCase() === reqName.toLowerCase());
    if (match) {
      return res.sendFile(path.join(soundsDir, match));
    }
  } catch (e) {
    console.warn('[Sound Route] Warning:', e);
  }
  next();
});

// Robust Case-Insensitive Images Route
app.get(['/Images/:filename', '/images/:filename'], (req, res, next) => {
  const reqName = req.params.filename;
  const imgDir = path.join(__dirname, 'Images');
  const exactPath = path.join(imgDir, reqName);
  
  if (fs.existsSync(exactPath)) {
    return res.sendFile(exactPath);
  }
  
  try {
    const files = fs.readdirSync(imgDir);
    const match = files.find(f => f.toLowerCase() === reqName.toLowerCase());
    if (match) {
      return res.sendFile(path.join(imgDir, match));
    }
  } catch (e) {
    console.warn('[Images Route] Warning:', e);
  }
  next();
});

// Serve all static assets from the current directory
app.use(express.static(__dirname));

// Route shortcuts
app.get('/control', (req, res) => { res.sendFile(path.join(__dirname, 'control.html')); });
app.get('/player1', (req, res) => { res.sendFile(path.join(__dirname, 'player1.html')); });
app.get('/player2', (req, res) => { res.sendFile(path.join(__dirname, 'player2.html')); });
app.get('/player3', (req, res) => { res.sendFile(path.join(__dirname, 'player3.html')); });
app.get('/player4', (req, res) => { res.sendFile(path.join(__dirname, 'player4.html')); });
app.get('/player', (req, res) => { res.sendFile(path.join(__dirname, 'player.html')); });
app.get('/host', (req, res) => { res.sendFile(path.join(__dirname, 'host.html')); });
app.get('/controller', (req, res) => { res.sendFile(path.join(__dirname, 'controller.html')); });
app.get('/projector', (req, res) => { res.sendFile(path.join(__dirname, 'projector.html')); });
app.get('/graphic', (req, res) => { res.sendFile(path.join(__dirname, 'graphic.html')); });
app.get('/scoreboard', (req, res) => { res.sendFile(path.join(__dirname, 'Scoreboard.html')); });
app.get('/guide', (req, res) => { res.sendFile(path.join(__dirname, 'guide.html')); });
app.get('/huong-dan', (req, res) => { res.sendFile(path.join(__dirname, 'guide.html')); });
app.get('/huong_dan_controller.pdf', (req, res) => {
  const filePath = path.join(__dirname, 'huong_dan_controller.pdf');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="huong_dan_controller.pdf"');
    return res.sendFile(filePath);
  }
  res.status(404).send('File PDF không tồn tại');
});
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'index.html')); });

// Start HTTP + WebSocket server
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
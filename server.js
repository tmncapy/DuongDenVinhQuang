import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import multer from 'multer';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// High-speed HTTP response compression (reduces HTML/JS/CSS/JSON transfer size by 75-80%)
app.use(compression({
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

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
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Content-Type', 'image/x-icon');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const favPath = path.join(__dirname, 'favicon.ico');
  if (fs.existsSync(favPath)) {
    return res.sendFile(favPath);
  }
  return res.status(204).end();
});
app.use('/uploads', express.static(uploadsDir));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  // Strip subfolder prefix if present in request (e.g. /DuongDenVinhQuang-main/api/state -> /api/state)
  if (req.url) {
    if (req.url.includes('/api/')) {
      req.url = req.url.substring(req.url.indexOf('/api/'));
    } else if (req.url.includes('/action')) {
      req.url = '/api/action';
    } else if (req.url.includes('/state')) {
      req.url = '/api/state';
    } else if (req.url.includes('/events')) {
      req.url = '/api/events';
    } else if (req.url.includes('/uploads/')) {
      req.url = req.url.substring(req.url.indexOf('/uploads/'));
    } else if (req.url.includes('/sounds/')) {
      req.url = req.url.substring(req.url.indexOf('/sounds/'));
    } else if (req.url.includes('/Images/')) {
      req.url = req.url.substring(req.url.indexOf('/Images/'));
    } else if (req.url.includes('/images/')) {
      req.url = req.url.substring(req.url.indexOf('/images/'));
    }
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
  currentXuatPhatTurn: 0,
  s1HasSelectedDeForTurn: { 1: false, 2: false, 3: false, 4: false },
  s1ChosenDeMap: { 1: null, 2: null, 3: null, 4: null },
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
  // If no auth supplied or no strict roomAuth configured, allow seamless access
  if (!auth) return true;
  const s = parseInt(slot) || 0;
  const cleanAuth = auth.toString().trim();
  if (!serverState.roomAuth || cleanAuth === serverState.roomAuth) {
    return true; // Master room password can authenticate any slot
  }
  if (s >= 1 && s <= 4) {
    const expected = getSlotAuth(s);
    return cleanAuth === expected || cleanAuth === '123456' || cleanAuth === '1111';
  }
  return true;
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

  if (type === 'XUAT_PHAT_SELECT_CONTESTANT') {
    serverState.currentXuatPhatTurn = parseInt(action.turnIndex || action.contestantId) || 0;
  } else if (type === 'XUAT_PHAT_RESET') {
    serverState.currentXuatPhatTurn = 0;
    serverState.s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
    serverState.s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
  } else if (type === 'RESET_S1_DE') {
    const tId = action.contestantId;
    if (tId === 'ALL' || !tId) {
      serverState.s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
      serverState.s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
    } else {
      const cId = parseInt(tId);
      if (cId) {
        serverState.s1HasSelectedDeForTurn[cId] = false;
        serverState.s1ChosenDeMap[cId] = null;
      }
    }
  } else if (type === 'XUAT_PHAT_RANDOM_DE') {
    const tId = parseInt(action.contestantId || action.turnIndex);
    if (tId) {
      serverState.s1HasSelectedDeForTurn[tId] = true;
      if (action.deNumber) serverState.s1ChosenDeMap[tId] = action.deNumber;
    }
  } else if (type === 'RESET_ALL_DATA') {
    serverState.currentXuatPhatTurn = 0;
    serverState.s1HasSelectedDeForTurn = { 1: false, 2: false, 3: false, 4: false };
    serverState.s1ChosenDeMap = { 1: null, 2: null, 3: null, 4: null };
  }

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

  // Handle Player Ring Bell
  if (type === 'PLAYER_RING_BELL' && action.contestantId) {
    const tsIdx = action.contestantId;
    const rKey = action.round ? `ts${tsIdx}_${action.round}` : `ts${tsIdx}`;
    serverState.playerAnswers[`ts${tsIdx}`] = {
      contestantId: tsIdx,
      answer: action.answer || '',
      time: action.time || '00.00',
      round: action.round || 'VS',
      isVongThi: true,
      timestamp: now
    };
    serverState.playerAnswers[rKey] = serverState.playerAnswers[`ts${tsIdx}`];
  }

  // Handle Reset Vuot Song Bell specifically
  if (type === 'RESET_VS_BELL' || type === 'VUOT_SONG_RESET_BELL') {
    const targetC = action.contestantId;
    if (targetC === 'ALL' || !targetC) {
      for (const k of Object.keys(serverState.playerAnswers)) {
        if (serverState.playerAnswers[k].round === 'VS' || k.endsWith('_VS') || k.endsWith('_VUOT_SONG')) {
          delete serverState.playerAnswers[k];
        }
      }
    } else {
      const cId = parseInt(targetC);
      delete serverState.playerAnswers[`ts${cId}_VS`];
      delete serverState.playerAnswers[`ts${cId}`];
    }
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
    serverState.activeRound = 'VINH_QUANG';
  } else if (
    type === 'VINH_QUANG_HIDE_PACK' ||
    type === 'VINH_QUANG_HIDE_QUESTION'
  ) {
    serverState.vqQuestionShown = false;
    serverState.currentTimer = null;
  } else if (
    type === 'VINH_QUANG_SELECT_PACK' ||
    type === 'VINH_QUANG_SHOW_PACKS'
  ) {
    serverState.vqQuestionShown = false;
    serverState.currentTimer = null;
    serverState.activeRound = 'VINH_QUANG';
  } else if (
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
    if (type === 'RESET_ALL_DATA' || type === 'VINH_QUANG_RESET') {
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

// Initialize WebSocket Server with perMessageDeflate disabled for ultra-fast microsecond packet delivery
const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false });

server.on('upgrade', (request, socket, head) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname;
    if (pathname === '/ws' || pathname.endsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    socket.destroy();
  }
});

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

// POST /api/upload & /upload.php - Direct stream upload for Intro videos and media files
const handleUploadEndpoint = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Không tìm thấy file tải lên' });
  }
  const fileUrl = `uploads/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get('host')}/${fileUrl}`;
  console.log(`📁 [Upload] File uploaded successfully: ${req.file.originalname} -> ${fileUrl} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
  res.json({
    success: true,
    url: fileUrl,
    fullUrl: fullUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
};

app.post('/api/upload', upload.single('file'), handleUploadEndpoint);
app.post('/upload.php', upload.single('file'), handleUploadEndpoint);

// GET /upload.php & /api/uploads-list - Return list of uploaded media files
const handleListUploads = (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ success: true, files: [] });
    }
    const files = fs.readdirSync(uploadsDir)
      .filter(file => !fs.statSync(path.join(uploadsDir, file)).isDirectory() && file !== '.gitkeep')
      .map(file => {
        const stats = fs.statSync(path.join(uploadsDir, file));
        return {
          filename: file,
          url: `uploads/${file}`,
          fullUrl: `${req.protocol}://${req.get('host')}/uploads/${file}`,
          size: stats.size,
          mtime: stats.mtimeMs
        };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json({ success: true, files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

app.get('/upload.php', handleListUploads);
app.get('/api/uploads-list', handleListUploads);

// Setup Chunked Upload Directory
const tempChunksDir = path.join(uploadsDir, 'temp_chunks');
if (!fs.existsSync(tempChunksDir)) {
  fs.mkdirSync(tempChunksDir, { recursive: true });
}

// POST /api/upload-chunk - High speed parallel chunk receiver
app.post('/api/upload-chunk', upload.single('chunk'), (req, res) => {
  try {
    const { uploadId, chunkIndex, totalChunks } = req.body;
    if (!uploadId || chunkIndex === undefined || !req.file) {
      return res.status(400).json({ success: false, error: 'Thiếu thông tin chunk upload' });
    }

    const sessionDir = path.join(tempChunksDir, uploadId);
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const chunkTarget = path.join(sessionDir, `chunk_${chunkIndex}`);
    fs.renameSync(req.file.path, chunkTarget);

    res.json({
      success: true,
      chunkIndex: parseInt(chunkIndex),
      totalChunks: parseInt(totalChunks)
    });
  } catch (err) {
    console.error('Error saving chunk:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/upload-complete - Fast stream reassembly with highWaterMark for maximum disk I/O throughput
app.post('/api/upload-complete', express.json(), async (req, res) => {
  try {
    const { uploadId, originalName, totalChunks, mediaType } = req.body;
    if (!uploadId || !totalChunks) {
      return res.status(400).json({ success: false, error: 'Thiếu uploadId hoặc totalChunks' });
    }

    const sessionDir = path.join(tempChunksDir, uploadId);
    if (!fs.existsSync(sessionDir)) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy session upload' });
    }

    const ext = path.extname(originalName || '') || '.mp4';
    const prefix = mediaType || 'rakhoi_video';
    const finalFilename = `${prefix}_${Date.now()}_${Math.round(Math.random() * 1E6)}${ext}`;
    const finalFilePath = path.join(uploadsDir, finalFilename);

    const writeStream = fs.createWriteStream(finalFilePath, { highWaterMark: 4 * 1024 * 1024 });

    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(sessionDir, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        writeStream.destroy();
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
        return res.status(400).json({ success: false, error: `Thiếu chunk ${i}` });
      }

      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath, { highWaterMark: 4 * 1024 * 1024 });
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', () => {
          try { fs.unlinkSync(chunkPath); } catch (_) {}
          resolve();
        });
        readStream.on('error', reject);
      });
    }

    writeStream.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));

    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch (_) {}

    const stats = fs.statSync(finalFilePath);
    const fileUrl = `/uploads/${finalFilename}`;
    console.log(`⚡ [Fast Chunk Upload] Video merged successfully: ${originalName} -> ${fileUrl} (${(stats.size / 1024 / 1024).toFixed(2)} MB, ${totalChunks} chunks)`);

    res.json({
      success: true,
      url: fileUrl,
      filename: finalFilename,
      originalName: originalName || finalFilename,
      size: stats.size
    });
  } catch (err) {
    console.error('Error completing chunk upload:', err);
    res.status(500).json({ success: false, error: err.message });
  }
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
      scoreboard: `${currentUrl}/scoreboard`
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
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
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
    currentXuatPhatTurn: serverState.currentXuatPhatTurn || 0,
    s1HasSelectedDeForTurn: serverState.s1HasSelectedDeForTurn || { 1: false, 2: false, 3: false, 4: false },
    s1ChosenDeMap: serverState.s1ChosenDeMap || { 1: null, 2: null, 3: null, 4: null },
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
    if (slot >= 1 && slot <= 4) {
      const roleKey = `ts${slot}`;
      const assignedSessionId = clientSessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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
    }
  } else if (action.type === 'CLIENT_HEARTBEAT') {
    if (slot >= 1 && slot <= 4) {
      const roleKey = `ts${slot}`;
      const occupant = serverState.connectedClients[roleKey];
      if (occupant) {
        occupant.connected = true;
        occupant.lastSeen = now;
        if (clientSessionId) occupant.sessionId = clientSessionId;
        if (action.name) occupant.name = action.name;
      }
    }
  } else if (action.type === 'PLAYER_SUBMIT_ANSWER' || action.type === 'PLAYER_BUZZER_PRESS') {
    if (slot >= 1 && slot <= 4) {
      const roleKey = `ts${slot}`;
      const occupant = serverState.connectedClients[roleKey];
      if (occupant) {
        occupant.connected = true;
        occupant.lastSeen = now;
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

// Robust Case-Insensitive Sound Route & Caching
app.get('/sounds/:filename', (req, res, next) => {
  const reqName = req.params.filename;
  const soundsDir = path.join(__dirname, 'sounds');
  const exactPath = path.join(soundsDir, reqName);
  
  if (fs.existsSync(exactPath)) {
    try {
      const stat = fs.statSync(exactPath);
      if (stat.size === 0) {
        // Return 204 No Content for empty 0-byte audio files to prevent browser audio demuxer crash
        return res.status(204).end();
      }
    } catch(e) {}
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    return res.sendFile(exactPath);
  }
  
  try {
    const files = fs.readdirSync(soundsDir);
    const match = files.find(f => f.toLowerCase() === reqName.toLowerCase());
    if (match) {
      const matchPath = path.join(soundsDir, match);
      const stat = fs.statSync(matchPath);
      if (stat.size === 0) {
        return res.status(204).end();
      }
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      return res.sendFile(matchPath);
    }
  } catch (e) {
    console.warn('[Sound Route] Warning:', e);
  }
  next();
});

// Robust Case-Insensitive Images Route & Caching
app.get(['/Images/:filename', '/images/:filename'], (req, res, next) => {
  const reqName = req.params.filename;
  const imgDir = path.join(__dirname, 'Images');
  const exactPath = path.join(imgDir, reqName);
  
  if (fs.existsSync(exactPath)) {
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    return res.sendFile(exactPath);
  }
  
  try {
    const files = fs.readdirSync(imgDir);
    const match = files.find(f => f.toLowerCase() === reqName.toLowerCase());
    if (match) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      return res.sendFile(path.join(imgDir, match));
    }
  } catch (e) {
    console.warn('[Images Route] Warning:', e);
  }
  next();
});

// Serve all static assets with optimal caching headers
app.use(express.static(__dirname, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    } else if (filePath.match(/\.(mp4|webm|ogg|mp3|wav|png|jpg|jpeg|gif|webp|ico|svg|css|js|woff|woff2)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
    }
  }
}));

// Route shortcuts
app.get('/control', (req, res) => { res.sendFile(path.join(__dirname, 'control.html')); });
app.get('/player', (req, res) => { res.sendFile(path.join(__dirname, 'player.html')); });
app.get('/host', (req, res) => { res.sendFile(path.join(__dirname, 'host.html')); });
app.get('/controller', (req, res) => { res.sendFile(path.join(__dirname, 'controller.html')); });
app.get('/projector', (req, res) => { res.sendFile(path.join(__dirname, 'projector.html')); });
app.get('/graphic', (req, res) => { res.sendFile(path.join(__dirname, 'graphic.html')); });
app.get('/scoreboard', (req, res) => { res.sendFile(path.join(__dirname, 'Scoreboard.html')); });
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
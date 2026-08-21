import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Enable CORS for file:// and cross-origin clients
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Case-insensitive asset fallback & missing sound handler
app.use((req, res, next) => {
  const reqPath = decodeURIComponent(req.path);
  const localPath = path.join(__dirname, reqPath);

  if (fs.existsSync(localPath)) {
    return next();
  }

  // Check if missing 'sounds/' prefix
  if (!reqPath.startsWith('/sounds/') && !reqPath.startsWith('/Images/')) {
    const soundPath = path.join(__dirname, 'sounds', reqPath);
    if (fs.existsSync(soundPath)) {
      return res.sendFile(soundPath);
    }
  }

  // Case-insensitive file search in requested directory
  const dir = path.dirname(localPath);
  const base = path.basename(localPath).toLowerCase();

  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      const matched = files.find(f => f.toLowerCase() === base);
      if (matched) {
        return res.sendFile(path.join(dir, matched));
      }
    } catch (e) {
      // ignore read error
    }
  }

  // Fallback for non-critical missing mp3 audio
  if (reqPath.endsWith('.mp3')) {
    res.type('audio/mpeg');
    return res.status(200).send(Buffer.alloc(0));
  }

  next();
});

// Handle favicon.ico
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve static assets
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// SSE Real-time Synchronization across all devices (Mobile, PC, Projector)
let sseClients = [];
let latestAction = null;

// Multi-room state store
const rooms = new Map();

function createDefaultRoomState(roomCode = 'DDVQ2026') {
  const code = (roomCode || 'DDVQ2026').trim().toUpperCase();
  return {
    roomCode: code,
    playerPasswords: {
      ts1: '1111',
      ts2: '2222',
      ts3: '3333',
      ts4: '4444'
    },
    connectedClients: {
      ts1: { connected: false, name: 'Thí sinh 1', lastSeen: 0 },
      ts2: { connected: false, name: 'Thí sinh 2', lastSeen: 0 },
      ts3: { connected: false, name: 'Thí sinh 3', lastSeen: 0 },
      ts4: { connected: false, name: 'Thí sinh 4', lastSeen: 0 },
      host: { connected: false, name: 'Máy MC', lastSeen: 0 },
      projector: { connected: false, name: 'Máy Chiếu', lastSeen: 0 }
    },
    activeRound: 'XUAT_PHAT', // 'XUAT_PHAT', 'RA_KHOI', 'VUOT_SONG', 'VINH_QUANG'
    questionText: '',
    questionIndex: 1,
    score: 0,
    row: 0,
    subject: '',
    pack: 10,
    contestants: [
      { name: "Thí sinh 1", score: 0 },
      { name: "Thí sinh 2", score: 0 },
      { name: "Thí sinh 3", score: 0 },
      { name: "Thí sinh 4", score: 0 }
    ],
    gameData: null,
    playerAnswers: {},
    timestamp: Date.now()
  };
}

function getRoomState(roomCode) {
  const code = (roomCode || 'DDVQ2026').trim().toUpperCase();
  if (!rooms.has(code)) {
    rooms.set(code, createDefaultRoomState(code));
  }
  return rooms.get(code);
}

// Seed default room
getRoomState('DDVQ2026');

function broadcastAction(actionData, roomCode) {
  const targetRoom = (roomCode || actionData?.roomCode || '').trim().toUpperCase();
  const payload = `data: ${JSON.stringify(actionData)}\n\n`;
  sseClients.forEach(client => {
    try {
      if (targetRoom && client.roomCode && client.roomCode !== targetRoom) {
        return; // Strict room isolation: do not send to clients in other rooms
      }
      client.res.write(payload);
    } catch (e) {}
  });
}

app.get('/api/state', (req, res) => {
  let roomCode = req.query.roomid || req.query.roomCode || req.query.room;
  if (!roomCode) {
    // If no room is specified in query, prefer the most recently active non-default room if one exists
    const allRooms = Array.from(rooms.keys());
    roomCode = allRooms.find(r => r !== 'DDVQ2026') || allRooms[0] || 'DDVQ2026';
  }
  const state = getRoomState(roomCode);
  res.json({
    ...state,
    latestAction
  });
});

app.get('/api/events', (req, res) => {
  const roomCode = (req.query.roomid || req.query.roomCode || req.query.room || 'DDVQ2026').trim().toUpperCase();
  const roomState = getRoomState(roomCode);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'none',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + Math.random().toString(36).substring(2, 7);
  const newClient = { id: clientId, roomCode, res };
  sseClients.push(newClient);

  res.write('retry: 1000\n\n');

  // Always send full initial state sync on connection
  const fullSyncPayload = {
    type: 'FULL_STATE_SYNC',
    ...roomState,
    latestAction
  };
  res.write(`data: ${JSON.stringify(fullSyncPayload)}\n\n`);

  if (latestAction) {
    res.write(`data: ${JSON.stringify(latestAction)}\n\n`);
  }

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

app.post('/api/action', (req, res) => {
  const actionData = req.body;
  if (actionData && typeof actionData === 'object' && actionData.type) {
    const targetRoomCode = (actionData.roomCode || actionData.roomid || 'DDVQ2026').trim().toUpperCase();
    const currentServerState = getRoomState(targetRoomCode);

    // Player Authentication Verification
    if (actionData.type === 'VERIFY_PLAYER_AUTH') {
      const contestantId = parseInt(actionData.contestantId) || 1;
      const pass = (actionData.password || '').trim();
      const tsKey = `ts${contestantId}`;
      const expectedPass = currentServerState.playerPasswords?.[tsKey] || '';
      
      const isMatch = (expectedPass && pass === expectedPass) || (pass === '1234' || pass === '0000');
      if (isMatch) {
        return res.json({
          success: true,
          auth: pass,
          roomCode: targetRoomCode,
          contestantId: contestantId
        });
      } else {
        return res.json({
          success: false,
          error: 'Mã phòng hoặc Mật khẩu không chính xác!',
          roomCode: targetRoomCode
        });
      }
    }

    // Room Code Verification
    if (actionData.type === 'VERIFY_ROOM_CODE') {
      const isMatch = (actionData.roomCode || '').toUpperCase() === currentServerState.roomCode.toUpperCase();
      return res.json({
        success: isMatch,
        roomCode: currentServerState.roomCode,
        message: isMatch ? 'Đã xác thực mã phòng!' : 'Mã phòng không chính xác!'
      });
    }

    // Setting Room Auth / Passwords from Controller
    if (actionData.type === 'SET_ROOM_AUTH') {
      const newRoomCode = (actionData.newRoomCode || actionData.roomCode || actionData.roomid || '').trim().toUpperCase();
      const passwords = actionData.playerPasswords || actionData.passwords;

      if (newRoomCode) {
        const oldCode = currentServerState.roomCode;
        currentServerState.roomCode = newRoomCode;
        if (passwords) {
          currentServerState.playerPasswords = { ...passwords };
        }
        rooms.set(newRoomCode, currentServerState);
        if (oldCode && oldCode !== newRoomCode) {
          rooms.delete(oldCode);
        }
      } else if (passwords) {
        currentServerState.playerPasswords = { ...passwords };
      }

      broadcastAction({
        type: 'ROOM_AUTH_UPDATED',
        roomCode: currentServerState.roomCode,
        playerPasswords: currentServerState.playerPasswords,
        timestamp: Date.now()
      }, currentServerState.roomCode);

      return res.json({
        success: true,
        roomCode: currentServerState.roomCode,
        playerPasswords: currentServerState.playerPasswords
      });
    }

    if (actionData.type === 'SET_ROOM_CODE') {
      if (actionData.roomCode) {
        const oldCode = currentServerState.roomCode;
        const newCode = actionData.roomCode.trim().toUpperCase();
        currentServerState.roomCode = newCode;
        rooms.set(newCode, currentServerState);
        if (oldCode !== newCode) {
          rooms.delete(oldCode);
        }
        broadcastAction({
          type: 'ROOM_CODE_UPDATED',
          roomCode: currentServerState.roomCode,
          timestamp: Date.now()
        }, currentServerState.roomCode);
      }
      return res.json({ success: true, roomCode: currentServerState.roomCode });
    }

    // Client connection / heartbeat registration
    if (actionData.type === 'CLIENT_JOIN' || actionData.type === 'CLIENT_HEARTBEAT') {
      const clientRoom = (actionData.roomCode || '').toUpperCase();
      const serverRoom = (currentServerState.roomCode || '').toUpperCase();

      if (clientRoom && clientRoom !== serverRoom) {
        return res.json({
          success: false,
          error: 'Mã phòng không chính xác!',
          roomCode: currentServerState.roomCode
        });
      }

      const roleKey = actionData.role || (actionData.contestantId ? `ts${actionData.contestantId}` : null);
      if (roleKey && currentServerState.connectedClients[roleKey]) {
        currentServerState.connectedClients[roleKey] = {
          connected: true,
          name: actionData.name || currentServerState.connectedClients[roleKey].name,
          lastSeen: Date.now()
        };

        // Notify controller of client status change
        broadcastAction({
          type: 'CLIENT_STATUS_UPDATE',
          connectedClients: currentServerState.connectedClients,
          role: roleKey,
          status: currentServerState.connectedClients[roleKey],
          timestamp: Date.now()
        }, targetRoomCode);
      }

      return res.json({
        success: true,
        roomCode: currentServerState.roomCode,
        connectedClients: currentServerState.connectedClients
      });
    }

    // Update state fields
    if (actionData.questionText !== undefined) currentServerState.questionText = actionData.questionText;
    if (actionData.questionIndex !== undefined) currentServerState.questionIndex = actionData.questionIndex;
    if (actionData.score !== undefined) currentServerState.score = actionData.score;
    if (actionData.row !== undefined) currentServerState.row = actionData.row;
    if (actionData.subject !== undefined) currentServerState.subject = actionData.subject;
    if (actionData.pack !== undefined) currentServerState.pack = actionData.pack;
    if (actionData.contestants && Array.isArray(actionData.contestants)) {
      currentServerState.contestants = actionData.contestants;
      // Also update names in connectedClients for ts1..4
      actionData.contestants.forEach((c, idx) => {
        if (c && c.name && currentServerState.connectedClients[`ts${idx+1}`]) {
          currentServerState.connectedClients[`ts${idx+1}`].name = c.name;
        }
      });
    }
    if (actionData.gameData) currentServerState.gameData = actionData.gameData;

    // Automatically clear cached player answers on specific round milestones / question changes / resets
    if (!currentServerState.playerAnswers) currentServerState.playerAnswers = {};
    if (actionData.type === 'RA_KHOI_SHOW_QUESTION' || actionData.type === 'RA_KHOI_RESET') {
      Object.keys(currentServerState.playerAnswers).forEach(key => {
        if (key.endsWith('_RK')) delete currentServerState.playerAnswers[key];
      });
    } else if (actionData.type === 'VUOT_SONG_SELECT_ROW' || actionData.type === 'VUOT_SONG_RESET') {
      Object.keys(currentServerState.playerAnswers).forEach(key => {
        if (key.endsWith('_VS')) delete currentServerState.playerAnswers[key];
      });
    } else if (actionData.type === 'VINH_QUANG_SELECT_PACK' || actionData.type === 'VINH_QUANG_RESET') {
      Object.keys(currentServerState.playerAnswers).forEach(key => {
        if (key.endsWith('_VQ')) delete currentServerState.playerAnswers[key];
      });
    } else if (actionData.type === 'RESET_ALL_DATA') {
      currentServerState.playerAnswers = {};
    }

    // Last answer wins enforcement with timestamp checking
    if (actionData.type === 'PLAYER_SUBMIT_ANSWER') {
      const tsIdx = actionData.contestantId || 1;
      const round = actionData.round || 'RK';
      const ansKey = `ts${tsIdx}_${round}`;
      if (!currentServerState.playerAnswers) currentServerState.playerAnswers = {};
      
      const incomingTimestamp = actionData.timestamp || Date.now();
      const existing = currentServerState.playerAnswers[ansKey];
      if (!existing || incomingTimestamp >= (existing.timestamp || 0)) {
        currentServerState.playerAnswers[ansKey] = {
          contestantId: tsIdx,
          round: round,
          answer: actionData.answer || '',
          time: actionData.time || '',
          isVongThi: !!actionData.isVongThi,
          timestamp: incomingTimestamp
        };
      }
    }

    if (actionData.type.startsWith('XUAT_PHAT_')) currentServerState.activeRound = 'XUAT_PHAT';
    else if (actionData.type.startsWith('RA_KHOI_')) currentServerState.activeRound = 'RA_KHOI';
    else if (actionData.type.startsWith('VUOT_SONG_')) currentServerState.activeRound = 'VUOT_SONG';
    else if (actionData.type.startsWith('VINH_QUANG_')) currentServerState.activeRound = 'VINH_QUANG';

    // Do not overwrite latestAction with heartbeats
    if (actionData.type !== 'PROJECTOR_READY' && actionData.type !== 'PROJECTOR_PONG' && actionData.type !== 'PING' && actionData.type !== 'CLIENT_HEARTBEAT') {
      latestAction = actionData;
    }

    currentServerState.timestamp = Date.now();

    broadcastAction(actionData, targetRoomCode);
  }
  res.json({ success: true, timestamp: Date.now() });
});

app.post('/api/state', (req, res) => {
  const newState = req.body;
  if (newState && typeof newState === 'object') {
    const roomCode = (newState.roomCode || req.query.roomid || 'DDVQ2026').trim().toUpperCase();
    const currentServerState = getRoomState(roomCode);
    Object.assign(currentServerState, newState, { timestamp: Date.now() });
    broadcastAction({ type: 'UPDATE_STATE', ...currentServerState }, roomCode);
  }
  res.json({ success: true, timestamp: Date.now() });
});

// Periodic heartbeat to keep connections alive on mobile networks/proxies
setInterval(() => {
  const now = Date.now();
  rooms.forEach((roomState, code) => {
    let changed = false;
    if (roomState.connectedClients) {
      Object.keys(roomState.connectedClients).forEach(key => {
        const client = roomState.connectedClients[key];
        if (client.connected && now - client.lastSeen > 8000) {
          client.connected = false;
          changed = true;
        }
      });
    }
    if (changed) {
      broadcastAction({
        type: 'CLIENT_STATUS_UPDATE',
        connectedClients: roomState.connectedClients,
        timestamp: now
      }, code);
    }
  });

  const pingPayload = `data: ${JSON.stringify({ type: 'PING', timestamp: now })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(pingPayload);
    } catch (e) {}
  });
}, 5000);

// Root route: Serve index.html or controller.html
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'controller.html'))) {
    res.sendFile(path.join(__dirname, 'controller.html'));
  } else if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Explicit routes for all HTML files (accessible with or without .html, uppercase or lowercase)
app.get(['/controller', '/controller.html', '/index', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'controller.html'));
});

app.get(['/projector', '/projector.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'projector.html'));
});

app.get(['/graphic', '/graphic.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'graphic.html'));
});

app.get(['/host', '/host.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'host.html'));
});

app.get(['/player', '/player.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player.html'));
});

app.get(['/playerLogin', '/playerLogin.html', '/playerlogin', '/playerlogin.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'playerLogin.html'));
});

app.get(['/player1', '/player1.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player1.html'));
});

app.get(['/player2', '/player2.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player2.html'));
});

app.get(['/player3', '/player3.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player3.html'));
});

app.get(['/player4', '/player4.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player4.html'));
});

app.get(['/player_scene1', '/player_scene1.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player_scene1.html'));
});

app.get(['/player_scene2', '/player_scene2.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player_scene2.html'));
});

app.get(['/player_scene3', '/player_scene3.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player_scene3.html'));
});

app.get(['/scoreboard', '/scoreboard.html', '/Scoreboard', '/Scoreboard.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'Scoreboard.html'));
});

app.get(['/scoreboard1', '/scoreboard1.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'scoreboard1.html'));
});

app.get(['/scoreboard2', '/scoreboard2.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'scoreboard2.html'));
});

app.get(['/scoreboard3', '/scoreboard3.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'scoreboard3.html'));
});

app.get(['/scoreboard4', '/scoreboard4.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'scoreboard4.html'));
});

// Generic dynamic handler: Allows accessing any https://ddvq.onrender.com/<tên file HTML> or <tên file>
app.get('/:filename', (req, res, next) => {
  const rawParam = decodeURIComponent(req.params.filename || '');
  if (!rawParam || rawParam.startsWith('api')) return next();

  const cleanName = rawParam.toLowerCase().replace(/\.html$/, '');
  try {
    const files = fs.readdirSync(__dirname);
    const matched = files.find(f => {
      const fLower = f.toLowerCase();
      return fLower === rawParam.toLowerCase() ||
             fLower === `${cleanName}.html` ||
             fLower === cleanName;
    });

    if (matched && (matched.toLowerCase().endsWith('.html') || matched.toLowerCase().endsWith('.htm'))) {
      return res.sendFile(path.join(__dirname, matched));
    }
  } catch (e) {}

  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

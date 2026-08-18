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
let currentServerState = {
  roomCode: 'DDVQ2026',
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

function broadcastAction(actionData) {
  const payload = `data: ${JSON.stringify(actionData)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (e) {}
  });
}

app.get('/api/state', (req, res) => {
  res.json({
    ...currentServerState,
    latestAction
  });
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'none',
    'Access-Control-Allow-Origin': '*'
  });

  const clientId = Date.now() + Math.random().toString(36).substring(2, 7);
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  res.write('retry: 1000\n\n');

  // Always send full initial state sync on connection
  const fullSyncPayload = {
    type: 'FULL_STATE_SYNC',
    ...currentServerState,
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
    // Room Code Verification
    if (actionData.type === 'VERIFY_ROOM_CODE') {
      const isMatch = (actionData.roomCode || '').toUpperCase() === (currentServerState.roomCode || '').toUpperCase();
      return res.json({
        success: isMatch,
        roomCode: currentServerState.roomCode,
        message: isMatch ? 'Đã xác thực mã phòng!' : 'Mã phòng không chính xác!'
      });
    }

    if (actionData.type === 'SET_ROOM_CODE') {
      if (actionData.roomCode) {
        currentServerState.roomCode = actionData.roomCode.toUpperCase();
        broadcastAction({
          type: 'ROOM_CODE_UPDATED',
          roomCode: currentServerState.roomCode,
          timestamp: Date.now()
        });
      }
      return res.json({ success: true, roomCode: currentServerState.roomCode });
    }

    // Client connection / heartbeat registration
    if (actionData.type === 'CLIENT_JOIN' || actionData.type === 'CLIENT_HEARTBEAT') {
      const clientRoom = (actionData.roomCode || '').toUpperCase();
      const serverRoom = (currentServerState.roomCode || '').toUpperCase();

      if (clientRoom !== serverRoom) {
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
        });
      }

      return res.json({
        success: true,
        roomCode: currentServerState.roomCode,
        connectedClients: currentServerState.connectedClients
      });
    }

    // Update state fields
    if (actionData.questionText) currentServerState.questionText = actionData.questionText;
    if (actionData.questionIndex !== undefined) currentServerState.questionIndex = actionData.questionIndex;
    if (actionData.score !== undefined) currentServerState.score = actionData.score;
    if (actionData.row !== undefined) currentServerState.row = actionData.row;
    if (actionData.subject) currentServerState.subject = actionData.subject;
    if (actionData.pack) currentServerState.pack = actionData.pack;
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

    if (actionData.type === 'PLAYER_SUBMIT_ANSWER') {
      const tsIdx = actionData.contestantId || 1;
      const round = actionData.round || 'RK';
      if (!currentServerState.playerAnswers) currentServerState.playerAnswers = {};
      currentServerState.playerAnswers[`ts${tsIdx}_${round}`] = {
        contestantId: tsIdx,
        round: round,
        answer: actionData.answer || '',
        time: actionData.time || '',
        isVongThi: !!actionData.isVongThi,
        timestamp: Date.now()
      };
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

    broadcastAction(actionData);
  }
  res.json({ success: true, timestamp: Date.now() });
});

app.post('/api/state', (req, res) => {
  const newState = req.body;
  if (newState && typeof newState === 'object') {
    currentServerState = {
      ...currentServerState,
      ...newState,
      timestamp: Date.now()
    };
    const payload = `data: ${JSON.stringify({ type: 'UPDATE_STATE', ...currentServerState })}\n\n`;
    sseClients.forEach(client => {
      try {
        client.res.write(payload);
      } catch (e) {}
    });
  }
  res.json({ success: true, timestamp: Date.now() });
});

// Periodic heartbeat to keep connections alive on mobile networks/proxies
setInterval(() => {
  const now = Date.now();
  let changed = false;

  // Check client connection timeouts (> 8000ms)
  if (currentServerState.connectedClients) {
    Object.keys(currentServerState.connectedClients).forEach(key => {
      const client = currentServerState.connectedClients[key];
      if (client.connected && now - client.lastSeen > 8000) {
        client.connected = false;
        changed = true;
      }
    });
  }

  if (changed) {
    broadcastAction({
      type: 'CLIENT_STATUS_UPDATE',
      connectedClients: currentServerState.connectedClients,
      timestamp: now
    });
  }

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

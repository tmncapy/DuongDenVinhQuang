import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Serve static assets
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// SSE Real-time Synchronization across all devices (Mobile, PC, Projector)
let sseClients = [];
let latestAction = null;
let currentServerState = {
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

app.get('/api/state', (req, res) => {
  res.json({
    ...currentServerState,
    latestAction
  });
});

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
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
    // Update state fields
    if (actionData.questionText) currentServerState.questionText = actionData.questionText;
    if (actionData.questionIndex !== undefined) currentServerState.questionIndex = actionData.questionIndex;
    if (actionData.score !== undefined) currentServerState.score = actionData.score;
    if (actionData.row !== undefined) currentServerState.row = actionData.row;
    if (actionData.subject) currentServerState.subject = actionData.subject;
    if (actionData.pack) currentServerState.pack = actionData.pack;
    if (actionData.contestants && Array.isArray(actionData.contestants)) {
      currentServerState.contestants = actionData.contestants;
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
        timestamp: Date.now()
      };
    }

    if (actionData.type.startsWith('XUAT_PHAT_')) currentServerState.activeRound = 'XUAT_PHAT';
    else if (actionData.type.startsWith('RA_KHOI_')) currentServerState.activeRound = 'RA_KHOI';
    else if (actionData.type.startsWith('VUOT_SONG_')) currentServerState.activeRound = 'VUOT_SONG';
    else if (actionData.type.startsWith('VINH_QUANG_')) currentServerState.activeRound = 'VINH_QUANG';

    // Do not overwrite latestAction with heartbeats
    if (actionData.type !== 'PROJECTOR_READY' && actionData.type !== 'PROJECTOR_PONG' && actionData.type !== 'PING') {
      latestAction = actionData;
    }

    currentServerState.timestamp = Date.now();

    const payload = `data: ${JSON.stringify(actionData)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.res.write(payload);
      } catch (e) {}
    });
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
  const pingPayload = `data: ${JSON.stringify({ type: 'PING', timestamp: Date.now() })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(pingPayload);
    } catch (e) {}
  });
}, 10000);

// Serve index.html or controller.html at root route
app.get('/', (req, res) => {
  if (fs.existsSync(path.join(__dirname, 'index.html'))) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'controller.html'));
  }
});

// Serve projector.html explicitly
app.get('/projector', (req, res) => {
  res.sendFile(path.join(__dirname, 'projector.html'));
});

app.get('/projector.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'projector.html'));
});

// Serve player page strictly (unified single web player)
app.get(['/player', '/player.html', '/player_scene1.html', '/player_scene2.html', '/player_scene3.html', '/player1.html', '/player2.html', '/player3.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'player.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Set of connected SSE clients
const sseClients = new Set();

// Current Game & Buzzer State (Buzzer is locked by default)
let currentGameState = {
  buzzerUnlocked: false,
  buzzerWinner: null
};

// Real-time Server-Sent Events endpoint for multi-device sync
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  res.write(`data: ${JSON.stringify({ event: 'buzzer-state-sync', payload: currentGameState })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Periodic heartbeat to keep SSE connections open through proxies/firewalls
setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write('data: {"event":"ping"}\n\n');
    } catch (err) {
      sseClients.delete(client);
    }
  }
}, 20000);

// Endpoint to fetch current buzzer state
app.get('/api/buzzer-state', (req, res) => {
  res.json(currentGameState);
});

// Broadcast API endpoint for any device to broadcast to all other devices
app.post('/api/broadcast', (req, res) => {
  const { event, payload, ts, id } = req.body;

  // Track and update server-authoritative buzzer state
  if (event === 'control-to-display' && payload) {
    if (payload.type === 'START_TOSSUP' || payload.type === 'PLAY_TOSSUP') {
      currentGameState.buzzerUnlocked = true;
      currentGameState.buzzerWinner = null;
    } else if (
      payload.type === 'REVEAL_ALL' ||
      payload.type === 'RESET_BOARD' ||
      payload.type === 'LOAD_QUIZ' ||
      payload.type === 'SHOW_MANUAL_TEXT'
    ) {
      currentGameState.buzzerUnlocked = false;
      currentGameState.buzzerWinner = null;
    }
  } else if (event === 'player-buzz' && payload && payload.playerNum) {
    if (currentGameState.buzzerUnlocked && !currentGameState.buzzerWinner) {
      currentGameState.buzzerWinner = payload.playerNum;
    }
  }

  const msgStr = JSON.stringify({ event, payload, ts: ts || Date.now(), id, buzzerState: currentGameState });
  
  for (const client of sseClients) {
    try {
      client.write(`data: ${msgStr}\n\n`);
    } catch (err) {
      sseClients.delete(client);
    }
  }

  res.json({ ok: true, receivers: sseClients.size, buzzerState: currentGameState });
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});


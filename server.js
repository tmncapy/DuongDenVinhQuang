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

  // Send initial retry interval and latest action if available
  res.write('retry: 1000\n\n');
  if (latestAction) {
    res.write(`data: ${JSON.stringify(latestAction)}\n\n`);
  }

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

app.post('/api/action', (req, res) => {
  const actionData = req.body;
  if (actionData && typeof actionData === 'object') {
    latestAction = actionData;
    const payload = `data: ${JSON.stringify(actionData)}\n\n`;
    sseClients.forEach(client => {
      try {
        client.res.write(payload);
      } catch (e) {
        // Client might be closed
      }
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

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
app.use(express.static(__dirname));

// Serve projector.html at root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'projector.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

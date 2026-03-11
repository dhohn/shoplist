import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { setupWSConnection, setPersistence } = require('y-websocket/bin/utils');
const Y = require('yjs');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '1234', 10);
if (isNaN(PORT) || PORT < 1 || PORT > 65535) throw new Error(`Invalid PORT: ${process.env.PORT}`);

// First path segment acts as a shared secret, e.g. BASE_PATH=xk29qz
// means only /xk29qz/* serves the app. Unset = no restriction (dev).
const BASE_PATH = process.env.BASE_PATH || null;

// Verbose logging — enable with DEBUG=true env var
const DEBUG = process.env.DEBUG === 'true';
function log(...args) {
  if (DEBUG) console.log('[shoplist]', new Date().toISOString(), ...args);
}

const DATA_DIR = path.join(__dirname, 'data');
const MAX_STATE_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Rate limiter: max messages per connection per second
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_WINDOW_MS = 1000;

fs.mkdirSync(DATA_DIR, { recursive: true });

function stateFilePath(docName) {
  const safe = docName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return path.join(DATA_DIR, `${safe}.bin`);
}

// File-based Y.js persistence — async I/O, size-guarded
setPersistence({
  bindState: async (docName, ydoc) => {
    const filePath = stateFilePath(docName);
    try {
      const stat = await fs.promises.stat(filePath);
      if (stat.size > MAX_STATE_FILE_BYTES) {
        console.warn(`State file for "${docName}" exceeds size limit (${stat.size} bytes), skipping load`);
      } else {
        const data = await fs.promises.readFile(filePath);
        Y.applyUpdate(ydoc, data);
        log('persist:loaded', docName, `(${stat.size} bytes)`);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.warn(`Failed to load state for "${docName}":`, e.message);
      }
    }

    // Debounced async persist on every update
    let saveTimer = null;
    ydoc.on('update', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const state = Y.encodeStateAsUpdate(ydoc);
          await fs.promises.writeFile(filePath, state);
          log('persist:saved', docName, `(${state.byteLength} bytes)`);
        } catch (err) {
          console.error(`Failed to save state for "${docName}":`, err.message);
        }
      }, 500);
    });
  },
  writeState: () => Promise.resolve(),
});

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // inline styles used by Vite build
      connectSrc: ["'self'", 'ws:', 'wss:'],
      imgSrc: ["'self'", 'data:'],
      workerSrc: ["'self'"],
    },
  },
}));

// Serve client dist in production
const clientDist = path.join(__dirname, '../client/dist');

// Static assets (JS, CSS, icons) are served freely — no sensitive data in them
app.use(express.static(clientDist));

// Only serve the app shell for paths that start with BASE_PATH
app.get('*', (req, res) => {
  if (BASE_PATH && req.path.split('/')[1] !== BASE_PATH) {
    log('http:404', req.path);
    return res.status(404).send('Not found');
  }
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Not found — run `npm run build` in client/');
  });
});

const server = createServer(app);

// WebSocket server with per-connection rate limiting
const wss = new WebSocketServer({ server });
wss.on('connection', (ws, req) => {
  const docName = req.url.split('?')[0].replace(/^\/+/, '').split('/').pop() || '(unknown)';
  log('ws:connect', docName);

  ws.on('close', () => log('ws:disconnect', docName));

  let msgCount = 0;
  let windowStart = Date.now();
  let rateLimited = false;

  // Prepend rate-limit check before setupWSConnection's message listener
  ws.prependListener('message', () => {
    if (rateLimited) return;
    const now = Date.now();
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      msgCount = 0;
      windowStart = now;
    }
    if (++msgCount > RATE_LIMIT_MAX) {
      rateLimited = true;
      console.warn('[shoplist] rate limit exceeded for doc:', docName);
      ws.close(1008, 'Rate limit exceeded');
    }
  });

  setupWSConnection(ws, req, { gc: true });
});

server.listen(PORT, () => {
  console.log(`Shoplist server running on http://localhost:${PORT}`);
});

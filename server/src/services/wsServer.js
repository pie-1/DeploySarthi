/**
 * WebSocket server with auth and heartbeat.
 *
 * Auth: client connects with ?token=<JWT>
 * Heartbeat: server pings every 30s, terminates dead clients.
 */

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;
const HEARTBEAT_INTERVAL_MS = 30000;

function startWebSocketServer(httpServer) {
  wss = new WebSocket.Server({
    server: httpServer,
    verifyClient: (info, cb) => {
      try {
        const url = new URL(info.req.url, 'http://localhost');
        const token = url.searchParams.get('token');
        if (!token) return cb(false, 401, 'Missing token');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        info.req.userId = decoded.id;
        cb(true);
      } catch (err) {
        cb(false, 401, 'Invalid token');
      }
    },
  });

  wss.on('connection', (ws, req) => {
    ws.userId = req.userId;
    ws.isAlive = true;

    console.log(`✅ WebSocket connected: user=${ws.userId}`);

    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {}
    });

    ws.on('close', () => {
      console.log(`❌ WebSocket disconnected: user=${ws.userId}`);
    });
  });

  // Heartbeat — terminate dead clients
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`💀 Terminating dead WS: user=${ws.userId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(heartbeat));

  console.log('🔌 WebSocket server started (auth + heartbeat)');
  return wss;
}

function broadcast(event, data, filterFn = null) {
  if (!wss) return;
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    if (client.readyState !== WebSocket.OPEN) return;
    if (filterFn && !filterFn(client)) return;
    client.send(message);
  });
}

module.exports = { startWebSocketServer, broadcast };
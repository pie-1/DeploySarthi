/**
 * WebSocket server for real-time dashboard updates.
 *
 * Events broadcast:
 * - incident:created — new incident detected
 * - incident:analyzed — AI analysis ready
 * - incident:updated — status change
 * - metrics:update — new metric snapshot
 */

const WebSocket = require('ws');

let wss = null;

function startWebSocketServer(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws) => {
    console.log('✅ WebSocket client connected');

    ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (e) {
        // ignore
      }
    });

    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
    });
  });

  console.log('🔌 WebSocket server started');
  return wss;
}

function broadcast(event, data) {
  if (!wss) return;
  const message = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { startWebSocketServer, broadcast };
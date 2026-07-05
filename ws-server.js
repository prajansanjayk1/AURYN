const { WebSocketServer } = require('ws');

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`[AURYN Event Engine] WebSockets running on ws://localhost:${PORT}`);

const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Event Engine] Client connected. Total active connections: ${clients.size}`);

  ws.send(JSON.stringify({
    type: 'system.welcome',
    payload: {
      message: 'Connected to DineFlow AI Realtime Event Engine',
      timestamp: new Date().toISOString()
    }
  }));

  ws.on('message', (messageString) => {
    try {
      const message = JSON.parse(messageString.toString());
      console.log(`[Event Engine] Event received: ${message.type}`);
      
      // Broadcast to all other clients
      const broadcastData = JSON.stringify(message);
      for (const client of clients) {
        if (client !== ws && client.readyState === 1) { // 1 = OPEN
          client.send(broadcastData);
        }
      }
    } catch (e) {
      console.error('[Event Engine] Failed to parse message', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Event Engine] Client disconnected. Total active connections: ${clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[Event Engine] Connection error', err);
    clients.delete(ws);
  });
});

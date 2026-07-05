import WebSocket from 'ws';

export function broadcastEvent(type: string, payload: any) {
  try {
    const ws = new WebSocket('ws://localhost:3001');
    ws.on('open', () => {
      ws.send(JSON.stringify({ type, payload }));
      setTimeout(() => {
        ws.close();
      }, 50); // Small delay to ensure send buffer clears
    });
    ws.on('error', (err) => {
      console.warn('[Broadcast Helper] Event engine offline. Broadcast skipped:', err.message);
    });
  } catch (e) {
    console.error('[Broadcast Helper] Error:', e);
  }
}

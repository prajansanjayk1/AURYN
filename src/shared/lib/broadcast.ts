export function broadcastEvent(type: string, payload: any) {
  try {
    const WSConstructor = typeof globalThis.WebSocket !== 'undefined' ? globalThis.WebSocket : require('ws');
    const ws = new WSConstructor('ws://localhost:3001');
    
    const handleOpen = () => {
      try {
        ws.send(JSON.stringify({ type, payload }));
      } catch (e) {
        console.warn('[Broadcast Helper] Send failed:', e);
      } finally {
        setTimeout(() => {
          try { ws.close(); } catch {}
        }, 50);
      }
    };

    const handleError = (err: any) => {
      console.warn('[Broadcast Helper] Event engine offline. Broadcast skipped');
    };

    if (typeof ws.on === 'function') {
      ws.on('open', handleOpen);
      ws.on('error', handleError);
    } else {
      ws.onopen = handleOpen;
      ws.onerror = handleError;
    }
  } catch (e) {
    console.error('[Broadcast Helper] Error:', e);
  }
}

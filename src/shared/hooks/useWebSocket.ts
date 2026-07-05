import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(onEvent?: (type: string, payload: any) => void) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const onEventRef = useRef(onEvent);

  // Keep ref up to date to prevent effect re-runs
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let active = true;
    let socket: WebSocket;

    function connect() {
      if (!active) return;
      
      console.log('[useWebSocket] Connecting to ws://localhost:3001...');
      socket = new WebSocket('ws://localhost:3001');
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setConnected(true);
        console.log('[useWebSocket] Connected');
      };

      socket.onmessage = (event) => {
        if (!active) return;
        try {
          const data = JSON.parse(event.data);
          if (onEventRef.current) {
            onEventRef.current(data.type, data.payload);
          }
        } catch (e) {
          console.error('[useWebSocket] Failed to parse message', e);
        }
      };

      socket.onclose = () => {
        if (!active) return;
        setConnected(false);
        console.log('[useWebSocket] Disconnected. Reconnecting in 3s...');
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error('[useWebSocket] Error:', err);
        socket.close();
      };
    }

    connect();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendEvent = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('[useWebSocket] Cannot send event: Socket not connected');
    }
  }, []);

  return { connected, sendEvent };
}

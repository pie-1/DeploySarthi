import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
const RECONNECT_BASE_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Map());
  const isMountedRef = useRef(false);
  const tokenRef = useRef(null);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    tokenRef.current = token;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.log('[ws] connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          const listeners = listenersRef.current.get(message.type) || [];
          listeners.forEach((fn) => {
            try { fn(message.data); } catch (err) { console.error('[ws] listener error:', err); }
          });
        } catch (err) {
          console.error('[ws] parse error:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        if (event.code === 4001) {
          console.warn('[ws] auth failed — not retrying');
          return;
        }

        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            RECONNECT_BASE_DELAY * 2 ** (reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_DELAY
          );
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = () => {};
    } catch (err) {
      console.error('[ws] connection failed:', err);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(connect, 100);

    // ─────────────────────────────────────────────────────────
    // NEW: Listen for token changes (login / logout / refresh)
    // ─────────────────────────────────────────────────────────
    const handleStorageChange = (e) => {
      if (e.key !== 'token') return;
      const newToken = e.newValue;
      if (!newToken) {
        // Logged out — close connection
        if (wsRef.current) {
          wsRef.current.onclose = null;
          wsRef.current.close();
          wsRef.current = null;
        }
        setIsConnected(false);
        return;
      }
      // Logged in / new token — connect if not already
      if (wsRef.current?.readyState !== WebSocket.OPEN) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for same-tab token changes via custom event
    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      if (token && wsRef.current?.readyState !== WebSocket.OPEN) {
        reconnectAttemptsRef.current = 0;
        connect();
      } else if (!token && wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
        setIsConnected(false);
      }
    };
    window.addEventListener('auth:changed', handleAuthChange);

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (timer) clearTimeout(timer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:changed', handleAuthChange);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const subscribe = useCallback((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, []);
    }
    listenersRef.current.get(eventType).push(callback);
    return () => {
      const listeners = listenersRef.current.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { isConnected, lastMessage, subscribe };
};
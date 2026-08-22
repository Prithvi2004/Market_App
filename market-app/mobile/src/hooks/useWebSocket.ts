/**
 * WebSocket hook for live price updates.
 * Faithfully ported from App.jsx's useLivePricesWS().
 * Uses exponential backoff reconnection identical to the web app.
 */
import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { WS_BASE_URL } from '../api/client';

export function useLivePricesWS() {
  const setLivePrices = useAppStore((s) => s.setLivePrices);
  const backoff = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    function connect() {
      if (stoppedRef.current) return;

      const ws = new WebSocket(`${WS_BASE_URL}/ws/prices`);
      wsRef.current = ws;

      ws.onopen = () => {
        backoff.current = 1000; // reset on successful connect
      };

      ws.onmessage = (e) => {
        try {
          setLivePrices(JSON.parse(e.data));
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (stoppedRef.current) return;
        reconnectTimer.current = setTimeout(() => {
          backoff.current = Math.min(30_000, backoff.current * 2);
          connect();
        }, backoff.current);
      };

      ws.onerror = () => {
        // onclose fires after onerror, so reconnect is handled there
      };
    }

    connect();

    return () => {
      stoppedRef.current = true;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
    };
  }, [setLivePrices]);
}

import { useState, useEffect } from 'react';
import { wsProvider, idbPersistence } from '../ydoc.js';

export function StatusBar() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    function update() {
      if (wsProvider.wsconnected) {
        setStatus('live');
      } else if (navigator.onLine === false) {
        setStatus('offline');
      } else {
        setStatus('connecting');
      }
    }

    wsProvider.on('status', update);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();

    return () => {
      wsProvider.off('status', update);
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const [idbReady, setIdbReady] = useState(false);
  useEffect(() => {
    idbPersistence.on('synced', () => setIdbReady(true));
  }, []);

  if (!idbReady && status === 'connecting') {
    return <div className="status status--loading">○ Loading…</div>;
  }
  if (status === 'live') {
    return <div className="status status--live">● Live</div>;
  }
  return <div className="status status--offline">● Offline (saved)</div>;
}

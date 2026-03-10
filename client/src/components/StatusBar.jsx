import { useState, useEffect } from 'react';

export function StatusBar({ wsProvider, idbPersistence }) {
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
  }, [wsProvider]);

  const [idbReady, setIdbReady] = useState(idbPersistence.synced);
  useEffect(() => {
    if (idbPersistence.synced) {
      setIdbReady(true);
      return;
    }
    const handler = () => setIdbReady(true);
    idbPersistence.on('synced', handler);
    return () => idbPersistence.off('synced', handler);
  }, [idbPersistence]);

  if (!idbReady && status === 'connecting') {
    return <div className="status status--loading">○ Loading…</div>;
  }
  if (status === 'live') {
    return <div className="status status--live">● Live</div>;
  }
  return <div className="status status--offline">● Offline (saved)</div>;
}

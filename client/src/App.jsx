import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen.jsx';
import { ListScreen } from './components/ListScreen.jsx';
import { useListIndex } from './useListIndex.js';
import { householdSegment } from './ydoc.js';
import { log } from './log.js';

function parseHash(hash) {
  const match = hash.match(/^#\/list\/([^/]+)$/);
  if (match) return { screen: 'list', listId: match[1] };
  return { screen: 'home' };
}

export function App() {
  // Remember the household path when visiting via browser so the PWA
  // (which always launches from start_url '/') can redirect back to it.
  const segments = location.pathname.split('/').filter(Boolean);
  const hasHousehold = segments.length >= 2;
  if (hasHousehold) {
    localStorage.setItem('householdPath', location.pathname);
  } else {
    const savedPath = localStorage.getItem('householdPath');
    if (savedPath) {
      location.replace(savedPath);
      return null;
    }
  }

  const [route, setRoute] = useState(() => {
    const parsed = parseHash(location.hash);
    if (parsed.screen === 'home') {
      const lastList = localStorage.getItem(`lastList:${householdSegment()}`);
      if (lastList) return { screen: 'list', listId: lastList };
    }
    return parsed;
  });

  const { lists } = useListIndex();

  // Sync the URL to match the initial route (e.g. when redirected via lastList)
  useEffect(() => {
    if (route.screen === 'list') {
      location.hash = `#/list/${route.listId}`;
    }
  }, []);

  // Update route state when the hash changes
  useEffect(() => {
    function onHashChange() {
      const next = parseHash(location.hash);
      log('route:change', next);
      setRoute(next);
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  function openList(id) {
    location.hash = `#/list/${id}`;
  }

  function goHome() {
    location.hash = '#/';
  }

  if (route.screen === 'list') {
    const listName = lists.find((l) => l.id === route.listId)?.name || '';
    return (
      <>
        <ListScreen listId={route.listId} listName={listName} onBack={goHome} />
        <IOSInstallBanner />
      </>
    );
  }

  return (
    <>
      <HomeScreen onOpenList={openList} />
      <IOSInstallBanner />
    </>
  );
}

function IOSInstallBanner() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = navigator.standalone === true;

  if (!isIOS || isStandalone) return null;

  return (
    <div className="ios-banner">
      Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to install
    </div>
  );
}

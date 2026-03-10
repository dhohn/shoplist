import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen.jsx';
import { ListScreen } from './components/ListScreen.jsx';
import { useListIndex } from './useListIndex.js';

function parseHash(hash) {
  const match = hash.match(/^#\/list\/([^/]+)$/);
  if (match) return { screen: 'list', listId: match[1] };
  return { screen: 'home' };
}

export function App() {
  const [route, setRoute] = useState(() => {
    const parsed = parseHash(location.hash);
    if (parsed.screen === 'home') {
      const lastList = localStorage.getItem('lastList');
      if (lastList) return { screen: 'list', listId: lastList };
    }
    return parsed;
  });

  const { lists, addList, indexReady } = useListIndex();

  // Sync the URL to match the initial route (e.g. when redirected via lastList)
  useEffect(() => {
    if (route.screen === 'list') {
      location.hash = `#/list/${route.listId}`;
    }
  }, []);

  // Update route state when the hash changes
  useEffect(() => {
    function onHashChange() {
      setRoute(parseHash(location.hash));
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // When opening a shared list URL not yet in our index, add a placeholder.
  // The real name will overwrite it once the index doc syncs from the server.
  useEffect(() => {
    if (route.screen !== 'list' || !indexReady) return;
    const known = lists.find((l) => l.id === route.listId);
    if (!known) addList('List', route.listId);
  }, [route.screen, route.listId, indexReady]);

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

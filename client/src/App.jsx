import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen.jsx';
import { ListScreen } from './components/ListScreen.jsx';
import { useListIndex } from './useListIndex.js';
import { log } from './log.js';

function parseHash(hash) {
  // Matches /#/list/<uuid> or /#/list/<uuid>/List%20Name
  const match = hash.match(/^#\/list\/([^/]+)(?:\/(.+))?$/);
  if (match) return {
    screen: 'list',
    listId: match[1],
    urlName: match[2] ? decodeURIComponent(match[2]) : null,
  };
  return { screen: 'home' };
}

export function App() {
  const [route, setRoute] = useState(() => {
    const parsed = parseHash(location.hash);
    if (parsed.screen === 'home') {
      const lastList = localStorage.getItem('lastList');
      if (lastList) return { screen: 'list', listId: lastList, urlName: null };
    }
    return parsed;
  });

  const { lists, addList, indexReady, joinForeignList } = useListIndex();

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

  // When opening a shared list URL not in our index:
  // - If the URL carries the list name, write it to the Y.Map (it's the real name)
  // - Otherwise fall back to a local foreign-list entry
  useEffect(() => {
    if (route.screen !== 'list') return;
    const known = lists.find((l) => l.id === route.listId);
    if (!known) {
      if (route.urlName) {
        log('route:unknown-list', route.listId, `— writing name from URL: "${route.urlName}"`);
        addList(route.urlName, route.listId);
      } else {
        log('route:unknown-list', route.listId, '— no name in URL, joining as foreign list');
        joinForeignList(route.listId);
      }
    }
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

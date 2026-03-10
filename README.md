# Shoplist

A real-time collaborative shopping list PWA. Multiple users can simultaneously edit a shared list from any device. Changes sync instantly via Y.js CRDTs; the list persists offline via IndexedDB.

## Features

- Real-time sync across all connected clients
- Offline support — add items without a connection, sync when back online
- Checked items stay visible with strikethrough, below an unchecked section
- Duplicate detection — re-adding an existing item moves it to the top and unchecks it
- Installable as a PWA on Android and iOS (Add to Home Screen)

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Sync | Y.js (CRDT), y-websocket |
| Offline | y-indexeddb (IndexedDB persistence) |
| Backend | Node.js, Express, ws |
| PWA | vite-plugin-pwa, Workbox |
| Security | Helmet |

## Development

```bash
# Terminal 1 — backend
cd server
npm install
node index.js        # runs on http://localhost:1234

# Terminal 2 — frontend
cd client
npm install
npm run dev          # runs on http://localhost:5173
```

The Vite dev server proxies `/ws` to `ws://localhost:1234`, so no CORS configuration is needed.

## Production build

```bash
# Build the client (bakes in the WebSocket URL)
cd client
VITE_WS_URL=wss://your-host.com npm run build

# Run the server (serves static files + WebSocket on the same port)
cd server
node index.js
```

Set the `PORT` environment variable to override the default of `1234`.

## Deployment

The server handles both HTTP (static file serving) and WebSocket traffic on a single port, so any platform with WebSocket support works. HTTPS/WSS is required for PWA install and service worker support.

Recommended platforms: Railway, Render, Fly.io. Each provides automatic HTTPS. Mount a persistent volume at `server/data/` so the shopping list survives redeploys.

See [the deployment section](#production-build) above for build instructions.

## Project structure

```
shoplist/
├── server/
│   ├── index.js          # Express + y-websocket + file-based persistence
│   └── package.json
└── client/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── ydoc.js           # Y.Doc singleton, IndexedDB + WebSocket providers
    │   ├── useShoppingList.js
    │   ├── index.css
    │   └── components/
    │       ├── AddItemForm.jsx
    │       ├── ShoppingItem.jsx
    │       └── StatusBar.jsx
    ├── public/
    │   ├── manifest.json
    │   └── icons/
    ├── index.html
    ├── vite.config.js
    └── package.json
```

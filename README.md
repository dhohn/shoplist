# Shoplist

A real-time collaborative shopping list PWA. Multiple users can simultaneously edit shared lists from any device. Changes sync instantly via Y.js CRDTs; lists persist offline via IndexedDB.

## Features

- Multiple named lists per household, synced in real-time across all devices
- Offline support — add items without a connection, sync when back online
- Checked items stay visible with strikethrough, below an unchecked section
- Duplicate detection — re-adding an existing item moves it to the top and unchecks it
- Share a list by copying its URL — no accounts required
- Installable as a PWA on Android and iOS (Add to Home Screen)
- Multi-household support — each household gets an isolated URL, no visibility into each other's lists

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Sync | Y.js (CRDT), y-websocket |
| Offline | y-indexeddb (IndexedDB persistence) |
| Backend | Node.js, Express, ws |
| PWA | vite-plugin-pwa, Workbox |
| Security | Helmet |

## URL structure

```
https://your-host.com/<base>/<household>/#/list/<uuid>
```

- `<base>` — a shared secret path segment set via `BASE_PATH` env var on the server. Requests not starting with this segment get a 404.
- `<household>` — identifies a household. Each household has its own isolated list index. You choose this when sharing the URL (e.g. `shop`, `parents`, `sister`).
- `<uuid>` — a random UUID identifying a specific list. Used as the Y.js doc name and WebSocket room.

Example: `https://hohn.be/xk29qz/shop/#/list/a3f27c91-...`

## Access model

- The base path (`xk29qz`) is a secret — only people you tell can find the app
- Each household path (`shop`, `sister`) is isolated — households cannot see each other's lists
- Individual lists are shared by copying their URL. Anyone with the URL can view and edit the list
- No user accounts or passwords

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

The Vite dev server proxies `/ws` to `ws://localhost:1234`. No `BASE_PATH` is needed in dev — all paths are accepted.

## Production build

```bash
# Build the client
cd client
VITE_WS_URL=wss://your-host.com VITE_START_PATH=/xk29qz/shop/ npm run build

# Run the server
cd server
BASE_PATH=xk29qz PORT=1234 node index.js
```

- `VITE_WS_URL` — WebSocket URL of your server (required in production)
- `VITE_START_PATH` — the path baked into the PWA manifest as `start_url`. Set this to the household's full path so the home screen icon opens the right household. Defaults to `/`.
- `BASE_PATH` — first path segment that the server accepts. Everything else returns 404. Omit in dev.
- `PORT` — defaults to `1234`

## Adding a new household

No server restart or rebuild needed. Simply share the URL with the new path:

```
https://your-host.com/<base>/<new-household>/
```

The household's list index is created automatically the first time someone opens it and creates a list.

## Data persistence

List data is stored server-side as binary Y.js state files in `server/data/`:

```
data/
  shop-index.bin       # index of lists for the 'shop' household
  <uuid>.bin           # one file per shopping list
```

Mount `server/data/` as a persistent volume so data survives redeploys.

## Deployment

The server handles both HTTP (static file serving) and WebSocket traffic on a single port. HTTPS/WSS is required for PWA install and service worker support.

Recommended platforms: Railway, Render, Fly.io — each provides automatic HTTPS and persistent volumes.

## Project structure

```
shoplist/
├── server/
│   ├── index.js          # Express + y-websocket + file-based persistence
│   └── package.json
└── client/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx           # hash-based router (home screen / list screen)
    │   ├── ydoc.js           # Y.Doc factory, IndexedDB + WebSocket providers
    │   ├── useShoppingList.js
    │   ├── useListIndex.js   # hook for the household's list index doc
    │   ├── index.css
    │   └── components/
    │       ├── HomeScreen.jsx
    │       ├── ListScreen.jsx
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

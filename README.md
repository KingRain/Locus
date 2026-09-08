# Locus

Browser-based real-time collaborative visual workspace. Base implementation of the SADD layered client-server design.

## Layers

- **Presentation:** Next.js App Router UI (`src/app`)
- **Application:** HTTPS JSON routes (`src/app/api`)
- **Collaboration:** WebSocket server (`server/collaboration.ts`, port 3001)
- **Persistence:** SQLite at `data/locus.db` plus files under `storage/`

## Run locally

```bash
npm install
cp .env.example .env.local   # optional
npm run dev
```

Open http://localhost:3000

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_COLLAB_URL` | `ws://localhost:3001` | WebSocket URL the browser uses for live edits |
| `COLLAB_PORT` | `3001` | Collaboration server port |
| `COLLAB_HOST` | `0.0.0.0` | Bind address (use `0.0.0.0` for tunnels) |

## Collaboration over a public tunnel (laptop dev)

For demos, run the collaboration server on your machine and expose port 3001 with **ngrok**, **Cloudflare Tunnel**, or **nginx** on your laptop.

### Option A — ngrok (simplest)

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
ngrok http 3001
```

Copy the `wss://…` URL from ngrok into `.env.local`:

```bash
NEXT_PUBLIC_COLLAB_URL=wss://YOUR-NGROK-HOST
```

Restart `npm run dev` so Next.js picks up the env var. Remote users load the Next app (localhost or your deployed web URL) and connect to your tunneled WSS endpoint.

### Option B — nginx reverse proxy

See `nginx.collab.example.conf` for WebSocket upgrade headers. Point `NEXT_PUBLIC_COLLAB_URL` at your public WSS host.

### Architecture notes

- **HTTPS (Application layer):** board CRUD, sharing invites, comments, versions — persisted in SQLite via `PermissionChecker`.
- **WSS (Collaboration layer):** cursor presence and diagram ops — routed through `PresenceManager` and `SyncManager`; ops are permission-checked then written to the DB and fan-out to the room.
- **In-memory fan-out:** all clients on a board share one Node process; presence lives in memory until disconnect.
- **Uptime:** if your laptop sleeps or the tunnel drops, live sessions end immediately. For always-on collab, deploy `server/collaboration.ts` to Render, Railway, or Fly.io and set `NEXT_PUBLIC_COLLAB_URL` to that host.

## Package map

- `src/auth` — User, Session, AuthenticationManager, RecoveryManager
- `src/board` — Board, BoardManager, diagram, templates
- `src/collaboration` — SyncManager, PresenceManager, WSS client hook
- `src/sharing` — PermissionChecker, BoardMember, Invitation
- `src/comments` — Comment threads
- `src/history` — non-destructive VersionManager
- `src/export` — SVG export into `storage/exports`

Account recovery writes a one-time link to `data/recovery.log` (no mailer in this base).

## Auth (Clerk)

Authentication is handled by [Clerk](https://clerk.com). Sign in at `/sign-in`, sign up at `/sign-up`.

- Protected routes: `/dashboard`, `/board/*`, `/api/boards/*`, `/api/templates`
- Local SQLite users are synced from Clerk on first API access (`User.syncFromClerk`)
- WebSocket collaboration verifies Clerk session tokens via `@clerk/backend`

Configure Clerk keys in `.env.local` (see `.env.example`). Legacy `/login`, `/register`, and `/recover` redirect to Clerk routes.

## Dark mode

Use the moon/sun toggle in the header. Preference is stored in `localStorage` under `locus_theme`.

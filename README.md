# Locus

A browser whiteboard for students and small teams. Draw shapes, leave comments, watch live cursors, and keep version history — without the enterprise fog.

Open [http://localhost:3000](http://localhost:3000) after starting the app, then register an account and create a board.

## Features

- **Diagram canvas** — select, pen, eraser, rectangles, ellipses, diamonds, lines, arrows, connectors, text, and sticky notes
- **Live collaboration** — WebSocket presence, live cursors, and broadcasted edits
- **Sharing** — invite by email as owner, editor, commenter, or viewer
- **Comments** — threads on the board or on a specific element
- **Version history** — capture snapshots, preview, and restore without destroying later work
- **Templates** — UML class, flowchart, ER, and architecture starters
- **SVG export** — download a board as SVG under `storage/exports`
- **Auth** — register, sign in, cookie sessions, and local password recovery

## Stack

| Layer | Implementation |
| --- | --- |
| UI | Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui |
| API | HTTPS JSON routes in `src/app/api` |
| Collaboration | `ws` server in `server/collaboration.ts` (default port 3001) |
| Database | Node.js built-in SQLite (`node:sqlite`) at `data/locus.db` |
| Files | SVG exports and media under `storage/` |

Requires **Node.js 22+** (`node:sqlite` is built in).

## Quick start

```bash
git clone https://github.com/KingRain/Locus.git
cd Locus
npm install
npm run dev
```

That starts both processes:

- Web app at [http://localhost:3000](http://localhost:3000)
- Collaboration WebSocket at `ws://localhost:3001`

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js (Turbopack) + collaboration server |
| `npm run dev:web` | Web app only |
| `npm run dev:wss` | Collaboration server only |
| `npm run build` | Production Next.js build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |

### Environment

Optional. Defaults work for local development.

| Variable | Default | Used by |
| --- | --- | --- |
| `COLLAB_PORT` | `3001` | Collaboration server |
| `NEXT_PUBLIC_COLLAB_URL` | `ws://localhost:3001` | Browser WebSocket client |

Copy into `.env.local` if you need to change them. `.env` files are gitignored.

## Using the app

1. Register at `/register` (password must be at least 8 characters).
2. From the dashboard, create a blank board or start from a template.
3. Draw on the canvas. Invite teammates from the share panel.
4. Capture versions from the history panel. Export SVG from the board toolbar.

### Canvas shortcuts

| Key | Tool |
| --- | --- |
| `V` | Select |
| `B` | Pen |
| `E` | Eraser |
| `L` | Line |
| `A` | Arrow |
| `O` | Ellipse |
| `R` | Rectangle |
| `D` | Diamond |
| `C` | Connector |
| `T` | Text |
| `S` | Sticky note |

### Access roles

| Role | Can view | Can comment | Can edit | Can manage sharing |
| --- | --- | --- | --- | --- |
| Viewer | yes | | | |
| Commenter | yes | yes | | |
| Editor | yes | yes | yes | |
| Owner | yes | yes | yes | yes |

Inviting an email that already has an account grants access immediately. Pending invites wait until that person registers.

### Password recovery

There is no mailer in this base. Requesting a reset writes a one-time link to `data/recovery.log`. Open `/recover?token=…` from that file within one hour.

## Architecture

Two paths to the same board:

```
Browser  --HTTPS JSON-->  Next.js API  -->  SQLite + storage/
Browser  --WebSocket--->  collab server -->  SyncManager / PresenceManager
```

HTTPS handles accounts, boards, sharing, comments, versions, and export. The WebSocket layer authenticates with the same session token, checks board permissions, applies edits, and broadcasts operations plus cursors to everyone in the room.

Package layout follows that split:

```
src/
  app/             pages and API routes
  auth/            User, Session, AuthenticationManager, RecoveryManager
  board/           Board, canvas, tools, templates
  collaboration/   SyncManager, PresenceManager, client hook
  sharing/         PermissionChecker, members, invitations
  comments/        comment threads
  history/         VersionManager snapshots
  export/          SVG export
  persistence/     SQLite schema and file storage
server/
  collaboration.ts WebSocket collaboration process
```

Visual tokens live in `DESIGN.md`.

## Data on disk

| Path | Contents |
| --- | --- |
| `data/locus.db` | Users, sessions, boards, elements, comments, versions |
| `data/recovery.log` | Local recovery links (dev only) |
| `storage/exports/` | Generated SVG files |
| `storage/media/` | Uploaded media |

SQLite files, recovery logs, and generated exports are gitignored. The schema is created automatically on first run.

## License

Private project unless a license file is added.

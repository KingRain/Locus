import { WebSocketServer, WebSocket } from "ws";
import { authenticationManager } from "../src/auth/AuthenticationManager";
import { permissionChecker } from "../src/sharing/PermissionChecker";
import { presenceManager } from "../src/collaboration/PresenceManager";
import { syncManager } from "../src/collaboration/SyncManager";
import type { CollabClientMessage, CollabServerMessage } from "../src/lib/types";

const PORT = Number(process.env.COLLAB_PORT ?? 3001);

type Client = {
  socket: WebSocket;
  id: string;
  boardId: string | null;
  userId: string | null;
};

const clients = new Map<WebSocket, Client>();

function send(socket: WebSocket, message: CollabServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(boardId: string, message: CollabServerMessage, except?: WebSocket): void {
  for (const client of clients.values()) {
    if (client.boardId === boardId && client.socket !== except) {
      send(client.socket, message);
    }
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket) => {
  const client: Client = { socket, id: crypto.randomUUID(), boardId: null, userId: null };
  clients.set(socket, client);

  socket.on("message", (raw) => {
    let message: CollabClientMessage;
    try {
      message = JSON.parse(String(raw)) as CollabClientMessage;
    } catch {
      send(socket, { type: "error", message: "Invalid collaboration payload." });
      return;
    }

    if (message.type === "join") {
      const auth = authenticationManager.sessionFromToken(message.token);
      if (!auth) {
        send(socket, { type: "error", message: "Not authenticated" });
        return;
      }
      if (!permissionChecker.canView(message.boardId, auth.user.record.id)) {
        send(socket, { type: "error", message: "You do not have access to this board." });
        return;
      }
      client.boardId = message.boardId;
      client.userId = auth.user.record.id;
      const presence = presenceManager.join(
        message.boardId,
        client.id,
        auth.user.record.id,
        auth.user.record.name,
      );
      send(socket, { type: "joined", selfId: auth.user.record.id, presence });
      broadcast(message.boardId, { type: "presence", presence }, socket);
      return;
    }

    if (!client.boardId || !client.userId) {
      send(socket, { type: "error", message: "Join a board first." });
      return;
    }

    if (message.type === "op") {
      try {
        const accepted = syncManager.apply(client.boardId, client.userId, message.operation);
        broadcast(client.boardId, { type: "op", from: client.userId, operation: accepted });
      } catch (error) {
        send(socket, {
          type: "error",
          message: error instanceof Error ? error.message : "Operation rejected.",
        });
      }
      return;
    }

    if (message.type === "cursor") {
      const occupant = presenceManager.cursor(client.boardId, client.id, message.x, message.y);
      if (!occupant) return;
      broadcast(client.boardId, {
        type: "cursor",
        userId: occupant.userId,
        name: occupant.name,
        color: occupant.color,
        x: message.x,
        y: message.y,
      }, socket);
    }
  });

  socket.on("close", () => {
    const boardId = client.boardId;
    clients.delete(socket);
    if (boardId) {
      const presence = presenceManager.leave(boardId, client.id);
      broadcast(boardId, { type: "presence", presence });
    }
  });
});

console.log(`Locus collaboration layer listening on ws://localhost:${PORT}`);

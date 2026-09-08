"use client";

import { useEffect, useRef, useState } from "react";
import type {
  BoardOperation,
  CollabServerMessage,
  ConnectionState,
  PresenceUser,
} from "@/lib/types";

const COLLAB_URL = process.env.NEXT_PUBLIC_COLLAB_URL ?? "ws://localhost:3001";

export function useCollaboration(boardId: string, token: string | null, onOp: (op: BoardOperation, from: string) => void) {
  const [state, setState] = useState<ConnectionState>("reconnecting");
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number; name: string; color: string }>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const onOpRef = useRef(onOp);
  onOpRef.current = onOp;

  useEffect(() => {
    if (!token) {
      setState("unavailable");
      return;
    }
    let cancelled = false;
    let retries = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    function connect() {
      setState("reconnecting");
      const socket = new WebSocket(COLLAB_URL);
      socketRef.current = socket;
      socket.onopen = () => {
        retries = 0;
        socket.send(JSON.stringify({ type: "join", boardId, token }));
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as CollabServerMessage;
        if (message.type === "joined") {
          setState("connected");
          setPresence(message.presence);
        } else if (message.type === "presence") {
          setPresence(message.presence);
        } else if (message.type === "op") {
          onOpRef.current(message.operation, message.from);
        } else if (message.type === "cursor") {
          setCursors((current) => ({
            ...current,
            [message.userId]: { x: message.x, y: message.y, name: message.name, color: message.color },
          }));
        } else if (message.type === "error") {
          setState("unavailable");
        }
      };
      socket.onclose = () => {
        if (cancelled) return;
        setState("reconnecting");
        retries += 1;
        if (retries > 8) {
          setState("unavailable");
          return;
        }
        retryTimer = setTimeout(connect, Math.min(1000 * retries, 5000));
      };
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      socketRef.current?.close();
    };
  }, [boardId, token]);

  function sendOp(operation: BoardOperation) {
    socketRef.current?.send(JSON.stringify({ type: "op", operation }));
  }

  function sendCursor(x: number, y: number) {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "cursor", x, y }));
    }
  }

  return { state, presence, cursors, sendOp, sendCursor };
}

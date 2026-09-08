"use client";

import { LiveMap } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import type { ReactNode } from "react";

export function BoardRoom({ boardId, children }: { boardId: string; children: ReactNode }) {
  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      throttle={16}
    >
      <RoomProvider
        id={boardId}
        initialStorage={{
          elements: new LiveMap(),
        }}
        initialPresence={{ cursor: null }}
      >
        <ClientSideSuspense fallback={<div className="grid min-h-screen place-items-center text-slate">Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

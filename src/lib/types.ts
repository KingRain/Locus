export type BoardRole = "owner" | "editor" | "commenter" | "viewer";
export type BoardStatus = "active" | "archived";
export type ElementType =
  | "rect"
  | "ellipse"
  | "diamond"
  | "text"
  | "connector"
  | "sticky"
  | "path"
  | "line"
  | "arrow";
export type TemplateKind = "uml" | "flowchart" | "er" | "architecture";
export type ConnectionState = "connected" | "reconnecting" | "unavailable";
export type Tool =
  | "select"
  | "pen"
  | "rect"
  | "ellipse"
  | "diamond"
  | "text"
  | "line"
  | "arrow"
  | "connector"
  | "sticky"
  | "eraser";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
};

export type SessionRecord = {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
};

export type BoardRecord = {
  id: string;
  ownerId: string;
  title: string;
  status: BoardStatus;
  createdAt: number;
  updatedAt: number;
};

export type BoardMemberRecord = {
  boardId: string;
  userId: string;
  role: BoardRole;
  email?: string;
  name?: string;
};

export type DiagramElementRecord = {
  id: string;
  boardId: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  text: string;
  fromId: string | null;
  toId: string | null;
  zIndex: number;
  updatedAt: number;
};

export type CommentRecord = {
  id: string;
  boardId: string;
  elementId: string | null;
  parentId: string | null;
  userId: string;
  authorName: string;
  content: string;
  resolved: boolean;
  createdAt: number;
};

export type VersionRecord = {
  id: string;
  boardId: string;
  label: string;
  createdBy: string;
  authorName: string;
  createdAt: number;
};

export type TemplateRecord = {
  id: string;
  name: string;
  kind: TemplateKind;
  description: string;
};

export type InvitationRecord = {
  id: string;
  boardId: string;
  email: string;
  role: BoardRole;
  status: "pending" | "accepted" | "revoked";
  createdAt: number;
};

export type PresenceUser = {
  userId: string;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
};

export type BoardOperation =
  | { kind: "upsert"; element: DiagramElementRecord }
  | { kind: "delete"; elementId: string }
  | { kind: "replaceAll"; elements: DiagramElementRecord[] };

export type CollabClientMessage =
  | { type: "join"; boardId: string; token: string }
  | { type: "op"; operation: BoardOperation }
  | { type: "cursor"; x: number; y: number }
  | { type: "leave" };

export type CollabServerMessage =
  | { type: "joined"; selfId: string; presence: PresenceUser[] }
  | { type: "op"; from: string; operation: BoardOperation }
  | { type: "presence"; presence: PresenceUser[] }
  | { type: "cursor"; userId: string; name: string; color: string; x: number; y: number }
  | { type: "error"; message: string }
  | { type: "state"; state: ConnectionState };

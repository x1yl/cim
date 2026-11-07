import express from "express";
import helmet from "helmet";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { v4 as uuid } from "uuid";
import {
  rooms, createRoom, getRoom, joinRoom, leaveRoom,
  pushHistory, broadcast, sendTo, LIMITS,
} from "./rooms.js";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: "1mb" }));

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get("/health", (_req, res) => res.json({ ok: true, rooms: rooms.size, uptime: process.uptime() }));

// serve built client if present (single-port deploy)
const clientDist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}
app.get("/api/rooms/count", (_req, res) => res.json({ count: rooms.size }));

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

// userCode -> userId (so DMs can resolve). In-memory.
const userCodes = new Map(); // code -> userId
const userIdToCode = new Map();
const connections = new Map(); // ws -> { userId, name, color, code, rooms:Set }

function genUserCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let c = "";
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function sanitize(str, max = 2000) {
  if (typeof str !== "string") return "";
  return str.slice(0, max).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

// token bucket per socket
function makeLimiter() {
  let tokens = 20;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(20, tokens + (now - last) / 1000 * 8);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

function broadcastPresence(room) {
  const members = [...room.members].map((uid) => {
    const c = [...connections.values()].find((x) => x.userId === uid);
    return c ? { userId: uid, name: c.name, color: c.color, code: c.code } : { userId: uid };
  });
  broadcast(room, { type: "presence", room: room.code, members });
}

wss.on("connection", (ws, req) => {
  const limiter = makeLimiter();
  const state = { userId: null, name: null, color: null, code: null, rooms: new Set(), limiter };
  connections.set(ws, state);

  ws.on("message", (raw) => {
    if (!limiter()) { sendTo(ws, { type: "error", message: "rate limited" }); return; }
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg.type !== "string") return;
    handle(ws, state, msg);
  });

  ws.on("close", () => {
    if (state.userId) {
      for (const code of state.rooms) {
        const room = getRoom(code);
        if (room) {
          leaveRoom(room, state.userId);
          broadcast(room, { type: "left", room: code, userId: state.userId, name: state.name });
          broadcastPresence(room);
        }
      }
    }
    connections.delete(ws);
  });

  ws.on("error", () => {});
});

function handle(ws, state, msg) {
  switch (msg.type) {
    case "hello": {
      if (state.userId) return;
      const name = sanitize(msg.name || "anon", 32) || "anon";
      const color = /^#[0-9a-fA-F]{6}$/.test(msg.color) ? msg.color : randomColor();
      state.userId = uuid();
      state.name = name;
      state.color = color;
      // user code
      let code = (msg.userCode && !userCodes.has(msg.userCode)) ? msg.userCode : genUserCode();
      while (userCodes.has(code)) code = genUserCode();
      state.code = code;
      userCodes.set(code, state.userId);
      userIdToCode.set(state.userId, code);

      // auto-join lobby (recreate if it ever disappeared)
      const lobby = getRoom("LOBBY") || createRoom({ name: "Public Lobby", owner: "system", code: "LOBBY" });
      if (lobby) {
        joinRoom(lobby, state.userId, ws);
        state.rooms.add("LOBBY");
      }

      sendTo(ws, {
        type: "welcome",
        userId: state.userId,
        name: state.name,
        color: state.color,
        userCode: state.code,
        lobby: "LOBBY",
      });

      if (lobby) {
        sendTo(ws, { type: "room_joined", room: "LOBBY", name: lobby.name, history: lobby.history });
        broadcast(lobby, { type: "joined", room: "LOBBY", userId: state.userId, name: state.name, color: state.color }, state.userId);
        broadcastPresence(lobby);
      }
      break;
    }

    case "create_room": {
      if (!state.userId) return;
      const name = sanitize(msg.name || "New Room", 60);
      const room = createRoom({ name, owner: state.userId });
      if (!room) { sendTo(ws, { type: "error", message: "too many rooms" }); return; }
      joinRoom(room, state.userId, ws);
      state.rooms.add(room.code);
      sendTo(ws, { type: "room_created", code: room.code, name: room.name });
      sendTo(ws, { type: "room_joined", room: room.code, name: room.name, history: room.history });
      broadcastPresence(room);
      break;
    }

    case "join_room": {
      if (!state.userId) return;
      const room = getRoom(msg.code);
      if (!room) { sendTo(ws, { type: "error", message: "room not found" }); return; }
      if (!joinRoom(room, state.userId, ws)) { sendTo(ws, { type: "error", message: "room full" }); return; }
      state.rooms.add(room.code);
      sendTo(ws, { type: "room_joined", room: room.code, name: room.name, history: room.history, isDM: room.isDM });
      broadcast(room, { type: "joined", room: room.code, userId: state.userId, name: state.name, color: state.color }, state.userId);
      broadcastPresence(room);
      break;
    }

    case "leave_room": {
      if (!state.userId) return;
      const room = getRoom(msg.code);
      if (!room || room.code === "LOBBY") return;
      leaveRoom(room, state.userId);
      state.rooms.delete(room.code);
      sendTo(ws, { type: "room_left", room: room.code });
      broadcast(room, { type: "left", room: room.code, userId: state.userId, name: state.name }, state.userId);
      broadcastPresence(room);
      break;
    }

    case "dm": {
      if (!state.userId) return;
      const targetCode = sanitize(msg.code, 16).toLowerCase();
      const targetUserId = userCodes.get(targetCode);
      if (!targetUserId) { sendTo(ws, { type: "error", message: "user not found" }); return; }
      // find or create DM room between the two
      let dmRoom = [...rooms.values()].find((r) =>
        r.isDM && r.members.has(state.userId) && r.members.has(targetUserId));
      if (!dmRoom) {
        dmRoom = createRoom({ name: `${state.name} ↔ DM`, owner: state.userId, isDM: true, dmTarget: targetUserId });
        if (!dmRoom) { sendTo(ws, { type: "error", message: "too many rooms" }); return; }
      }
      // join both if online
      if (!dmRoom.members.has(state.userId)) { joinRoom(dmRoom, state.userId, ws); state.rooms.add(dmRoom.code); }
      const targetWs = [...connections.keys()].find((s) => connections.get(s).userId === targetUserId);
      if (targetWs) {
        const tState = connections.get(targetWs);
        if (!dmRoom.members.has(targetUserId)) { joinRoom(dmRoom, targetUserId, targetWs); tState.rooms.add(dmRoom.code); }
        sendTo(targetWs, { type: "dm_invite", room: dmRoom.code, from: { userId: state.userId, name: state.name, color: state.color } });
        sendTo(targetWs, { type: "room_joined", room: dmRoom.code, name: dmRoom.name, history: dmRoom.history, isDM: true });
      }
      sendTo(ws, { type: "room_created", code: dmRoom.code, name: dmRoom.name, isDM: true });
      sendTo(ws, { type: "room_joined", room: dmRoom.code, name: dmRoom.name, history: dmRoom.history, isDM: true });
      broadcastPresence(dmRoom);
      break;
    }

    case "post": {
      if (!state.userId) return;
      const room = getRoom(msg.room);
      if (!room || !room.members.has(state.userId)) return;
      const body = sanitize(msg.body, LIMITS.MAX_MSG_LEN);
      if (!body.trim()) return;
      const title = sanitize(msg.title || "", 120);
      const parentId = msg.parentId ? sanitize(String(msg.parentId), 64) : null;
      const id = uuid();
      const post = {
        id,
        type: "post",
        room: room.code,
        userId: state.userId,
        name: state.name,
        color: state.color,
        title,
        body,
        parentId,
        reactions: {},
        createdAt: Date.now(),
      };
      pushHistory(room, post);
      broadcast(room, { type: "message", message: post });
      break;
    }

    case "react": {
      if (!state.userId) return;
      const room = getRoom(msg.room);
      if (!room || !room.members.has(state.userId)) return;
      const emoji = sanitize(msg.emoji, 8);
      if (!emoji) return;
      const mid = sanitize(String(msg.messageId), 64);
      // find message in history
      const m = room.history.find((x) => x.id === mid);
      if (!m) return;
      m.reactions = m.reactions || {};
      const arr = Array.isArray(m.reactions[emoji]) ? m.reactions[emoji] : [];
      const idx = arr.indexOf(state.userId);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(state.userId);
      m.reactions[emoji] = arr;
      broadcast(room, { type: "reaction", room: room.code, messageId: mid, reactions: m.reactions });
      break;
    }

    case "typing": {
      if (!state.userId) return;
      const room = getRoom(msg.room);
      if (!room || !room.members.has(state.userId)) return;
      broadcast(room, { type: "typing", room: room.code, userId: state.userId, name: state.name, isTyping: !!msg.isTyping }, state.userId);
      break;
    }

    case "pin": {
      if (!state.userId) return;
      const room = getRoom(msg.room);
      if (!room || room.owner !== state.userId) return;
      const mid = sanitize(String(msg.messageId), 64);
      if (room.pins.has(mid)) room.pins.delete(mid); else room.pins.add(mid);
      const m = room.history.find((x) => x.id === mid);
      if (m) m.pinned = room.pins.has(mid);
      broadcast(room, { type: "pin", room: room.code, messageId: mid, pinned: room.pins.has(mid) });
      break;
    }

    default:
      break;
  }
}

function randomColor() {
  const palette = ["#ff006e", "#8338ec", "#3a86ff", "#06d6a0", "#ffbe0b", "#fb5607", "#00f5d4"];
  return palette[Math.floor(Math.random() * palette.length)];
}

// lobby
createRoom({ name: "Public Lobby", owner: "system", code: "LOBBY" });

server.listen(PORT, HOST, () => {
  console.log(`CIM server listening on ${HOST}:${PORT}`);
});
process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

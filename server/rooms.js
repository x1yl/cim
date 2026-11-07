// In-memory, ephemeral room store. Dies with the process.
const MAX_ROOMS = 500;
const MAX_MEMBERS = 100;
const MAX_HISTORY = 100;
const MAX_MSG_LEN = 4000;

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  // format XXX-XXX for readability
  return code.slice(0, 3) + "-" + code.slice(3);
}

export const rooms = new Map(); // code -> Room

export function createRoom({ name, owner, isDM = false, dmTarget = null, code: forcedCode = null }) {
  if (rooms.size >= MAX_ROOMS) return null;
  let code = forcedCode;
  if (!code) do { code = makeCode(); } while (rooms.has(code));
  code = code.toUpperCase().trim();
  if (rooms.has(code)) return rooms.get(code);
  const room = {
    code,
    name: (name || "Untitled").slice(0, 60),
    owner,
    isDM,
    dmTarget,
    members: new Set(), // userIds
    sockets: new Map(), // userId -> ws
    history: [], // last N messages
    pins: new Set(),
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code) {
  return rooms.get((code || "").toUpperCase().trim());
}

export function joinRoom(room, userId, ws) {
  if (room.members.size >= MAX_MEMBERS && !room.members.has(userId)) return false;
  room.members.add(userId);
  room.sockets.set(userId, ws);
  return true;
}

export function leaveRoom(room, userId) {
  room.members.delete(userId);
  room.sockets.delete(userId);
  // remove empty non-lobby rooms after a grace period? Keep simple: delete if empty & not lobby & not created recently
  if (room.members.size === 0 && room.code !== "LOBBY" && Date.now() - room.createdAt > 60_000) {
    rooms.delete(room.code);
  }
}

export function pushHistory(room, msg) {
  room.history.push(msg);
  if (room.history.length > MAX_HISTORY) room.history.shift();
}

export function broadcast(room, payload, exceptUserId = null) {
  const data = JSON.stringify(payload);
  for (const [uid, ws] of room.sockets) {
    if (uid === exceptUserId) continue;
    if (ws.readyState === 1) ws.send(data);
  }
}

export function sendTo(ws, payload) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify(payload));
}

export const LIMITS = { MAX_MSG_LEN, MAX_MEMBERS, MAX_ROOMS, MAX_HISTORY };

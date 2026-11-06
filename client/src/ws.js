import { useStore } from "./store";

let ws = null;
let reconnectTimer = null;
let reconnectDelay = 1000;
let listeners = new Set();

function url() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  // in dev, vite proxies /ws; in prod, same origin
  return `${proto}://${location.host}/ws`;
}

export function connect() {
  const store = useStore.getState();
  store.setStatus("connecting");
  try { ws = new WebSocket(url()); } catch { scheduleReconnect(); return; }

  ws.onopen = () => {
    reconnectDelay = 1000;
    const { name, color, userCode } = useStore.getState();
    if (name) {
      send({ type: "hello", name, color, userCode: userCode || undefined });
    }
  };

  ws.onmessage = (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    handle(msg);
  };

  ws.onclose = () => {
    useStore.getState().setStatus("disconnected");
    ws = null;
    scheduleReconnect();
  };
  ws.onerror = () => {};
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectDelay = Math.min(reconnectDelay * 2, 15000);
    connect();
  }, reconnectDelay);
}

export function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

export function isConnected() { return ws && ws.readyState === WebSocket.OPEN; }

function handle(msg) {
  const s = useStore.getState();
  switch (msg.type) {
    case "welcome":
      s.setStatus("connected");
      useStore.setState({ userId: msg.userId, userCode: msg.userCode, name: msg.name, color: msg.color });
      localStorage.setItem("cim_usercode", msg.userCode);
      localStorage.setItem("cim_name", msg.name);
      localStorage.setItem("cim_color", msg.color);
      break;
    case "room_created":
      s.upsertRoom({ code: msg.code, name: msg.name, isDM: msg.isDM });
      break;
    case "room_joined": {
      s.upsertRoom({ code: msg.room, name: msg.name, isDM: msg.isDM });
      s.setMessages(msg.room, msg.history || []);
      s.setActiveRoom(msg.room);
      break;
    }
    case "room_left":
      break;
    case "message":
      s.addMessage(msg.message.room, msg.message);
      if (s.sound) playPing();
      break;
    case "reaction":
      s.updateReactions(msg.room, msg.messageId, msg.reactions);
      break;
    case "typing":
      s.setTyping(msg.room, msg.userId, msg.name, msg.isTyping);
      break;
    case "presence":
      s.setPresence(msg.room, msg.members);
      break;
    case "joined":
      // presence handled separately; nothing to store
      break;
    case "left":
      break;
    case "dm_invite":
      s.upsertRoom({ code: msg.room, name: "DM", isDM: true });
      break;
    case "pin":
      s.togglePin(msg.room, msg.messageId, msg.pinned);
      break;
    case "error":
      console.warn("server:", msg.message);
      break;
    default:
      break;
  }
  for (const l of listeners) l(msg);
}

export function onMessage(cb) { listeners.add(cb); return () => listeners.delete(cb); }

function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; g.gain.value = 0.05;
    o.start(); o.stop(ctx.currentTime + 0.08);
  } catch {}
}

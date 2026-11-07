import { create } from "zustand";

const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch {} return v; };

export const useStore = create((set, get) => ({
  // identity
  name: localStorage.getItem("cim_name") || "",
  color: localStorage.getItem("cim_color") || "#ffb300",
  userCode: localStorage.getItem("cim_usercode") || "",
  userId: null,
  setName: (name) => { localStorage.setItem("cim_name", name); set({ name }); },
  setColor: (color) => { localStorage.setItem("cim_color", color); set({ color }); },

  // connection
  status: "disconnected", // disconnected | connecting | connected
  setStatus: (status) => set({ status }),

  // rooms
  rooms: {}, // code -> { code, name, isDM, history, members }
  activeRoom: null,
  setActiveRoom: (code) => set({ activeRoom: code }),
  upsertRoom: (room) => set((s) => ({ rooms: { ...s.rooms, [room.code || room.room]: { ...(s.rooms[room.code || room.room] || {}), ...room } } })),
  setHistory: (room, history) => set((s) => ({ rooms: { ...s.rooms, [room]: { ...(s.rooms[room] || {}), history } } })),

  // messages per room (merged from history + live)
  messages: {}, // room -> array
  addMessage: (room, message) => set((s) => {
    const arr = s.messages[room] || [];
    if (arr.some((m) => m.id === message.id)) return {};
    return { messages: { ...s.messages, [room]: [...arr, message] } };
  }),
  setMessages: (room, msgs) => set((s) => ({ messages: { ...s.messages, [room]: msgs } })),
  updateReactions: (room, messageId, reactions) => set((s) => {
    const arr = (s.messages[room] || []).map((m) => m.id === messageId ? { ...m, reactions } : m);
    return { messages: { ...s.messages, [room]: arr } };
  }),
  togglePin: (room, messageId, pinned) => set((s) => {
    const arr = (s.messages[room] || []).map((m) => m.id === messageId ? { ...m, pinned } : m);
    return { messages: { ...s.messages, [room]: arr } };
  }),

  // typing
  typing: {}, // room -> {userId: name}
  setTyping: (room, userId, name, isTyping) => set((s) => {
    const cur = { ...(s.typing[room] || {}) };
    if (isTyping) cur[userId] = name; else delete cur[userId];
    return { typing: { ...s.typing, [room]: cur } };
  }),

  // presence
  presence: {}, // room -> members[]
  setPresence: (room, members) => set((s) => ({ presence: { ...s.presence, [room]: members } })),

  // moderation
  moderation: null, // { enabled, model, failClosed }
  setModeration: (moderation) => set({ moderation }),
  moderationNotice: null, // { room, flagged, message }
  setModerationNotice: (notice) => set({ moderationNotice: notice }),

  // ui
  theme: localStorage.getItem("cim_theme") || "cyber",
  setTheme: (t) => { localStorage.setItem("cim_theme", t); set({ theme: t }); },
  sound: localStorage.getItem("cim_sound") === "1",
  setSound: (v) => { localStorage.setItem("cim_sound", v ? "1" : "0"); set({ sound: v }); },
  reducedMotion: false,
  setReducedMotion: (v) => set({ reducedMotion: v }),

  // command palette
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
}));

import { create } from "zustand";

const ls = (k, v) => { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch {} return v; };

export const useStore = create((set, get) => ({
  // identity
  name: localStorage.getItem("cim_name") || "",
  color: localStorage.getItem("cim_color") || "#ffb300",
  userCode: localStorage.getItem("cim_usercode") || "",
  userId: null,
  setName: (name) => { localStorage.setItem("cim_name", name); set({ name }); },
  clearName: () => { localStorage.removeItem("cim_name"); set({ name: "" }); },
  setColor: (color) => { localStorage.setItem("cim_color", color); set({ color }); },
  namePending: false,
  setNamePending: (namePending) => set({ namePending }),
  nameError: "",
  setNameError: (nameError) => set({ nameError }),

  // connection
  status: "disconnected", // disconnected | connecting | connected
  setStatus: (status) => set({ status }),

  // rooms
  rooms: {}, // code -> { code, name, isDM, visibility, history, members }
  activeRoom: null,
  setActiveRoom: (code) => set({ activeRoom: code }),
  upsertRoom: (room) => set((s) => ({ rooms: { ...s.rooms, [room.code || room.room]: { ...(s.rooms[room.code || room.room] || {}), ...room } } })),
  setHistory: (room, history) => set((s) => ({ rooms: { ...s.rooms, [room]: { ...(s.rooms[room] || {}), history } } })),
  removeRoom: (code) => set((s) => {
    const rooms = { ...s.rooms };
    const messages = { ...s.messages };
    const presence = { ...s.presence };
    const typing = { ...s.typing };
    delete rooms[code];
    delete messages[code];
    delete presence[code];
    delete typing[code];
    return {
      rooms, messages, presence, typing,
      activeRoom: s.activeRoom === code ? "LOBBY" : s.activeRoom,
    };
  }),

  // discoverable public rooms
  publicRooms: [], // [{ code, name, members, createdAt }]
  setPublicRooms: (publicRooms) => set({ publicRooms }),

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

  // background constellation density (0.5 = calm, 3 = very busy)
  particleDensity: (() => {
    const v = parseFloat(localStorage.getItem("cim_particles"));
    return Number.isFinite(v) ? Math.min(3, Math.max(0.5, v)) : 1.25;
  })(),
  setParticleDensity: (v) => {
    const n = Math.min(3, Math.max(0.5, Number(v) || 1.25));
    localStorage.setItem("cim_particles", String(n));
    set({ particleDensity: n });
  },

  // command palette
  paletteOpen: false,
  setPaletteOpen: (v) => set({ paletteOpen: v }),
}));

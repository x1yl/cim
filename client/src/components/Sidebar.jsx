import { useEffect, useState } from "react";
import { useStore } from "../store";
import { send, onMessage } from "../ws";
import { readableText } from "../colors";
import { ACCENT_COLORS } from "../palette";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Hash, MessageCircle, Copy, Check, Pencil, Loader2, Palette, Sparkles } from "lucide-react";

export default function Sidebar() {
  const {
    rooms, activeRoom, setActiveRoom, userCode, name, color, setColor, presence, status,
    namePending, nameError, setNamePending, setNameError,
    particleDensity, setParticleDensity,
  } = useStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [dmCode, setDmCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("rooms"); // rooms | join | dm
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [showColors, setShowColors] = useState(false);
  const [showBackground, setShowBackground] = useState(false);

  const roomList = Object.values(rooms);

  useEffect(() => {
    if (!editingName) setDraftName(name);
  }, [name, editingName]);

  useEffect(() => onMessage((msg) => {
    if (msg.type === "name_changed" && msg.userId === useStore.getState().userId) {
      setEditingName(false);
    }
  }), []);

  const startEditName = () => {
    setDraftName(name);
    setNameError("");
    setEditingName(true);
  };

  const cancelEditName = () => {
    if (namePending) return;
    setEditingName(false);
    setDraftName(name);
    setNameError("");
  };

  const saveName = (e) => {
    e.preventDefault();
    const n = draftName.trim().replace(/\s+/g, " ");
    if (!n) {
      setNameError("Display name cannot be empty.");
      return;
    }
    if (n === name) {
      setEditingName(false);
      setNameError("");
      return;
    }
    setNameError("");
    setNamePending(true);
    const ok = send({ type: "set_name", name: n });
    if (!ok) {
      setNamePending(false);
      setNameError("Not connected — reconnecting. Try again in a moment.");
    }
  };

  const createRoom = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    send({ type: "create_room", name: newName.trim() });
    setNewName("");
    setCreating(false);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    send({ type: "join_room", code: joinCode.trim() });
    setJoinCode("");
  };

  const startDm = (e) => {
    e.preventDefault();
    if (!dmCode.trim()) return;
    send({ type: "dm", code: dmCode.trim() });
    setDmCode("");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const changeColor = (c) => {
    setColor(c);
    // If the socket is reconnecting, hello() will sync the saved color later.
    send({ type: "set_color", color: c });
  };

  const toggleColors = () => {
    setShowColors((v) => !v);
    setShowBackground(false);
  };

  const toggleBackground = () => {
    setShowBackground((v) => !v);
    setShowColors(false);
  };

  return (
    <aside className="w-72 shrink-0 glass-strong border-r border-accent/20 flex flex-col relative z-10">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: color, color: readableText(color) }}
          >
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="font-semibold truncate">{name}</div>
              {!editingName && (
                <button
                  onClick={startEditName}
                  title="Edit display name"
                  aria-label="Edit display name"
                  className="text-slate-500 hover:text-accent transition shrink-0"
                >
                  <Pencil size={12} />
                </button>
              )}
              <button
                onClick={toggleColors}
                title="Change accent color"
                aria-label="Change accent color"
                aria-expanded={showColors}
                className={`transition shrink-0 ${showColors ? "text-accent" : "text-slate-500 hover:text-accent"}`}
              >
                <Palette size={12} />
              </button>
              <button
                onClick={toggleBackground}
                title="Background constellation"
                aria-label="Background constellation"
                aria-expanded={showBackground}
                className={`transition shrink-0 ${showBackground ? "text-accent" : "text-slate-500 hover:text-accent"}`}
              >
                <Sparkles size={12} />
              </button>
            </div>
            <button onClick={copyCode} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {userCode}
            </button>
          </div>
        </div>

        {showColors && (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Accent color</div>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => changeColor(c)}
                  title={c}
                  aria-label={`Use accent color ${c}`}
                  className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-110 ring-2 ring-white" : "hover:scale-110"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        )}

        {showBackground && (
          <div className="mt-3 rounded-lg bg-white/5 border border-white/10 px-2.5 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">Constellation</span>
              <span className="text-[10px] text-slate-500">{particleDensity.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.25"
              value={particleDensity}
              onChange={(e) => setParticleDensity(parseFloat(e.target.value))}
              aria-label="Constellation density"
              className="w-full cursor-pointer"
              style={{ accentColor: color }}
            />
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>Calm</span>
              <span>Busy</span>
            </div>
          </div>
        )}

        {editingName && (
          <form onSubmit={saveName} className="mt-3 space-y-2">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => { setDraftName(e.target.value); setNameError(""); }}
              maxLength={32}
              disabled={namePending}
              placeholder="your alias"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={namePending}
                className="flex-1 py-1.5 rounded-lg bg-accent text-accent-contrast text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {namePending ? <><Loader2 size={12} className="animate-spin" /> Checking name…</> : "Save name"}
              </button>
              <button
                type="button"
                onClick={cancelEditName}
                disabled={namePending}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-slate-500">Names are checked by Mistral before going live.</p>
          </form>
        )}

        {nameError && (
          <div className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1.5">
            {nameError}
          </div>
        )}
      </div>

      <div className="px-3 pt-3">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {["rooms", "join", "dm"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1.5 rounded-md capitalize transition ${tab === t ? "bg-accent text-accent-contrast" : "text-slate-400 hover:text-white"}`}
            >
              {t === "rooms" ? "Rooms" : t === "join" ? "Join" : "DM"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tab === "rooms" && (
          <>
            <button
              onClick={() => setCreating((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
            >
              <Plus size={16} /> New room
            </button>
            <AnimatePresence>
              {creating && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={createRoom}
                  className="space-y-2"
                >
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="room name"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-accent focus:outline-none"
                  />
                  <button type="submit" className="w-full py-2 rounded-lg bg-accent text-accent-contrast text-sm font-medium">Create</button>
                </motion.form>
              )}
            </AnimatePresence>

            {roomList.map((r) => {
              const members = (presence[r.code] || []).length;
              const isActive = activeRoom === r.code;
              return (
                <motion.button
                  key={r.code}
                  whileHover={{ x: 2 }}
                  onClick={() => setActiveRoom(r.code)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${isActive ? "bg-accent/20 border border-accent/40" : "hover:bg-white/5"}`}
                >
                  {r.isDM ? <MessageCircle size={15} className="text-accent" /> : <Hash size={15} className="text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.name || r.code}</div>
                    <div className="text-[10px] text-slate-500">{r.code} · {members} online</div>
                  </div>
                </motion.button>
              );
            })}
          </>
        )}

        {tab === "join" && (
          <form onSubmit={joinRoom} className="space-y-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <button type="submit" className="w-full py-2 rounded-lg bg-accent text-accent-contrast text-sm font-medium">Join room</button>
            <p className="text-xs text-slate-500">Enter a 6-character room code shared by someone.</p>
          </form>
        )}

        {tab === "dm" && (
          <form onSubmit={startDm} className="space-y-2">
            <input
              value={dmCode}
              onChange={(e) => setDmCode(e.target.value.toLowerCase())}
              placeholder="user code"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:border-accent focus:outline-none"
            />
            <button type="submit" className="w-full py-2 rounded-lg bg-accent text-accent-contrast text-sm font-medium">Start DM</button>
            <p className="text-xs text-slate-500">Ask the other person for their personal code (shown under their name).</p>
          </form>
        )}
      </div>

      <div className="p-3 border-t border-accent/10 space-y-1">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span className={`w-1.5 h-1.5 rounded-full ${status === "connected" ? "bg-green-400 shadow-[0_0_6px_#4ade80]" : "bg-yellow-400 animate-pulse"}`} />
          <span className={status === "connected" ? "text-green-400" : "text-yellow-400"}>{status}</span>
        </div>
        <div className="text-[10px] text-slate-500">Rooms vanish when server restarts. Nothing is stored.</div>
      </div>
    </aside>
  );
}

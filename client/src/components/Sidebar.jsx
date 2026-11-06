import { useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Hash, MessageCircle, Search, LogOut, Copy, Check } from "lucide-react";

export default function Sidebar() {
  const { rooms, activeRoom, setActiveRoom, userCode, name, color, presence } = useStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [dmCode, setDmCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("rooms"); // rooms | join | dm

  const roomList = Object.values(rooms);

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

  return (
    <aside className="w-72 shrink-0 glass border-r border-white/5 flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: color }}>
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{name}</div>
            <button onClick={copyCode} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {userCode}
            </button>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {["rooms", "join", "dm"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 text-xs py-1.5 rounded-md capitalize transition ${tab === t ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"}`}
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
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-purple-500 focus:outline-none"
                  />
                  <button type="submit" className="w-full py-2 rounded-lg bg-purple-600 text-sm font-medium">Create</button>
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
                  className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center gap-2 ${isActive ? "bg-purple-600/30 border border-purple-500/40" : "hover:bg-white/5"}`}
                >
                  {r.isDM ? <MessageCircle size={15} className="text-pink-400" /> : <Hash size={15} className="text-slate-400" />}
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
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:border-purple-500 focus:outline-none"
            />
            <button type="submit" className="w-full py-2 rounded-lg bg-blue-600 text-sm font-medium">Join room</button>
            <p className="text-xs text-slate-500">Enter a 6-character room code shared by someone.</p>
          </form>
        )}

        {tab === "dm" && (
          <form onSubmit={startDm} className="space-y-2">
            <input
              value={dmCode}
              onChange={(e) => setDmCode(e.target.value.toLowerCase())}
              placeholder="user code"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-mono focus:border-purple-500 focus:outline-none"
            />
            <button type="submit" className="w-full py-2 rounded-lg bg-pink-600 text-sm font-medium">Start DM</button>
            <p className="text-xs text-slate-500">Ask the other person for their personal code (shown under their name).</p>
          </form>
        )}
      </div>

      <div className="p-3 border-t border-white/5 text-[10px] text-slate-500">
        Rooms vanish when server restarts. Nothing is stored.
      </div>
    </aside>
  );
}

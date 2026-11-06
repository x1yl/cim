import { useEffect, useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Hash, Plus } from "lucide-react";

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, rooms, setActiveRoom } = useStore();
  const [q, setQ] = useState("");

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [paletteOpen, setPaletteOpen]);

  const roomList = Object.values(rooms).filter((r) =>
    (r.name || r.code).toLowerCase().includes(q.toLowerCase())
  );

  const go = (code) => { setActiveRoom(code); setPaletteOpen(false); setQ(""); };

  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24"
          onClick={() => setPaletteOpen(false)}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass rounded-2xl w-full max-w-lg shadow-glow overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <Search size={16} className="text-slate-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search rooms, or type 'create: name'..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <kbd className="text-[10px] px-1.5 py-0.5 bg-white/5 rounded">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {roomList.map((r) => (
                <button
                  key={r.code}
                  onClick={() => go(r.code)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-sm"
                >
                  <Hash size={14} className="text-slate-400" />
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{r.code}</span>
                </button>
              ))}
              {q.startsWith("create:") && (
                <button
                  onClick={() => { send({ type: "create_room", name: q.slice(7).trim() }); setPaletteOpen(false); setQ(""); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-sm text-purple-300"
                >
                  <Plus size={14} /> Create room "{q.slice(7).trim()}"
                </button>
              )}
              {roomList.length === 0 && !q.startsWith("create:") && (
                <div className="text-center text-slate-500 text-sm py-6">No matches. Try "create: RoomName"</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

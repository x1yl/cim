import { useState } from "react";
import { useStore } from "../store";
import { motion } from "framer-motion";

const COLORS = ["#ff006e","#8338ec","#3a86ff","#06d6a0","#ffbe0b","#fb5607","#00f5d4","#f72585"];

export default function Onboard() {
  const { setName, setColor } = useStore();
  const [name, setNameLocal] = useState("");
  const [color, setColorLocal] = useState(COLORS[1]);

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim().slice(0, 32) || "anon";
    setName(n);
    setColor(color);
  };

  return (
    <div className="h-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="glass rounded-2xl p-8 w-full max-w-md shadow-glow"
      >
        <h1 className="text-4xl font-extrabold glow-text mb-1">CIM</h1>
        <p className="text-slate-400 text-sm mb-6">Ephemeral communication. No accounts. No storage. Just vibes.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400">Display name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              placeholder="your alias"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400">Accent color</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColorLocal(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition shadow-glow"
          >
            Enter the forum →
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-4">Your name lives only in this browser. Nothing is stored on the server.</p>
      </motion.div>
    </div>
  );
}

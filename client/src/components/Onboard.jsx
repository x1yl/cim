import { useState } from "react";
import { useStore } from "../store";
import { motion } from "framer-motion";

const COLORS = ["#00e5ff","#ffb300","#ff1744","#06d6a0","#ffbe0b","#fb5607","#00f5d4","#f72585"];

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
    <div className="h-full flex items-center justify-center p-6 relative z-10">
      <motion.div
        initial={{ opacity: 1, y: 0, scale: 1 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="glass-strong panel-angular p-8 w-full max-w-md shadow-glow"
      >
        <h1 className="text-5xl font-black font-display glow-text mb-1 tracking-wider">CIM</h1>
        <p className="text-slate-400 text-sm mb-6">Ephemeral communication. No accounts. No storage. Just vibes.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400">Display name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setNameLocal(e.target.value)}
              placeholder="your alias"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
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
            className="w-full py-3 panel-angular font-bold font-display tracking-wider bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-400 hover:to-red-500 transition shadow-glow uppercase"
          >
            Enter the forum →
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-4">Your name lives only in this browser. Nothing is stored on the server.</p>
      </motion.div>
    </div>
  );
}

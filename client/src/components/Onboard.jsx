import { useState } from "react";
import { useStore } from "../store";
import { hello } from "../ws";
import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { ACCENT_COLORS } from "../palette";

export default function Onboard() {
  const {
    namePending, nameError, setColor, color: storedColor,
    setNamePending, setNameError,
  } = useStore();
  const [name, setNameLocal] = useState("");
  const [color, setColorLocal] = useState(storedColor || ACCENT_COLORS[1]);

  const pickColor = (c) => {
    setColorLocal(c);
    setColor(c); // live-preview the theme while onboarding
  };

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim().replace(/\s+/g, " ").slice(0, 32) || "anon";
    setNameError("");
    setNamePending(true);
    hello({ name: n, color });
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
              onChange={(e) => { setNameLocal(e.target.value); setNameError(""); }}
              maxLength={32}
              disabled={namePending}
              placeholder="your alias"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
            />
            {nameError && (
              <div className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {nameError}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-slate-400">Accent color</label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {ACCENT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => pickColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={namePending}
            className="w-full py-3 panel-angular font-bold font-display tracking-wider bg-accent text-accent-contrast hover:opacity-90 transition shadow-glow uppercase disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {namePending
              ? <><Loader2 size={16} className="animate-spin" /> Checking name…</>
              : "Enter the forum →"}
          </button>
        </form>
        <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-4">
          <ShieldCheck size={12} /> Names are checked by Mistral before you enter.
        </p>
      </motion.div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { motion } from "framer-motion";
import { Send, ShieldCheck } from "lucide-react";

export default function Composer({ room }) {
  const moderation = useStore((s) => s.moderation);
  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [showTitle, setShowTitle] = useState(false);
  const [typing, setTypingState] = useState(false);
  const typingTimer = useRef(null);

  const handleTyping = (val) => {
    setBody(val);
    if (!typing) {
      setTypingState(true);
      send({ type: "typing", room, isTyping: true });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTypingState(false);
      send({ type: "typing", room, isTyping: false });
    }, 1200);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    send({ type: "post", room, title: showTitle ? title.trim() : "", body: body.trim() });
    setBody("");
    setTitle("");
    setTypingState(false);
    send({ type: "typing", room, isTyping: false });
    clearTimeout(typingTimer.current);
  };

  // Ctrl+Enter submit
  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(e);
  };

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-accent/20 glass-strong p-4 space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTitle((v) => !v)}
          className={`text-xs px-2 py-1 rounded transition ${showTitle ? "bg-accent text-accent-contrast" : "bg-white/5"}`}
        >
          Title
        </button>
        <span className="text-[10px] text-slate-500">Markdown supported · Ctrl+Enter to send</span>
        {moderation?.enabled && (
          <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-400/80" title={`Moderated by ${moderation.model}`}>
            <ShieldCheck size={12} /> AI moderated
          </span>
        )}
      </div>
      {showTitle && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title (optional)"
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold focus:border-accent focus:outline-none"
        />
      )}
      <div className="flex gap-2 items-end">
        <textarea
          value={body}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message... (markdown)"
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm resize-none focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          type="submit"
          className="px-5 py-2 panel-angular bg-accent text-accent-contrast font-bold font-display tracking-wider flex items-center gap-2 shadow-glow uppercase hover:opacity-90 transition"
        >
          <Send size={16} /> Send
        </motion.button>
      </div>
    </form>
  );
}

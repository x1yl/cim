import { useState } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import confetti from "canvas-confetti";
import { Reply, Pin, Smile } from "lucide-react";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🤔", "🚀", "👀", "🔥"];

export default function Message({ message, room, isReply }) {
  const { userId, sound } = useStore();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const isOwn = message.userId === userId;

  const react = (emoji) => {
    send({ type: "react", room, messageId: message.id, emoji });
    setShowEmoji(false);
    if (emoji === "🎉") confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
  };

  const submitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    send({ type: "post", room, body: replyText.trim(), parentId: message.id });
    setReplyText("");
    setReplying(false);
  };

  const pin = () => send({ type: "pin", room, messageId: message.id });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className={`group relative rounded-xl p-4 ${isOwn ? "bg-purple-500/10 border border-purple-500/20" : "bg-white/5 border border-white/5"} ${message.pinned ? "ring-2 ring-yellow-500/40" : ""}`}
    >
      {message.pinned && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Pin size={10} /> PINNED
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold shadow" style={{ background: message.color || "#8338ec" }}>
          {(message.name || "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{message.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{new Date(message.createdAt).toLocaleTimeString()}</span>
          </div>
          {message.title && <div className="font-bold text-base mt-1">{message.title}</div>}
          <div className="prose-cim text-sm mt-1 break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {message.body}
            </ReactMarkdown>
          </div>

          {/* reactions */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {Object.entries(message.reactions || {}).map(([emoji, users]) => (
              users.length > 0 && (
                <button
                  key={emoji}
                  onClick={() => react(emoji)}
                  className={`px-2 py-0.5 rounded-full text-xs border transition ${users.includes(userId) ? "bg-purple-600/40 border-purple-500" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  {emoji} <span className="ml-1 text-slate-300">{users.length}</span>
                </button>
              )
            ))}
            <div className="relative">
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition"
              >
                <Smile size={12} />
              </button>
              {showEmoji && (
                <div className="absolute bottom-full mb-1 left-0 glass rounded-lg p-1 flex gap-1 z-10">
                  {EMOJIS.map((e) => (
                    <button key={e} onClick={() => react(e)} className="hover:scale-125 transition text-base">{e}</button>
                  ))}
                </div>
              )}
            </div>
            {!isReply && (
              <button
                onClick={() => setReplying((v) => !v)}
                className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
              >
                <Reply size={12} /> Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={pin}
                className="px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
              >
                <Pin size={12} />
              </button>
            )}
          </div>

          {replying && (
            <form onSubmit={submitReply} className="mt-2 flex gap-2">
              <input
                autoFocus
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="write a reply..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm focus:border-purple-500 focus:outline-none"
              />
              <button type="submit" className="px-3 py-1.5 rounded-lg bg-purple-600 text-sm">Reply</button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}

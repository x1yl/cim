import { useEffect, useState, useRef } from "react";
import { useStore } from "../store";
import { send } from "../ws";
import { motion, AnimatePresence } from "framer-motion";
import Message from "./Message.jsx";
import Composer from "./Composer.jsx";
import Typing from "./Typing.jsx";
import { Hash, MessageCircle, Users, Pin } from "lucide-react";

export default function RoomView() {
  const { rooms, activeRoom, messages, presence } = useStore();
  const room = rooms[activeRoom];
  const msgs = messages[activeRoom] || [];
  const members = presence[activeRoom] || [];
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, activeRoom]);

  if (!activeRoom) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        Select or create a room
      </div>
    );
  }

  // build threads
  const topLevel = msgs.filter((m) => !m.parentId);
  const repliesOf = (id) => msgs.filter((m) => m.parentId === id);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <header className="px-6 py-4 border-b border-amber-500/20 glass-strong flex items-center gap-3">
        {room?.isDM ? <MessageCircle className="text-cyan-400" /> : <Hash className="text-slate-400" />}
        <div className="min-w-0 flex-1">
          <h2 className="font-bold font-display text-xl tracking-wide truncate text-amber-300">{room?.name || activeRoom}</h2>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-mono">{activeRoom}</span>
            <span>·</span>
            <Users size={12} />
            <span>{members.length} online</span>
          </div>
        </div>
        <div className="flex -space-x-2">
          {members.slice(0, 5).map((m) => (
            <div key={m.userId} title={m.name} className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold" style={{ background: m.color || "#ffb300" }}>
              {(m.name || "?").slice(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {topLevel.map((m) => (
            <div key={m.id} className="space-y-2">
              <Message message={m} room={activeRoom} />
              {repliesOf(m.id).map((r) => (
                <div key={r.id} className="ml-8 border-l-2 border-white/5 pl-4">
                  <Message message={r} room={activeRoom} isReply />
                </div>
              ))}
            </div>
          ))}
        </AnimatePresence>
        {msgs.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <div className="text-4xl mb-2">✨</div>
            No messages yet. Be the first to post.
          </div>
        )}
        <Typing room={activeRoom} />
      </div>

      <Composer room={activeRoom} />
    </div>
  );
}

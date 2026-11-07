import { useStore } from "../store";

export default function Typing({ room }) {
  const typing = useStore((s) => s.typing[room]);
  const names = Object.values(typing || {});
  if (names.length === 0) return null;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      {names.join(", ")} {names.length === 1 ? "is" : "are"} typing...
    </div>
  );
}

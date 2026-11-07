import { useEffect } from "react";
import { useStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

const LABELS = {
  sexual: "sexual content",
  hate_and_discrimination: "hate / discrimination",
  violence_and_threats: "violence / threats",
  dangerous_and_criminal_content: "dangerous / criminal content",
  selfharm: "self-harm",
  health: "health misinformation",
  financial: "financial misinformation",
  law: "legal misinformation",
  pii: "personal information",
  moderation_unavailable: "moderation service unavailable",
};

export default function ModerationNotice({ room }) {
  const notice = useStore((s) => s.moderationNotice);
  const setNotice = useStore((s) => s.setModerationNotice);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 9000);
    return () => clearTimeout(t);
  }, [notice, setNotice]);

  const visible = notice && notice.room === room;
  const flagged = (notice?.flagged || []).map((k) => LABELS[k] || k);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1, height: "auto" }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mx-4 mb-2 overflow-hidden"
        >
          <div className="panel-angular border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-start gap-3">
            <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={18} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-red-300">
                {notice.message}
              </div>
              {flagged.length > 0 && (
                <div className="text-xs text-red-200/70 mt-0.5">
                  Flagged: {flagged.join(", ")}
                </div>
              )}
              <div className="text-[10px] text-red-200/50 mt-1 uppercase tracking-wider">
                Checked by mistral-moderation before sending · nothing was posted
              </div>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-red-300/70 hover:text-red-200 transition"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

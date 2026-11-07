import { useEffect } from "react";
import { useStore } from "./store";
import { connect, send, isConnected } from "./ws";
import Aurora from "./components/Aurora.jsx";
import Particles from "./components/Particles.jsx";
import Onboard from "./components/Onboard.jsx";
import Sidebar from "./components/Sidebar.jsx";
import RoomView from "./components/RoomView.jsx";
import CommandPalette from "./components/CommandPalette.jsx";

export default function App() {
  const { name, status, theme, reducedMotion } = useStore();

  useEffect(() => {
    connect();
  }, []);

  useEffect(() => {
    document.documentElement.className = theme === "minimal" ? "" : "dark";
  }, [theme]);

  // reduced motion detection
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    useStore.getState().setReducedMotion(mq.matches);
    const h = (e) => useStore.getState().setReducedMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  if (!name) return (
    <>
      <Aurora />
      <Particles />
      <Onboard />
    </>
  );

  return (
    <div className="h-full flex relative overflow-hidden z-10">
      <Aurora />
      <Particles />
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <RoomView />
      </main>
      <CommandPalette />
      <div className="fixed top-3 right-3 glass px-3 py-1.5 rounded-full text-xs flex items-center gap-2 z-50 panel-angular">
        <span className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-green-400" : "bg-yellow-400 animate-pulse"}`} />
        {status === "connected" ? "connected" : status}
      </div>
    </div>
  );
}

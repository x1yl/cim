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
  const { name, theme } = useStore();

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
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <RoomView />
      </main>
      <CommandPalette />
    </div>
  );
}

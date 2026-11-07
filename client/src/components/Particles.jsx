import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { hexToRgb } from "../colors";

export default function Particles() {
  const canvasRef = useRef(null);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const color = useStore((s) => s.color);
  const density = useStore((s) => s.particleDensity);

  useEffect(() => {
    if (reducedMotion) return;
    const rgb = hexToRgb(color) || { r: 255, g: 179, b: 0 };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let pts = [];

    const makePoints = () => {
      // Scale the count with the viewport so wide screens stay busy.
      const area = canvas.width * canvas.height;
      const base = Math.round(area / 15000);
      const count = Math.max(40, Math.min(320, Math.round(base * density)));
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.5,
        a: Math.random() * 0.45 + 0.25,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      makePoints();
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.a})`;
        ctx.fill();
      }
      // connect close points
      const linkDist = 130;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${0.16 * (1 - d / linkDist)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [reducedMotion, color, density]);

  if (reducedMotion) return null;
  return <canvas ref={canvasRef} className="particles" />;
}

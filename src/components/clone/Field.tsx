"use client";

import { useEffect, useRef } from "react";

export interface FieldState { status: string; events: number; turns: number; children: number; pulse: number }

/**
 * The living field. Every visual quantity is read from the clone's state:
 *   events   → smoke density          turns    → rings inside the pearl
 *   children → orbiting pearls        status   → breath (waiting) or stillness and light (alive)
 *   pulse    → a wave each time a real event arrives
 * Reduced motion: one still frame per state change, same meaning.
 */
export function Field({ s, label, anchor = 0.46, scale = 1 }: { s: FieldState; label: string; anchor?: number; scale?: number }) {
  const geo = useRef({ anchor, scale });
  geo.current = { anchor, scale };
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef(s);
  const waves = useRef<{ t0: number }[]>([]);
  const lastPulse = useRef(s.pulse);
  const drawRef = useRef<((t: number) => void) | null>(null);
  st.current = s;

  useEffect(() => {
    if (s.pulse !== lastPulse.current) { lastPulse.current = s.pulse; waves.current.push({ t0: performance.now() }); }
  }, [s.pulse]);

  useEffect(() => {
    const c = ref.current!; const g = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, w = 0, h = 0, dpr = 1;
    const seeds = Array.from({ length: 48 }, (_, i) => ({ a: (i * 2.399) % (Math.PI * 2), r: 0.18 + ((i * 0.618) % 1) * 0.55, s: 0.00004 + ((i * 0.37) % 1) * 0.00008, z: 0.5 + ((i * 0.73) % 1) }));
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); w = c.clientWidth; h = c.clientHeight; c.width = w * dpr; c.height = h * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(performance.now()); });
    ro.observe(c); resize();

    function draw(t: number) {
      const S = st.current, cx = w / 2, cy = h * geo.current.anchor, m = Math.min(w, h) * geo.current.scale;
      const alive = S.status === "ALIVE", waiting = S.status === "WAITING" || S.status === "OPENED";
      g.clearRect(0, 0, w, h);
      // smoke: density from the number of events in the chain
      const n = Math.min(seeds.length, 10 + S.events * 6);
      for (let i = 0; i < n; i++) {
        const p = seeds[i], a = p.a + (reduce ? 0 : t * p.s * (alive ? 0.6 : 1));
        const x = cx + Math.cos(a) * p.r * m * 0.9, y = cy + Math.sin(a * 1.3) * p.r * m * 0.55;
        const rad = m * 0.22 * p.z;
        const grd = g.createRadialGradient(x, y, 0, x, y, rad);
        const alpha = (alive ? 0.06 : 0.035) * p.z;
        grd.addColorStop(0, `rgba(${alive ? "236,228,212" : "190,196,208"},${alpha})`); grd.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      }
      // the pearl: breathes while waiting, settles when alive
      const breath = waiting && !reduce ? 1 + Math.sin(t / 1400) * 0.035 : 1;
      const R = m * (alive ? 0.13 : 0.11) * breath;
      const glow = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 3.2);
      glow.addColorStop(0, `rgba(245,238,222,${alive ? 0.22 : 0.1})`); glow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = glow; g.beginPath(); g.arc(cx, cy, R * 3.2, 0, Math.PI * 2); g.fill();
      const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
      body.addColorStop(0, "#fffdf8"); body.addColorStop(0.45, alive ? "#e9e1cf" : "#cfd2d8"); body.addColorStop(1, alive ? "#8d826d" : "#5d626c");
      g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
      // rings: one per captured turn (max 12)
      g.lineWidth = 1;
      for (let i = 0; i < Math.min(12, S.turns); i++) { g.strokeStyle = `rgba(236,228,212,${0.18 - i * 0.012})`; g.beginPath(); g.arc(cx, cy, R * (1.25 + i * 0.13), 0, Math.PI * 2); g.stroke(); }
      // orbits: one per continuation or branch
      for (let i = 0; i < Math.min(12, S.children); i++) {
        const a = (i / Math.max(1, S.children)) * Math.PI * 2 + (reduce ? 0 : t / 6000);
        const or = R * 2.4, x = cx + Math.cos(a) * or, y = cy + Math.sin(a) * or * 0.6;
        g.fillStyle = "rgba(245,238,222,0.85)"; g.beginPath(); g.arc(x, y, Math.max(2.5, R * 0.12), 0, Math.PI * 2); g.fill();
      }
      // waves: one per arrived event
      waves.current = waves.current.filter((wv) => t - wv.t0 < 2200);
      for (const wv of waves.current) { const k = (t - wv.t0) / 2200; g.strokeStyle = `rgba(245,238,222,${0.5 * (1 - k)})`; g.lineWidth = 2 * (1 - k) + 0.5; g.beginPath(); g.arc(cx, cy, R * (1 + k * 4), 0, Math.PI * 2); g.stroke(); }
    }
    drawRef.current = draw;
    const loop = (t: number) => { if (!document.hidden) draw(t); raf = requestAnimationFrame(loop); };
    if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) drawRef.current?.(performance.now());
  }, [s]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" role="img" aria-label={label} />;
}

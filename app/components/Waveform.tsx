"use client";

import { useEffect, useRef } from "react";

// ─── Fixed base shape — matches the GIF exactly ───────────────────────────────
// These are the RESTING heights in pixels (half-height, mirrored top+bottom).
// Small dots on edges, one main hill peak ~bar 15, secondary bump ~bar 26, quiet tail.
const BASE: number[] = [
  2, 2, 2, 2, 3, 3, 3, 3, 4, 4,
  4, 5, 6, 8, 10, 14, 16, 14, 12, 10,
  8, 6, 5, 4, 4, 5, 8, 10, 8, 6,
  4, 3, 3, 4, 5, 6, 5, 4, 4, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
  3, 3, 3, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
  2, 2, 2, 2, 2,
];

const N = BASE.length;

// Per-bar: how much it can spike above base (the "burst" amplitude)
// Peak bars spike massively (up to 4x), quiet bars barely move
const SPIKE_AMPLITUDE: number[] = BASE.map((h, i) => {
  if (i >= 11 && i <= 20) return h * 3.2;   // main hill — huge spikes
  if (i >= 23 && i <= 30) return h * 2.8;   // secondary bump — large spikes
  if (i >= 8  && i <= 10) return h * 1.5;   // rising edge
  if (i >= 31 && i <= 38) return h * 1.2;   // trailing edge
  return h * 0.35;                           // quiet bars — barely move
});

// Each bar has its own independent phase offset and speed
// so they never move in unison — organic, not mechanical
const PHASE:    number[] = BASE.map((_, i) => (i * 0.71 + Math.sin(i * 1.3)) % (Math.PI * 2));
const SPEED:    number[] = BASE.map((_, i) => 1.8 + (i % 7) * 0.35 + Math.sin(i * 0.4) * 0.4);

interface Props {
  playing: boolean;
}

export default function Waveform({ playing }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const tRef         = useRef(0);
  const lastTsRef    = useRef<number | null>(null);
  const playingRef   = useRef(playing);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Size canvas on mount
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr  = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width        = rect.width  * dpr;
    canvas.height       = rect.height * dpr;
    canvas.style.width  = rect.width  + "px";
    canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.width  / dpr;
      const H   = canvas.height / dpr;
      const midY = H / 2;

      // Advance time only while playing
      if (playingRef.current) {
        if (lastTsRef.current !== null) {
          tRef.current += (ts - lastTsRef.current) / 1000;
        }
        lastTsRef.current = ts;
      } else {
        lastTsRef.current = null;
      }

      const t = tRef.current;

      ctx.clearRect(0, 0, W, H);

      // Bar geometry — fit exactly within the canvas width
      const totalGap  = N - 1;
      const barW      = 4.5;
      const gapW      = (W - barW * N) / totalGap;

      for (let i = 0; i < N; i++) {
        const base  = BASE[i];
        const spike = SPIKE_AMPLITUDE[i];
        const phi   = PHASE[i];
        const spd   = SPEED[i];

        // Height oscillation:
        // osc ranges -1 → 1, but we only use the positive half (bars grow from base)
        // This gives big burst spikes that collapse back to base, not symmetric breathing
        const raw = Math.sin(t * spd * Math.PI * 2 - phi);
        // Rectify + bias: result is 0 → 1 (0 = at base, 1 = full spike)
        const osc = Math.max(0, raw);

        const halfH = playingRef.current
          ? base + spike * osc
          : base; // static when stopped/paused

        // Brightness: brighter when tall
        const brightness = 0.35 + (halfH / (base + spike)) * 0.65;
        const alpha      = Math.min(1, brightness);

        // White pill bar, centred vertically, mirrored top+bottom
        const x      = i * (barW + gapW);
        const barH   = halfH * 2;
        const y      = midY - halfH;

        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, barW / 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.fill();

        // Soft glow on tall bars
        if (halfH > 10) {
          ctx.shadowColor = "rgba(255,255,255,0.4)";
          ctx.shadowBlur  = 4;
          ctx.fill();
          ctx.shadowBlur  = 0;
        }
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width:    "100%",
        height:   90,
        overflow: "hidden",
        margin:   "18px 0 20px",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

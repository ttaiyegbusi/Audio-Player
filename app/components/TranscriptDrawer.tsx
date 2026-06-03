"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Pause, Play, Square } from "lucide-react";

export interface TranscriptLine {
  id: number;
  startTime: number;
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lines: TranscriptLine[];
  currentTime: number;
  playing: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  trackTitle: string;
}

type Position = "right" | "bottom";

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ─── Spring engine (pure JS, no React state in hot path) ──────────────────────
class Spring {
  pos: number; vel: number; stiffness: number; damping: number;
  constructor(init: number, stiffness = 340, damping = 30) {
    this.pos = init; this.vel = 0; this.stiffness = stiffness; this.damping = damping;
  }
  step(target: number): boolean {
    const F = -this.stiffness * (this.pos - target) - this.damping * this.vel;
    this.vel += F / 60; this.pos += this.vel / 60;
    const settled = Math.abs(this.pos - target) < 0.5 && Math.abs(this.vel) < 0.5;
    if (settled) { this.pos = target; this.vel = 0; }
    return settled;
  }
}

export default function TranscriptDrawer({ open, onClose, lines, currentTime, playing, onPlayPause, onStop, trackTitle }: Props) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>("right");
  const drawerRef = useRef<HTMLDivElement>(null);
  const scrimRef  = useRef<HTMLDivElement>(null);
  const spring    = useRef(new Spring(100)); // 0=open, 100=closed (percent)
  const rafRef    = useRef<number>(0);
  const openRef   = useRef(open);
  const posRef    = useRef<Position>("right");

  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs  = useRef<(HTMLDivElement | null)[]>([]);

  const activeIdx = lines.reduce((acc, line, i) =>
    currentTime >= line.startTime ? i : acc, 0);

  useEffect(() => {
    const el = lineRefs.current[activeIdx];
    const container = scrollRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: Math.max(0, el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2), behavior: "smooth" });
  }, [activeIdx]);

  useEffect(() => { if (open) setMounted(true); }, [open]);

  // ── Apply transform directly to DOM — zero React re-renders ───────────────
  const applyTransform = useCallback((pct: number, pos: Position) => {
    const drawer = drawerRef.current;
    const scrim  = scrimRef.current;
    if (!drawer) return;

    const clamped = Math.max(0, Math.min(110, pct));
    if (pos === "right") {
      drawer.style.transform = `translateX(${clamped}%)`;
    } else {
      drawer.style.transform = `translateY(${clamped}%)`;
    }
    if (scrim) scrim.style.background = `rgba(0,0,0,${Math.max(0, (1 - clamped / 100) * 0.6)})`;
  }, []);

  // ── Run spring animation ──────────────────────────────────────────────────
  const runSpring = useCallback((target: number, pos: Position, onSettle?: () => void) => {
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      const settled = spring.current.step(target);
      applyTransform(spring.current.pos, pos);
      if (settled) { onSettle?.(); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [applyTransform]);

  // ── React to open/close ───────────────────────────────────────────────────
  useEffect(() => {
    openRef.current = open;
    if (open) {
      runSpring(0, posRef.current);
    } else {
      runSpring(100, posRef.current);
    }
  }, [open, runSpring]);

  // ── Switch position ───────────────────────────────────────────────────────
  const switchPosition = useCallback((to: Position) => {
    if (to === posRef.current) return;
    // Spring out
    runSpring(100, posRef.current, () => {
      // Swap
      posRef.current = to;
      setPosition(to);
      spring.current.pos = 100;
      spring.current.vel = 0;
      // Apply immediately so no flash
      applyTransform(100, to);
      // Spring back in after a tick
      requestAnimationFrame(() => runSpring(0, to));
    });
  }, [runSpring, applyTransform]);

  // ── Drag — all DOM direct, no React state ─────────────────────────────────
  const drag = useRef({ active: false, startX: 0, startY: 0, basePos: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelAnimationFrame(rafRef.current);
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      basePos: spring.current.pos,
    };
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const pos = posRef.current;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    let delta = 0;
    if (pos === "right") {
      // Primary: drag right to dismiss
      // Secondary: drag down to switch to bottom
      delta = Math.max(0, dx);
      const downDelta = Math.max(0, dy);
      // If dragging down more than right, show downward motion
      if (downDelta > Math.abs(dx) && downDelta > 20) {
        delta = downDelta * 0.4; // rubber-band feel
      }
    } else {
      // Primary: drag down to dismiss
      // Secondary: drag left to switch to right
      delta = Math.max(0, dy);
      const leftDelta = Math.max(0, -dx);
      if (leftDelta > Math.abs(dy) && leftDelta > 20) {
        delta = 0; // switching direction — just hold
      }
    }

    // Convert pixel delta to percentage (drawer ~400px wide or 520px tall)
    const size = pos === "right" ? 400 : 520;
    const pct = drag.current.basePos + (delta / size) * 100;
    spring.current.pos = Math.max(0, pct);
    applyTransform(spring.current.pos, pos);
  }, [applyTransform]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;

    const pos = posRef.current;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const DISMISS = 30;   // % of drawer size to dismiss
    const SWITCH  = 80;   // px to trigger position switch

    if (pos === "right") {
      const size = 400;
      const pct = ((Math.max(0, dx)) / size) * 100;
      if (dy > SWITCH && dy > Math.abs(dx)) {
        // Switch to bottom
        switchPosition("bottom");
      } else if (pct > DISMISS) {
        // Dismiss
        spring.current.vel = (dx / size) * 100;
        runSpring(110, pos, onClose);
      } else {
        // Snap back
        runSpring(0, pos);
      }
    } else {
      const size = 520;
      const pct = ((Math.max(0, dy)) / size) * 100;
      if (-dx > SWITCH && -dx > Math.abs(dy)) {
        // Switch to right
        switchPosition("right");
      } else if (pct > DISMISS) {
        spring.current.vel = (dy / size) * 100;
        runSpring(110, pos, onClose);
      } else {
        runSpring(0, pos);
      }
    }
  }, [runSpring, onClose, switchPosition]);

  useEffect(() => { posRef.current = position; }, [position]);

  if (!mounted) return null;

  const isRight = position === "right";

  const drawerBaseStyle: React.CSSProperties = isRight
    ? { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 90vw)", borderRadius: "20px 0 0 20px", boxShadow: "-8px 0 60px rgba(0,0,0,0.6)", transform: "translateX(100%)" }
    : { position: "fixed", bottom: 0, left: 0, right: 0, height: "min(520px, 78vh)", borderRadius: "20px 20px 0 0", boxShadow: "0 -8px 60px rgba(0,0,0,0.6)", transform: "translateY(100%)" };

  return (
    <>
      {/* Scrim */}
      <div ref={scrimRef} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0)", zIndex: 40, pointerEvents: open ? "auto" : "none" }}
      />

      {/* Drawer */}
      <div ref={drawerRef}
        style={{ ...drawerBaseStyle, background: "#171717", zIndex: 50, display: "flex", flexDirection: "column", overflow: "hidden", willChange: "transform", touchAction: "none" }}
      >
        {/* Drag zone — handle + header */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ flexShrink: 0, cursor: "grab", touchAction: "none", userSelect: "none" }}
        >
          {/* Handle pill */}
          <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px" }}>
            <div style={{ width: isRight ? 4 : 40, height: isRight ? 40 : 4, borderRadius: 99, background: "#3a3a3a", transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 14px", borderBottom: "1px solid #2a2a2a" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: "#BDBDBD", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>Lyrics</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", margin: "3px 0 0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.01em" }}>{trackTitle}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#3a3a3a", fontFamily: "'IBM Plex Sans', sans-serif", userSelect: "none" }}>
                {isRight ? "drag ↓ for bottom" : "drag ← for side"}
              </span>
              <button onClick={onClose}
                style={{ width: 34, height: 34, borderRadius: 8, background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#BDBDBD", transition: "background 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#333"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a"; }}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Lyrics scroll */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, background: "linear-gradient(to bottom, #171717 10%, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #171717 10%, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", padding: "60px 32px 80px", scrollbarWidth: "none" }}>
            {lines.map((line, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              if (line.text === "") return <div key={line.id} style={{ height: 20 }} />;
              return (
                <div key={line.id} ref={(el) => { lineRefs.current[i] = el; }} style={{ textAlign: "center", marginBottom: 18 }}>
                  <p style={{
                    fontSize: isActive ? 19 : 15, fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#ffffff" : isPast ? "#333333" : "#7a7a7a",
                    lineHeight: 1.5, letterSpacing: isActive ? "-0.02em" : "0em",
                    margin: 0, fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
                    transform: isActive ? "scale(1.04)" : "scale(1)", transformOrigin: "center",
                  }}>{line.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: "14px 28px 28px", borderTop: "1px solid #2a2a2a", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0, background: "#171717" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#BDBDBD", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{formatTime(currentTime)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={onStop} style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            ><Square size={16} fill="#E8470A" color="#E8470A" strokeWidth={0} /></button>
            <button onClick={onPlayPause} style={{ width: 56, height: 56, borderRadius: "50%", background: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.90)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >{playing ? <Pause size={22} fill="#111111" strokeWidth={0} /> : <Play size={22} fill="#111111" strokeWidth={0} />}</button>
            <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            ><X size={18} strokeWidth={2} color="#BDBDBD" /></button>
          </div>
        </div>
      </div>
    </>
  );
}

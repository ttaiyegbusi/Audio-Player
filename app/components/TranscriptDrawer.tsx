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

// ─── Spring ───────────────────────────────────────────────────────────────────
function springStep(pos: number, vel: number, target: number, stiffness = 340, damping = 30) {
  const F = -stiffness * (pos - target) - damping * vel;
  const newVel = vel + F / 60;
  const newPos = pos + newVel / 60;
  const settled = Math.abs(newPos - target) < 0.001 && Math.abs(newVel) < 0.001;
  return { pos: settled ? target : newPos, vel: settled ? 0 : newVel, settled };
}

export default function TranscriptDrawer({
  open, onClose, lines, currentTime, playing, onPlayPause, onStop, trackTitle,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<Position>("right");

  // Spring values for translateX (right panel) and translateY (bottom panel)
  // 0 = fully open, 1 = fully hidden
  const springRef = useRef({ pos: 1, vel: 0 });
  const [springVal, setSpringVal] = useState(1);
  const rafRef = useRef<number>(0);

  // Drag state
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    position: "right" as Position,
  });
  const [dragDelta, setDragDelta] = useState({ x: 0, y: 0 });

  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIdx = lines.reduce((acc, line, i) =>
    currentTime >= line.startTime ? i : acc, 0);

  useEffect(() => {
    const el = lineRefs.current[activeIdx];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  useEffect(() => { if (open) setMounted(true); }, [open]);

  // ── Animate spring ──────────────────────────────────────────────────────────
  const animateSpring = useCallback((target: number, onSettle?: () => void) => {
    cancelAnimationFrame(rafRef.current);
    const step = () => {
      const s = springRef.current;
      const result = springStep(s.pos, s.vel, target);
      springRef.current = { pos: result.pos, vel: result.vel };
      setSpringVal(result.pos);
      if (result.settled) { onSettle?.(); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    if (open) {
      animateSpring(0);
    } else {
      animateSpring(1);
    }
  }, [open, animateSpring]);

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      position,
    };
    setDragDelta({ x: 0, y: 0 });
    cancelAnimationFrame(rafRef.current);
  }, [position]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.currentX = e.clientX;
    dragRef.current.currentY = e.clientY;
    setDragDelta({ x: dx, y: dy });
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;

    const dx = dragRef.current.currentX - dragRef.current.startX;
    const dy = dragRef.current.currentY - dragRef.current.startY;
    const pos = dragRef.current.position;

    const SWITCH_THRESHOLD = 80;
    const DISMISS_THRESHOLD = 160;

    if (pos === "right") {
      if (dx > DISMISS_THRESHOLD) {
        // Dismiss
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 1, vel: 0 };
        setSpringVal(1);
        onClose();
      } else if (dy > SWITCH_THRESHOLD) {
        // Switch to bottom
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 1, vel: 0 };
        setSpringVal(1);
        setTimeout(() => {
          setPosition("bottom");
          springRef.current = { pos: 1, vel: 0 };
          setSpringVal(1);
          setTimeout(() => animateSpring(0), 30);
        }, 300);
      } else {
        // Spring back
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 0, vel: 0 };
        setSpringVal(0);
        animateSpring(0);
      }
    } else {
      // bottom
      if (dy > DISMISS_THRESHOLD) {
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 1, vel: 0 };
        setSpringVal(1);
        onClose();
      } else if (dx < -SWITCH_THRESHOLD) {
        // Switch to right
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 1, vel: 0 };
        setSpringVal(1);
        setTimeout(() => {
          setPosition("right");
          springRef.current = { pos: 1, vel: 0 };
          setSpringVal(1);
          setTimeout(() => animateSpring(0), 30);
        }, 300);
      } else {
        setDragDelta({ x: 0, y: 0 });
        springRef.current = { pos: 0, vel: 0 };
        setSpringVal(0);
        animateSpring(0);
      }
    }
  }, [animateSpring, onClose]);

  if (!mounted) return null;

  const isRight = position === "right";
  const isDragging = dragRef.current.active;

  // Compute transform
  let transform = "";
  if (isRight) {
    // Base spring (0→100% right), plus drag delta X (clamped ≥0) and drag delta Y influence
    const springPx = springVal * 110; // percentage
    const dragX = Math.max(0, dragDelta.x);
    const dragY = Math.max(0, dragDelta.y) * 0.3; // vertical drag shows subtle vertical shift
    transform = `translateX(calc(${springPx}% + ${dragX}px)) translateY(${dragY}px)`;
  } else {
    const springPx = springVal * 110;
    const dragY = Math.max(0, dragDelta.y);
    const dragX = Math.min(0, dragDelta.x) * 0.15; // left drag shows subtle horizontal shift
    transform = `translateY(calc(${springPx}% + ${dragY}px)) translateX(${dragX}px)`;
  }

  const scrimOpacity = Math.max(0, (1 - springVal) * 0.6 - (isRight ? Math.max(0, dragDelta.x) : Math.max(0, dragDelta.y)) / 600);

  const drawerStyle: React.CSSProperties = isRight
    ? { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px, 90vw)", borderRadius: "20px 0 0 20px", boxShadow: "-8px 0 48px rgba(0,0,0,0.55)" }
    : { position: "fixed", bottom: 0, left: 0, right: 0, height: "min(520px, 78vh)", borderRadius: "20px 20px 0 0", boxShadow: "0 -8px 48px rgba(0,0,0,0.55)" };

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: `rgba(0,0,0,${scrimOpacity})`, zIndex: 40, pointerEvents: open ? "auto" : "none" }} />

      {/* Drawer */}
      <div
        style={{
          ...drawerStyle,
          background: "#171717",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          willChange: "transform",
          transform,
          transition: isDragging ? "none" : "border-radius 0.4s cubic-bezier(0.4,0,0.2,1)",
          touchAction: "none",
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ display: "flex", justifyContent: "center", padding: "14px 0 4px", flexShrink: 0, cursor: isRight ? "grab" : "grab", touchAction: "none" }}
        >
          <div style={{
            width: isRight ? 4 : 40, height: isRight ? 40 : 4, borderRadius: 99, background: "#3a3a3a",
            transition: isDragging ? "none" : "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        </div>

        {/* Header */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px 14px", borderBottom: "1px solid #2a2a2a", flexShrink: 0, cursor: "grab", touchAction: "none", userSelect: "none" }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#BDBDBD", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>Lyrics</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", margin: "3px 0 0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.01em" }}>{trackTitle}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onPointerDown={(e) => e.stopPropagation()}>
            {/* Hint text for drag direction */}
            <span style={{ fontSize: 11, color: "#444", fontFamily: "'IBM Plex Sans', sans-serif" }}>
              {isRight ? "drag ↓ to move bottom" : "drag ← to move right"}
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

        {/* Lyrics */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 72, background: "linear-gradient(to bottom, #171717 10%, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #171717 10%, transparent)", zIndex: 2, pointerEvents: "none" }} />
          <div ref={scrollRef} style={{ height: "100%", overflowY: "auto", padding: "60px 32px 80px", scrollbarWidth: "none" }}>
            {lines.map((line, i) => {
              const isActive = i === activeIdx;
              const isPast = i < activeIdx;
              const isEmpty = line.text === "";
              return (
                <div key={line.id} ref={(el) => { lineRefs.current[i] = el; }} style={{ textAlign: "center", marginBottom: isEmpty ? 10 : 18 }}>
                  {isEmpty ? <div style={{ height: 16 }} /> : (
                    <p style={{
                      fontSize: isActive ? 19 : 15, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#ffffff" : isPast ? "#333333" : "#7a7a7a",
                      lineHeight: 1.5, letterSpacing: isActive ? "-0.02em" : "0em",
                      margin: 0, fontFamily: "'IBM Plex Sans', sans-serif",
                      transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
                      transform: isActive ? "scale(1.04)" : "scale(1)", transformOrigin: "center",
                    }}>{line.text}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: "14px 28px 28px", borderTop: "1px solid #2a2a2a", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0, background: "#171717" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#BDBDBD", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>{formatTime(currentTime)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={onStop}
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            ><Square size={16} fill="#E8470A" color="#E8470A" strokeWidth={0} /></button>
            <button onClick={onPlayPause}
              style={{ width: 56, height: 56, borderRadius: "50%", background: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.90)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >{playing ? <Pause size={22} fill="#111111" strokeWidth={0} /> : <Play size={22} fill="#111111" strokeWidth={0} />}</button>
            <button onClick={onClose}
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
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

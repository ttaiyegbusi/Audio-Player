"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Pause, Play, Square, PanelRight, PanelBottom } from "lucide-react";

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

// ─── Spring ───────────────────────────────────────────────────────────────────
function useSpring(target: number, stiffness = 340, damping = 30) {
  const [val, setVal] = useState(target);
  const state = useRef({ pos: target, vel: 0 });
  const raf   = useRef<number>(0);
  useEffect(() => {
    const go = () => {
      const s = state.current;
      const F = -stiffness * (s.pos - target) - damping * s.vel;
      s.vel += F / 60; s.pos += s.vel / 60;
      if (Math.abs(s.pos - target) < 0.0008 && Math.abs(s.vel) < 0.0008) {
        s.pos = target; s.vel = 0; setVal(target); return;
      }
      setVal(s.pos); raf.current = requestAnimationFrame(go);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(raf.current);
  }, [target, stiffness, damping]);
  return val;
}

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(Math.floor(s % 60)).padStart(2,"0")}`;
}

// ─── Filled skip icons ────────────────────────────────────────────────────────
const SkipBackFilled = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <rect x="4" y="4" width="2.5" height="16" rx="1" fill="white"/>
    <polygon points="19,4 8,12 19,20" fill="white"/>
  </svg>
);
const SkipForwardFilled = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <rect x="17.5" y="4" width="2.5" height="16" rx="1" fill="white"/>
    <polygon points="5,4 16,12 5,20" fill="white"/>
  </svg>
);

export default function TranscriptDrawer({
  open, onClose, lines, currentTime, playing, onPlayPause, onStop, trackTitle,
}: Props) {
  const [position, setPosition]   = useState<Position>("right");
  const [switching, setSwitching] = useState(false);
  const [mounted, setMounted]     = useState(false);

  // Drag state
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging   = useRef(false);
  const dragStart    = useRef(0);
  const dragOffsetRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs  = useRef<(HTMLDivElement | null)[]>([]);

  // Spring: 0 = visible, 1 = hidden
  const springTarget = (open && !switching) ? 0 : 1;
  const springVal    = useSpring(springTarget, 340, 30);

  // Combined offset: spring + drag
  const totalOffset = springVal + dragOffset / (position === "right" ? 400 : 520);

  useEffect(() => { if (open) setMounted(true); }, [open]);

  const activeIdx = lines.reduce((acc, line, i) =>
    currentTime >= line.startTime ? i : acc, 0);

  useEffect(() => {
    const el = lineRefs.current[activeIdx];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  // ── Position switch ──────────────────────────────────────────────────────
  const switchPosition = useCallback((to: Position) => {
    if (to === position || switching) return;
    setSwitching(true);
    setTimeout(() => { setPosition(to); setSwitching(false); }, 420);
  }, [position, switching]);

  // ── Drag handlers ────────────────────────────────────────────────────────
  const onDragStart = useCallback((clientPos: number) => {
    isDragging.current = true;
    dragStart.current  = clientPos;
    dragOffsetRef.current = 0;
  }, []);

  const onDragMove = useCallback((clientPos: number) => {
    if (!isDragging.current) return;
    const delta = clientPos - dragStart.current;
    // Right: only drag rightward (positive = dismiss)
    // Bottom: only drag downward (positive = dismiss)
    const clamped = Math.max(0, delta);
    dragOffsetRef.current = clamped;
    setDragOffset(clamped);
  }, []);

  const onDragEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = position === "right" ? 120 : 140;
    if (dragOffsetRef.current > threshold) {
      onClose();
    }
    setDragOffset(0);
    dragOffsetRef.current = 0;
  }, [position, onClose]);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    onDragStart(position === "right" ? e.clientX : e.clientY);
    const onMove = (ev: MouseEvent) => onDragMove(position === "right" ? ev.clientX : ev.clientY);
    const onUp   = () => { onDragEnd(); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    onDragStart(position === "right" ? t.clientX : t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    onDragMove(position === "right" ? t.clientX : t.clientY);
  };
  const onTouchEnd = () => onDragEnd();

  if (!mounted) return null;

  const isRight  = position === "right";
  const scrimOpacity = Math.max(0, (1 - totalOffset) * 0.55);

  // Pixel offset for drag
  const px = dragOffset;

  const drawerStyle: React.CSSProperties = isRight
    ? {
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(400px, 90vw)",
        borderRadius: "20px 0 0 20px",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.55)",
        transform: `translateX(calc(${springVal * 110}% + ${px}px))`,
      }
    : {
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: "min(520px, 78vh)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 48px rgba(0,0,0,0.55)",
        transform: `translateY(calc(${springVal * 110}% + ${px}px))`,
      };

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: `rgba(0,0,0,${scrimOpacity})`,
        zIndex: 40,
        pointerEvents: open && springVal < 0.5 ? "auto" : "none",
        transition: "background 0.05s",
      }} />

      {/* Drawer */}
      <div style={{
        ...drawerStyle,
        background: "#171717",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        willChange: "transform",
        // Only apply transition when NOT dragging
        transition: isDragging.current ? "none" : "border-radius 0.35s cubic-bezier(0.4,0,0.2,1)",
      }}>

        {/* Drag handle — touch/click to drag */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            display: "flex", justifyContent: "center",
            padding: "14px 0 4px", flexShrink: 0,
            cursor: isRight ? "ew-resize" : "ns-resize",
          }}
        >
          <div style={{
            width: isRight ? 4 : 40,
            height: isRight ? 40 : 4,
            borderRadius: 99, background: "#3a3a3a",
            transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        </div>

        {/* Header — also draggable */}
        <div
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "6px 20px 14px",
            borderBottom: "1px solid #2a2a2a",
            flexShrink: 0,
            cursor: isRight ? "ew-resize" : "ns-resize",
            userSelect: "none",
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#BDBDBD", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Lyrics
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", margin: "3px 0 0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.01em" }}>
              {trackTitle}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }} onMouseDown={(e) => e.stopPropagation()}>
            {/* Position toggle */}
            <button onClick={() => switchPosition(isRight ? "bottom" : "right")}
              style={{ width: 34, height: 34, borderRadius: 8, background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#BDBDBD", transition: "background 0.15s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)"; }}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a"; (e.currentTarget as HTMLButtonElement).style.color = "#BDBDBD"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
            >
              {isRight ? <PanelBottom size={16} strokeWidth={1.8} /> : <PanelRight size={16} strokeWidth={1.8} />}
            </button>
            {/* Close */}
            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 8, background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#BDBDBD", transition: "background 0.15s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => { e.stopPropagation(); (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)"; }}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#333"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a"; (e.currentTarget as HTMLButtonElement).style.color = "#BDBDBD"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
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
              const isPast   = i < activeIdx;
              const isEmpty  = line.text === "";
              return (
                <div key={line.id} ref={(el) => { lineRefs.current[i] = el; }}
                  style={{ textAlign: "center", marginBottom: isEmpty ? 10 : 18 }}
                >
                  {isEmpty ? (
                    <div style={{ height: 16 }} />
                  ) : (
                    <p style={{
                      fontSize: isActive ? 19 : 15,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "#ffffff" : isPast ? "#333333" : "#7a7a7a",
                      lineHeight: 1.5,
                      letterSpacing: isActive ? "-0.02em" : "0em",
                      margin: 0,
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
                      transform: isActive ? "scale(1.04)" : "scale(1)",
                      transformOrigin: "center",
                    }}>
                      {line.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div style={{ padding: "14px 28px 28px", borderTop: "1px solid #2a2a2a", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0, background: "#171717" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "#BDBDBD", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
            {formatTime(currentTime)}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={onStop}
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a"; }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#333")}
            >
              <Square size={16} fill="#E8470A" color="#E8470A" strokeWidth={0} />
            </button>
            <button onClick={onPlayPause}
              style={{ width: 56, height: 56, borderRadius: "50%", background: "#ffffff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.90)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              {playing ? <Pause size={22} fill="#111111" strokeWidth={0} /> : <Play size={22} fill="#111111" strokeWidth={0} />}
            </button>
            <button onClick={onClose}
              style={{ width: 44, height: 44, borderRadius: "50%", background: "#2a2a2a", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a"; }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#333")}
            >
              <X size={18} strokeWidth={2} color="#BDBDBD" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

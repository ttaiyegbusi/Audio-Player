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

// ─── Spring hook ──────────────────────────────────────────────────────────────
function useSpring(
  target: number,
  stiffness = 320,
  damping = 28
): number {
  const [val, setVal] = useState(target);
  const state = useRef({ pos: target, vel: 0 });
  const raf   = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const s = state.current;
      const F = -stiffness * (s.pos - target) - damping * s.vel;
      s.vel  += F / 60;
      s.pos  += s.vel / 60;
      if (Math.abs(s.pos - target) < 0.0008 && Math.abs(s.vel) < 0.0008) {
        s.pos = target; s.vel = 0; setVal(target); return;
      }
      setVal(s.pos);
      raf.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, stiffness, damping]);

  return val;
}

function formatTime(s: number) {
  const m   = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function TranscriptDrawer({
  open, onClose, lines, currentTime, playing, onPlayPause, onStop, trackTitle,
}: Props) {
  const [position, setPosition] = useState<Position>("right");
  // switching = true while we're animating out→in during position change
  const [switching, setSwitching] = useState(false);
  const [nextPosition, setNextPosition] = useState<Position | null>(null);
  const [mounted, setMounted]     = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const lineRefs   = useRef<(HTMLDivElement | null)[]>([]);

  // 0 = fully visible, 1 = fully hidden
  const openTarget     = open && !switching ? 0 : 1;
  const springVal      = useSpring(openTarget, 340, 30);

  useEffect(() => { if (open) setMounted(true); }, [open]);

  // Active lyric line
  const activeIdx = lines.reduce((acc, line, i) =>
    currentTime >= line.startTime ? i : acc, 0);

  // Auto-scroll to active line
  useEffect(() => {
    const el        = lineRefs.current[activeIdx];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  }, [activeIdx]);

  // ── Position switch — spring out, swap, spring back in ───────────────────
  const switchPosition = useCallback((to: Position) => {
    if (to === position || switching) return;
    setNextPosition(to);
    setSwitching(true);
    // After spring-out completes (~400ms), swap position and spring back in
    setTimeout(() => {
      setPosition(to);
      setSwitching(false);
      setNextPosition(null);
    }, 420);
  }, [position, switching]);

  if (!mounted) return null;

  // ── Geometry ─────────────────────────────────────────────────────────────
  const isRight  = position === "right";
  const isBottom = position === "bottom";

  // Right panel: translate X; Bottom panel: translate Y
  const translateRight  = isRight  ? `${springVal * 110}%` : "0%";
  const translateBottom = isBottom ? `${springVal * 110}%` : "0%";
  const scrimOpacity    = (1 - springVal) * 0.55;

  const drawerStyle: React.CSSProperties = isRight
    ? {
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: "min(400px, 90vw)",
        borderRadius: "20px 0 0 20px",
        boxShadow: "-8px 0 48px rgba(0,0,0,0.5)",
        transform: `translateX(${translateRight})`,
        flexDirection: "column",
      }
    : {
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: "min(520px, 78vh)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -8px 48px rgba(0,0,0,0.5)",
        transform: `translateY(${translateBottom})`,
        flexDirection: "column",
      };

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: `rgba(0,0,0,${scrimOpacity})`,
          zIndex: 40,
          pointerEvents: open && springVal < 0.5 ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          ...drawerStyle,
          background: "#171717",
          zIndex: 50,
          display: "flex",
          overflow: "hidden",
          willChange: "transform",
          transition: "border-radius 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px", flexShrink: 0 }}>
          <div style={{
            width: isBottom ? 40 : 4,
            height: isBottom ? 4 : 40,
            borderRadius: 99,
            background: "#3a3a3a",
            transition: "width 0.4s cubic-bezier(0.34,1.56,0.64,1), height 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 14px",
          borderBottom: "1px solid #2a2a2a",
          flexShrink: 0,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#BDBDBD", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Lyrics
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", margin: "3px 0 0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.01em" }}>
              {trackTitle}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Position toggle */}
            <button
              onClick={() => switchPosition(isRight ? "bottom" : "right")}
              title={isRight ? "Move to bottom" : "Move to right"}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: "#2a2a2a", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#BDBDBD",
                transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#333";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
                (e.currentTarget as HTMLButtonElement).style.color = "#BDBDBD";
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              {/* Show the icon for where it will GO (opposite of current) */}
              {isRight
                ? <PanelBottom size={16} strokeWidth={1.8} />
                : <PanelRight  size={16} strokeWidth={1.8} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: "#2a2a2a", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#BDBDBD",
                transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#333";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
                (e.currentTarget as HTMLButtonElement).style.color = "#BDBDBD";
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Lyrics scroll area */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden", minHeight: 0 }}>
          {/* Top fade */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 72,
            background: "linear-gradient(to bottom, #171717 10%, transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(to top, #171717 10%, transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />

          <div
            ref={scrollRef}
            style={{
              height: "100%",
              overflowY: "auto",
              padding: "60px 28px 80px",
              scrollbarWidth: "none",
            }}
          >
            {lines.map((line, i) => {
              const isActive = i === activeIdx;
              const isPast   = i < activeIdx;
              return (
                <div
                  key={line.id}
                  ref={(el) => { lineRefs.current[i] = el; }}
                  style={{ textAlign: "center", marginBottom: 22 }}
                >
                  <p style={{
                    fontSize: isActive ? 18 : 15,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#ffffff" : isPast ? "#3a3a3a" : "#BDBDBD",
                    lineHeight: 1.55,
                    letterSpacing: isActive ? "-0.02em" : "0em",
                    margin: 0,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "all 0.45s cubic-bezier(0.4,0,0.2,1)",
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                  }}>
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback controls */}
        <div style={{
          padding: "14px 28px 28px",
          borderTop: "1px solid #2a2a2a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          background: "#171717",
        }}>
          <p style={{
            fontSize: 13, fontWeight: 500, color: "#BDBDBD",
            margin: 0, fontFamily: "'IBM Plex Sans', sans-serif",
            fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em",
          }}>
            {formatTime(currentTime)}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Stop */}
            <button
              onClick={onStop}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#2a2a2a", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#333")}
            >
              <Square size={16} fill="#E8470A" color="#E8470A" strokeWidth={0} />
            </button>

            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#ffffff", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.90)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              {playing
                ? <Pause size={22} fill="#111111" strokeWidth={0} />
                : <Play  size={22} fill="#111111" strokeWidth={0} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#2a2a2a", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
              }}
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

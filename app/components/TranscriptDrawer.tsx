"use client";

import { useEffect, useRef, useState } from "react";
import { X, Pause, Play, Square } from "lucide-react";

export interface TranscriptLine {
  id: number;
  startTime: number; // seconds
  text: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  lines: TranscriptLine[];
  currentTime: number; // seconds
  playing: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  trackTitle: string;
}

// Spring physics
function useSpringValue(target: number, config = { stiffness: 320, damping: 28, mass: 1 }) {
  const [value, setValue] = useState(target);
  const state = useRef({ pos: target, vel: 0 });
  const raf   = useRef<number>(0);

  useEffect(() => {
    const { stiffness, damping, mass } = config;
    const step = () => {
      const s  = state.current;
      const F  = -stiffness * (s.pos - target) - damping * s.vel;
      s.vel   += (F / mass) / 60;
      s.pos   += s.vel / 60;
      if (Math.abs(s.pos - target) < 0.001 && Math.abs(s.vel) < 0.001) {
        s.pos = target; s.vel = 0; setValue(target); return;
      }
      setValue(s.pos);
      raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]); // eslint-disable-line

  return value;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

export default function TranscriptDrawer({
  open, onClose, lines, currentTime, playing, onPlayPause, onStop, trackTitle,
}: Props) {
  const springVal   = useSpringValue(open ? 0 : 1); // 0=fully open, 1=fully closed
  const scrollRef   = useRef<HTMLDivElement>(null);
  const lineRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const [mounted, setMounted] = useState(false);

  // Find active line
  const activeIdx = lines.reduce((acc, line, i) => {
    if (currentTime >= line.startTime) return i;
    return acc;
  }, 0);

  // Mount on first open
  useEffect(() => { if (open) setMounted(true); }, [open]);

  // Auto-scroll to active line
  useEffect(() => {
    const el = lineRefs.current[activeIdx];
    const container = scrollRef.current;
    if (!el || !container) return;
    const elTop    = el.offsetTop;
    const elH      = el.offsetHeight;
    const contH    = container.clientHeight;
    const target   = elTop - contH / 2 + elH / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [activeIdx]);

  if (!mounted) return null;

  // translateX: springVal=1 → off-screen right (100%), springVal=0 → on-screen (0%)
  const translateX = `${springVal * 105}%`;
  const scrimOpacity = 1 - springVal;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: `rgba(0,0,0,${scrimOpacity * 0.45})`,
          zIndex: 40,
          pointerEvents: open ? "auto" : "none",
          transition: "none",
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(420px, 92vw)",
          background: "#ffffff",
          borderRadius: "20px 0 0 20px",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          transform: `translateX(${translateX})`,
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#D1D1D6" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 20px 12px",
          borderBottom: "1px solid #F2F2F7",
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#8E8E93", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0, fontFamily: "'IBM Plex Sans', sans-serif" }}>
              Transcript
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#1C1C1E", margin: "2px 0 0", fontFamily: "'IBM Plex Sans', sans-serif", letterSpacing: "-0.01em" }}>
              {trackTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "#F2F2F7", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#3C3C43",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#E5E5EA")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#F2F2F7")}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Transcript scroll area */}
        <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          {/* Top fade */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 60,
            background: "linear-gradient(to bottom, #ffffff, transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />
          {/* Bottom fade */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: "linear-gradient(to top, #ffffff, transparent)",
            zIndex: 2, pointerEvents: "none",
          }} />

          <div
            ref={scrollRef}
            style={{
              height: "100%",
              overflowY: "auto",
              padding: "48px 28px 80px",
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
                  style={{
                    textAlign: "center",
                    marginBottom: 20,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <p style={{
                    fontSize: isActive ? 17 : 15,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#1C1C1E" : isPast ? "#C7C7CC" : "#8E8E93",
                    lineHeight: 1.55,
                    letterSpacing: isActive ? "-0.02em" : "-0.01em",
                    margin: 0,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isActive ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "center",
                  }}>
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback controls at bottom */}
        <div style={{
          padding: "14px 28px 28px",
          borderTop: "1px solid #F2F2F7",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          background: "#ffffff",
        }}>
          {/* Timer */}
          <p style={{
            fontSize: 13, fontWeight: 500, color: "#8E8E93",
            margin: 0, fontFamily: "'IBM Plex Sans', sans-serif",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.02em",
          }}>
            {formatTime(currentTime)}
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Stop */}
            <button
              onClick={onStop}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#F2F2F7", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.15s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "#F2F2F7";
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#E5E5EA")}
            >
              <Square size={16} fill="#E8470A" color="#E8470A" strokeWidth={0} />
            </button>

            {/* Play / Pause — big centre button */}
            <button
              onClick={onPlayPause}
              style={{
                width: 56, height: 56, borderRadius: "50%",
                background: "#1C1C1E", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.90)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            >
              {playing
                ? <Pause size={22} fill="white" strokeWidth={0} />
                : <Play  size={22} fill="white" strokeWidth={0} />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "#F2F2F7", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.15s, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.88)")}
              onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "#F2F2F7";
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#E5E5EA")}
            >
              <X size={18} strokeWidth={2} color="#3C3C43" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

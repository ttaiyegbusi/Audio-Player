"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  SkipBack,
  SkipForward,
  Pause,
  Play,
  Square,
  ChevronDown,
  MoreVertical,
  ScrollText,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Track {
  id: number;
  title: string;
  duration: number;
}

const TRACKS: Track[] = [
  { id: 1, title: "Pray for me - Theophilus Sunday",    duration: 321 },
  { id: 2, title: "Glorious - Theophilus Sunday",       duration: 274 },
  { id: 3, title: "Way Maker - Sinach",                 duration: 348 },
  { id: 4, title: "Hallelujah Challenge - N. Bassey",   duration: 412 },
  { id: 5, title: "All Things New - Theophilus Sunday", duration: 289 },
];

const TRANSCRIPT_LINES = [
  "Lord, I need you now, more than ever before...",
  "When the storms of life are raging, stand by me.",
  "When the world is tossing me like a ship upon the sea...",
  "Thou who rulest wind and water, stand by me.",
];

// ─── Waveform shape ───────────────────────────────────────────────────────────

const NUM_BARS = 120;

const BAR_SHAPE: number[] = Array.from({ length: NUM_BARS }, (_, i) => {
  const detail =
    Math.abs(Math.sin(i * 0.61 + 1.0)) * 0.35 +
    Math.abs(Math.sin(i * 1.33 + 0.5)) * 0.25 +
    Math.abs(Math.sin(i * 0.27 + 2.3)) * 0.20 +
    Math.abs(Math.sin(i * 2.10 + 0.9)) * 0.10;
  const t = i / (NUM_BARS - 1);
  const edge = 1 - Math.pow(Math.abs(t - 0.5) * 1.2, 3);
  return Math.max(0.06, Math.min(1, detail * edge));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: hovered ? "#252525" : "#1C1C1C",
        border: "none",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
    >
      {children}
    </button>
  );
}

// ─── Waveform — canvas-based for smooth 60fps ─────────────────────────────────

function Waveform({
  progress,
  onScrub,
}: {
  progress: number;
  onScrub: (pct: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  // Draw on every progress change via rAF
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const W = canvas.width;
      const H = canvas.height;
      const MAX_H = H - 4;
      const GLOW_HALF = 0.18; // glow window half-width as fraction of total

      ctx.clearRect(0, 0, W, H);

      const barW   = W / NUM_BARS;
      const gap    = 1.5;
      const fillW  = Math.max(1, barW - gap);

      for (let i = 0; i < NUM_BARS; i++) {
        const barPos = i / (NUM_BARS - 1);
        const dist   = Math.abs(barPos - progress);
        const glow   = dist < GLOW_HALF
          ? Math.pow(1 - dist / GLOW_HALF, 1.8)
          : 0;

        const heightPx = Math.max(2, glow * BAR_SHAPE[i] * MAX_H);
        const opacity  = glow > 0 ? glow * 0.88 + 0.08 : 0;

        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
        ctx.fillRect(
          i * barW + gap / 2,
          H - heightPx,   // bottom-anchored
          fillW,
          heightPx
        );
      }
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [progress]);

  // Handle DPR for sharp rendering
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width  = rect.width  + "px";
    canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        onScrub(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
      }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio progress"
      style={{ height: 110, margin: "18px 0 20px", cursor: "pointer" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AudioPlayer() {
  const [trackIndex, setTrackIndex]         = useState(0);
  // Use a ref for high-res elapsed time (seconds as float), state for display
  const [displayTime, setDisplayTime]       = useState(0);
  const [playing, setPlaying]               = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showQueue, setShowQueue]           = useState(false);

  const elapsedRef   = useRef(0);       // float seconds, updated every rAF
  const startTsRef   = useRef<number | null>(null); // timestamp when play began
  const rafRef       = useRef<number>(0);
  const playingRef   = useRef(false);

  const track = TRACKS[trackIndex];
  const total = track.duration;

  // ── rAF-based playback clock ──────────────────────────────────────────────

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (startTsRef.current === null) startTsRef.current = ts;

    const elapsed = elapsedRef.current + (ts - startTsRef.current) / 1000;

    if (elapsed >= total) {
      elapsedRef.current = 0;
      startTsRef.current = null;
      playingRef.current = false;
      setPlaying(false);
      setDisplayTime(0);
      return;
    }

    setDisplayTime(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, [total]);

  const play = useCallback(() => {
    playingRef.current = true;
    startTsRef.current = null;
    setPlaying(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    // Freeze elapsed at current position
    if (startTsRef.current !== null) {
      // Calculate how much time passed since last startTs
      // We can't get ts here so we read displayTime as approximation
      elapsedRef.current = displayTime;
    }
    playingRef.current = false;
    startTsRef.current = null;
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }, [displayTime]);

  const stop = useCallback(() => {
    playingRef.current = false;
    startTsRef.current = null;
    elapsedRef.current = 0;
    cancelAnimationFrame(rafRef.current);
    setPlaying(false);
    setDisplayTime(0);
  }, []);

  const skipTo = useCallback((idx: number) => {
    stop();
    setTrackIndex(idx);
  }, [stop]);

  const prev = () => skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length);
  const next = () => skipTo((trackIndex + 1) % TRACKS.length);

  const scrub = (pct: number) => {
    const newTime = pct * total;
    elapsedRef.current = newTime;
    startTsRef.current = null;
    setDisplayTime(newTime);
    // If playing, restart rAF from new position
    if (playingRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // ── Derived ───────────────────────────────────────────────────────────────

  const progress    = total > 0 ? displayTime / total : 0;
  const remaining   = Math.max(0, total - Math.floor(displayTime));
  const statusLabel = playing ? "Playing" : displayTime > 0 ? "Paused" : "Stopped";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        width: "100%",
        maxWidth: 820,
        margin: "0 auto",
        userSelect: "none",
      }}
    >
      {/* View Transcript tab */}
      <div style={{ display: "flex" }}>
        <button
          onClick={() => setShowTranscript((v) => !v)}
          aria-expanded={showTranscript}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 20px",
            background: "#1C1C1C",
            border: "none",
            borderRadius: "12px 12px 0 0",
            color: "#ffffff",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15,
            fontWeight: 400,
            letterSpacing: "0.01em",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#242424")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C")
          }
        >
          <ScrollText size={17} strokeWidth={1.5} />
          View Transcript
        </button>
      </div>

      {/* Player row */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "#171717",
            borderRadius: "0 12px 12px 12px",
            padding: "22px 24px 20px",
          }}
        >
          {/* Meta row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontSize: 17, fontWeight: 400, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                {track.title}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: "#E8470A", display: "inline-block", flexShrink: 0,
                    animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none",
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 400, color: "#BDBDBD", letterSpacing: "0.01em" }}>
                  {statusLabel}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: 52, fontWeight: 600, color: "#ffffff",
                letterSpacing: "0.04em", lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {formatTime(remaining)}
            </span>
          </div>

          {/* Waveform */}
          <Waveform progress={progress} onScrub={scrub} />

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconBtn onClick={prev} label="Previous track">
              <SkipBack size={20} fill="white" strokeWidth={0} />
            </IconBtn>
            <IconBtn onClick={next} label="Next track">
              <SkipForward size={20} fill="white" strokeWidth={0} />
            </IconBtn>
            <div style={{ flex: 1 }} />
            <IconBtn onClick={playing ? pause : play} label={playing ? "Pause" : "Play"}>
              {playing
                ? <Pause size={20} fill="white" strokeWidth={0} />
                : <Play  size={20} fill="white" strokeWidth={0} />
              }
            </IconBtn>
            <button
              onClick={stop}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0 20px", height: 48, borderRadius: 10,
                background: "#ffffff", border: "none", color: "#111111",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 15, fontWeight: 600, letterSpacing: "0.01em",
                cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#ffffff")}
            >
              Stop
              <Square size={14} fill="#E8470A" color="#E8470A" strokeWidth={0} />
            </button>
          </div>
        </div>

        {/* Side buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <IconBtn onClick={() => setShowQueue((v) => !v)} label="Toggle queue">
            <ChevronDown
              size={20} strokeWidth={1.5}
              style={{ transform: showQueue ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            />
          </IconBtn>
          <IconBtn label="More options">
            <MoreVertical size={20} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* Transcript panel */}
      {showTranscript && (
        <div style={{ background: "#171717", borderRadius: "0 0 12px 12px", padding: "20px 24px" }}>
          {TRANSCRIPT_LINES.map((line, i) => (
            <p key={i} style={{
              fontSize: 15, fontWeight: 400,
              color: i % 2 === 0 ? "#ffffff" : "#BDBDBD",
              lineHeight: 1.75, letterSpacing: "0.01em", margin: 0,
            }}>
              {line}
            </p>
          ))}
        </div>
      )}

      {/* Queue panel */}
      {showQueue && (
        <div style={{ background: "#171717", borderRadius: "0 0 12px 0", marginTop: 2, marginRight: 58, padding: "16px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#BDBDBD", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>
            Queue
          </p>
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              onClick={() => skipTo(i)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "9px 10px", borderRadius: 8, cursor: "pointer",
                background: i === trackIndex ? "#1C1C1C" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (i !== trackIndex) (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = i === trackIndex ? "#1C1C1C" : "transparent"; }}
            >
              <div style={{ width: 18, textAlign: "center", flexShrink: 0, fontSize: 13, color: "#BDBDBD", fontVariantNumeric: "tabular-nums" }}>
                {i === trackIndex && playing ? (
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8470A", display: "inline-block", animation: "pulseDot 1.6s ease-in-out infinite" }} />
                ) : i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 14, fontWeight: i === trackIndex ? 500 : 400, color: i === trackIndex ? "#ffffff" : "#BDBDBD", letterSpacing: "0.005em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.title}
              </span>
              <span style={{ fontSize: 13, color: "#BDBDBD", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                {formatTime(t.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

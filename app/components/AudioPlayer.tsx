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

// ─── Waveform bar shape ───────────────────────────────────────────────────────
// Fully rendered at all times. Dense, tall in the centre, shorter at edges.

const NUM_BARS = 130;

const BAR_SHAPE: number[] = Array.from({ length: NUM_BARS }, (_, i) => {
  const t = i / (NUM_BARS - 1); // 0 → 1
  // Bell-curve envelope — tallest around 40-60%, shortest at edges
  const envelope = Math.exp(-Math.pow((t - 0.5) * 2.4, 2));
  // Fine deterministic detail
  const detail =
    Math.abs(Math.sin(i * 0.61 + 1.0)) * 0.40 +
    Math.abs(Math.sin(i * 1.33 + 0.5)) * 0.28 +
    Math.abs(Math.sin(i * 0.27 + 2.3)) * 0.18 +
    Math.abs(Math.sin(i * 2.10 + 0.9)) * 0.14;
  return Math.max(0.06, Math.min(1, envelope * (0.4 + detail * 0.6)));
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

// ─── Waveform canvas ──────────────────────────────────────────────────────────

function Waveform({
  playing,
  progress,
  onScrub,
}: {
  playing: boolean;
  progress: number; // 0→1, used only to show a subtle playhead marker
  onScrub: (pct: number) => void;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const phaseRef     = useRef<number>(0); // rolling wave phase
  const lastTsRef    = useRef<number | null>(null);
  const playingRef   = useRef(playing);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  // Set up canvas size once on mount
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

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.width  / dpr;
      const H   = canvas.height / dpr;

      // Advance phase only while playing
      if (playingRef.current) {
        if (lastTsRef.current !== null) {
          const dt = (ts - lastTsRef.current) / 1000; // seconds
          // Wave rolls left→right: phase advances at ~0.8 cycles/sec
          phaseRef.current += dt * 0.8;
        }
        lastTsRef.current = ts;
      } else {
        lastTsRef.current = null;
      }

      ctx.clearRect(0, 0, W, H);

      const barW  = W / NUM_BARS;
      const gap   = 1.5;
      const fillW = Math.max(1, barW - gap);
      const MAX_H = H - 2;

      for (let i = 0; i < NUM_BARS; i++) {
        const t = i / (NUM_BARS - 1); // 0→1 position

        // Base brightness from the bell-curve envelope:
        // edges ~0.15 opacity, centre ~0.65 opacity
        const baseBrightness = 0.15 + BAR_SHAPE[i] * 0.50;

        let brightness = baseBrightness;

        if (playingRef.current || phaseRef.current > 0) {
          // Rolling sine wave: crests travel left → right
          // Multiple overlapping waves for a richer shimmer
          const wave1 = Math.sin(phaseRef.current * 2 * Math.PI - t * 6.0) * 0.5 + 0.5;
          const wave2 = Math.sin(phaseRef.current * 2 * Math.PI * 1.3 - t * 9.0 + 1.2) * 0.5 + 0.5;
          const shimmer = (wave1 * 0.65 + wave2 * 0.35);

          // Blend: base dims when shimmer is low, brightens when high
          brightness = baseBrightness * 0.4 + shimmer * 0.60;
        }

        brightness = Math.max(0, Math.min(1, brightness));

        const heightPx = Math.max(2, BAR_SHAPE[i] * MAX_H);

        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`;
        // Bottom-anchored
        ctx.fillRect(
          i * barW + gap / 2,
          H - heightPx,
          fillW,
          heightPx
        );
      }

      // Subtle playhead line
      if (progress > 0 && progress < 1) {
        const x = progress * W;
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(x - 1, 0, 2, H);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [progress]);

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
      style={{ height: 120, margin: "18px 0 20px", cursor: "pointer", width: "100%" }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AudioPlayer() {
  const [trackIndex, setTrackIndex]         = useState(0);
  const [displayTime, setDisplayTime]       = useState(0);
  const [playing, setPlaying]               = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showQueue, setShowQueue]           = useState(false);

  const elapsedRef   = useRef(0);
  const startTsRef   = useRef<number | null>(null);
  const rafRef       = useRef<number>(0);
  const playingRef   = useRef(false);

  const track = TRACKS[trackIndex];
  const total = track.duration;

  // ── rAF clock ─────────────────────────────────────────────────────────────

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
    elapsedRef.current = displayTime;
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
    const t = pct * total;
    elapsedRef.current = t;
    startTsRef.current = null;
    setDisplayTime(t);
    if (playingRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

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
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 20px", background: "#1C1C1C", border: "none",
            borderRadius: "12px 12px 0 0", color: "#ffffff",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15, fontWeight: 400, letterSpacing: "0.01em",
            cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C")}
        >
          <ScrollText size={17} strokeWidth={1.5} />
          View Transcript
        </button>
      </div>

      {/* Player row */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>

        {/* Main card */}
        <div
          style={{
            flex: 1, minWidth: 0, background: "#171717",
            borderRadius: "0 12px 12px 12px", padding: "22px 24px 20px",
          }}
        >
          {/* Meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span style={{ fontSize: 17, fontWeight: 400, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                {track.title}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: "#E8470A",
                  display: "inline-block", flexShrink: 0,
                  animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none",
                }} />
                <span style={{ fontSize: 14, fontWeight: 400, color: "#BDBDBD", letterSpacing: "0.01em" }}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <span style={{
              fontSize: 52, fontWeight: 600, color: "#ffffff",
              letterSpacing: "0.04em", lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}>
              {formatTime(remaining)}
            </span>
          </div>

          {/* Waveform */}
          <Waveform playing={playing} progress={progress} onScrub={scrub} />

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
                : <Play  size={20} fill="white" strokeWidth={0} />}
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
            <ChevronDown size={20} strokeWidth={1.5}
              style={{ transform: showQueue ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            />
          </IconBtn>
          <IconBtn label="More options">
            <MoreVertical size={20} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* Transcript */}
      {showTranscript && (
        <div style={{ background: "#171717", borderRadius: "0 0 12px 12px", padding: "20px 24px" }}>
          {TRANSCRIPT_LINES.map((line, i) => (
            <p key={i} style={{
              fontSize: 15, fontWeight: 400,
              color: i % 2 === 0 ? "#ffffff" : "#BDBDBD",
              lineHeight: 1.75, letterSpacing: "0.01em", margin: 0,
            }}>{line}</p>
          ))}
        </div>
      )}

      {/* Queue */}
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
                {i === trackIndex && playing
                  ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8470A", display: "inline-block", animation: "pulseDot 1.6s ease-in-out infinite" }} />
                  : i + 1}
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

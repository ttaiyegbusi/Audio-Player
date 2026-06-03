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
  { id: 1, title: "Pray for me - Theophilus Sunday",     duration: 321 },
  { id: 2, title: "Glorious - Theophilus Sunday",        duration: 274 },
  { id: 3, title: "Way Maker - Sinach",                  duration: 348 },
  { id: 4, title: "Hallelujah Challenge - N. Bassey",    duration: 412 },
  { id: 5, title: "All Things New - Theophilus Sunday",  duration: 289 },
];

const TRANSCRIPT_LINES = [
  "Lord, I need you now, more than ever before...",
  "When the storms of life are raging, stand by me.",
  "When the world is tossing me like a ship upon the sea...",
  "Thou who rulest wind and water, stand by me.",
];

// ─── Waveform shape ───────────────────────────────────────────────────────────
// Each value is the MAX possible height (0→1) for that bar column.
// The glow window will modulate the actual visible height.
// Deterministic — no Math.random().

const NUM_BARS = 120;

const BAR_SHAPE: number[] = Array.from({ length: NUM_BARS }, (_, i) => {
  const t = i / (NUM_BARS - 1);
  const detail =
    Math.abs(Math.sin(i * 0.61 + 1.0)) * 0.35 +
    Math.abs(Math.sin(i * 1.33 + 0.5)) * 0.25 +
    Math.abs(Math.sin(i * 0.27 + 2.3)) * 0.20 +
    Math.abs(Math.sin(i * 2.10 + 0.9)) * 0.10;
  // Slight overall envelope so very first and last bars aren't too tall
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

// ─── Waveform component ───────────────────────────────────────────────────────

function Waveform({
  progress,
  onScrub,
}: {
  progress: number; // 0 → 1
  onScrub: (pct: number) => void;
}) {
  const MAX_HEIGHT = 100; // px — max bar height (bottom-anchored)
  // Glow window half-width in bar units (how many bars on each side are lit)
  const GLOW_HALF = 0.18; // fraction of total width

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onScrub(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  return (
    <div
      onClick={handleClick}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio progress"
      style={{
        height: MAX_HEIGHT + 10,
        display: "flex",
        alignItems: "flex-end", // bottom-anchored bars
        gap: 1.5,
        cursor: "pointer",
        overflow: "hidden",
        margin: "18px 0 20px",
      }}
    >
      {BAR_SHAPE.map((shape, i) => {
        const barPos = i / (NUM_BARS - 1); // 0 → 1

        // Distance from playhead (0 = at playhead, 1 = far away)
        const dist = Math.abs(barPos - progress);

        // Glow factor: 1.0 at playhead, 0.0 outside the window
        // Smooth falloff using a gaussian-like curve
        const glow = dist < GLOW_HALF
          ? Math.pow(1 - dist / GLOW_HALF, 1.8)
          : 0;

        // Height: only visible inside the glow window
        // Bars outside the window collapse to near-zero
        const heightFactor = glow * shape;
        const heightPx = Math.max(2, Math.round(heightFactor * MAX_HEIGHT));

        // Brightness: bright white at playhead, fades to nothing outside window
        const opacity = glow * 0.88 + (glow > 0 ? 0.08 : 0);

        return (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: 2,
              maxWidth: 6,
              height: heightPx,
              background: `rgba(255, 255, 255, ${opacity})`,
              borderRadius: 0,
              flexShrink: 0,
              // Smooth height transitions as glow passes
              transition: "height 0.04s linear, background 0.04s linear",
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AudioPlayer() {
  const [trackIndex, setTrackIndex]         = useState(0);
  const [current, setCurrent]               = useState(0);
  const [playing, setPlaying]               = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showQueue, setShowQueue]           = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = TRACKS[trackIndex];
  const total = track.duration;

  // ── Playback engine ───────────────────────────────────────────────────────

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setCurrent((c) => {
        if (c >= total - 1) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          return 0;
        }
        return c + 1;
      });
    }, 1000);
  }, [total]);

  const pause = useCallback(() => {
    setPlaying(false);
    clearTick();
  }, [clearTick]);

  const stop = useCallback(() => {
    setPlaying(false);
    clearTick();
    setCurrent(0);
  }, [clearTick]);

  const skipTo = useCallback(
    (idx: number) => {
      stop();
      setTrackIndex(idx);
    },
    [stop]
  );

  const prev = () => skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length);
  const next = () => skipTo((trackIndex + 1) % TRACKS.length);

  useEffect(() => () => clearTick(), [clearTick]);

  const progress    = total > 0 ? current / total : 0;
  const statusLabel = playing ? "Playing" : current > 0 ? "Paused" : "Stopped";

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
      {/* ── View Transcript tab ──────────────────────────────────────────────── */}
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

      {/* ── Player row ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>

        {/* Main card */}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 400,
                  color: "#ffffff",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {track.title}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#E8470A",
                    display: "inline-block",
                    flexShrink: 0,
                    animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: "#BDBDBD",
                    letterSpacing: "0.01em",
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Big timer */}
            <span
              style={{
                fontSize: 52,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "0.04em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              {formatTime(total - current)}
            </span>
          </div>

          {/* Waveform */}
          <Waveform
            progress={progress}
            onScrub={(pct) => setCurrent(Math.round(pct * total))}
          />

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
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 20px",
                height: 48,
                borderRadius: 10,
                background: "#ffffff",
                border: "none",
                color: "#111111",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: "0.01em",
                cursor: "pointer",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#ffffff")
              }
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
              size={20}
              strokeWidth={1.5}
              style={{
                transform: showQueue ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            />
          </IconBtn>
          <IconBtn label="More options">
            <MoreVertical size={20} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* ── Transcript panel ─────────────────────────────────────────────────── */}
      {showTranscript && (
        <div
          style={{
            background: "#171717",
            borderRadius: "0 0 12px 12px",
            padding: "20px 24px",
          }}
        >
          {TRANSCRIPT_LINES.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: 15,
                fontWeight: 400,
                color: i % 2 === 0 ? "#ffffff" : "#BDBDBD",
                lineHeight: 1.75,
                letterSpacing: "0.01em",
                margin: 0,
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      {/* ── Queue panel ──────────────────────────────────────────────────────── */}
      {showQueue && (
        <div
          style={{
            background: "#171717",
            borderRadius: "0 0 12px 0",
            marginTop: 2,
            marginRight: 58,
            padding: "16px 24px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#BDBDBD",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}
          >
            Queue
          </p>
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              onClick={() => skipTo(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "9px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: i === trackIndex ? "#1C1C1C" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (i !== trackIndex)
                  (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  i === trackIndex ? "#1C1C1C" : "transparent";
              }}
            >
              <div
                style={{
                  width: 18,
                  textAlign: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  color: "#BDBDBD",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {i === trackIndex && playing ? (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#E8470A",
                      display: "inline-block",
                      animation: "pulseDot 1.6s ease-in-out infinite",
                    }}
                  />
                ) : (
                  i + 1
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 14,
                  fontWeight: i === trackIndex ? 500 : 400,
                  color: i === trackIndex ? "#ffffff" : "#BDBDBD",
                  letterSpacing: "0.005em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.title}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: "#BDBDBD",
                  fontVariantNumeric: "tabular-nums",
                  flexShrink: 0,
                }}
              >
                {formatTime(t.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

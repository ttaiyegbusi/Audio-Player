"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: number;
}

const TRACKS: Track[] = [
  { id: 1, title: "Pray for Me", artist: "Theophilus Sunday", duration: 321 },
  { id: 2, title: "Glorious", artist: "Theophilus Sunday", duration: 274 },
  { id: 3, title: "Way Maker", artist: "Sinach", duration: 348 },
  { id: 4, title: "Hallelujah Challenge", artist: "Nathaniel Bassey", duration: 412 },
  { id: 5, title: "All Things New", artist: "Theophilus Sunday", duration: 289 },
];

const TRANSCRIPT = [
  { text: "Lord, I need you now, more than ever before...", highlight: true },
  { text: "When the storms of life are raging, stand by me.", highlight: false },
  { text: "When the world is tossing me like a ship upon the sea...", highlight: true },
  { text: "Thou who rulest wind and water, stand by me.", highlight: false },
];

const WAVE_HEIGHTS: number[] = Array.from({ length: 80 }, (_, i) => {
  const base =
    Math.sin(i * 0.18) * 0.3 +
    Math.sin(i * 0.43) * 0.25 +
    Math.sin(i * 0.11) * 0.2;
  return 0.15 + Math.abs(base) + (((i * 7 + 13) % 17) / 17) * 0.2;
});
const MAX_H = Math.max(...WAVE_HEIGHTS);

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Icon components ───────────────────────────────────────────────
const iconBase = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const NoteIcon = () => (
  <svg {...iconBase}>
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="2" />
    <line x1="9" y1="12" x2="15" y2="12" />
    <line x1="9" y1="16" x2="13" y2="16" />
  </svg>
);

const PlayIcon = () => (
  <svg {...iconBase}>
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
  </svg>
);

const PauseIcon = () => (
  <svg {...iconBase}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
  </svg>
);

const SkipBackIcon = () => (
  <svg {...iconBase}>
    <polygon points="19 20 9 12 19 4 19 20" />
    <line x1="5" y1="19" x2="5" y2="5" />
  </svg>
);

const SkipFwdIcon = () => (
  <svg {...iconBase}>
    <polygon points="5 4 15 12 5 20 5 4" />
    <line x1="19" y1="5" x2="19" y2="19" />
  </svg>
);

const QueueIcon = () => (
  <svg {...iconBase}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
    <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const DotsIcon = () => (
  <svg {...iconBase}>
    <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const ChevronIcon = ({ up }: { up: boolean }) => (
  <svg {...iconBase} style={{ transform: up ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────
interface CtrlBtnProps {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}

function CtrlBtn({ onClick, label, children }: CtrlBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: "#2a2a2a",
        border: "0.5px solid #3a3a3a",
        color: "#ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#333";
        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
        (e.currentTarget as HTMLButtonElement).style.color = "#ccc";
      }}
    >
      {children}
    </button>
  );
}

interface SideBtnProps {
  onClick?: () => void;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}

function SideBtn({ onClick, label, active = false, children }: SideBtnProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: "#2a2a2a",
        border: `0.5px solid ${active ? "#e84c2f66" : "#3a3a3a"}`,
        color: active ? "#e84c2f" : "#aaa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#333";
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#fff";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "#2a2a2a";
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "#aaa";
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function AudioPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const track = TRACKS[trackIndex];
  const total = track.duration;

  const stopInterval = useCallback(() => {
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
    stopInterval();
  }, [stopInterval]);

  const stop = useCallback(() => {
    setPlaying(false);
    stopInterval();
    setCurrent(0);
  }, [stopInterval]);

  const skipTo = useCallback(
    (index: number) => {
      stop();
      setTrackIndex(index);
      setCurrent(0);
    },
    [stop]
  );

  const prev = useCallback(() => {
    skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length);
  }, [trackIndex, skipTo]);

  const next = useCallback(() => {
    skipTo((trackIndex + 1) % TRACKS.length);
  }, [trackIndex, skipTo]);

  const scrub = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setCurrent(Math.round(pct * total));
    },
    [total]
  );

  useEffect(() => () => stopInterval(), [stopInterval]);

  const progress = current / total;
  const statusLabel = playing ? "Playing" : current > 0 ? "Paused" : "Stopped";

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", maxWidth: 620, margin: "0 auto", padding: "2rem 1rem" }}>

      {/* Transcript tab */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <button
          onClick={() => setShowTranscript((v) => !v)}
          aria-expanded={showTranscript}
          style={{
            background: "#1e1e1e",
            border: "0.5px solid #3a3a3a",
            borderBottom: "none",
            borderRadius: "8px 8px 0 0",
            padding: "8px 16px",
            fontSize: 13,
            color: showTranscript ? "#f0f0f0" : "#888",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            transition: "color 0.2s",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <NoteIcon />
          View Transcript
        </button>
      </div>

      {/* Player + side buttons */}
      <div style={{ display: "flex", alignItems: "stretch" }}>

        {/* Main card */}
        <div
          style={{
            background: "#1a1a1a",
            border: "0.5px solid #3a3a3a",
            borderRadius: "0 12px 12px 12px",
            padding: "20px 24px 16px",
            flex: 1,
            minWidth: 0,
          }}
        >
          {/* Meta row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0", margin: "0 0 2px" }}>{track.title}</p>
              <p style={{ fontSize: 12, color: "#666", margin: "0 0 6px" }}>{track.artist}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="pulse-dot"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#e84c2f",
                    display: "inline-block",
                    animationPlayState: playing ? "running" : "paused",
                  }}
                />
                <span style={{ fontSize: 12, color: "#888" }}>{statusLabel}</span>
              </div>
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 26,
                fontWeight: 500,
                color: "#f0f0f0",
                letterSpacing: "0.04em",
                minWidth: 80,
                textAlign: "right",
              }}
            >
              {formatTime(total - current)}
            </div>
          </div>

          {/* Waveform */}
          <div
            onClick={scrub}
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label="Audio progress"
            style={{
              height: 72,
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              overflow: "hidden",
              marginBottom: 16,
              cursor: "pointer",
            }}
          >
            {WAVE_HEIGHTS.map((h, i) => {
              const heightPx = Math.round((h / MAX_H) * 68);
              const isPast = (i / WAVE_HEIGHTS.length) < progress;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minWidth: 3,
                    height: heightPx,
                    borderRadius: "1px 1px 0 0",
                    background: isPast
                      ? "#e84c2f"
                      : `rgba(255,255,255,${playing ? 0.18 + (i % 3) * 0.06 : 0.12})`,
                    transition: "background 0.1s",
                  }}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CtrlBtn onClick={prev} label="Previous track"><SkipBackIcon /></CtrlBtn>
            <CtrlBtn onClick={next} label="Next track"><SkipFwdIcon /></CtrlBtn>
            <div style={{ flex: 1 }} />
            <CtrlBtn onClick={playing ? pause : play} label={playing ? "Pause" : "Play"}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </CtrlBtn>
            <button
              onClick={stop}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 16px",
                height: 36,
                borderRadius: 8,
                background: "#fff",
                border: "none",
                color: "#111",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              Stop
              <span style={{ width: 10, height: 10, background: "#e84c2f", borderRadius: 2, display: "inline-block" }} />
            </button>
          </div>
        </div>

        {/* Side buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingLeft: 8, justifyContent: "center" }}>
          <SideBtn onClick={() => setShowQueue((v) => !v)} label="Toggle queue" active={showQueue}>
            <QueueIcon />
          </SideBtn>
          <SideBtn label="Collapse" onClick={() => setShowTranscript((v) => !v)}>
            <ChevronIcon up={showTranscript} />
          </SideBtn>
          <SideBtn label="More options">
            <DotsIcon />
          </SideBtn>
        </div>
      </div>

      {/* Transcript panel */}
      {showTranscript && (
        <div
          style={{
            background: "#1a1a1a",
            border: "0.5px solid #3a3a3a",
            borderTop: "none",
            borderRadius: "0 0 12px 0",
            padding: "16px 24px",
          }}
        >
          {TRANSCRIPT.map((line, i) => (
            <p
              key={i}
              style={{
                fontSize: 13,
                lineHeight: 1.7,
                margin: "0 0 4px",
                color: line.highlight ? "#e0e0e0" : "#777",
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {line.text}
            </p>
          ))}
        </div>
      )}

      {/* Queue panel */}
      {showQueue && (
        <div
          style={{
            background: "#161616",
            border: "0.5px solid #3a3a3a",
            borderTop: "none",
            borderRadius: "0 0 0 12px",
            padding: "12px 16px",
            marginRight: 44,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#555",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Up next
          </p>
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              onClick={() => skipTo(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 10px",
                borderRadius: 8,
                cursor: "pointer",
                background: i === trackIndex ? "#2a2a2a" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (i !== trackIndex)
                  (e.currentTarget as HTMLDivElement).style.background = "#222";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  i === trackIndex ? "#2a2a2a" : "transparent";
              }}
            >
              <div style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {i === trackIndex && playing ? (
                  <span
                    className="pulse-dot"
                    style={{ width: 6, height: 6, borderRadius: "50%", background: "#e84c2f", display: "inline-block" }}
                  />
                ) : (
                  <span style={{ fontSize: 12, color: "#555" }}>{i + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: i === trackIndex ? "#f0f0f0" : "#ccc",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.title}
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>{t.artist}</span>
              </div>
              <span style={{ fontSize: 12, color: "#555", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                {formatTime(t.duration)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

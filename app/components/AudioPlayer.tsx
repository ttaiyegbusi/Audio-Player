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

const NUM_BARS = 130;

const BAR_HEIGHT: number[] = Array.from({ length: NUM_BARS }, (_, i) => {
  const t = i / (NUM_BARS - 1);
  const bell = Math.exp(-Math.pow((t - 0.5) * 2.5, 2));
  const detail =
    Math.abs(Math.sin(i * 0.61 + 1.0)) * 0.18 +
    Math.abs(Math.sin(i * 1.33 + 0.5)) * 0.12 +
    Math.abs(Math.sin(i * 0.27 + 2.3)) * 0.08;
  return Math.max(0.05, Math.min(1, bell * (0.72 + detail)));
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

// ─── Click sound — soft low tock via Web Audio API ───────────────────────────

function useClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playTock = useCallback(() => {
    try {
      const ctx     = getCtx();
      const now     = ctx.currentTime;

      // Body — low sine thud
      const osc     = ctx.createOscillator();
      const gainOsc = ctx.createGain();
      osc.type      = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gainOsc.gain.setValueAtTime(0.35, now);
      gainOsc.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gainOsc);
      gainOsc.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);

      // Click transient — short noise burst for the 'tock' attack
      const bufSize   = ctx.sampleRate * 0.02;
      const buffer    = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data      = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
      const noise     = ctx.createBufferSource();
      noise.buffer    = buffer;
      const gainNoise = ctx.createGain();
      const filter    = ctx.createBiquadFilter();
      filter.type     = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value  = 0.8;
      gainNoise.gain.setValueAtTime(0.12, now);
      gainNoise.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      noise.connect(filter);
      filter.connect(gainNoise);
      gainNoise.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.02);
    } catch {
      // Silently ignore — audio not critical
    }
  }, [getCtx]);

  return playTock;
}

// ─── Spring animation hook ────────────────────────────────────────────────────
// Drives a 0→1 value with a spring physics feel (Apple-like).

function useSpring(open: boolean, config = { stiffness: 280, damping: 26, mass: 1 }) {
  const [value, setValue] = useState(open ? 1 : 0);
  const rafRef   = useRef<number>(0);
  const stateRef = useRef({ pos: open ? 1 : 0, vel: 0 });

  useEffect(() => {
    const target = open ? 1 : 0;
    const { stiffness, damping, mass } = config;

    const step = () => {
      const s   = stateRef.current;
      const F   = -stiffness * (s.pos - target) - damping * s.vel;
      s.vel    += (F / mass) * (1 / 60);
      s.pos    += s.vel * (1 / 60);

      // Settle check
      if (Math.abs(s.pos - target) < 0.0005 && Math.abs(s.vel) < 0.0005) {
        s.pos = target;
        s.vel = 0;
        setValue(target);
        return;
      }

      setValue(s.pos);
      rafRef.current = requestAnimationFrame(step);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

// ─── Animated panel ───────────────────────────────────────────────────────────

function AnimatedPanel({
  open,
  children,
  style,
}: {
  open: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const spring    = useSpring(open);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = useState(0);

  // Measure natural content height
  useEffect(() => {
    if (contentRef.current) {
      setContentH(contentRef.current.scrollHeight);
    }
  }, [open, children]);

  return (
    <div
      style={{
        overflow: "hidden",
        height: spring * contentH,
        opacity: 0.15 + spring * 0.85,
        transform: `translateY(${(1 - spring) * -8}px)`,
        ...style,
      }}
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function IconBtn({
  onClick,
  label,
  children,
  playSound,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  playSound?: () => void;
}) {
  const [hovered, setHovered]   = useState(false);
  const [pressed, setPressed]   = useState(false);

  const handleClick = () => {
    playSound?.();
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
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
        transform: pressed ? "scale(0.91)" : "scale(1)",
        // Springy scale back
        transitionProperty: "background, transform",
        transitionDuration: pressed ? "0.05s" : "0.35s",
        transitionTimingFunction: pressed
          ? "ease-in"
          : "cubic-bezier(0.34, 1.56, 0.64, 1)", // overshoot spring
      }}
    >
      {children}
    </button>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({
  playing,
  progress,
  onScrub,
}: {
  playing: boolean;
  progress: number;
  onScrub: (pct: number) => void;
}) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const tRef         = useRef(0);
  const lastTsRef    = useRef<number | null>(null);
  const playingRef   = useRef(playing);

  useEffect(() => { playingRef.current = playing; }, [playing]);

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

      if (playingRef.current) {
        if (lastTsRef.current !== null) {
          tRef.current += (ts - lastTsRef.current) / 1000;
        }
        lastTsRef.current = ts;
      } else {
        lastTsRef.current = null;
      }

      const t     = tRef.current;
      const MAX_H = H - 4;

      ctx.clearRect(0, 0, W, H);

      const barW  = W / NUM_BARS;
      const gap   = 1.5;
      const fillW = Math.max(1, barW - gap);

      for (let i = 0; i < NUM_BARS; i++) {
        const pos   = i / (NUM_BARS - 1);
        const barH  = BAR_HEIGHT[i] * MAX_H;
        let brightness: number;

        if (playingRef.current || t > 0) {
          const centre1 = 0.5 + Math.sin(t * 0.4) * 0.25;
          const amp1    = 0.55 + Math.sin(t * 1.1 + 0.5) * 0.35;
          const dist1   = Math.abs(pos - centre1) / 0.35;
          const glow1   = amp1 * Math.exp(-dist1 * dist1 * 2.0);

          const centre2 = 0.45 + Math.sin(t * 0.7 + 1.2) * 0.30;
          const amp2    = 0.40 + Math.sin(t * 1.8 + 2.1) * 0.25;
          const dist2   = Math.abs(pos - centre2) / 0.25;
          const glow2   = amp2 * Math.exp(-dist2 * dist2 * 2.5);

          const amp3  = 0.20 + Math.sin(t * 0.55 + 3.0) * 0.12;
          const dist3 = Math.abs(pos - 0.5) / 0.55;
          const glow3 = amp3 * Math.exp(-dist3 * dist3 * 1.5);

          const base  = 0.08 + BAR_HEIGHT[i] * 0.06;
          brightness  = Math.min(1, base + Math.min(1, glow1 + glow2 + glow3) * 0.82);
        } else {
          brightness = 0.08 + BAR_HEIGHT[i] * 0.10;
        }

        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`;
        ctx.fillRect(i * barW + gap / 2, H - barH, fillW, barH);
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
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

  const elapsedRef  = useRef(0);
  const startTsRef  = useRef<number | null>(null);
  const rafRef      = useRef<number>(0);
  const playingRef  = useRef(false);

  const playTock = useClickSound();

  const track = TRACKS[trackIndex];
  const total = track.duration;

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

  const prev = () => { playTock(); skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length); };
  const next = () => { playTock(); skipTo((trackIndex + 1) % TRACKS.length); };

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

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", width: "100%", maxWidth: 820, margin: "0 auto", userSelect: "none" }}>

      {/* View Transcript tab */}
      <div style={{ display: "flex" }}>
        <button
          onClick={() => { playTock(); setShowTranscript((v) => !v); }}
          aria-expanded={showTranscript}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 20px", background: "#1C1C1C", border: "none",
            borderRadius: "12px 12px 0 0", color: "#ffffff",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: 15, fontWeight: 400, letterSpacing: "0.01em",
            cursor: "pointer", whiteSpace: "nowrap",
            transition: "background 0.15s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            transformOrigin: "bottom center",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          // onMouseLeave2={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C")}
        >
          <ScrollText size={17} strokeWidth={1.5} />
          View Transcript
        </button>
      </div>

      {/* Player row */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0, background: "#171717", borderRadius: "0 12px 12px 12px", padding: "22px 24px 20px" }}>

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

          <Waveform playing={playing} progress={progress} onScrub={scrub} />

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <IconBtn onClick={prev} label="Previous track" playSound={playTock}>
              <SkipBack size={20} fill="white" strokeWidth={0} />
            </IconBtn>
            <IconBtn onClick={next} label="Next track" playSound={playTock}>
              <SkipForward size={20} fill="white" strokeWidth={0} />
            </IconBtn>
            <div style={{ flex: 1 }} />
            <IconBtn onClick={playing ? pause : play} label={playing ? "Pause" : "Play"} playSound={playTock}>
              {playing ? <Pause size={20} fill="white" strokeWidth={0} /> : <Play size={20} fill="white" strokeWidth={0} />}
            </IconBtn>
            <button
              onClick={() => { playTock(); stop(); }}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "#ffffff";
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "0 20px", height: 48, borderRadius: 10,
                background: "#ffffff", border: "none", color: "#111111",
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: 15, fontWeight: 600, letterSpacing: "0.01em",
                cursor: "pointer", flexShrink: 0,
                transition: "background 0.15s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")}
            >
              Stop <Square size={14} fill="#E8470A" color="#E8470A" strokeWidth={0} />
            </button>
          </div>
        </div>

        {/* Side buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <IconBtn onClick={() => setShowQueue((v) => !v)} label="Toggle queue" playSound={playTock}>
            <ChevronDown size={20} strokeWidth={1.5}
              style={{
                transform: showQueue ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </IconBtn>
          <IconBtn label="More options" playSound={playTock}>
            <MoreVertical size={20} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* Transcript — spring animated */}
      <AnimatedPanel open={showTranscript}>
        <div style={{ background: "#171717", borderRadius: "0 0 12px 12px", padding: "20px 24px" }}>
          {TRANSCRIPT_LINES.map((line, i) => (
            <p key={i} style={{
              fontSize: 15, fontWeight: 400,
              color: i % 2 === 0 ? "#ffffff" : "#BDBDBD",
              lineHeight: 1.75, letterSpacing: "0.01em", margin: 0,
            }}>{line}</p>
          ))}
        </div>
      </AnimatedPanel>

      {/* Queue — spring animated */}
      <AnimatedPanel open={showQueue} style={{ marginRight: 58 }}>
        <div style={{ background: "#171717", borderRadius: "0 0 12px 0", padding: "16px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#BDBDBD", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>Queue</p>
          {TRACKS.map((t, i) => (
            <div
              key={t.id}
              onClick={() => { playTock(); skipTo(i); }}
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
      </AnimatedPanel>
    </div>
  );
}

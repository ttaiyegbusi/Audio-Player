"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  SkipBack, SkipForward, Pause, Play, Square,
  ChevronDown, MoreVertical, ScrollText,
} from "lucide-react";
import TranscriptDrawer, { TranscriptLine } from "./TranscriptDrawer";

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Track {
  id: number;
  title: string;
  duration: number;
  transcript: TranscriptLine[];
}

const TRACKS: Track[] = [
  {
    id: 1, title: "Pray for me - Theophilus Sunday", duration: 321,
    transcript: [
      { id: 1,  startTime: 0,   text: "Lord, I need you now" },
      { id: 2,  startTime: 8,   text: "More than ever before" },
      { id: 3,  startTime: 16,  text: "When the storms of life are raging" },
      { id: 4,  startTime: 24,  text: "Stand by me" },
      { id: 5,  startTime: 32,  text: "When the world is tossing me" },
      { id: 6,  startTime: 40,  text: "Like a ship upon the sea" },
      { id: 7,  startTime: 48,  text: "Thou who rulest wind and water" },
      { id: 8,  startTime: 56,  text: "Stand by me" },
      { id: 9,  startTime: 64,  text: "In the midst of tribulation" },
      { id: 10, startTime: 72,  text: "Stand by me" },
      { id: 11, startTime: 80,  text: "When the hosts of hell assail" },
      { id: 12, startTime: 88,  text: "And my strength begins to fail" },
      { id: 13, startTime: 96,  text: "Thou who never lost a battle" },
      { id: 14, startTime: 104, text: "Stand by me" },
      { id: 15, startTime: 112, text: "In my trials, Lord walk with me" },
      { id: 16, startTime: 120, text: "When my heart is almost breaking" },
      { id: 17, startTime: 128, text: "Lord walk with me" },
      { id: 18, startTime: 136, text: "When I'm growing old and feeble" },
      { id: 19, startTime: 144, text: "And my eyes grow dim with age" },
      { id: 20, startTime: 152, text: "Lord I need a friend to help me" },
      { id: 21, startTime: 160, text: "Stand by me" },
    ],
  },
  {
    id: 2, title: "Glorious - Theophilus Sunday", duration: 274,
    transcript: [
      { id: 1, startTime: 0,  text: "You are glorious" },
      { id: 2, startTime: 8,  text: "More than I can imagine" },
      { id: 3, startTime: 16, text: "You are wonderful" },
      { id: 4, startTime: 24, text: "Words cannot describe" },
      { id: 5, startTime: 32, text: "In all of the earth" },
      { id: 6, startTime: 40, text: "Your glory is seen" },
      { id: 7, startTime: 48, text: "And I am undone" },
      { id: 8, startTime: 56, text: "By the beauty of the King" },
    ],
  },
  {
    id: 3, title: "Way Maker - Sinach", duration: 348,
    transcript: [
      { id: 1, startTime: 0,   text: "You are here, moving in our midst" },
      { id: 2, startTime: 10,  text: "I worship You, I worship You" },
      { id: 3, startTime: 20,  text: "You are here, working in this place" },
      { id: 4, startTime: 30,  text: "I worship You, I worship You" },
      { id: 5, startTime: 40,  text: "Way maker, miracle worker" },
      { id: 6, startTime: 50,  text: "Promise keeper, light in the darkness" },
      { id: 7, startTime: 60,  text: "My God, that is who You are" },
      { id: 8, startTime: 70,  text: "That is who You are" },
    ],
  },
  {
    id: 4, title: "Hallelujah Challenge - N. Bassey", duration: 412,
    transcript: [
      { id: 1, startTime: 0,  text: "Hallelujah" },
      { id: 2, startTime: 6,  text: "Hallelujah" },
      { id: 3, startTime: 12, text: "Hallelujah" },
      { id: 4, startTime: 18, text: "Praise the Lord" },
      { id: 5, startTime: 24, text: "Hallelujah" },
      { id: 6, startTime: 30, text: "You deserve all the glory" },
      { id: 7, startTime: 38, text: "You deserve all the honour" },
      { id: 8, startTime: 46, text: "You deserve all the praise" },
    ],
  },
  {
    id: 5, title: "All Things New - Theophilus Sunday", duration: 289,
    transcript: [
      { id: 1, startTime: 0,  text: "Behold I make all things new" },
      { id: 2, startTime: 10, text: "Behold I make all things new" },
      { id: 3, startTime: 20, text: "The former things have passed away" },
      { id: 4, startTime: 30, text: "Behold I make all things new" },
      { id: 5, startTime: 40, text: "Your past does not define you" },
      { id: 6, startTime: 50, text: "My grace has now refined you" },
      { id: 7, startTime: 60, text: "I have called you by your name" },
      { id: 8, startTime: 70, text: "You are mine" },
    ],
  },
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

// ─── Click sound ──────────────────────────────────────────────────────────────

function useClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  return useCallback(() => {
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type  = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      g.gain.setValueAtTime(0.35, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(now); osc.stop(now + 0.12);

      const buf  = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buf;
      const gn  = ctx.createGain();
      const f   = ctx.createBiquadFilter();
      f.type    = "bandpass"; f.frequency.value = 1200; f.Q.value = 0.8;
      gn.gain.setValueAtTime(0.12, now);
      gn.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      noise.connect(f); f.connect(gn); gn.connect(ctx.destination);
      noise.start(now); noise.stop(now + 0.02);
    } catch { /* ignore */ }
  }, [getCtx]);
}

// ─── Spring panel ─────────────────────────────────────────────────────────────

function useSpring(open: boolean) {
  const [value, setValue] = useState(open ? 1 : 0);
  const state = useRef({ pos: open ? 1 : 0, vel: 0 });
  const raf   = useRef<number>(0);

  useEffect(() => {
    const target = open ? 1 : 0;
    const step = () => {
      const s = state.current;
      const F = -280 * (s.pos - target) - 26 * s.vel;
      s.vel  += F / 60; s.pos += s.vel / 60;
      if (Math.abs(s.pos - target) < 0.0005 && Math.abs(s.vel) < 0.0005) {
        s.pos = target; s.vel = 0; setValue(target); return;
      }
      setValue(s.pos);
      raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [open]);

  return value;
}

function AnimatedPanel({ open, children, style }: { open: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  const spring     = useSpring(open);
  const contentRef = useRef<HTMLDivElement>(null);
  const [h, setH]  = useState(0);
  useEffect(() => { if (contentRef.current) setH(contentRef.current.scrollHeight); }, [open]);
  return (
    <div style={{ overflow: "hidden", height: spring * h, opacity: 0.15 + spring * 0.85, transform: `translateY(${(1 - spring) * -8}px)`, ...style }}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────

function IconBtn({ onClick, label, children, playSound }: { onClick?: () => void; label: string; children: React.ReactNode; playSound?: () => void; }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={() => { playSound?.(); onClick?.(); }}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        width: 48, height: 48, borderRadius: 10,
        background: hovered ? "#252525" : "#1C1C1C",
        border: "none", color: "#ffffff",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
        transform: pressed ? "scale(0.91)" : "scale(1)",
        transitionProperty: "background, transform",
        transitionDuration: pressed ? "0.05s" : "0.35s",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >{children}</button>
  );
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

function Waveform({ playing, progress, onScrub }: { playing: boolean; progress: number; onScrub: (p: number) => void; }) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);
  const tRef         = useRef(0);
  const lastTsRef    = useRef<number | null>(null);
  const playingRef   = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px"; canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d"); if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.width / dpr; const H = canvas.height / dpr;
      if (playingRef.current) {
        if (lastTsRef.current !== null) tRef.current += (ts - lastTsRef.current) / 1000;
        lastTsRef.current = ts;
      } else { lastTsRef.current = null; }
      const t = tRef.current; const MAX_H = H - 4;
      ctx.clearRect(0, 0, W, H);
      const barW = W / NUM_BARS; const gap = 1.5; const fillW = Math.max(1, barW - gap);
      for (let i = 0; i < NUM_BARS; i++) {
        const pos = i / (NUM_BARS - 1);
        const barH = BAR_HEIGHT[i] * MAX_H;
        let brightness: number;
        if (playingRef.current || t > 0) {
          const c1 = 0.5 + Math.sin(t * 0.4) * 0.25;
          const a1 = 0.55 + Math.sin(t * 1.1 + 0.5) * 0.35;
          const g1 = a1 * Math.exp(-Math.pow(Math.abs(pos - c1) / 0.35, 2) * 2.0);
          const c2 = 0.45 + Math.sin(t * 0.7 + 1.2) * 0.30;
          const a2 = 0.40 + Math.sin(t * 1.8 + 2.1) * 0.25;
          const g2 = a2 * Math.exp(-Math.pow(Math.abs(pos - c2) / 0.25, 2) * 2.5);
          const a3 = 0.20 + Math.sin(t * 0.55 + 3.0) * 0.12;
          const g3 = a3 * Math.exp(-Math.pow(Math.abs(pos - 0.5) / 0.55, 2) * 1.5);
          brightness = Math.min(1, 0.08 + BAR_HEIGHT[i] * 0.06 + Math.min(1, g1 + g2 + g3) * 0.82);
        } else { brightness = 0.08 + BAR_HEIGHT[i] * 0.10; }
        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`;
        ctx.fillRect(i * barW + gap / 2, H - barH, fillW, barH);
      }
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={containerRef}
      onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onScrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
      role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}
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
  const playTock    = useClickSound();

  const track = TRACKS[trackIndex];
  const total = track.duration;

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (startTsRef.current === null) startTsRef.current = ts;
    const elapsed = elapsedRef.current + (ts - startTsRef.current) / 1000;
    if (elapsed >= total) {
      elapsedRef.current = 0; startTsRef.current = null;
      playingRef.current = false; setPlaying(false); setDisplayTime(0); return;
    }
    setDisplayTime(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, [total]);

  const play = useCallback(() => {
    playingRef.current = true; startTsRef.current = null;
    setPlaying(true); rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    elapsedRef.current = displayTime; playingRef.current = false;
    startTsRef.current = null; cancelAnimationFrame(rafRef.current); setPlaying(false);
  }, [displayTime]);

  const stop = useCallback(() => {
    playingRef.current = false; startTsRef.current = null;
    elapsedRef.current = 0; cancelAnimationFrame(rafRef.current);
    setPlaying(false); setDisplayTime(0);
  }, []);

  const skipTo = useCallback((idx: number) => { stop(); setTrackIndex(idx); }, [stop]);
  const prev = () => { playTock(); skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length); };
  const next = () => { playTock(); skipTo((trackIndex + 1) % TRACKS.length); };

  const scrub = (pct: number) => {
    const t = pct * total; elapsedRef.current = t; startTsRef.current = null; setDisplayTime(t);
    if (playingRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tick); }
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const progress    = total > 0 ? displayTime / total : 0;
  const remaining   = Math.max(0, total - Math.floor(displayTime));
  const statusLabel = playing ? "Playing" : displayTime > 0 ? "Paused" : "Stopped";

  return (
    <>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", width: "100%", maxWidth: 820, margin: "0 auto", userSelect: "none" }}>

        {/* Transcript tab */}
        <div style={{ display: "flex" }}>
          <button
            onClick={() => { playTock(); setShowTranscript(true); }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)")}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C";
            }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "12px 20px", background: "#1C1C1C", border: "none",
              borderRadius: "12px 12px 0 0", color: "#ffffff",
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 15, fontWeight: 400, letterSpacing: "0.01em",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              transformOrigin: "bottom center",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          >
            <ScrollText size={17} strokeWidth={1.5} />
            View Lyrics
          </button>
        </div>

        {/* Player row */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0, background: "#171717", borderRadius: "0 12px 12px 12px", padding: "22px 24px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <span style={{ fontSize: 17, fontWeight: 400, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.2 }}>{track.title}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8470A", display: "inline-block", flexShrink: 0, animation: playing ? "pulseDot 1.6s ease-in-out infinite" : "none" }} />
                  <span style={{ fontSize: 14, fontWeight: 400, color: "#BDBDBD", letterSpacing: "0.01em" }}>{statusLabel}</span>
                </div>
              </div>
              <span style={{ fontSize: 52, fontWeight: 600, color: "#ffffff", letterSpacing: "0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Sans', sans-serif" }}>
                {formatTime(remaining)}
              </span>
            </div>

            <Waveform playing={playing} progress={progress} onScrub={scrub} />

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconBtn onClick={prev} label="Previous" playSound={playTock}><SkipBack size={20} fill="white" strokeWidth={0} /></IconBtn>
              <IconBtn onClick={next} label="Next" playSound={playTock}><SkipForward size={20} fill="white" strokeWidth={0} /></IconBtn>
              <div style={{ flex: 1 }} />
              <IconBtn onClick={playing ? pause : play} label={playing ? "Pause" : "Play"} playSound={playTock}>
                {playing ? <Pause size={20} fill="white" strokeWidth={0} /> : <Play size={20} fill="white" strokeWidth={0} />}
              </IconBtn>
              <button
                onClick={() => { playTock(); stop(); }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)")}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 48, borderRadius: 10, background: "#ffffff", border: "none", color: "#111111", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.01em", cursor: "pointer", flexShrink: 0, transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")}
              >
                Stop <Square size={14} fill="#E8470A" color="#E8470A" strokeWidth={0} />
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <IconBtn onClick={() => { setShowQueue((v) => !v); }} label="Toggle queue" playSound={playTock}>
              <ChevronDown size={20} strokeWidth={1.5} style={{ transform: showQueue ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }} />
            </IconBtn>
            <IconBtn label="More options" playSound={playTock}><MoreVertical size={20} strokeWidth={1.5} /></IconBtn>
          </div>
        </div>

        {/* Queue — spring panel */}
        <AnimatedPanel open={showQueue} style={{ marginRight: 58 }}>
          <div style={{ background: "#171717", borderRadius: "0 0 12px 0", padding: "16px 24px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#BDBDBD", letterSpacing: "0.12em", textTransform: "uppercase", margin: "0 0 12px" }}>Queue</p>
            {TRACKS.map((t, i) => (
              <div key={t.id} onClick={() => { playTock(); skipTo(i); }}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 10px", borderRadius: 8, cursor: "pointer", background: i === trackIndex ? "#1C1C1C" : "transparent", transition: "background 0.15s" }}
                onMouseEnter={(e) => { if (i !== trackIndex) (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = i === trackIndex ? "#1C1C1C" : "transparent"; }}
              >
                <div style={{ width: 18, textAlign: "center", flexShrink: 0, fontSize: 13, color: "#BDBDBD", fontVariantNumeric: "tabular-nums" }}>
                  {i === trackIndex && playing ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8470A", display: "inline-block", animation: "pulseDot 1.6s ease-in-out infinite" }} /> : i + 1}
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: i === trackIndex ? 500 : 400, color: i === trackIndex ? "#ffffff" : "#BDBDBD", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</span>
                <span style={{ fontSize: 13, color: "#BDBDBD", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{formatTime(t.duration)}</span>
              </div>
            ))}
          </div>
        </AnimatedPanel>
      </div>

      {/* Transcript drawer — slides from right */}
      <TranscriptDrawer
        open={showTranscript}
        onClose={() => setShowTranscript(false)}
        lines={track.transcript}
        currentTime={displayTime}
        playing={playing}
        onPlayPause={playing ? pause : play}
        onStop={() => { stop(); setShowTranscript(false); }}
        trackTitle={track.title}
      />
    </>
  );
}

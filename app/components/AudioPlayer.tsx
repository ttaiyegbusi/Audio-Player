"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play, Square, ChevronDown, MoreVertical, ScrollText } from "lucide-react";
import TranscriptDrawer, { TranscriptLine } from "./TranscriptDrawer";

// ─── Filled skip icons ────────────────────────────────────────────────────────
const SkipBackFilled = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="4" y="4" width="2.5" height="16" rx="1" fill="white"/>
    <polygon points="19,4 8,12 19,20" fill="white"/>
  </svg>
);
const SkipForwardFilled = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <rect x="17.5" y="4" width="2.5" height="16" rx="1" fill="white"/>
    <polygon points="5,4 16,12 5,20" fill="white"/>
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Track { id: number; title: string; duration: number; transcript: TranscriptLine[]; }

// Helper — blank line spacer between sections
const gap = (id: number, t: number): TranscriptLine => ({ id, startTime: t, text: "" });

const TRACKS: Track[] = [
  {
    id: 1, title: "Pray for me - Theophilus Sunday", duration: 321,
    transcript: [
      { id: 1,  startTime: 0,   text: "Lord I need you now" },
      { id: 2,  startTime: 5,   text: "More than I ever did before" },
      { id: 3,  startTime: 10,  text: "I'm crying out, I'm reaching out" },
      { id: 4,  startTime: 15,  text: "Lord please open up the door" },
      gap(5, 20),
      { id: 6,  startTime: 22,  text: "When the storms of life are raging" },
      { id: 7,  startTime: 27,  text: "Stand by me" },
      { id: 8,  startTime: 31,  text: "When the world is tossing me" },
      { id: 9,  startTime: 35,  text: "Like a ship upon the sea" },
      { id: 10, startTime: 39,  text: "Thou who rulest wind and water" },
      { id: 11, startTime: 44,  text: "Stand by me" },
      gap(12, 48),
      { id: 13, startTime: 50,  text: "In the midst of tribulation" },
      { id: 14, startTime: 55,  text: "Stand by me" },
      { id: 15, startTime: 59,  text: "When the hosts of hell assail" },
      { id: 16, startTime: 63,  text: "And my strength begins to fail" },
      { id: 17, startTime: 67,  text: "Thou who never lost a battle" },
      { id: 18, startTime: 72,  text: "Stand by me" },
      gap(19, 76),
      { id: 20, startTime: 78,  text: "Pray for me" },
      { id: 21, startTime: 82,  text: "When I cannot pray for myself" },
      { id: 22, startTime: 87,  text: "Pray for me" },
      { id: 23, startTime: 91,  text: "Lord intercede" },
      { id: 24, startTime: 95,  text: "When words fail me" },
      { id: 25, startTime: 100, text: "And tears are all I have" },
      { id: 26, startTime: 105, text: "Pray for me" },
      gap(27, 110),
      { id: 28, startTime: 112, text: "In my trials Lord walk with me" },
      { id: 29, startTime: 117, text: "When my heart is almost breaking" },
      { id: 30, startTime: 122, text: "Lord walk with me" },
      { id: 31, startTime: 126, text: "When I'm growing old and feeble" },
      { id: 32, startTime: 131, text: "And my eyes grow dim with age" },
      { id: 33, startTime: 136, text: "Lord I need a friend to help me" },
      { id: 34, startTime: 141, text: "Stand by me" },
      gap(35, 146),
      { id: 36, startTime: 148, text: "Pray for me" },
      { id: 37, startTime: 152, text: "When I cannot pray for myself" },
      { id: 38, startTime: 157, text: "Pray for me" },
      { id: 39, startTime: 161, text: "Oh Lord intercede" },
      { id: 40, startTime: 165, text: "When words fail me" },
      { id: 41, startTime: 170, text: "And all I have is tears" },
      { id: 42, startTime: 175, text: "Pray for me" },
      gap(43, 180),
      { id: 44, startTime: 182, text: "You know the depths of my heart" },
      { id: 45, startTime: 187, text: "You know the things I cannot say" },
      { id: 46, startTime: 192, text: "Father speak on my behalf" },
      { id: 47, startTime: 197, text: "And make a way" },
      { id: 48, startTime: 202, text: "Make a way" },
      gap(49, 207),
      { id: 50, startTime: 209, text: "Pray for me" },
      { id: 51, startTime: 213, text: "When I cannot pray for myself" },
      { id: 52, startTime: 218, text: "Pray for me" },
      { id: 53, startTime: 222, text: "Lord intercede" },
      { id: 54, startTime: 226, text: "When my faith is running dry" },
      { id: 55, startTime: 231, text: "You are the one who prays for me" },
    ],
  },
  {
    id: 2, title: "Glorious - Theophilus Sunday", duration: 274,
    transcript: [
      { id: 1,  startTime: 0,   text: "Glorious, glorious" },
      { id: 2,  startTime: 5,   text: "God in the highest" },
      { id: 3,  startTime: 10,  text: "Glorious, glorious" },
      { id: 4,  startTime: 15,  text: "Worthy of all praise" },
      gap(5, 20),
      { id: 6,  startTime: 22,  text: "You are more beautiful" },
      { id: 7,  startTime: 27,  text: "Than anything I've ever seen" },
      { id: 8,  startTime: 32,  text: "Words cannot describe" },
      { id: 9,  startTime: 37,  text: "The glory of your majesty" },
      gap(10, 42),
      { id: 11, startTime: 44,  text: "In all of the earth" },
      { id: 12, startTime: 49,  text: "Your glory is seen" },
      { id: 13, startTime: 54,  text: "And I am undone" },
      { id: 14, startTime: 59,  text: "By the beauty of the King" },
      gap(15, 64),
      { id: 16, startTime: 66,  text: "Let everything that has breath" },
      { id: 17, startTime: 71,  text: "Praise the Lord" },
      { id: 18, startTime: 75,  text: "Let everything that has breath" },
      { id: 19, startTime: 80,  text: "Praise the Lord" },
      gap(20, 85),
      { id: 21, startTime: 87,  text: "Glorious, glorious" },
      { id: 22, startTime: 92,  text: "God in the highest" },
      { id: 23, startTime: 97,  text: "Holy, holy" },
      { id: 24, startTime: 102, text: "Is the Lord God Almighty" },
      gap(25, 107),
      { id: 26, startTime: 109, text: "Heaven and earth are full" },
      { id: 27, startTime: 114, text: "Of your glory" },
      { id: 28, startTime: 119, text: "And my heart will always cry" },
      { id: 29, startTime: 124, text: "Glorious" },
    ],
  },
  {
    id: 3, title: "Way Maker - Sinach", duration: 348,
    transcript: [
      { id: 1,  startTime: 0,   text: "You are here, moving in our midst" },
      { id: 2,  startTime: 7,   text: "I worship you, I worship you" },
      { id: 3,  startTime: 14,  text: "You are here, working in this place" },
      { id: 4,  startTime: 21,  text: "I worship you, I worship you" },
      gap(5, 28),
      { id: 6,  startTime: 30,  text: "Way maker, miracle worker" },
      { id: 7,  startTime: 36,  text: "Promise keeper, light in the darkness" },
      { id: 8,  startTime: 43,  text: "My God, that is who you are" },
      gap(9, 50),
      { id: 10, startTime: 52,  text: "Way maker, miracle worker" },
      { id: 11, startTime: 58,  text: "Promise keeper, light in the darkness" },
      { id: 12, startTime: 65,  text: "My God, that is who you are" },
      gap(13, 72),
      { id: 14, startTime: 74,  text: "You are here, touching every heart" },
      { id: 15, startTime: 81,  text: "I worship you, I worship you" },
      { id: 16, startTime: 88,  text: "You are here, healing every heart" },
      { id: 17, startTime: 95,  text: "I worship you, I worship you" },
      gap(18, 102),
      { id: 19, startTime: 104, text: "You are here, turning lives around" },
      { id: 20, startTime: 111, text: "I worship you, I worship you" },
      { id: 21, startTime: 118, text: "You are here, mending every heart" },
      { id: 22, startTime: 125, text: "I worship you" },
      gap(23, 132),
      { id: 24, startTime: 134, text: "Even when I don't see it" },
      { id: 25, startTime: 139, text: "You're working" },
      { id: 26, startTime: 143, text: "Even when I don't feel it" },
      { id: 27, startTime: 148, text: "You're working" },
      { id: 28, startTime: 152, text: "You never stop" },
      { id: 29, startTime: 156, text: "You never stop working" },
      { id: 30, startTime: 161, text: "You never stop" },
      { id: 31, startTime: 165, text: "You never stop working" },
    ],
  },
  {
    id: 4, title: "Hallelujah Challenge - N. Bassey", duration: 412,
    transcript: [
      { id: 1,  startTime: 0,   text: "Hallelujah" },
      { id: 2,  startTime: 4,   text: "Hallelujah" },
      { id: 3,  startTime: 8,   text: "Hallelujah" },
      { id: 4,  startTime: 12,  text: "Praise the Lord" },
      gap(5, 16),
      { id: 6,  startTime: 18,  text: "You deserve all the glory" },
      { id: 7,  startTime: 23,  text: "You deserve all the honour" },
      { id: 8,  startTime: 28,  text: "You deserve all the praise" },
      { id: 9,  startTime: 33,  text: "Hallelujah" },
      gap(10, 38),
      { id: 11, startTime: 40,  text: "For the Lord is good" },
      { id: 12, startTime: 45,  text: "And his mercy endures forever" },
      { id: 13, startTime: 51,  text: "His truth endures to all generations" },
      { id: 14, startTime: 58,  text: "Hallelujah" },
      gap(15, 63),
      { id: 16, startTime: 65,  text: "Sing hallelujah to the Lord" },
      { id: 17, startTime: 71,  text: "Sing hallelujah" },
      { id: 18, startTime: 76,  text: "Sing hallelujah to the Lord" },
      { id: 19, startTime: 82,  text: "Sing hallelujah" },
      gap(20, 87),
      { id: 21, startTime: 89,  text: "I will praise you, Lord" },
      { id: 22, startTime: 94,  text: "With my whole heart" },
      { id: 23, startTime: 99,  text: "I will tell of all your marvellous works" },
      { id: 24, startTime: 106, text: "Hallelujah" },
      gap(25, 111),
      { id: 26, startTime: 113, text: "Great is the Lord" },
      { id: 27, startTime: 118, text: "And greatly to be praised" },
      { id: 28, startTime: 123, text: "His greatness is unsearchable" },
      { id: 29, startTime: 129, text: "Hallelujah" },
    ],
  },
  {
    id: 5, title: "All Things New - Theophilus Sunday", duration: 289,
    transcript: [
      { id: 1,  startTime: 0,   text: "Behold I make all things new" },
      { id: 2,  startTime: 7,   text: "Behold I make all things new" },
      { id: 3,  startTime: 14,  text: "The former things have passed away" },
      { id: 4,  startTime: 21,  text: "Behold I make all things new" },
      gap(5, 28),
      { id: 6,  startTime: 30,  text: "Your past does not define you" },
      { id: 7,  startTime: 36,  text: "My grace has now refined you" },
      { id: 8,  startTime: 42,  text: "I have called you by your name" },
      { id: 9,  startTime: 48,  text: "You are mine" },
      gap(10, 53),
      { id: 11, startTime: 55,  text: "The shame you wore like clothing" },
      { id: 12, startTime: 61,  text: "The chains that kept you broken" },
      { id: 13, startTime: 67,  text: "I have come to set you free" },
      { id: 14, startTime: 73,  text: "You are free indeed" },
      gap(15, 78),
      { id: 16, startTime: 80,  text: "Behold I make all things new" },
      { id: 17, startTime: 87,  text: "I make all things new" },
      { id: 18, startTime: 94,  text: "The pain you thought would kill you" },
      { id: 19, startTime: 101, text: "Becomes the story that will heal you" },
      { id: 20, startTime: 108, text: "Behold I make all things new" },
      gap(21, 115),
      { id: 22, startTime: 117, text: "So let go of what is behind" },
      { id: 23, startTime: 123, text: "Press forward toward the prize" },
      { id: 24, startTime: 129, text: "The best is yet to come" },
      { id: 25, startTime: 135, text: "Fix your eyes" },
      { id: 26, startTime: 139, text: "Fix your eyes on me" },
    ],
  },
];

// ─── Waveform ─────────────────────────────────────────────────────────────────
const NUM_BARS = 130;
const BAR_HEIGHT: number[] = Array.from({ length: NUM_BARS }, (_, i) => {
  const t = i / (NUM_BARS - 1);
  const bell = Math.exp(-Math.pow((t - 0.5) * 2.5, 2));
  const d = Math.abs(Math.sin(i * 0.61 + 1.0)) * 0.18 + Math.abs(Math.sin(i * 1.33 + 0.5)) * 0.12 + Math.abs(Math.sin(i * 0.27 + 2.3)) * 0.08;
  return Math.max(0.05, Math.min(1, bell * (0.72 + d)));
});

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(Math.floor(s % 60)).padStart(2,"0")}`;
}

// ─── Click sound ──────────────────────────────────────────────────────────────
function useClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctxRef.current;
  }, []);
  return useCallback(() => {
    try {
      const ctx = getCtx(); const now = ctx.currentTime;
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sine"; osc.frequency.setValueAtTime(180, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g); g.connect(ctx.destination); osc.start(now); osc.stop(now + 0.12);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
      const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const gn = ctx.createGain(); const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 1200; f.Q.value = 0.8;
      gn.gain.setValueAtTime(0.12, now); gn.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      noise.connect(f); f.connect(gn); gn.connect(ctx.destination); noise.start(now); noise.stop(now + 0.02);
    } catch { /* ignore */ }
  }, [getCtx]);
}

// ─── Spring panel ─────────────────────────────────────────────────────────────
function useSpring(open: boolean) {
  const [v, setV] = useState(open ? 1 : 0);
  const s = useRef({ pos: open ? 1 : 0, vel: 0 }); const r = useRef<number>(0);
  useEffect(() => {
    const target = open ? 1 : 0;
    const go = () => {
      const st = s.current; const F = -280 * (st.pos - target) - 26 * st.vel;
      st.vel += F / 60; st.pos += st.vel / 60;
      if (Math.abs(st.pos - target) < 0.0005 && Math.abs(st.vel) < 0.0005) { st.pos = target; st.vel = 0; setV(target); return; }
      setV(st.pos); r.current = requestAnimationFrame(go);
    };
    cancelAnimationFrame(r.current); r.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(r.current);
  }, [open]);
  return v;
}

function AnimatedPanel({ open, children, style }: { open: boolean; children: React.ReactNode; style?: React.CSSProperties }) {
  const spring = useSpring(open); const ref = useRef<HTMLDivElement>(null); const [h, setH] = useState(0);
  useEffect(() => { if (ref.current) setH(ref.current.scrollHeight); }, [open]);
  return (
    <div style={{ overflow: "hidden", height: spring * h, opacity: 0.15 + spring * 0.85, transform: `translateY(${(1 - spring) * -8}px)`, ...style }}>
      <div ref={ref}>{children}</div>
    </div>
  );
}

// ─── Icon button ──────────────────────────────────────────────────────────────
function IconBtn({ onClick, label, children, playSound }: { onClick?: () => void; label: string; children: React.ReactNode; playSound?: () => void }) {
  const [hovered, setHovered] = useState(false); const [pressed, setPressed] = useState(false);
  return (
    <button onClick={() => { playSound?.(); onClick?.(); }} aria-label={label}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{ width: 48, height: 48, borderRadius: 10, background: hovered ? "#252525" : "#1C1C1C", border: "none", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transform: pressed ? "scale(0.91)" : "scale(1)", transitionProperty: "background, transform", transitionDuration: pressed ? "0.05s" : "0.35s", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >{children}</button>
  );
}

// ─── Waveform component ───────────────────────────────────────────────────────
function Waveform({ playing, progress, onScrub }: { playing: boolean; progress: number; onScrub: (p: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null); const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0); const tRef = useRef(0); const lastTsRef = useRef<number | null>(null); const playingRef = useRef(playing);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => {
    const canvas = canvasRef.current; const container = containerRef.current; if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1; const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px"; canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d"); if (ctx) ctx.scale(dpr, dpr);
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      const dpr = window.devicePixelRatio || 1; const W = canvas.width / dpr; const H = canvas.height / dpr;
      if (playingRef.current) { if (lastTsRef.current !== null) tRef.current += (ts - lastTsRef.current) / 1000; lastTsRef.current = ts; } else { lastTsRef.current = null; }
      const t = tRef.current; const MAX_H = H - 4; ctx.clearRect(0, 0, W, H);
      const barW = W / NUM_BARS; const gap = 1.5; const fillW = Math.max(1, barW - gap);
      for (let i = 0; i < NUM_BARS; i++) {
        const pos = i / (NUM_BARS - 1); const barH = BAR_HEIGHT[i] * MAX_H; let brightness: number;
        if (playingRef.current || t > 0) {
          const c1 = 0.5 + Math.sin(t * 0.4) * 0.25; const a1 = 0.55 + Math.sin(t * 1.1 + 0.5) * 0.35;
          const g1 = a1 * Math.exp(-Math.pow(Math.abs(pos - c1) / 0.35, 2) * 2.0);
          const c2 = 0.45 + Math.sin(t * 0.7 + 1.2) * 0.30; const a2 = 0.40 + Math.sin(t * 1.8 + 2.1) * 0.25;
          const g2 = a2 * Math.exp(-Math.pow(Math.abs(pos - c2) / 0.25, 2) * 2.5);
          const a3 = 0.20 + Math.sin(t * 0.55 + 3.0) * 0.12;
          const g3 = a3 * Math.exp(-Math.pow(Math.abs(pos - 0.5) / 0.55, 2) * 1.5);
          brightness = Math.min(1, 0.08 + BAR_HEIGHT[i] * 0.06 + Math.min(1, g1 + g2 + g3) * 0.82);
        } else { brightness = 0.08 + BAR_HEIGHT[i] * 0.10; }
        ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(3)})`; ctx.fillRect(i * barW + gap / 2, H - barH, fillW, barH);
      }
    };
    rafRef.current = requestAnimationFrame(draw); return () => cancelAnimationFrame(rafRef.current);
  }, []);
  return (
    <div ref={containerRef} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onScrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
      role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}
      style={{ height: 120, margin: "18px 0 20px", cursor: "pointer", width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AudioPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const elapsedRef = useRef(0); const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0); const playingRef = useRef(false);
  const playTock = useClickSound();
  const track = TRACKS[trackIndex]; const total = track.duration;

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (startTsRef.current === null) startTsRef.current = ts;
    const elapsed = elapsedRef.current + (ts - startTsRef.current) / 1000;
    if (elapsed >= total) { elapsedRef.current = 0; startTsRef.current = null; playingRef.current = false; setPlaying(false); setDisplayTime(0); return; }
    setDisplayTime(elapsed); rafRef.current = requestAnimationFrame(tick);
  }, [total]);

  const play = useCallback(() => { playingRef.current = true; startTsRef.current = null; setPlaying(true); rafRef.current = requestAnimationFrame(tick); }, [tick]);
  const pause = useCallback(() => { elapsedRef.current = displayTime; playingRef.current = false; startTsRef.current = null; cancelAnimationFrame(rafRef.current); setPlaying(false); }, [displayTime]);
  const stop = useCallback(() => { playingRef.current = false; startTsRef.current = null; elapsedRef.current = 0; cancelAnimationFrame(rafRef.current); setPlaying(false); setDisplayTime(0); }, []);
  const skipTo = useCallback((idx: number) => { stop(); setTrackIndex(idx); }, [stop]);
  const prev = () => { playTock(); skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length); };
  const next = () => { playTock(); skipTo((trackIndex + 1) % TRACKS.length); };
  const scrub = (pct: number) => {
    const t = pct * total; elapsedRef.current = t; startTsRef.current = null; setDisplayTime(t);
    if (playingRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tick); }
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const progress = total > 0 ? displayTime / total : 0;
  const remaining = Math.max(0, total - Math.floor(displayTime));
  const statusLabel = playing ? "Playing" : displayTime > 0 ? "Paused" : "Stopped";

  return (
    <>
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", width: "100%", maxWidth: 820, margin: "0 auto", userSelect: "none" }}>
        {/* View Lyrics tab */}
        <div style={{ display: "flex" }}>
          <button onClick={() => { playTock(); setShowLyrics(true); }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)")}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C"; }}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", background: "#1C1C1C", border: "none", borderRadius: "12px 12px 0 0", color: "#ffffff", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, fontWeight: 400, letterSpacing: "0.01em", cursor: "pointer", whiteSpace: "nowrap", transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)", transformOrigin: "bottom center" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          >
            <ScrollText size={17} strokeWidth={1.5} /> View Lyrics
          </button>
        </div>

        {/* Player */}
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
              <span style={{ fontSize: 52, fontWeight: 600, color: "#ffffff", letterSpacing: "0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Sans', sans-serif" }}>{formatTime(remaining)}</span>
            </div>
            <Waveform playing={playing} progress={progress} onScrub={scrub} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IconBtn onClick={prev} label="Previous track" playSound={playTock}><SkipBackFilled /></IconBtn>
              <IconBtn onClick={next} label="Next track" playSound={playTock}><SkipForwardFilled /></IconBtn>
              <div style={{ flex: 1 }} />
              <IconBtn onClick={playing ? pause : play} label={playing ? "Pause" : "Play"} playSound={playTock}>
                {playing ? <Pause size={20} fill="white" strokeWidth={0} /> : <Play size={20} fill="white" strokeWidth={0} />}
              </IconBtn>
              <button onClick={() => { playTock(); stop(); }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)")}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", height: 48, borderRadius: 10, background: "#ffffff", border: "none", color: "#111111", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.01em", cursor: "pointer", flexShrink: 0, transition: "background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")}
              >Stop <Square size={14} fill="#E8470A" color="#E8470A" strokeWidth={0} /></button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <IconBtn onClick={() => setShowQueue(v => !v)} label="Toggle queue" playSound={playTock}>
              <ChevronDown size={20} strokeWidth={1.5} style={{ transform: showQueue ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }} />
            </IconBtn>
            <IconBtn label="More options" playSound={playTock}><MoreVertical size={20} strokeWidth={1.5} /></IconBtn>
          </div>
        </div>

        {/* Queue */}
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

      {/* Lyrics drawer */}
      <TranscriptDrawer
        open={showLyrics}
        onClose={() => setShowLyrics(false)}
        lines={track.transcript}
        currentTime={displayTime}
        playing={playing}
        onPlayPause={playing ? pause : play}
        onStop={() => { stop(); setShowLyrics(false); }}
        trackTitle={track.title}
      />
    </>
  );
}

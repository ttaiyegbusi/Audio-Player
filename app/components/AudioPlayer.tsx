"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pause, Play, Square, ChevronDown, MoreVertical, ScrollText } from "lucide-react";
import TranscriptDrawer, { TranscriptLine } from "./TranscriptDrawer";

// ─── Skip icons ───────────────────────────────────────────────────────────────
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
const gap = (id: number, t: number): TranscriptLine => ({ id, startTime: t, text: "" });

const TRACKS: Track[] = [
  { id: 1, title: "Pray for me - Theophilus Sunday", duration: 321, transcript: [
    {id:1,startTime:0,text:"Lord I need you now"},{id:2,startTime:5,text:"More than I ever did before"},{id:3,startTime:10,text:"I'm crying out, I'm reaching out"},{id:4,startTime:15,text:"Lord please open up the door"},gap(5,20),{id:6,startTime:22,text:"When the storms of life are raging"},{id:7,startTime:27,text:"Stand by me"},{id:8,startTime:31,text:"When the world is tossing me"},{id:9,startTime:35,text:"Like a ship upon the sea"},{id:10,startTime:39,text:"Thou who rulest wind and water"},{id:11,startTime:44,text:"Stand by me"},gap(12,48),{id:13,startTime:50,text:"Pray for me"},{id:14,startTime:54,text:"When I cannot pray for myself"},{id:15,startTime:59,text:"Pray for me"},{id:16,startTime:63,text:"Lord intercede"},{id:17,startTime:67,text:"When words fail me"},{id:18,startTime:71,text:"And tears are all I have"},{id:19,startTime:76,text:"Pray for me"},gap(20,81),{id:21,startTime:83,text:"You know the depths of my heart"},{id:22,startTime:88,text:"You know the things I cannot say"},{id:23,startTime:93,text:"Father speak on my behalf"},{id:24,startTime:98,text:"And make a way"},
  ]},
  { id: 2, title: "Glorious - Theophilus Sunday", duration: 274, transcript: [
    {id:1,startTime:0,text:"Glorious, glorious"},{id:2,startTime:5,text:"God in the highest"},{id:3,startTime:10,text:"Glorious, glorious"},{id:4,startTime:15,text:"Worthy of all praise"},gap(5,20),{id:6,startTime:22,text:"You are more beautiful"},{id:7,startTime:27,text:"Than anything I've ever seen"},{id:8,startTime:32,text:"Words cannot describe"},{id:9,startTime:37,text:"The glory of your majesty"},gap(10,42),{id:11,startTime:44,text:"In all of the earth"},{id:12,startTime:49,text:"Your glory is seen"},{id:13,startTime:54,text:"And I am undone"},{id:14,startTime:59,text:"By the beauty of the King"},
  ]},
  { id: 3, title: "Way Maker - Sinach", duration: 348, transcript: [
    {id:1,startTime:0,text:"You are here, moving in our midst"},{id:2,startTime:7,text:"I worship you, I worship you"},{id:3,startTime:14,text:"You are here, working in this place"},{id:4,startTime:21,text:"I worship you, I worship you"},gap(5,28),{id:6,startTime:30,text:"Way maker, miracle worker"},{id:7,startTime:36,text:"Promise keeper, light in the darkness"},{id:8,startTime:43,text:"My God, that is who you are"},gap(9,50),{id:10,startTime:52,text:"Even when I don't see it"},{id:11,startTime:57,text:"You're working"},{id:12,startTime:61,text:"You never stop working"},
  ]},
  { id: 4, title: "Hallelujah Challenge - N. Bassey", duration: 412, transcript: [
    {id:1,startTime:0,text:"Hallelujah"},{id:2,startTime:4,text:"Hallelujah"},{id:3,startTime:8,text:"Praise the Lord"},gap(4,13),{id:5,startTime:15,text:"You deserve all the glory"},{id:6,startTime:20,text:"You deserve all the honour"},{id:7,startTime:25,text:"You deserve all the praise"},
  ]},
  { id: 5, title: "All Things New - Theophilus Sunday", duration: 289, transcript: [
    {id:1,startTime:0,text:"Behold I make all things new"},{id:2,startTime:7,text:"The former things have passed away"},{id:3,startTime:14,text:"Behold I make all things new"},gap(4,21),{id:5,startTime:23,text:"Your past does not define you"},{id:6,startTime:29,text:"My grace has now refined you"},{id:7,startTime:35,text:"I have called you by your name"},{id:8,startTime:41,text:"You are mine"},
  ]},
  { id: 6, title: "No Longer Slaves - Bethel Music", duration: 356, transcript: [{id:1,startTime:0,text:"You unravel me with a melody"},{id:2,startTime:6,text:"You surround me with a song"},{id:3,startTime:12,text:"Of deliverance from my enemies"},{id:4,startTime:18,text:"Till all my fears are gone"},gap(5,24),{id:6,startTime:26,text:"I'm no longer a slave to fear"},{id:7,startTime:32,text:"I am a child of God"}]},
  { id: 7, title: "Reckless Love - Cory Asbury", duration: 398, transcript: [{id:1,startTime:0,text:"Before I spoke a word, You were singing over me"},{id:2,startTime:7,text:"You have been so, so good to me"},gap(3,14),{id:4,startTime:16,text:"Oh the overwhelming, never-ending reckless love of God"},{id:5,startTime:24,text:"It chases me down, fights till I'm found"}]},
  { id: 8, title: "Goodness of God - Bethel Music", duration: 312, transcript: [{id:1,startTime:0,text:"I love You Lord"},{id:2,startTime:5,text:"Oh Your mercy never fails me"},{id:3,startTime:10,text:"All my days, I've been held in Your hands"},gap(4,16),{id:5,startTime:18,text:"All my life You have been faithful"},{id:6,startTime:24,text:"All my life You have been so, so good"}]},
  { id: 9, title: "Oceans - Hillsong United", duration: 445, transcript: [{id:1,startTime:0,text:"You call me out upon the waters"},{id:2,startTime:6,text:"The great unknown where feet may fail"},{id:3,startTime:12,text:"And there I find You in the mystery"},gap(4,18),{id:5,startTime:20,text:"Spirit lead me where my trust is without borders"},{id:6,startTime:27,text:"Let me walk upon the waters"}]},
  { id: 10, title: "What a Beautiful Name - Hillsong", duration: 361, transcript: [{id:1,startTime:0,text:"You were the Word at the beginning"},{id:2,startTime:6,text:"One with God the Lord Most High"},gap(3,12),{id:4,startTime:14,text:"What a beautiful Name it is"},{id:5,startTime:20,text:"The Name of Jesus Christ my King"}]},
  { id: 11, title: "King of Kings - Hillsong Worship", duration: 389, transcript: [{id:1,startTime:0,text:"In the darkness we were waiting"},{id:2,startTime:6,text:"Without hope, without light"},{id:3,startTime:12,text:"Till from Heaven You came running"},gap(4,18),{id:5,startTime:20,text:"Praise the Father, praise the Son"},{id:6,startTime:26,text:"Praise the Spirit, three in one"}]},
  { id: 12, title: "Do It Again - Elevation Worship", duration: 332, transcript: [{id:1,startTime:0,text:"Walking around these walls"},{id:2,startTime:5,text:"I thought by now they'd fall"},{id:3,startTime:10,text:"But You have never failed me yet"},gap(4,15),{id:5,startTime:17,text:"Your promise still stands"},{id:6,startTime:22,text:"Great is Your faithfulness"}]},
  { id: 13, title: "Graves Into Gardens - Elevation", duration: 278, transcript: [{id:1,startTime:0,text:"I searched the world but it couldn't fill me"},{id:2,startTime:7,text:"Man's empty praise and treasures that fade"},gap(3,14),{id:4,startTime:16,text:"You turn mourning to dancing"},{id:5,startTime:22,text:"You give beauty for ashes"}]},
  { id: 14, title: "Build My Life - Housefires", duration: 267, transcript: [{id:1,startTime:0,text:"Worthy of every song we could ever sing"},{id:2,startTime:7,text:"Worthy of all the praise we could ever bring"},gap(3,14),{id:4,startTime:16,text:"I will build my life upon Your love"},{id:5,startTime:22,text:"It is a firm foundation"}]},
  { id: 15, title: "Holy Forever - Chris Tomlin", duration: 344, transcript: [{id:1,startTime:0,text:"A thousand generations falling down in worship"},{id:2,startTime:8,text:"To sing the song of ages to the Lamb"},gap(3,16),{id:4,startTime:18,text:"Holy, holy, holy is the Lord Almighty"},{id:5,startTime:25,text:"Who was and is and is to come"}]},
  { id: 16, title: "My Testimony - Elevation Worship", duration: 298, transcript: [{id:1,startTime:0,text:"I came from nothing"},{id:2,startTime:5,text:"You called me worthy"},{id:3,startTime:10,text:"Alive for Your glory"},gap(4,15),{id:5,startTime:17,text:"All that I have"},{id:6,startTime:22,text:"Here for Your glory"}]},
  { id: 17, title: "The Blessing - Kari Jobe", duration: 378, transcript: [{id:1,startTime:0,text:"The Lord bless you and keep you"},{id:2,startTime:7,text:"Make His face shine upon you"},{id:3,startTime:14,text:"And be gracious to you"},gap(4,20),{id:5,startTime:22,text:"The Lord turn His face toward you"},{id:6,startTime:29,text:"And give you peace"}]},
  { id: 18, title: "Surrounded - Michael W. Smith", duration: 312, transcript: [{id:1,startTime:0,text:"This is how I fight my battles"},{id:2,startTime:6,text:"It may look like I'm surrounded"},{id:3,startTime:12,text:"But I am surrounded by You"},gap(4,18),{id:5,startTime:20,text:"Praise the Lord"}]},
  { id: 19, title: "Same God - Elevation Worship", duration: 334, transcript: [{id:1,startTime:0,text:"I'm calling on the God of Jacob"},{id:2,startTime:7,text:"Whose love endures through generations"},gap(3,14),{id:4,startTime:16,text:"You're the same God"},{id:5,startTime:21,text:"Yesterday, today and forever"}]},
  { id: 20, title: "Champion - Bethel Music", duration: 289, transcript: [{id:1,startTime:0,text:"You are the Lord of all creation"},{id:2,startTime:7,text:"All things were made by You"},gap(3,14),{id:4,startTime:16,text:"God You reign forever"},{id:5,startTime:22,text:"Champion, mighty in battle"}]},
];

// ─── Waveform bar heights — fixed shape from spec doc ─────────────────────────
// Calm intro → main hill peak → secondary bump → quiet tail
const WAVE_HEIGHTS = [
  4, 4, 5, 5, 5, 5, 6, 6, 7, 7,
  8, 9, 11, 14, 18, 23, 28, 32, 33, 31,
  28, 24, 19, 15, 11, 9, 8, 7, 7, 7,
  7, 8, 9, 11, 13, 15, 17, 16, 14, 12,
  10, 8, 7, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 7, 7, 7, 7, 6, 6, 6, 6,
  6, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  4, 4, 4, 4, 4,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ─── Waveform — CSS-animated bars, spec-accurate ─────────────────────────────
function Waveform({ playing }: { playing: boolean }) {
  const NUM = WAVE_HEIGHTS.length;
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "5px",
      height: 80,
      margin: "20px 0",
      padding: "0 2px",
    }}>
      {WAVE_HEIGHTS.map((h, i) => {
        const isMainPeak    = i >= 13 && i <= 22;
        const isSecondary   = i >= 32 && i <= 41;
        const brightness    = isMainPeak ? "#f2f2f2" : isSecondary ? "#e0e0e0" : "#c0c0c0";
        const glowStrength  = isMainPeak ? "0 0 7px rgba(255,255,255,0.55)" : isSecondary ? "0 0 5px rgba(255,255,255,0.35)" : "0 0 4px rgba(255,255,255,0.25)";
        const scaleMin      = isMainPeak ? 0.88 : isSecondary ? 0.90 : 0.80;
        const scaleMax      = isMainPeak ? 1.13 : isSecondary ? 1.20 : 1.30;
        const dur           = 700 + (i % 9) * 95; // 700ms–1405ms
        const delay         = i * 18;

        return (
          <div
            key={i}
            style={{
              width: "4.5px",
              height: `${h}px`,
              minHeight: "3px",
              borderRadius: "999px",
              background: brightness,
              boxShadow: glowStrength,
              filter: "blur(0.15px)",
              flexShrink: 0,
              transformOrigin: "center",
              animation: playing
                ? `waveBar ${dur}ms ease-in-out ${delay}ms infinite alternate`
                : "none",
              "--scale-min": scaleMin,
              "--scale-max": scaleMax,
            } as React.CSSProperties}
          />
        );
      })}

      <style>{`
        @keyframes waveBar {
          0%   { transform: scaleY(var(--scale-min)); opacity: 0.65; }
          100% { transform: scaleY(var(--scale-max)); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Glitch timer ─────────────────────────────────────────────────────────────
function GlitchTimer({ time, trackIndex }: { time: string; trackIndex: number }) {
  const [display, setDisplay] = useState(time);
  const [glitching, setGlitching] = useState(false);
  const prevIndex = useRef(trackIndex);
  const rafRef = useRef<number>(0);

  useEffect(() => { if (!glitching) setDisplay(time); }, [time, glitching]);

  useEffect(() => {
    if (trackIndex === prevIndex.current) return;
    prevIndex.current = trackIndex;
    setGlitching(true);
    const chars = "0123456789";
    const startTs = performance.now();
    const duration = 600;
    const tick = (ts: number) => {
      const progress = Math.min(1, (ts - startTs) / duration);
      const target = time;
      const result = target.split("").map((char, i) => {
        if (char === ":") return ":";
        const cp = Math.max(0, progress - i * 0.15);
        if (cp >= 1) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      setDisplay(result);
      if (progress < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { setDisplay(target); setGlitching(false); }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trackIndex]); // eslint-disable-line

  return (
    <span style={{ fontSize: 52, fontWeight: 600, color: "#ffffff", letterSpacing: "0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", fontFamily: "'IBM Plex Sans', sans-serif", filter: glitching ? "blur(0.5px)" : "none", transition: "filter 0.1s" }}>
      {display}
    </span>
  );
}

// ─── Animated title ───────────────────────────────────────────────────────────
function AnimatedTitle({ title, direction }: { title: string; direction: "left" | "right" }) {
  const [displayed, setDisplayed] = useState(title);
  const [animState, setAnimState] = useState<"idle"|"exit"|"enter">("idle");
  const prevTitle = useRef(title);
  useEffect(() => {
    if (title === prevTitle.current) return;
    prevTitle.current = title;
    setAnimState("exit");
    setTimeout(() => { setDisplayed(title); setAnimState("enter"); setTimeout(() => setAnimState("idle"), 350); }, 200);
  }, [title]);
  const transforms: Record<string,string> = { idle:"translateX(0px)", exit: direction==="right"?"translateX(-28px)":"translateX(28px)", enter: direction==="right"?"translateX(20px)":"translateX(-20px)" };
  const opacities: Record<string,number> = { idle:1, exit:0, enter:0 };
  return (
    <span style={{ fontSize:17, fontWeight:400, color:"#ffffff", letterSpacing:"-0.01em", lineHeight:1.2, display:"block", transform:transforms[animState], opacity:opacities[animState]??1, transition: animState==="exit"?"transform 0.2s cubic-bezier(0.4,0,1,1), opacity 0.15s ease":animState==="idle"?"transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease":"none" }}>
      {displayed}
    </span>
  );
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

// ─── Tick sound ───────────────────────────────────────────────────────────────
function useTickSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return ctxRef.current;
  }, []);
  return useCallback(() => {
    try {
      const ctx = getCtx(); const now = ctx.currentTime;
      const bufSize = Math.floor(ctx.sampleRate * 0.018);
      const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.12));
      const noise = ctx.createBufferSource(); noise.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2800; bp.Q.value = 1.4;
      const shelf = ctx.createBiquadFilter(); shelf.type = "lowshelf"; shelf.frequency.value = 300; shelf.gain.value = -6;
      const master = ctx.createGain(); master.gain.setValueAtTime(0.055, now); master.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      noise.connect(bp); bp.connect(shelf); shelf.connect(master); master.connect(ctx.destination);
      noise.start(now); noise.stop(now + 0.02);
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
    <div style={{ overflow:"hidden", height:spring*h, opacity:0.15+spring*0.85, transform:`translateY(${(1-spring)*-8}px)`, ...style }}>
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
      style={{ width:48, height:48, borderRadius:10, background:hovered?"#252525":"#1C1C1C", border:"none", color:"#ffffff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transform:pressed?"scale(0.91)":"scale(1)", transitionProperty:"background, transform", transitionDuration:pressed?"0.05s":"0.35s", transitionTimingFunction:"cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >{children}</button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AudioPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [skipDir, setSkipDir] = useState<"left"|"right">("right");

  const elapsedRef = useRef(0); const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0); const playingRef = useRef(false);
  const lastSecRef = useRef(-1);
  const playTock = useClickSound();
  const playTick = useTickSound();
  const track = TRACKS[trackIndex]; const total = track.duration;

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (startTsRef.current === null) startTsRef.current = ts;
    const elapsed = elapsedRef.current + (ts - startTsRef.current) / 1000;
    if (elapsed >= total) { elapsedRef.current = 0; startTsRef.current = null; playingRef.current = false; lastSecRef.current = -1; setPlaying(false); setDisplayTime(0); return; }
    const wholeSecond = Math.floor(elapsed);
    if (wholeSecond !== lastSecRef.current) { lastSecRef.current = wholeSecond; playTick(); }
    setDisplayTime(elapsed); rafRef.current = requestAnimationFrame(tick);
  }, [total, playTick]);

  const play = useCallback(() => { playingRef.current = true; startTsRef.current = null; setPlaying(true); rafRef.current = requestAnimationFrame(tick); }, [tick]);
  const pause = useCallback(() => { elapsedRef.current = displayTime; playingRef.current = false; startTsRef.current = null; cancelAnimationFrame(rafRef.current); setPlaying(false); }, [displayTime]);
  const stop = useCallback(() => { playingRef.current = false; startTsRef.current = null; elapsedRef.current = 0; lastSecRef.current = -1; cancelAnimationFrame(rafRef.current); setPlaying(false); setDisplayTime(0); }, []);
  const skipTo = useCallback((idx: number, dir: "left"|"right") => { stop(); setSkipDir(dir); setTrackIndex(idx); }, [stop]);
  const prev = () => { playTock(); skipTo((trackIndex - 1 + TRACKS.length) % TRACKS.length, "left"); };
  const next = () => { playTock(); skipTo((trackIndex + 1) % TRACKS.length, "right"); };
  const scrub = (pct: number) => {
    const t = pct * total; elapsedRef.current = t; startTsRef.current = null; lastSecRef.current = Math.floor(t); setDisplayTime(t);
    if (playingRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = requestAnimationFrame(tick); }
  };
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const progress = total > 0 ? displayTime / total : 0;
  const remaining = Math.max(0, total - Math.floor(displayTime));
  const statusLabel = playing ? "Playing" : displayTime > 0 ? "Paused" : "Stopped";

  return (
    <>
      <div style={{ fontFamily:"'IBM Plex Sans', sans-serif", width:"100%", maxWidth:820, margin:"0 auto", userSelect:"none" }}>
        <div style={{ display:"flex" }}>
          <button onClick={() => { playTock(); setShowLyrics(true); }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)")}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C"; }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 20px", background:"#1C1C1C", border:"none", borderRadius:"12px 12px 0 0", color:"#ffffff", fontFamily:"'IBM Plex Sans', sans-serif", fontSize:15, fontWeight:400, letterSpacing:"0.01em", cursor:"pointer", whiteSpace:"nowrap", transition:"background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)", transformOrigin:"bottom center" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          ><ScrollText size={17} strokeWidth={1.5} /> View Lyrics</button>
        </div>

        <div style={{ display:"flex", alignItems:"stretch", gap:10 }}>
          <div style={{ flex:1, minWidth:0, background:"#171717", borderRadius:"0 12px 12px 12px", padding:"22px 24px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:7, overflow:"hidden", flex:1, marginRight:16 }}>
                <AnimatedTitle title={track.title} direction={skipDir} />
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#E8470A", display:"inline-block", flexShrink:0, animation:playing?"pulseDot 1.6s ease-in-out infinite":"none" }} />
                  <span style={{ fontSize:14, fontWeight:400, color:"#BDBDBD", letterSpacing:"0.01em" }}>{statusLabel}</span>
                </div>
              </div>
              <GlitchTimer time={formatTime(remaining)} trackIndex={trackIndex} />
            </div>

            {/* Waveform */}
            <Waveform playing={playing} />

            {/* Scrub bar underneath waveform */}
            <div
              onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); scrub(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))); }}
              style={{ height:3, background:"#2a2a2a", borderRadius:2, marginBottom:20, cursor:"pointer", position:"relative" }}
            >
              <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${progress * 100}%`, background:"#E8470A", borderRadius:2, transition:"width 0.3s linear" }} />
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <IconBtn onClick={prev} label="Previous track" playSound={playTock}><SkipBackFilled /></IconBtn>
              <IconBtn onClick={next} label="Next track" playSound={playTock}><SkipForwardFilled /></IconBtn>
              <div style={{ flex:1 }} />
              <IconBtn onClick={playing ? pause : play} label={playing?"Pause":"Play"} playSound={playTock}>
                {playing ? <Pause size={20} fill="white" strokeWidth={0} /> : <Play size={20} fill="white" strokeWidth={0} />}
              </IconBtn>
              <button onClick={() => { playTock(); stop(); }}
                onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.93)")}
                onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#ffffff"; }}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"0 20px", height:48, borderRadius:10, background:"#ffffff", border:"none", color:"#111111", fontFamily:"'IBM Plex Sans', sans-serif", fontSize:15, fontWeight:600, letterSpacing:"0.01em", cursor:"pointer", flexShrink:0, transition:"background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#f0f0f0")}
              >Stop <Square size={14} fill="#E8470A" color="#E8470A" strokeWidth={0} /></button>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <IconBtn onClick={() => setShowQueue(v => !v)} label="Toggle queue" playSound={playTock}>
              <ChevronDown size={20} strokeWidth={1.5} style={{ transform:showQueue?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }} />
            </IconBtn>
            <IconBtn label="More options" playSound={playTock}><MoreVertical size={20} strokeWidth={1.5} /></IconBtn>
          </div>
        </div>

        <AnimatedPanel open={showQueue} style={{ marginRight:58 }}>
          <div style={{ background:"#171717", borderRadius:"0 0 12px 0" }}>
            <div style={{ padding:"16px 24px 8px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#BDBDBD", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>Queue <span style={{ color:"#444", fontWeight:400 }}>— {TRACKS.length} songs</span></p>
            </div>
            <div style={{ maxHeight:320, overflowY:"auto", padding:"0 24px 16px", scrollbarWidth:"thin", scrollbarColor:"#2a2a2a transparent" }}>
              {TRACKS.map((t, i) => (
                <div key={t.id} onClick={() => { playTock(); skipTo(i, i > trackIndex ? "right" : "left"); }}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"9px 10px", borderRadius:8, cursor:"pointer", background:i===trackIndex?"#1C1C1C":"transparent", transition:"background 0.15s" }}
                  onMouseEnter={(e) => { if (i !== trackIndex) (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = i===trackIndex?"#1C1C1C":"transparent"; }}
                >
                  <div style={{ width:18, textAlign:"center", flexShrink:0, fontSize:13, color:"#BDBDBD", fontVariantNumeric:"tabular-nums" }}>
                    {i===trackIndex && playing ? <span style={{ width:7, height:7, borderRadius:"50%", background:"#E8470A", display:"inline-block", animation:"pulseDot 1.6s ease-in-out infinite" }} /> : i+1}
                  </div>
                  <span style={{ flex:1, fontSize:14, fontWeight:i===trackIndex?500:400, color:i===trackIndex?"#ffffff":"#BDBDBD", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.title}</span>
                  <span style={{ fontSize:13, color:"#BDBDBD", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{formatTime(t.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedPanel>
      </div>

      <TranscriptDrawer
        open={showLyrics} onClose={() => setShowLyrics(false)}
        lines={track.transcript} currentTime={displayTime}
        playing={playing} onPlayPause={playing ? pause : play}
        onStop={() => { stop(); setShowLyrics(false); }}
        onNext={() => { playTock(); skipTo((trackIndex + 1) % TRACKS.length, "right"); }}
        trackTitle={track.title}
      />
    </>
  );
}

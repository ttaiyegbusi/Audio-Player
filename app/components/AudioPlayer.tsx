"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Pause, Play, Square, ChevronDown, MoreVertical, ScrollText,
  Gauge, Bookmark, Share2, Copy, Trash2
} from "lucide-react";
import TranscriptDrawer, { TranscriptLine } from "./TranscriptDrawer";
import Waveform from "./Waveform";

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

// ─── Voice note data ──────────────────────────────────────────────────────────
interface VoiceNote { id: number; title: string; duration: number; transcript: TranscriptLine[]; }
const g = (id: number, t: number): TranscriptLine => ({ id, startTime: t, text: "" });

const NOTES: VoiceNote[] = [
  {
    id: 1, title: "On feeling lost", duration: 97,
    transcript: [
      {id:1,startTime:0,text:"I don't know what I want anymore."},
      {id:2,startTime:5,text:"Like, I thought I had it figured out."},
      {id:3,startTime:10,text:"But the older I get the less certain I am about everything."},
      g(4,16),
      {id:5,startTime:18,text:"Maybe that's not a bad thing."},
      {id:6,startTime:22,text:"Maybe certainty was just arrogance wearing a disguise."},
      g(7,28),
      {id:8,startTime:30,text:"I just want to feel like I'm moving toward something."},
      {id:9,startTime:36,text:"Even if I can't name what it is."},
      g(10,42),
      {id:11,startTime:44,text:"Is that enough? Just... direction without destination?"},
      {id:12,startTime:51,text:"I think it has to be."},
      {id:13,startTime:55,text:"Because the alternative is standing still."},
      g(14,61),
      {id:15,startTime:63,text:"And I can't do that anymore."},
    ],
  },
  {
    id: 2, title: "3am thought", duration: 74,
    transcript: [
      {id:1,startTime:0,text:"It's 3am and I can't sleep again."},
      {id:2,startTime:5,text:"I keep replaying that conversation from two weeks ago."},
      {id:3,startTime:11,text:"The one where I said nothing when I should have said everything."},
      g(4,17),
      {id:5,startTime:19,text:"I wonder if silence is a choice or a failure."},
      {id:6,startTime:25,text:"Sometimes they feel the same."},
      g(7,30),
      {id:8,startTime:32,text:"I think I protect people from my honesty."},
      {id:9,startTime:38,text:"And tell myself it's kindness."},
      {id:10,startTime:42,text:"But really I'm just scared of what they'd think."},
      g(11,48),
      {id:12,startTime:50,text:"Okay. Going to try to sleep now."},
      {id:13,startTime:55,text:"Maybe this made sense. Maybe not."},
    ],
  },
  {
    id: 3, title: "On gratitude", duration: 83,
    transcript: [
      {id:1,startTime:0,text:"I had this moment today on the bus."},
      {id:2,startTime:5,text:"The light was coming through the window at a weird angle."},
      {id:3,startTime:10,text:"And I just felt... grateful. For no specific reason."},
      g(4,16),
      {id:5,startTime:18,text:"I don't know what triggered it."},
      {id:6,startTime:22,text:"Maybe nothing. Maybe everything."},
      g(7,27),
      {id:8,startTime:29,text:"I think gratitude is underrated."},
      {id:9,startTime:34,text:"Not the forced kind. Not the list-making kind."},
      {id:10,startTime:40,text:"The kind that just arrives uninvited and sits with you."},
      g(11,46),
      {id:12,startTime:48,text:"I want more of those moments."},
      {id:13,startTime:52,text:"I think that means slowing down."},
      {id:14,startTime:56,text:"Which is the hardest thing for me."},
    ],
  },
  {
    id: 4, title: "Fear of failure", duration: 112,
    transcript: [
      {id:1,startTime:0,text:"I submitted the thing today."},
      {id:2,startTime:4,text:"After six months of not submitting the thing."},
      g(3,9),
      {id:4,startTime:11,text:"I kept telling myself it wasn't ready."},
      {id:5,startTime:16,text:"But honestly? I was just scared."},
      {id:6,startTime:20,text:"Scared that if I put it out there and it failed,"},
      {id:7,startTime:26,text:"I'd lose the one thing I still believed I could do."},
      g(8,32),
      {id:9,startTime:34,text:"There's this strange safety in the unfinished."},
      {id:10,startTime:40,text:"Nobody can judge what you haven't shown them."},
      g(11,46),
      {id:12,startTime:48,text:"But that's not living. That's hiding."},
      {id:13,startTime:53,text:"And I'm tired of hiding."},
      g(14,58),
      {id:15,startTime:60,text:"So I sent it. It's done."},
      {id:16,startTime:65,text:"Whatever happens next, at least it's real now."},
    ],
  },
  {
    id: 5, title: "People and energy", duration: 68,
    transcript: [
      {id:1,startTime:0,text:"I've been thinking about the people in my life."},
      {id:2,startTime:6,text:"Who leaves me feeling more full."},
      {id:3,startTime:10,text:"And who leaves me feeling emptied out."},
      g(4,15),
      {id:5,startTime:17,text:"It's not about good or bad people."},
      {id:6,startTime:22,text:"It's about chemistry. Compatibility."},
      {id:7,startTime:27,text:"Some people just cost more than they give."},
      g(8,32),
      {id:9,startTime:34,text:"And I'm learning that's okay to notice."},
      {id:10,startTime:39,text:"It doesn't mean I love them less."},
      {id:11,startTime:43,text:"It just means I need to be intentional about distance."},
      g(12,49),
      {id:13,startTime:51,text:"Protect the energy. That's the job."},
    ],
  },
  {
    id: 6, title: "On comparison", duration: 79,
    transcript: [
      {id:1,startTime:0,text:"I compared myself to someone today and spiralled."},
      {id:2,startTime:6,text:"Like really spiralled."},
      {id:3,startTime:9,text:"They're doing everything I said I wanted to do."},
      g(4,14),
      {id:5,startTime:16,text:"And instead of feeling inspired, I felt small."},
      {id:6,startTime:22,text:"Which tells me something."},
      g(7,26),
      {id:8,startTime:28,text:"Maybe I'm not as far along as I pretend."},
      {id:9,startTime:34,text:"Maybe the work is to stop pretending."},
      g(10,39),
      {id:11,startTime:41,text:"Their path is not my path."},
      {id:12,startTime:45,text:"Their timeline is not my timeline."},
      {id:13,startTime:49,text:"The only useful comparison is who I was yesterday."},
    ],
  },
  {
    id: 7, title: "Sunday afternoon", duration: 55,
    transcript: [
      {id:1,startTime:0,text:"Sunday afternoons make me existential for some reason."},
      {id:2,startTime:7,text:"Something about the light. The quiet."},
      {id:3,startTime:12,text:"The feeling that a week is ending before I was ready."},
      g(4,17),
      {id:5,startTime:19,text:"Did I use it well? Probably not."},
      {id:6,startTime:24,text:"Did I rest? Sort of."},
      {id:7,startTime:27,text:"Did I do anything I'm proud of?"},
      g(8,32),
      {id:9,startTime:34,text:"Maybe that's the wrong question."},
      {id:10,startTime:38,text:"Maybe the question is just: was I present?"},
      {id:11,startTime:43,text:"And today, yeah. I think I was."},
    ],
  },
  {
    id: 8, title: "On letting go", duration: 91,
    transcript: [
      {id:1,startTime:0,text:"I've been holding onto something that's already gone."},
      {id:2,startTime:6,text:"A version of a relationship that no longer exists."},
      {id:3,startTime:12,text:"And I keep visiting it like a museum."},
      g(4,17),
      {id:5,startTime:19,text:"Touching things that used to mean something."},
      {id:6,startTime:24,text:"Looking for signs of life in something static."},
      g(7,29),
      {id:8,startTime:31,text:"I think grief works like that."},
      {id:9,startTime:35,text:"Even when nothing died, technically."},
      {id:10,startTime:40,text:"Sometimes you grieve the version of things you thought would last."},
      g(11,47),
      {id:12,startTime:49,text:"I'm trying to close that museum."},
      {id:13,startTime:54,text:"Lock the doors. Let the dust settle."},
      {id:14,startTime:59,text:"And walk somewhere new."},
    ],
  },
  {
    id: 9, title: "What I want", duration: 63,
    transcript: [
      {id:1,startTime:0,text:"If I'm honest — and this is just for me —"},
      {id:2,startTime:6,text:"I want a quiet life."},
      {id:3,startTime:10,text:"I want mornings with no alarm."},
      {id:4,startTime:14,text:"Work that feels like mine."},
      {id:5,startTime:18,text:"People who know me well enough to ask the real questions."},
      g(6,24),
      {id:7,startTime:26,text:"I don't want to be famous."},
      {id:8,startTime:30,text:"I don't want to be impressive."},
      {id:9,startTime:34,text:"I want to be okay with myself at the end of the day."},
      g(10,40),
      {id:11,startTime:42,text:"That's it. That's the whole list."},
    ],
  },
  {
    id: 10, title: "On time", duration: 88,
    transcript: [
      {id:1,startTime:0,text:"I keep acting like time is something I have plenty of."},
      {id:2,startTime:7,text:"Like there's always another version of this moment coming."},
      {id:3,startTime:13,text:"There isn't."},
      g(4,16),
      {id:5,startTime:18,text:"This specific combination of people, circumstances, age —"},
      {id:6,startTime:25,text:"it only exists once."},
      g(7,28),
      {id:8,startTime:30,text:"I want to take that seriously."},
      {id:9,startTime:35,text:"Not in a panicked way. In a present way."},
      g(10,40),
      {id:11,startTime:42,text:"What am I waiting for permission to do?"},
      {id:12,startTime:48,text:"Who gave everyone else the authority to start and not me?"},
      g(13,55),
      {id:14,startTime:57,text:"Nobody. I'm the one waiting on myself."},
    ],
  },
  {
    id: 11, title: "After the argument", duration: 71,
    transcript: [
      {id:1,startTime:0,text:"We argued again. Same argument. Different words."},
      {id:2,startTime:6,text:"And I said things I meant and things I didn't."},
      {id:3,startTime:12,text:"And now it's quiet and I'm sitting with both."},
      g(4,17),
      {id:5,startTime:19,text:"I think what I actually wanted was to be heard."},
      {id:6,startTime:25,text:"Not agreed with. Just heard."},
      g(7,30),
      {id:8,startTime:32,text:"And maybe that's what they wanted too."},
      {id:9,startTime:37,text:"And we were both so busy talking we forgot to listen."},
      g(10,44),
      {id:11,startTime:46,text:"Tomorrow I'll try again."},
      {id:12,startTime:50,text:"Slower. Softer."},
    ],
  },
  {
    id: 12, title: "Small victories", duration: 59,
    transcript: [
      {id:1,startTime:0,text:"I made my bed today."},
      {id:2,startTime:4,text:"Which sounds stupid but last week I couldn't even do that."},
      g(3,9),
      {id:4,startTime:11,text:"I also replied to three messages I'd been avoiding."},
      {id:5,startTime:17,text:"And drank enough water."},
      g(6,21),
      {id:7,startTime:23,text:"Some days the win is just surviving with dignity."},
      {id:8,startTime:30,text:"And I'm learning to count those days."},
      {id:9,startTime:35,text:"Not dismiss them."},
      g(10,39),
      {id:11,startTime:41,text:"Today was a small win. I'll take it."},
    ],
  },
  {
    id: 13, title: "On being understood", duration: 76,
    transcript: [
      {id:1,startTime:0,text:"I wonder sometimes if anyone really knows me."},
      {id:2,startTime:6,text:"Like the full picture. Not just the version I present."},
      g(3,12),
      {id:4,startTime:14,text:"I curate myself so carefully."},
      {id:5,startTime:18,text:"I show people the parts I think they can handle."},
      {id:6,startTime:24,text:"And hide the rest."},
      g(7,28),
      {id:8,startTime:30,text:"But then I feel lonely and wonder why."},
      {id:9,startTime:36,text:"And the answer is obviously: you hid yourself."},
      g(10,42),
      {id:11,startTime:44,text:"Being known requires the risk of being seen."},
      {id:12,startTime:50,text:"I keep wanting the first without doing the second."},
    ],
  },
  {
    id: 14, title: "Morning ramble", duration: 52,
    transcript: [
      {id:1,startTime:0,text:"Just woke up. Coffee's brewing."},
      {id:2,startTime:5,text:"Had a dream I can't fully remember."},
      {id:3,startTime:9,text:"But the feeling is still here. Warm. A little sad."},
      g(4,15),
      {id:5,startTime:17,text:"I want to be the kind of person who journals."},
      {id:6,startTime:22,text:"So I'm doing this instead."},
      {id:7,startTime:26,text:"Close enough."},
      g(8,30),
      {id:9,startTime:32,text:"Today I want to be intentional."},
      {id:10,startTime:37,text:"Whatever that means. We'll find out."},
    ],
  },
  {
    id: 15, title: "On ambition", duration: 84,
    transcript: [
      {id:1,startTime:0,text:"I've been asking myself: is this ambition or is this fear?"},
      {id:2,startTime:7,text:"Because they feel identical from the inside."},
      g(3,13),
      {id:4,startTime:15,text:"Ambition pulls you toward something."},
      {id:5,startTime:19,text:"Fear pushes you away from something else."},
      {id:6,startTime:24,text:"But the motion looks the same."},
      g(7,28),
      {id:8,startTime:30,text:"I think a lot of what I call drive is actually dread."},
      {id:9,startTime:37,text:"Dread of stagnation. Of becoming someone I don't respect."},
      g(10,44),
      {id:11,startTime:46,text:"Maybe I need both. Maybe they're not enemies."},
      {id:12,startTime:52,text:"Maybe the trick is knowing which one is leading."},
    ],
  },
  {
    id: 16, title: "What peace feels like", duration: 61,
    transcript: [
      {id:1,startTime:0,text:"I had a peaceful moment today."},
      {id:2,startTime:5,text:"Genuinely peaceful. No noise in my head."},
      {id:3,startTime:10,text:"Just me, a bench, and twenty minutes."},
      g(4,15),
      {id:5,startTime:17,text:"I forget what that feels like so often."},
      {id:6,startTime:22,text:"I fill every gap with something. A podcast. A scroll."},
      {id:7,startTime:28,text:"Anything to avoid the silence."},
      g(8,33),
      {id:9,startTime:35,text:"But today I didn't. And it was fine."},
      {id:10,startTime:41,text:"Better than fine."},
      {id:11,startTime:44,text:"It was exactly what I needed."},
    ],
  },
  {
    id: 17, title: "To my future self", duration: 78,
    transcript: [
      {id:1,startTime:0,text:"I'm recording this for future me."},
      {id:2,startTime:5,text:"Whoever you are. Whenever you find this."},
      g(3,10),
      {id:4,startTime:12,text:"Right now I'm okay. Mostly."},
      {id:5,startTime:17,text:"There are things I'm figuring out."},
      {id:6,startTime:21,text:"Things I'm scared of."},
      {id:7,startTime:24,text:"Things I hope work out."},
      g(8,28),
      {id:9,startTime:30,text:"I hope by the time you hear this some of them did."},
      {id:10,startTime:36,text:"And the ones that didn't — I hope you made peace with them."},
      g(11,43),
      {id:12,startTime:45,text:"Be patient with yourself. Please."},
      {id:13,startTime:51,text:"You deserved more of that from me."},
    ],
  },
  {
    id: 18, title: "On rest", duration: 66,
    transcript: [
      {id:1,startTime:0,text:"I'm tired. Not sleepy tired. Tired tired."},
      {id:2,startTime:6,text:"The kind that sleep doesn't fully fix."},
      g(3,11),
      {id:4,startTime:13,text:"I think I've been running on something."},
      {id:5,startTime:18,text:"Adrenaline. Obligation. Guilt."},
      {id:6,startTime:23,text:"Not sure. Probably all three."},
      g(7,27),
      {id:8,startTime:29,text:"Rest isn't lazy. I know that intellectually."},
      {id:9,startTime:35,text:"But I still feel guilty when I stop."},
      g(10,40),
      {id:11,startTime:42,text:"Working on it."},
      {id:12,startTime:45,text:"For now I'm going to lie down and not apologise for it."},
    ],
  },
  {
    id: 19, title: "Uncertainty", duration: 73,
    transcript: [
      {id:1,startTime:0,text:"Nothing is certain right now."},
      {id:2,startTime:5,text:"And I'm sitting with that."},
      {id:3,startTime:9,text:"Not comfortably. But I'm sitting with it."},
      g(4,14),
      {id:5,startTime:16,text:"I used to think uncertainty was the enemy."},
      {id:6,startTime:22,text:"Something to defeat. To resolve."},
      {id:7,startTime:27,text:"Now I think it's just the texture of being alive."},
      g(8,33),
      {id:9,startTime:35,text:"Everything certain is either past or an illusion."},
      {id:10,startTime:42,text:"The present is always uncertain."},
      g(11,47),
      {id:12,startTime:49,text:"Maybe I can just be here in it."},
      {id:13,startTime:54,text:"Not fix it. Just be in it."},
    ],
  },
  {
    id: 20, title: "End of the day", duration: 58,
    transcript: [
      {id:1,startTime:0,text:"It's late. The day is done."},
      {id:2,startTime:5,text:"I don't know if it was a good one."},
      {id:3,startTime:9,text:"I think I was kind. Mostly."},
      {id:4,startTime:13,text:"I think I worked. Enough."},
      g(5,17),
      {id:6,startTime:19,text:"There was a moment around three where I felt fully alive."},
      {id:7,startTime:26,text:"And then I forgot to hold onto it."},
      g(8,31),
      {id:9,startTime:33,text:"But I remembered it now."},
      {id:10,startTime:37,text:"So maybe that counts."},
      g(11,41),
      {id:12,startTime:43,text:"Goodnight. Tomorrow we try again."},
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
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
    const tick = (ts: number) => {
      const progress = Math.min(1, (ts - startTs) / 600);
      const result = time.split("").map((char, i) => {
        if (char === ":") return ":";
        const cp = Math.max(0, progress - i * 0.15);
        if (cp >= 1) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join("");
      setDisplay(result);
      if (progress < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { setDisplay(time); setGlitching(false); }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trackIndex]); // eslint-disable-line
  return (
    <span style={{ fontSize:52, fontWeight:600, color:"#ffffff", letterSpacing:"0.04em", lineHeight:1, fontVariantNumeric:"tabular-nums", fontFamily:"'IBM Plex Sans', sans-serif", filter:glitching?"blur(0.5px)":"none", transition:"filter 0.1s" }}>
      {display}
    </span>
  );
}

// ─── Animated title ───────────────────────────────────────────────────────────
function AnimatedTitle({ title, direction }: { title: string; direction: "left"|"right" }) {
  const [displayed, setDisplayed] = useState(title);
  const [state, setState] = useState<"idle"|"exit"|"enter">("idle");
  const prev = useRef(title);
  useEffect(() => {
    if (title === prev.current) return;
    prev.current = title;
    setState("exit");
    setTimeout(() => { setDisplayed(title); setState("enter"); setTimeout(() => setState("idle"), 350); }, 200);
  }, [title]);
  const tx: Record<string,string> = { idle:"translateX(0)", exit:direction==="right"?"translateX(-28px)":"translateX(28px)", enter:direction==="right"?"translateX(20px)":"translateX(-20px)" };
  const op: Record<string,number> = { idle:1, exit:0, enter:0 };
  return (
    <span style={{ fontSize:17, fontWeight:400, color:"#ffffff", letterSpacing:"-0.01em", lineHeight:1.2, display:"block", transform:tx[state], opacity:op[state]??1, transition:state==="exit"?"transform 0.2s cubic-bezier(0.4,0,1,1), opacity 0.15s ease":state==="idle"?"transform 0.38s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease":"none" }}>
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

// ─── Spring ───────────────────────────────────────────────────────────────────
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
function IconBtn({ onClick, label, children, playSound, active }: { onClick?: () => void; label: string; children: React.ReactNode; playSound?: () => void; active?: boolean }) {
  const [hovered, setHovered] = useState(false); const [pressed, setPressed] = useState(false);
  return (
    <button onClick={() => { playSound?.(); onClick?.(); }} aria-label={label}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      style={{ width:48, height:48, borderRadius:10, background: active ? "#2a2a2a" : hovered?"#252525":"#1C1C1C", border: active ? "1px solid #3a3a3a" : "none", color:"#ffffff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transform:pressed?"scale(0.91)":"scale(1)", transitionProperty:"background, transform", transitionDuration:pressed?"0.05s":"0.35s", transitionTimingFunction:"cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >{children}</button>
  );
}

// ─── Speed badge ──────────────────────────────────────────────────────────────
function SpeedBtn({ speed, onClick, active }: { speed: number; onClick: () => void; active: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
      style={{ width:48, height:48, borderRadius:10, background: active?"#E8470A":"#1C1C1C", border:"none", color:"#ffffff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, fontFamily:"'IBM Plex Sans', sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.02em", transform:pressed?"scale(0.91)":"scale(1)", transition:"transform 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.2s" }}
    >{speed}×</button>
  );
}

// ─── Stacked side menu ────────────────────────────────────────────────────────
function SideMenu({
  showQueue, setShowQueue, playTock, speed, setSpeed, onBookmark, onShare, onCopy, onDelete,
}: {
  showQueue: boolean; setShowQueue: (v: boolean) => void;
  playTock: () => void; speed: number; setSpeed: (s: number) => void;
  onBookmark: () => void; onShare: () => void; onCopy: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);

  // Spring values for each extra button — they stack vertically below ⋮
  const s1 = useSpring(menuOpen);
  const s2 = useSpring(menuOpen);
  const s3 = useSpring(menuOpen);
  const s4 = useSpring(menuOpen);
  const s5 = useSpring(menuOpen);

  const SPEEDS = [1, 1.5, 2];

  const menuItems = [
    { icon: <Gauge size={18} strokeWidth={1.8} />, label: "Speed", action: () => setSpeedOpen(v => !v), spring: s1 },
    { icon: <Bookmark size={18} strokeWidth={1.8} />, label: "Bookmark", action: () => { onBookmark(); setMenuOpen(false); }, spring: s2 },
    { icon: <Share2 size={18} strokeWidth={1.8} />, label: "Share", action: () => { onShare(); setMenuOpen(false); }, spring: s3 },
    { icon: <Copy size={18} strokeWidth={1.8} />, label: "Copy transcript", action: () => { onCopy(); setMenuOpen(false); }, spring: s4 },
    { icon: <Trash2 size={18} strokeWidth={1.8} color="#E8470A" />, label: "Delete", action: () => { onDelete(); setMenuOpen(false); }, spring: s5 },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
      {/* Chevron — queue toggle */}
      <IconBtn onClick={() => { setShowQueue(!showQueue); }} label="Toggle queue" playSound={playTock}>
        <ChevronDown size={20} strokeWidth={1.5} style={{ transform:showQueue?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.45s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </IconBtn>

      {/* Speed buttons — spring out when speedOpen */}
      {speedOpen && menuOpen && SPEEDS.map((sp, i) => (
        <div key={sp} style={{ transform:`scale(${s1})`, opacity:s1, transition:"none" }}>
          <SpeedBtn speed={sp} active={speed === sp} onClick={() => { setSpeed(sp); playTock(); }} />
        </div>
      ))}

      {/* Stacked menu items — spring out below ⋮ */}
      {menuItems.map((item, i) => {
        if (i === 0 && !menuOpen && !speedOpen) return null; // hide speed sub when closed
        return (
          <div key={item.label}
            style={{
              transform: `translateY(${(1 - item.spring) * -12}px) scale(${0.85 + item.spring * 0.15})`,
              opacity: item.spring,
              pointerEvents: item.spring < 0.1 ? "none" : "auto",
              transitionDelay: `${i * 30}ms`,
            }}
          >
            <IconBtn onClick={item.action} label={item.label} playSound={playTock} active={item.label === "Speed" && speedOpen}>
              {item.icon}
            </IconBtn>
          </div>
        );
      })}

      {/* ⋮ More button — always at bottom */}
      <IconBtn onClick={() => { playTock(); setMenuOpen(v => !v); if (menuOpen) setSpeedOpen(false); }} label="More options" active={menuOpen}>
        <MoreVertical size={20} strokeWidth={1.5} style={{ transform: menuOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.35s cubic-bezier(0.34,1.56,0.64,1)" }} />
      </IconBtn>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AudioPlayer() {
  const [noteIndex, setNoteIndex] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [skipDir, setSkipDir] = useState<"left"|"right">("right");
  const [speed, setSpeed] = useState(1);

  const elapsedRef = useRef(0); const startTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0); const playingRef = useRef(false);
  const lastSecRef = useRef(-1);
  const playTock = useClickSound();
  const playTick = useTickSound();
  const note = NOTES[noteIndex]; const total = note.duration;

  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (startTsRef.current === null) startTsRef.current = ts;
    const elapsed = elapsedRef.current + (ts - startTsRef.current) / 1000 * speed;
    if (elapsed >= total) { elapsedRef.current = 0; startTsRef.current = null; playingRef.current = false; lastSecRef.current = -1; setPlaying(false); setDisplayTime(0); return; }
    const wholeSecond = Math.floor(elapsed);
    if (wholeSecond !== lastSecRef.current) { lastSecRef.current = wholeSecond; playTick(); }
    setDisplayTime(elapsed); rafRef.current = requestAnimationFrame(tick);
  }, [total, playTick, speed]);

  const play = useCallback(() => { playingRef.current = true; startTsRef.current = null; setPlaying(true); rafRef.current = requestAnimationFrame(tick); }, [tick]);
  const pause = useCallback(() => { elapsedRef.current = displayTime; playingRef.current = false; startTsRef.current = null; cancelAnimationFrame(rafRef.current); setPlaying(false); }, [displayTime]);
  const stop = useCallback(() => { playingRef.current = false; startTsRef.current = null; elapsedRef.current = 0; lastSecRef.current = -1; cancelAnimationFrame(rafRef.current); setPlaying(false); setDisplayTime(0); }, []);
  const skipTo = useCallback((idx: number, dir: "left"|"right") => { stop(); setSkipDir(dir); setNoteIndex(idx); }, [stop]);
  const prev = () => { playTock(); skipTo((noteIndex - 1 + NOTES.length) % NOTES.length, "left"); };
  const next = () => { playTock(); skipTo((noteIndex + 1) % NOTES.length, "right"); };

  useEffect(() => { if (playing) { cancelAnimationFrame(rafRef.current); startTsRef.current = null; rafRef.current = requestAnimationFrame(tick); } }, [speed]); // eslint-disable-line
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const remaining = Math.max(0, total - Math.floor(displayTime));
  const statusLabel = playing ? "Listening" : displayTime > 0 ? "Paused" : "Ready";

  return (
    <>
      <div style={{ fontFamily:"'IBM Plex Sans', sans-serif", width:"100%", maxWidth:820, margin:"0 auto", userSelect:"none" }}>

        {/* Transcript tab */}
        <div style={{ display:"flex" }}>
          <button onClick={() => { playTock(); setShowLyrics(true); }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)")}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = "scale(1)")}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; (e.currentTarget as HTMLButtonElement).style.background = "#1C1C1C"; }}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 20px", background:"#1C1C1C", border:"none", borderRadius:"12px 12px 0 0", color:"#ffffff", fontFamily:"'IBM Plex Sans', sans-serif", fontSize:15, fontWeight:400, letterSpacing:"0.01em", cursor:"pointer", whiteSpace:"nowrap", transition:"background 0.15s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)", transformOrigin:"bottom center" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "#242424")}
          ><ScrollText size={17} strokeWidth={1.5} /> View Transcript</button>
        </div>

        {/* Player row */}
        <div style={{ display:"flex", alignItems:"stretch", gap:10 }}>
          <div style={{ flex:1, minWidth:0, background:"#171717", borderRadius:"0 12px 12px 12px", padding:"22px 24px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:7, overflow:"hidden", flex:1, marginRight:16 }}>
                <AnimatedTitle title={note.title} direction={skipDir} />
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#E8470A", display:"inline-block", flexShrink:0, animation:playing?"pulseDot 1.6s ease-in-out infinite":"none" }} />
                  <span style={{ fontSize:14, fontWeight:400, color:"#BDBDBD", letterSpacing:"0.01em" }}>{statusLabel}</span>
                  {speed > 1 && <span style={{ fontSize:11, fontWeight:600, color:"#E8470A", letterSpacing:"0.05em" }}>{speed}×</span>}
                </div>
              </div>
              <GlitchTimer time={formatTime(remaining)} trackIndex={noteIndex} />
            </div>

            <Waveform playing={playing} />

            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <IconBtn onClick={prev} label="Previous note" playSound={playTock}><SkipBackFilled /></IconBtn>
              <IconBtn onClick={next} label="Next note" playSound={playTock}><SkipForwardFilled /></IconBtn>
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

          {/* Side menu */}
          <SideMenu
            showQueue={showQueue} setShowQueue={setShowQueue}
            playTock={playTock} speed={speed} setSpeed={setSpeed}
            onBookmark={() => alert("Bookmarked!")}
            onShare={() => alert("Share coming soon")}
            onCopy={() => { const text = note.transcript.map(l => l.text).filter(Boolean).join(" "); navigator.clipboard?.writeText(text); }}
            onDelete={() => alert("Delete coming soon")}
          />
        </div>

        {/* Voice notes queue */}
        <AnimatedPanel open={showQueue} style={{ marginRight:58 }}>
          <div style={{ background:"#171717", borderRadius:"0 0 12px 0" }}>
            <div style={{ padding:"16px 24px 8px" }}>
              <p style={{ fontSize:11, fontWeight:600, color:"#BDBDBD", letterSpacing:"0.12em", textTransform:"uppercase", margin:0 }}>
                Voice Notes <span style={{ color:"#444", fontWeight:400 }}>— {NOTES.length} recordings</span>
              </p>
            </div>
            <div style={{ maxHeight:320, overflowY:"auto", padding:"0 24px 16px", scrollbarWidth:"thin", scrollbarColor:"#2a2a2a transparent" }}>
              {NOTES.map((n, i) => (
                <div key={n.id} onClick={() => { playTock(); skipTo(i, i > noteIndex ? "right" : "left"); }}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"9px 10px", borderRadius:8, cursor:"pointer", background:i===noteIndex?"#1C1C1C":"transparent", transition:"background 0.15s" }}
                  onMouseEnter={(e) => { if (i !== noteIndex) (e.currentTarget as HTMLDivElement).style.background = "#1a1a1a"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = i===noteIndex?"#1C1C1C":"transparent"; }}
                >
                  <div style={{ width:18, textAlign:"center", flexShrink:0, fontSize:13, color:"#BDBDBD", fontVariantNumeric:"tabular-nums" }}>
                    {i===noteIndex && playing
                      ? <span style={{ width:7, height:7, borderRadius:"50%", background:"#E8470A", display:"inline-block", animation:"pulseDot 1.6s ease-in-out infinite" }} />
                      : i+1}
                  </div>
                  <span style={{ flex:1, fontSize:14, fontWeight:i===noteIndex?500:400, color:i===noteIndex?"#ffffff":"#BDBDBD", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{n.title}</span>
                  <span style={{ fontSize:13, color:"#BDBDBD", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>{formatTime(n.duration)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedPanel>
      </div>

      <TranscriptDrawer
        open={showLyrics} onClose={() => setShowLyrics(false)}
        lines={note.transcript} currentTime={displayTime}
        playing={playing} onPlayPause={playing ? pause : play}
        onStop={() => { stop(); setShowLyrics(false); }}
        onNext={() => { playTock(); skipTo((noteIndex + 1) % NOTES.length, "right"); }}
        trackTitle={note.title}
      />
    </>
  );
}

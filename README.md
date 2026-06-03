# Audio Player

A sermon & podcast audio player built with **Next.js 14**, **TypeScript**, and **IBM Plex Sans**.

---

## Getting Started

```bash
git clone https://github.com/your-username/audio-player.git
cd audio-player
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Build for production

```bash
npm run build && npm start
```

---

## Project Structure

```
audio-player/
├── app/
│   ├── components/
│   │   ├── AudioPlayer.tsx       # Main player
│   │   └── TranscriptDrawer.tsx  # Right-slide transcript panel
│   ├── globals.css               # IBM Plex Sans + animations
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── fonts/                    # Self-hosted IBM Plex Sans TTF
└── README.md
```

---

## Features

- ▶️ Play / Pause / Stop with spring-physics button animations
- ⏭ Skip between tracks
- 🎚 Waveform scrubbing
- 🌊 Animated brightness waveform while playing
- 📋 **Transcript drawer** — slides in from the right with live auto-scrolling lyrics
- 🎵 Track queue with spring animation
- 🔊 Soft tock click sound on every button (Web Audio API)
- 🌑 Dark theme — `#111111` / `#171717` / `#1C1C1C`

---

## Push to GitHub

```bash
git init && git add .
git commit -m "feat: right-slide transcript drawer with live auto-scrolling lyrics"
git branch -M main
git remote add origin https://github.com/your-username/audio-player.git
git push -u origin main
```

---

## License

MIT

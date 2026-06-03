# Audio Player

A sermon & podcast audio player built with **Next.js 14**, **TypeScript**, and **IBM Plex Sans**.

---

## Getting Started

### 1. Clone or download

```bash
git clone https://github.com/your-username/audio-player.git
cd audio-player
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Build for production

```bash
npm run build
npm start
```

---

## Project Structure

```
audio-player/
├── app/
│   ├── components/
│   │   └── AudioPlayer.tsx     # Main player component
│   ├── globals.css             # IBM Plex Sans @font-face + base styles
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   └── fonts/                  # Self-hosted IBM Plex Sans TTF files
├── package.json
└── README.md
```

---

## Tech Stack

- [Next.js 14](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Lucide React](https://lucide.dev/) — Icons
- IBM Plex Sans — Self-hosted typeface
- Tailwind CSS

---

## Features

- ▶️ Play / Pause / Stop
- ⏭ Skip between tracks
- 🎚 Click waveform to scrub
- 🌊 Travelling glow pulse waveform — bars rise and fall as playhead passes
- 📋 Transcript panel toggle
- 🎵 Track queue
- 🌑 Dark theme — `#111111` / `#171717` / `#1C1C1C`

---

## Push to GitHub

```bash
git init
git add .
git commit -m "feat: travelling glow pulse waveform — bars rise and collapse as playhead passes"
git branch -M main
git remote add origin https://github.com/your-username/audio-player.git
git push -u origin main
```

---

## License

MIT

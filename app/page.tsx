import AudioPlayer from "./components/AudioPlayer";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#111111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <AudioPlayer />
    </main>
  );
}

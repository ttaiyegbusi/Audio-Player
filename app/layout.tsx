import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audio Player",
  description: "Sermon & podcast audio player",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

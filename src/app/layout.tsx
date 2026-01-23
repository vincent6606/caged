import type { Metadata } from "next";
import { Silkscreen } from "next/font/google";
import "./globals.css";

const silkscreen = Silkscreen({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-silkscreen",
});

export const metadata: Metadata = {
  title: "Guitar Architect v27",
  description: "Retro Digital Practice Station",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={silkscreen.variable}>
        {/* AlphaTab CSS for rendering Music Score/Target Notation */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/alphaTab.css" />
        {children}
      </body>
    </html>
  );
}

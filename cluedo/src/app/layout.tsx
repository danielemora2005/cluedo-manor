import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cluedo: Manor of Shadows",
  description:
    "An online multiplayer mystery deduction game inspired by the classic Cluedo board game.",
  keywords: ["cluedo", "clue", "board game", "mystery", "multiplayer"],
  openGraph: {
    title: "Cluedo: Manor of Shadows",
    description: "Solve the murder. Unmask the culprit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-obsidian-950 text-manor-100 font-body antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#18181f",
              color: "#f7ecd8",
              border: "1px solid rgba(245,158,11,0.3)",
              fontFamily: "var(--font-lora)",
            },
            success: { iconTheme: { primary: "#f59e0b", secondary: "#18181f" } },
            error:   { iconTheme: { primary: "#dc2626", secondary: "#18181f" } },
          }}
        />
      </body>
    </html>
  );
}

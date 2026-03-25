import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

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
    <html lang="en" className={`${playfair.variable} ${lora.variable}`}>
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

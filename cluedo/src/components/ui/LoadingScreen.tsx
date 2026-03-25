"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="text-5xl"
      >
        🕯️
      </motion.div>
      <div className="text-center">
        <p className="font-serif text-gold-400 text-xl font-bold animate-pulse">
          Entering the Manor…
        </p>
        <p className="text-obsidian-500 text-sm mt-2 italic">
          The candles flicker in the darkness
        </p>
      </div>
      {/* Animated dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-gold-600"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

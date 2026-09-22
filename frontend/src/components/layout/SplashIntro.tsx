import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const SPLASH_SESSION_KEY = "ars-splash-shown";

function shouldShowSplash(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return !window.sessionStorage.getItem(SPLASH_SESSION_KEY);
}

export function SplashIntro() {
  const [mounted, setMounted] = useState(shouldShowSplash);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!mounted) return;
    window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    const timer = setTimeout(() => setFading(true), 2500);
    return () => clearTimeout(timer);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <motion.div
      role="presentation"
      aria-hidden="true"
      onClick={() => setFading(true)}
      initial={{ opacity: 1 }}
      animate={{ opacity: fading ? 0 : 1 }}
      transition={{ duration: 0.55, ease: [0.4, 0, 1, 1] }}
      onAnimationComplete={() => {
        if (fading) setMounted(false);
      }}
      className={cn(
        "fixed inset-0 z-100 flex cursor-pointer items-center justify-center bg-ink-950",
        // Set the instant fading starts, not once the fade finishes —
        // otherwise clicks on the real page underneath get swallowed for
        // the whole ~0.5s the overlay is still visually (if faintly) here.
        fading && "pointer-events-none",
      )}
    >
      <div className="bg-noise absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 42%, rgba(200,154,62,0.16), transparent 68%)",
        }}
      />
      <div
        className="relative w-80 sm:w-104 md:w-lg"
        style={{ aspectRatio: "747 / 585", filter: "contrast(1.1) saturate(1.12)" }}
      >
        <motion.img
          src="/logo-frame.png"
          alt=""
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-contain"
        />
        <motion.img
          src="/logo-lion.png"
          alt=""
          initial={{ opacity: 0, y: -230, rotate: -12 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.4, duration: 1.1, type: "spring", bounce: 0.4 }}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    </motion.div>
  );
}

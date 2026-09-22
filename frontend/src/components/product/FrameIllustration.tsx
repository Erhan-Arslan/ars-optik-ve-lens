import type { FrameShape, ProductCategory } from "@/types";

interface FrameIllustrationProps {
  shape?: FrameShape;
  category: ProductCategory;
  colorHex: string;
  className?: string;
}

const LENS_PATHS: Record<FrameShape, string> = {
  yuvarlak: "M 32 0 A 32 32 0 1 1 32 -0.01 Z",
  oval: "M 0 -30 C 20 -30 36 -16 36 0 C 36 16 20 30 0 30 C -20 30 -36 16 -36 0 C -36 -16 -20 -30 0 -30 Z",
  kare: "M -32 -28 h 64 a 8 8 0 0 1 8 8 v 40 a 8 8 0 0 1 -8 8 h -64 a 8 8 0 0 1 -8 -8 v -40 a 8 8 0 0 1 8 -8 Z",
  dikdortgen: "M -40 -22 h 80 a 8 8 0 0 1 8 8 v 28 a 8 8 0 0 1 -8 8 h -80 a 8 8 0 0 1 -8 -8 v -28 a 8 8 0 0 1 8 -8 Z",
  pilot:
    "M -34 -8 C -35 -26 -14 -32 2 -30 C 22 -28 38 -18 37 0 C 36 20 20 34 0 34 C -20 34 -34 14 -34 -8 Z",
  kelebek:
    "M -36 -4 C -39 -22 -18 -32 0 -29 C 20 -33 42 -22 39 -3 C 42 10 24 27 0 24 C -22 27 -38 12 -36 -4 Z",
};

function idSafe(hex: string): string {
  return hex.replace("#", "");
}

function LensPair({
  shape,
  glassId,
  rimStroke,
  highlightId,
}: {
  shape: FrameShape;
  glassId: string;
  rimStroke: string;
  highlightId: string;
}) {
  const d = LENS_PATHS[shape];
  const clipId = `clip-${shape}`;

  const lens = (
    <>
      <path d={d} fill={`url(#${glassId})`} stroke={rimStroke} strokeWidth="4" strokeLinejoin="round" />
      <g clipPath={`url(#${clipId})`}>
        <path d="M -34 -26 L -14 -26 L 6 26 L -14 26 Z" fill={`url(#${highlightId})`} />
        <path d="M 14 -30 L 22 -30 L 2 30 L -6 30 Z" fill="white" opacity="0.18" />
      </g>
      <path d={d} fill="none" stroke="black" strokeOpacity="0.08" strokeWidth="1" />
    </>
  );

  return (
    <>
      <g transform="translate(72,56)">{lens}</g>
      <g transform="translate(168,56)">{lens}</g>
    </>
  );
}

export function FrameIllustration({
  shape = "oval",
  category,
  colorHex,
  className,
}: FrameIllustrationProps) {
  const key = idSafe(colorHex);
  const rimGradId = `rim-${key}`;
  const glassId = `glass-${key}-${category}`;
  const highlightId = `highlight-${key}-${category}`;
  const shadowId = `shadow-${key}`;
  const isSun = category === "gunes-gozlugu";

  if (category === "lens") {
    return (
      <svg viewBox="0 0 240 110" className={className} aria-hidden>
        <defs>
          <radialGradient id={rimGradId} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor={colorHex} stopOpacity="1" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.55" />
          </radialGradient>
          <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#16110c" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#16110c" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="98" rx="52" ry="7" fill={`url(#${shadowId})`} />
        <rect
          x="68"
          y="18"
          width="104"
          height="74"
          rx="16"
          fill="white"
          stroke="var(--color-ink-200)"
          strokeWidth="2"
        />
        <circle cx="120" cy="55" r="27" fill={`url(#${rimGradId})`} stroke="white" strokeWidth="3" />
        <circle cx="111" cy="46" r="8" fill="white" fillOpacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 110" className={className} aria-hidden>
      <defs>
        <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorHex} stopOpacity="0.65" />
          <stop offset="35%" stopColor={colorHex} />
          <stop offset="100%" stopColor="#16110c" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={glassId} x1="0%" y1="0%" x2="100%" y2="100%">
          {isSun ? (
            <>
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.5" />
              <stop offset="100%" stopColor="#16110c" stopOpacity="0.62" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d8cfc2" stopOpacity="0.18" />
            </>
          )}
        </linearGradient>
        <linearGradient id={highlightId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity={isSun ? 0.35 : 0.55} />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#16110c" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#16110c" stopOpacity="0" />
        </radialGradient>
        {(["yuvarlak", "oval", "kare", "dikdortgen", "pilot", "kelebek"] as FrameShape[]).map((s) => (
          <clipPath id={`clip-${s}`} key={s}>
            <path d={LENS_PATHS[s]} />
          </clipPath>
        ))}
      </defs>

      {/* ground shadow */}
      <ellipse cx="120" cy="98" rx="88" ry="8" fill={`url(#${shadowId})`} />

      {/* temples */}
      <path d="M 6 18 Q 26 22 42 33" fill="none" stroke={`url(#${rimGradId})`} strokeWidth="5" strokeLinecap="round" />
      <path d="M 234 18 Q 214 22 198 33" fill="none" stroke={`url(#${rimGradId})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="40" cy="34" r="3.5" fill={colorHex} />
      <circle cx="200" cy="34" r="3.5" fill={colorHex} />

      {/* bridge */}
      <path d="M 102 49 Q 120 37 138 49" fill="none" stroke={`url(#${rimGradId})`} strokeWidth="5" strokeLinecap="round" />

      <LensPair shape={shape} glassId={glassId} rimStroke={`url(#${rimGradId})`} highlightId={highlightId} />
    </svg>
  );
}

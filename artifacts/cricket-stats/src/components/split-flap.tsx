import { useEffect, useRef, useState } from "react";

// ── Split-flap (flip-number) display for the web dashboard ────────────────────
// Mirrors the mobile SplitFlapDisplay: each digit is a tile split into top and
// bottom halves; on change the old top half flips down and the new bottom half
// flips up, like a station departure board.

type SizeKey = "lg" | "sm";
const SIZES: Record<SizeKey, { W: number; H: number; FS: number; R: number; DIV: number; MX: number }> = {
  lg: { W: 56, H: 78, FS: 50, R: 12, DIV: 2, MX: 3 },
  sm: { W: 26, H: 36, FS: 20, R: 6, DIV: 1, MX: 2 },
};

const FLIP_MS = 220;

function HalfDigit({
  digit,
  isTop,
  cfg,
  tileColor,
  inkColor,
}: {
  digit: string;
  isTop: boolean;
  cfg: (typeof SIZES)[SizeKey];
  tileColor: string;
  inkColor: string;
}) {
  const HH = (cfg.H - cfg.DIV) / 2;
  return (
    <div
      style={{
        width: cfg.W,
        height: HH,
        overflow: "hidden",
        backgroundColor: tileColor,
        borderRadius: isTop ? `${cfg.R}px ${cfg.R}px 0 0` : `0 0 ${cfg.R}px ${cfg.R}px`,
        position: "relative",
      }}
    >
      <div
        style={{
          width: cfg.W,
          height: cfg.H,
          marginTop: isTop ? 0 : -HH - cfg.DIV,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: cfg.FS,
          fontWeight: 700,
          lineHeight: 1,
          color: inkColor,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {digit}
      </div>
    </div>
  );
}

function SplitFlapDigit({
  digit,
  cfg,
  tileColor,
  inkColor,
  borderColor,
}: {
  digit: string;
  cfg: (typeof SIZES)[SizeKey];
  tileColor: string;
  inkColor: string;
  borderColor: string;
}) {
  const prevRef = useRef(digit);
  const [staticDigit, setStaticDigit] = useState(digit);
  const [animPrev, setAnimPrev] = useState(digit);
  const [phase, setPhase] = useState<"idle" | "top" | "bottom">("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (digit === prevRef.current) return;
    const old = prevRef.current;
    prevRef.current = digit;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAnimPrev(old);
    setPhase("top");
    timers.current.push(
      window.setTimeout(() => setPhase("bottom"), FLIP_MS),
      window.setTimeout(() => {
        setStaticDigit(digit);
        setPhase("idle");
      }, FLIP_MS * 2),
    );
  }, [digit]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const HH = (cfg.H - cfg.DIV) / 2;
  const animating = phase !== "idle";

  return (
    <div
      style={{
        width: cfg.W,
        height: cfg.H,
        margin: `0 ${cfg.MX}px`,
        borderRadius: cfg.R,
        border: `${cfg.DIV === 2 ? 1.5 : 1}px solid ${borderColor}`,
        boxShadow: `0 0 ${cfg.DIV === 2 ? 12 : 6}px ${borderColor}`,
        position: "relative",
        boxSizing: "content-box",
      }}
    >
      {/* Static halves: top shows next digit once its flap has fallen; bottom holds old digit until flip completes */}
      <HalfDigit digit={phase === "idle" ? staticDigit : digit} isTop cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
      <div style={{ height: cfg.DIV, backgroundColor: "rgba(0,0,0,0.55)" }} />
      <HalfDigit digit={phase === "idle" ? staticDigit : animPrev} isTop={false} cfg={cfg} tileColor={tileColor} inkColor={inkColor} />

      {animating && (
        <>
          {/* Old top half flipping down */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: cfg.W,
              height: HH,
              overflow: "hidden",
              transformOrigin: "bottom",
              backfaceVisibility: "hidden",
              transform: "rotateX(-90deg)",
              animation: phase === "top" ? `sf-top-flip ${FLIP_MS}ms ease-in forwards` : "none",
            }}
          >
            <HalfDigit digit={animPrev} isTop cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
          </div>
          {/* New bottom half flipping up */}
          {phase === "bottom" && (
            <div
              style={{
                position: "absolute",
                top: HH + cfg.DIV,
                left: 0,
                width: cfg.W,
                height: HH,
                overflow: "hidden",
                transformOrigin: "top",
                backfaceVisibility: "hidden",
                animation: `sf-bottom-flip ${FLIP_MS}ms ease-out forwards`,
              }}
            >
              <HalfDigit digit={digit} isTop={false} cfg={cfg} tileColor={tileColor} inkColor={inkColor} />
            </div>
          )}
        </>
      )}
      <style>{`
        @keyframes sf-top-flip {
          from { transform: perspective(800px) rotateX(0deg); }
          to   { transform: perspective(800px) rotateX(-90deg); }
        }
        @keyframes sf-bottom-flip {
          from { transform: perspective(800px) rotateX(90deg); }
          to   { transform: perspective(800px) rotateX(0deg); }
        }
      `}</style>
    </div>
  );
}

export function SplitFlapDisplay({
  value,
  minDigits = 1,
  size = "lg",
  tileColor = "#1C1C1E",
  inkColor = "#FFFDF8",
  borderColor = "rgba(210,160,40,0.55)",
}: {
  value: number;
  minDigits?: number;
  size?: SizeKey;
  tileColor?: string;
  inkColor?: string;
  borderColor?: string;
}) {
  const raw = String(value);
  const padded = raw.length < minDigits ? raw.padStart(minDigits, "0") : raw;
  const digits = padded.split("");
  const cfg = SIZES[size];

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {digits.map((d, i) => (
        <SplitFlapDigit
          // Key by position-from-right so digits keep identity as the number grows
          key={digits.length - i}
          digit={d}
          cfg={cfg}
          tileColor={tileColor}
          inkColor={inkColor}
          borderColor={borderColor}
        />
      ))}
    </div>
  );
}

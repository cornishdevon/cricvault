import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playCowMooSound } from "../utils/cricket-audio";
import { cn } from "@/lib/utils";

export type BattingHand = "right" | "left";
export type WheelShot = { x: number; y: number; runs: 1 | 2 | 4 | 6 };

const FIELD_SIZE = 310;
const CX = FIELD_SIZE / 2;
const CY = FIELD_SIZE / 2;
const FIELD_R  = FIELD_SIZE / 2 - 14;
const PITCH_R  = 14;
const DOT_R    = 8;
const HIT_R    = 18;
const SIX_MAX  = FIELD_R * 1.18;
const VIEW_PADDING = 24;
const VIEW_SIZE = FIELD_SIZE + VIEW_PADDING * 2;

function maxDist(runs: 1 | 2 | 4 | 6): number {
  if (runs === 6) return SIX_MAX;
  if (runs === 4) return FIELD_R;
  if (runs === 2) return FIELD_R * 0.72;
  return FIELD_R * 0.52;
}

function snapDist(runs: 1 | 2 | 4 | 6, tapped: number): number {
  if (runs === 6) return SIX_MAX;
  if (runs === 4) return FIELD_R;
  return Math.min(maxDist(runs), Math.max(PITCH_R + 8, tapped));
}

function shotColor(runs: 1 | 2 | 4 | 6): string {
  if (runs === 6) return "#7C3AED";
  if (runs === 4) return "#EB6B3D";
  if (runs === 2) return "#3686C5";
  return "#839197";
}

interface Props {
  shots: WheelShot[];
  onChange?: (shots: WheelShot[]) => void;
  battingHand?: BattingHand;
}

const RUN_OPTS: (1 | 2 | 4 | 6)[] = [1, 2, 4, 6];
const RUN_LABELS: Record<number, string> = { 1: "1 run", 2: "2 runs", 4: "Four", 6: "Six" };

const SHOT_LABELS = [
  { label: "Lucky edge", x: 155, y: 44 },
  { label: "Scoop", x: 195, y: 29 },
  { label: "Reverse sweep", x: 112, y: 40 },
  { label: "Leg glance", x: 213, y: 58 },
  { label: "Straight drive", x: 155, y: 266 },
  { label: "Cover drive", x: 83, y: 231 },
  { label: "Square drive", x: 57, y: 186 },
  { label: "Cut", x: 52, y: 132 },
  { label: "Leading edge", x: 48, y: 158 },
  { label: "Late cut", x: 86, y: 75 },
  { label: "Sweep", x: 224, y: 75 },
  { label: "Pull / Hook", x: 257, y: 132 },
  { label: "Flick", x: 253, y: 186 },
  { label: "Slog", x: 246, y: 209 },
  { label: "On drive", x: 227, y: 231 },
];

const BATTING_ORIGIN = { x: CX, y: CY - 25 };

function angularDistance(a: number, b: number): number {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function getShotLabels(battingHand: BattingHand) {
  if (battingHand === "right") return SHOT_LABELS;
  return SHOT_LABELS.map((label) => ({ ...label, x: 2 * CX - label.x }));
}

function getNearestShotLabel(x: number, y: number, shotLabels: typeof SHOT_LABELS): string {
  const shotAngle = Math.atan2(y - BATTING_ORIGIN.y, x - BATTING_ORIGIN.x);
  let nearestLabel = "";
  let nearestDistance = Number.POSITIVE_INFINITY;

  for (const label of shotLabels) {
    const labelAngle = Math.atan2(label.y - BATTING_ORIGIN.y, label.x - BATTING_ORIGIN.x);
    const distance = angularDistance(shotAngle, labelAngle);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestLabel = label.label;
    }
  }

  return nearestLabel;
}

function getShotSectionEdges(shotLabels: typeof SHOT_LABELS) {
  const originY = CY - 25;
  const angles = shotLabels.map(({ x, y }) => Math.atan2(y - originY, x - CX))
    .sort((a, b) => a - b);
  return angles.map((angle, i) => {
    const next = angles[(i + 1) % angles.length] + (i === angles.length - 1 ? 2 * Math.PI : 0);
    const behind = -Math.PI / 2;
    const middle = Math.abs(angle - behind) < 0.001
      ? behind + 0.28
      : Math.abs(next - behind) < 0.001
        ? behind - 0.28
        : (angle + next) / 2;
    const dx = Math.cos(middle);
    const dy = Math.sin(middle);
    const offset = originY - CY;
    const distance = -offset * dy + Math.sqrt(FIELD_R ** 2 - offset ** 2 + (offset * dy) ** 2);
    return { x: CX + distance * dx, y: originY + distance * dy };
  });
}

export function WagonWheel({ shots, onChange, battingHand = "right" }: Props) {
  const svgId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const stageRef = useRef<HTMLDivElement>(null);
  
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; tappedDist: number } | null>(null);
  const [chooseOpen, setChooseOpen]     = useState(false);
  const [mooVisible, setMooVisible]     = useState(false);
  const [mooRuns, setMooRuns]           = useState<4 | 6>(6);
  const [fourVisible, setFourVisible]   = useState(false);
  const [fourMessage, setFourMessage]   = useState("FOUR!");
  const [boundaryRuns, setBoundaryRuns] = useState<4 | 6>(4);
  
  const fourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mooTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fourSequence = useRef(0);
  const mooSequence = useRef(0);

  const shotLabels = useMemo(() => getShotLabels(battingHand), [battingHand]);
  const shotSectionEdges = useMemo(() => getShotSectionEdges(shotLabels), [shotLabels]);

  useEffect(() => () => {
    fourSequence.current += 1;
    if (fourTimer.current) clearTimeout(fourTimer.current);
    mooSequence.current += 1;
    if (mooTimer.current) clearTimeout(mooTimer.current);
  }, []);

  function celebrateBoundary(message: string, runs: 4 | 6) {
    setFourMessage(message);
    setBoundaryRuns(runs);
    const sequence = ++fourSequence.current;
    if (fourTimer.current) clearTimeout(fourTimer.current);
    
    setFourVisible(true);
    fourTimer.current = setTimeout(() => {
      if (sequence === fourSequence.current) setFourVisible(false);
    }, 1500);
  }

  async function celebrateCowCorner(runs: 4 | 6) {
    setMooRuns(runs);
    const sequence = ++mooSequence.current;
    if (mooTimer.current) clearTimeout(mooTimer.current);
    
    void playCowMooSound();
    
    if (sequence !== mooSequence.current) return;
    setMooVisible(true);
    mooTimer.current = setTimeout(() => {
      if (sequence === mooSequence.current) setMooVisible(false);
    }, 1800);
  }

  const shotsRef = useRef(shots);
  shotsRef.current = shots;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const draggingIdx = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  const getPoint = (e: React.PointerEvent) => {
    if (!stageRef.current) return null;
    const rect = stageRef.current.getBoundingClientRect();
    const scale = VIEW_SIZE / rect.width;
    const lx = (e.clientX - rect.left) * scale - VIEW_PADDING;
    const ly = (e.clientY - rect.top) * scale - VIEW_PADDING;
    return { lx, ly };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onChangeRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;
    const { lx, ly } = pt;
    
    touchStart.current = { x: lx, y: ly };
    didDrag.current = false;
    draggingIdx.current = null;
    
    const current = shotsRef.current;
    for (let i = 0; i < current.length; i++) {
      const sx = current[i].x * FIELD_SIZE;
      const sy = current[i].y * FIELD_SIZE;
      if (Math.hypot(lx - sx, ly - sy) < HIT_R) {
        draggingIdx.current = i;
        if (e.target instanceof Element) {
          e.target.setPointerCapture(e.pointerId);
        }
        return;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx.current === null) return;
    const pt = getPoint(e);
    if (!pt) return;
    const { lx, ly } = pt;
    
    const start = touchStart.current;
    if (start && Math.hypot(lx - start.x, ly - start.y) > 4) {
      didDrag.current = true;
    }
    
    const idx = draggingIdx.current;
    const shot = shotsRef.current[idx];
    const dx = lx - CX;
    const dy = ly - CY;
    const angle = Math.atan2(dy, dx);
    const raw = Math.hypot(dx, dy);
    const dist = Math.min(maxDist(shot.runs), Math.max(PITCH_R + 6, raw));
    
    const newShots = [...shotsRef.current];
    newShots[idx] = {
      ...shot,
      x: (CX + Math.cos(angle) * dist) / FIELD_SIZE,
      y: (CY + Math.sin(angle) * dist) / FIELD_SIZE,
    };
    onChangeRef.current?.(newShots);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!onChangeRef.current) return;
    const pt = getPoint(e);
    if (!pt) return;
    const { lx, ly } = pt;
    const idx = draggingIdx.current;
    const drag = didDrag.current;
    
    draggingIdx.current = null;
    didDrag.current = false;
    if (e.target instanceof Element) {
      e.target.releasePointerCapture(e.pointerId);
    }
    
    if (idx !== null) {
      if (!drag) {
        onChangeRef.current?.(shotsRef.current.filter((_, i) => i !== idx));
      }
      return;
    }
    
    const start = touchStart.current;
    if (start && Math.hypot(lx - start.x, ly - start.y) > 8) return;
    
    const dx = lx - CX;
    const dy = ly - CY;
    const dist = Math.hypot(dx, dy);
    if (dist < PITCH_R + 4 || dist > SIX_MAX + 6) return;
    
    setPendingPoint({ x: lx / FIELD_SIZE, y: ly / FIELD_SIZE, tappedDist: dist });
    setChooseOpen(true);
  };

  function confirmShot(runs: 1 | 2 | 4 | 6) {
    if (!pendingPoint || !onChange) return;
    const dx = pendingPoint.x * FIELD_SIZE - CX;
    const dy = pendingPoint.y * FIELD_SIZE - CY;
    const angle = Math.atan2(dy, dx);
    const dist = snapDist(runs, pendingPoint.tappedDist);
    const x = CX + Math.cos(angle) * dist;
    const y = CY + Math.sin(angle) * dist;
    
    onChange([...shots, {
      x: x / FIELD_SIZE,
      y: y / FIELD_SIZE,
      runs,
    }]);
    
    const cowCorner = getNearestShotLabel(x, y, shotLabels) === "Slog";
    if ((runs === 4 || runs === 6) && !cowCorner) {
      const angleFromCrease = Math.atan2(y - BATTING_ORIGIN.y, x - BATTING_ORIGIN.x);
      const luckyEdge = angularDistance(angleFromCrease, -Math.PI / 2) <= 0.28;
      const shotLabel = getNearestShotLabel(x, y, shotLabels);
      const messages: Record<string, string> = {
        "On drive": "classy!",
        "Straight drive": "beautiful shot!",
        "Cover drive": "fine shot!",
        "Leg glance": "delicately played!",
        "Scoop": "show off!",
        "Reverse sweep": "cheeky!",
        "Pull / Hook": "can't bowl there",
        "Flick": "well played",
        "Leading edge": "jammy thing!",
        "Late cut": "touch of class",
        "Cut": "awesome",
        "Square drive": "lovely stroke",
        "Sweep": "dominating",
      };
      const sixMessages = [
        "powerful shot!",
        "good bat you have there",
        "right out of the middle",
      ];
      const message = runs === 6
        ? shotLabel === "Straight drive"
          ? "that's huge!"
          : sixMessages[Math.floor(Math.random() * sixMessages.length)]
        : luckyEdge ? "says 4 in the book!" : messages[shotLabel] ?? "FOUR!";
      celebrateBoundary(message, runs);
    }
    if ((runs === 4 || runs === 6) && cowCorner) void celebrateCowCorner(runs);
    setChooseOpen(false);
    setPendingPoint(null);
  }

  return (
    <div className="flex flex-col items-center py-4 px-2 bg-[#F0E5C7] rounded-[20px] border border-[#E0D2AC] w-full">
      <div className="w-full flex flex-row items-center justify-between gap-2 mb-3 px-1">
        <span className="text-[8px] tracking-[0.8px] text-[#53705A] font-semibold uppercase">CRICVAULT · SHOT MAP</span>
        <span className="text-[10px] text-[#53705A]">{battingHand === "left" ? "Left-handed" : "Right-handed"}</span>
      </div>
      
      <div className="flex flex-row gap-3 mb-2.5 flex-wrap justify-center">
        {RUN_OPTS.map((r) => (
          <div key={r} className="flex flex-row items-center gap-[5px]">
            <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: shotColor(r) }} />
            <span className="text-[11px] text-[#555]">{RUN_LABELS[r]}</span>
          </div>
        ))}
      </div>

      <div 
        ref={stageRef}
        className="relative w-full max-w-[358px] aspect-square select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <svg
          pointerEvents="none"
          width="100%"
          height="100%"
          viewBox={`${-VIEW_PADDING} ${-VIEW_PADDING} ${VIEW_SIZE} ${VIEW_SIZE}`}
        >
          <defs>
            <radialGradient id={`${svgId}grass`} cx="42%" cy="32%" r="74%">
              <stop offset="0%" stopColor="#8BB957" />
              <stop offset="62%" stopColor="#528D45" />
              <stop offset="100%" stopColor="#2F6841" />
            </radialGradient>
            <linearGradient id={`${svgId}pitch`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#B6854F" />
              <stop offset="43%" stopColor="#E2BB7B" />
              <stop offset="100%" stopColor="#A87342" />
            </linearGradient>
            <clipPath id={`${svgId}field`}>
              <circle cx={CX} cy={CY} r={FIELD_R} />
            </clipPath>
          </defs>

          <circle cx={CX} cy={CY} r={SIX_MAX} fill="#7C3AED" fillOpacity={0.04} stroke="#7C3AED" strokeWidth={1} strokeDasharray="2 4" />
          <circle cx={CX} cy={CY + 5} r={FIELD_R + 3} fill="#2A5432" opacity={0.18} />
          <circle cx={CX} cy={CY} r={FIELD_R} fill={`url(#${svgId}grass)`} />
          
          <g clipPath={`url(#${svgId}field)`}>
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={i * 36} y={0} width={18} height={FIELD_SIZE} fill="#D6EB8C" opacity={0.1} />
            ))}
            <ellipse cx={CX - 58} cy={CY - 72} rx={106} ry={35} fill="#D7ED9C" opacity={0.09} transform={`rotate(-25 ${CX - 58} ${CY - 72})`} />
            <ellipse cx={CX + 68} cy={CY + 85} rx={130} ry={40} fill="#183F31" opacity={0.13} transform={`rotate(-25 ${CX + 68} ${CY + 85})`} />
          </g>

          <circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#76502E" strokeWidth={6.5} opacity={0.8} />
          <circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#F5DD9C" strokeWidth={4.3} />
          <circle cx={CX} cy={CY} r={FIELD_R} fill="none" stroke="#B78B52" strokeWidth={2} strokeDasharray="1 4.2" />
          <ellipse cx={CX} cy={CY} rx={FIELD_R * 0.6} ry={FIELD_R * 0.6} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          
          {shotSectionEdges.map(({ x, y }, i) => (
            <line key={`section-${i}`} x1={CX} y1={CY - 25} x2={x} y2={y} stroke="#F6BC7D" strokeWidth={1} strokeOpacity={0.9} />
          ))}

          {shotLabels.map(({ label, x, y }) => (
            <text key={label} x={x} y={y} textAnchor="middle" fontSize={8.7} fill="#000000" fontWeight="700">
              {label === "Lucky edge" || label === "Leg glance" || label === "Leading edge" || label === "Reverse sweep" ? (
                <>
                  <tspan x={x} y={y - 5}>{label.split(" ")[0]}</tspan>
                  <tspan x={x} y={y + 5}>{label.split(" ")[1]}</tspan>
                </>
              ) : label}
            </text>
          ))}

          {shots.map((shot, i) => {
            const sx    = shot.x * FIELD_SIZE;
            const sy    = shot.y * FIELD_SIZE;
            const dx    = sx - CX;
            const dy    = sy - CY;
            const dist  = Math.hypot(dx, dy);
            const sx0   = CX + (dx / dist) * PITCH_R;
            const sy0   = CY + (dy / dist) * PITCH_R;
            const color = shotColor(shot.runs);
            const isSix = shot.runs === 6;
            return (
              <g key={i}>
                {isSix && (
                  <line x1={sx0} y1={sy0} x2={sx} y2={sy} stroke={color} strokeWidth={1.5} strokeOpacity={0.35} strokeDasharray="4 3" />
                )}
                <line x1={sx0} y1={sy0} x2={sx} y2={sy} stroke={color} strokeWidth={2.5} strokeOpacity={isSix ? 0.7 : 0.85} />
                <circle cx={sx} cy={sy} r={DOT_R + 2} fill={color} fillOpacity={0.18} />
                <circle cx={sx} cy={sy} r={DOT_R} fill={color} fillOpacity={0.95} />
                <text x={sx} y={sy + 3} textAnchor="middle" fontSize={8} fill="#fff" fontWeight="700">
                  {shot.runs}
                </text>
              </g>
            );
          })}

          <rect x={CX - 11} y={CY - 30} width={24} height={66} rx={3} fill="#34472A" opacity={0.3} />
          <rect x={CX - 10} y={CY - 32} width={20} height={64} rx={2} fill={`url(#${svgId}pitch)`} stroke="#8C5E32" strokeWidth={1} />
          
          {[-1, 1].map((end) => (
            <g key={end}>
              <line x1={CX - 13} y1={CY + end * 22} x2={CX + 13} y2={CY + end * 22} stroke="#FFFFFF" strokeWidth={1.5} />
              {[-3, 0, 3].map((offset) => (
                <line key={offset} x1={CX + offset} y1={CY + end * 25} x2={CX + offset} y2={CY + end * 30} stroke="#54351D" strokeWidth={1.5} />
              ))}
              <line x1={CX - 4} y1={CY + (end === 1 ? 25 : -30)} x2={CX + 4} y2={CY + (end === 1 ? 25 : -30)} stroke="#54351D" strokeWidth={1.5} />
            </g>
          ))}
        </svg>

        <AnimatePresence>
          {fourVisible && (
            <motion.div
              initial={{ scale: 0.6, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 130, damping: 15 }}
              className="absolute top-[17%] inset-x-0 mx-auto flex flex-col items-center justify-center py-2.5 px-6 rounded-[18px] bg-[#FFF3CF] border-2 border-[#EB6B3D] shadow-md w-max pointer-events-none"
              aria-live="polite"
              aria-label={`${fourMessage} ${boundaryRuns === 6 ? "Six" : "Four"}`}
            >
              <div className={cn("text-[#A53715] font-bold", fourMessage !== "FOUR!" ? "text-[18px] leading-[24px] text-center" : "text-[30px] leading-[34px] tracking-[2px]")}>{fourMessage}</div>
              <div className="text-[#A53715] text-[9px] font-bold tracking-[2px] mt-0.5">{boundaryRuns === 6 ? "SIX" : "BOUNDARY"}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mooVisible && (
            <motion.div
              initial={{ scale: 0.55, rotate: -5, opacity: 0 }}
              animate={{ scale: 1, rotate: -5, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 130, damping: 15 }}
              className="absolute top-[38%] inset-x-0 mx-auto w-max flex flex-row items-center justify-center gap-2 py-2 px-3 rounded-[18px] bg-[#FFF3CF] border-2 border-[#8B5E24] shadow-[0_4px_8px_rgba(42,24,8,0.28)] pointer-events-none"
              aria-live="assertive"
              aria-label={`Moo! ${mooRuns === 4 ? "Four" : "Six"} into cow corner`}
            >
              <span className="text-[28px]">🐄</span>
              <div className="flex flex-col">
                <span className="text-[#5A3516] text-[20px] leading-[21px] font-bold tracking-[1.5px]">MOO!</span>
                <span className="text-[#7A5125] text-[8px] leading-[11px] font-bold tracking-[0.8px]">COW CORNER {mooRuns === 4 ? "FOUR" : "SIX"}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="text-[10px] text-[#5C7051] text-center mt-1">From the crease, every inning has its own story.</div>
      <div className="text-[10px] text-[#56664D] text-center mt-2">
        {onChange ? "Tap field to add · Drag dot to lengthen · Tap dot to remove" : "Interactive elements disabled in readonly view."}
      </div>

      {shots.length > 0 && onChange && (
        <button 
          onClick={() => onChange([])} 
          className="mt-2 px-4 py-1.5 rounded-lg border border-[#ccc] text-[12px] font-medium text-[#888] hover:bg-black/5"
        >
          Clear all shots
        </button>
      )}

      <AnimatePresence>
        {chooseOpen && (
          <div 
            className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4"
            onClick={() => { setChooseOpen(false); setPendingPoint(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-white rounded-[16px] p-5 w-full max-w-[290px] flex flex-col items-center shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-[16px] font-semibold text-[#1A2520] mb-[14px]">How many runs?</h3>
              <div className="flex flex-row gap-[10px]">
                {RUN_OPTS.map((r) => (
                  <button
                    key={r}
                    className="w-[56px] h-[56px] rounded-[12px] flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: shotColor(r as any) }}
                    onClick={() => confirmShot(r as any)}
                  >
                    <span className="text-[18px] font-semibold text-white">{r}</span>
                    <span className="text-[8px] font-normal text-white/80">{RUN_LABELS[r]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[10px] font-normal text-[#999]">Fours snap to boundary · Sixes go beyond</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
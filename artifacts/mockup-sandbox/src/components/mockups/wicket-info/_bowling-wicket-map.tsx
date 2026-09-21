import React, { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type BowlingWicket = {
  id: string;
  kind: "caught" | "bowled" | "lbw";
  x: number;
  y: number;
  batter?: string;
  over?: string;
  note?: string;
  /** Present only on aggregated maps; never written to a per-match wicket map. */
  sourceMatchId?: number;
  sourceOpponent?: string;
  sourceDate?: string;
};

export function parseWicketMap(value: string | null | undefined): BowlingWicket[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length > 100 || parsed.some((w) =>
      !w || typeof w !== "object" || Array.isArray(w) ||
      typeof w.id !== "string" || !["caught", "bowled", "lbw"].includes(w.kind as string) ||
      !Number.isFinite(w.x) || !Number.isFinite(w.y) ||
      w.x < 0 || w.x > 1 || w.y < 0 || w.y > 1
    )) throw new Error("Invalid saved wicket map");

    // Optional metadata is deliberately normalized independently of the map
    // geometry. A malformed historical note must not make every marker vanish.
    return parsed.map((entry) => {
      const wicket: BowlingWicket = {
        id: entry.id as string,
        kind: entry.kind as BowlingWicket["kind"],
        x: entry.x as number,
        y: entry.y as number,
      };
      if (typeof entry.batter === "string" && entry.batter.length <= 120) {
        wicket.batter = entry.batter;
      }
      if (typeof entry.over === "string" && entry.over.length <= 8 && /^(?:0|[1-9]\d*)(?:\.[0-5])?$/.test(entry.over)) {
        wicket.over = entry.over;
      }
      if (typeof entry.note === "string" && entry.note.length <= 1000) {
        wicket.note = entry.note;
      }
      return wicket;
    });
  } catch (error) {
    console.warn("Unable to read saved wicket map", error);
    return [];
  }
}

const SIZE = 320;
const CENTER = 160;
const RADIUS = 144;

function CricketBall({ x, y, number, compactMarkers, compactScale, selected }: {
  x: number;
  y: number;
  number: number;
  compactMarkers?: boolean;
  compactScale?: number;
  selected?: boolean;
}) {
  const scale = compactScale !== undefined ? compactScale : (compactMarkers ? 0.75 : 1);
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {selected && <circle cx={0} cy={0} r={12} fill="none" stroke="#FFF" strokeWidth={2} />}
      <circle cx={1} cy={2} r={10} fill="#671A1D" opacity={0.2} />
      <circle cx={0} cy={0} r={9} fill="#BC2938" stroke="#801521" strokeWidth={1} />
      <line x1={-3} y1={-8} x2={-3} y2={8} stroke="#FAD8CD" strokeWidth={1} strokeDasharray="1 2" />
      <text x={0} y={2.5} textAnchor="middle" fontSize={8} fontWeight="700" fill="#FFF">{number}</text>
    </g>
  );
}

function WicketMarker({
  wicket,
  number,
  x,
  y,
  compactMarkers,
  compactScale,
  selected,
  onSelect,
}: {
  wicket: BowlingWicket;
  number: number;
  x: number;
  y: number;
  compactMarkers?: boolean;
  compactScale?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const kind = wicket.kind === "caught" ? "Caught" : wicket.kind === "lbw" ? "LBW" : "Bowled";
  const select = (event: React.SyntheticEvent) => {
    // A marker is also inside the catch-placement surface. Stop its event so
    // selecting details can never place a second catch at the same position.
    event.stopPropagation();
    onSelect();
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Wicket ${number}, ${kind}. Select to view details.`}
      aria-pressed={selected}
      onClick={select}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(event);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <circle cx={x} cy={y} r={16} fill="transparent" />
      <CricketBall
        x={x}
        y={y}
        number={number}
        compactMarkers={compactMarkers}
        compactScale={compactScale}
        selected={selected}
      />
    </g>
  );
}

export function BowlingWicketMap({ wickets, onChange, compactMarkers, hideList, scrollableList }: {
  wickets: BowlingWicket[];
  onChange?: (wickets: BowlingWicket[]) => void;
  compactMarkers?: boolean;
  hideList?: boolean;
  scrollableList?: boolean;
}) {
  const [placingCatch, setPlacingCatch] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const svgId = `bowling-${useId().replace(/:/g, "")}-`;
  const widthRef = useRef<HTMLDivElement>(null);
  const editable = !!onChange;

  useEffect(() => {
    if (selectedId && !wickets.some((wicket) => wicket.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, wickets]);
  
  const caught = wickets.filter((w) => w.kind === "caught").length;
  const bowled = wickets.filter((w) => w.kind === "bowled").length;
  const lbw = wickets.filter((w) => w.kind === "lbw").length;
  const creaseWickets = wickets.map((wicket, index) => ({ wicket, number: index + 1 }))
    .filter(({ wicket }) => wicket.kind !== "caught");
  const creaseColumns = Math.ceil(Math.sqrt(creaseWickets.length));
  const creaseRows = Math.ceil(creaseWickets.length / (creaseColumns || 1));
  const compactSpacing = Math.min(12, 130 / (creaseColumns || 1));
  const compactScale = Math.min(0.75, (compactSpacing / 12) * 0.75);

  function addWicket(kind: BowlingWicket["kind"], x: number, y: number) {
    if (!onChange || wickets.length >= 100) return;
    const wicket: BowlingWicket = {
      id: `wicket-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      kind, x, y,
    };
    onChange([...wickets, wicket]);
    setSelectedId(wicket.id);
    setPlacingCatch(false);
  }

  function updateSelectedWicket(field: "batter" | "over" | "note", value: string) {
    if (!onChange || !selectedId) return;
    const maxLength = field === "batter" ? 120 : field === "over" ? 8 : 1000;
    const boundedValue = value.slice(0, maxLength);
    onChange(wickets.map((wicket) => {
      if (wicket.id !== selectedId) return wicket;
      const updated = { ...wicket };
      if (boundedValue.length === 0) delete updated[field];
      else updated[field] = boundedValue;
      return updated;
    }));
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!editable || !placingCatch) return;
    if (!widthRef.current) return;
    const rect = widthRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.width;
    if (Math.hypot(x * SIZE - CENTER, y * SIZE - CENTER) > RADIUS) return;
    addWicket("caught", x, y);
  };

  return (
    <div className="bg-[#F6F1E5] p-3 rounded-[16px] mt-[14px] w-full flex flex-col">
      <h3 className="text-[#244E33] text-[17px] font-bold">Bowler’s wicket map</h3>
      <p className="text-[#56705B] text-[12px] mt-1">{caught} caught &middot; {bowled} bowled &middot; {lbw} LBW</p>
      
      {editable && (
        <div className="flex flex-row gap-2.5 mt-3">
          <button 
            type="button"
            aria-pressed={placingCatch}
            onClick={() => setPlacingCatch(!placingCatch)}
            className={cn("flex-1 min-h-[44px] flex items-center justify-center rounded-[10px] border border-[#356343] px-2 transition-colors", placingCatch ? "bg-[#356343] text-white" : "bg-transparent text-[#244E33]")}
          >
            <span className="text-[13px] font-semibold">{placingCatch ? "Cancel catch" : "Mark a catch"}</span>
          </button>
          <button 
            type="button"
            onClick={() => addWicket("bowled", 0.5, 0.4)}
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-[10px] border border-[#356343] px-2 text-[#244E33] hover:bg-black/5 transition-colors"
          >
            <span className="text-[13px] font-semibold">Bowled</span>
          </button>
          <button 
            type="button"
            onClick={() => addWicket("lbw", 0.5, 0.4)}
            className="flex-1 min-h-[44px] flex items-center justify-center rounded-[10px] border border-[#356343] px-2 text-[#244E33] hover:bg-black/5 transition-colors"
          >
            <span className="text-[13px] font-semibold">LBW</span>
          </button>
        </div>
      )}
      
      <div aria-live="polite" className="text-[#586758] text-[11px] leading-[16px] mt-2.5 text-center">
        {placingCatch ? "Tap where the fielder took the catch."
          : editable ? "Mark catches on the field. Bowled and LBW add a ball at the wicket."
            : "Each numbered ball is one wicket. Bowled and LBW balls sit at the wicket."}
      </div>
      
      <div 
        ref={widthRef}
        className={cn("w-full max-w-[400px] aspect-square self-center mt-1.5 touch-none", editable && placingCatch ? "cursor-crosshair" : "cursor-default")}
        onPointerDown={handlePointerDown}
        aria-label="Cricket field. Tap to place the catch, or select a numbered wicket for details."
        role="group"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
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
              <circle cx={CENTER} cy={CENTER} r={RADIUS} />
            </clipPath>
          </defs>
          <circle cx={CENTER} cy={CENTER + 5} r={RADIUS + 3} fill="#2A5432" opacity={0.18} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={`url(#${svgId}grass)`} />
          <g clipPath={`url(#${svgId}field)`}>
            {Array.from({ length: 9 }, (_, i) => (
              <rect key={i} x={i * 36} y={0} width={18} height={SIZE} fill="#D6EB8C" opacity={0.1} />
            ))}
            <ellipse cx={CENTER - 58} cy={CENTER - 72} rx={106} ry={35} fill="#D7ED9C" opacity={0.09} transform={`rotate(-25 ${CENTER - 58} ${CENTER - 72})`} />
            <ellipse cx={CENTER + 68} cy={CENTER + 85} rx={130} ry={40} fill="#183F31" opacity={0.13} transform={`rotate(-25 ${CENTER + 68} ${CENTER + 85})`} />
          </g>
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#76502E" strokeWidth={6.5} opacity={0.8} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#F5DD9C" strokeWidth={4.3} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#B78B52" strokeWidth={2} strokeDasharray="1 4.2" />
          <circle cx={CENTER} cy={CENTER} r={85} fill="none" stroke="#FFF" strokeOpacity={0.85} strokeWidth={1.5} />
          <rect x={150} y={124} width={20} height={72} rx={2} fill={`url(#${svgId}pitch)`} stroke="#8C5E32" strokeWidth={1} />
          {[130, 190].map((y) => (
            <g key={y}>
              <line x1={144} x2={176} y1={y + (y === 130 ? 5 : -5)} y2={y + (y === 130 ? 5 : -5)} stroke="#FFF" strokeWidth={1.5} />
              {[-4, 0, 4].map((dx) => <line key={dx} x1={CENTER + dx} x2={CENTER + dx} y1={y - 4} y2={y + 3} stroke="#654725" strokeWidth={1.5} />)}
              <line x1={155} x2={165} y1={y - 4} y2={y - 4} stroke="#654725" strokeWidth={1.5} />
            </g>
          ))}
          {creaseWickets.map(({ wicket, number }, index) => {
            const spacing = compactMarkers ? compactSpacing : 22;
            return (
              <WicketMarker key={wicket.id}
                wicket={wicket}
                compactMarkers={compactMarkers}
                compactScale={compactMarkers ? compactScale : undefined}
                x={CENTER + (index % creaseColumns - (creaseColumns - 1) / 2) * spacing}
                y={128 + (Math.floor(index / creaseColumns) - (creaseRows - 1) / 2) * spacing}
                number={number}
                selected={selectedId === wicket.id}
                onSelect={() => setSelectedId(wicket.id)} />
            );
          })}
          {wickets.map((w, i) => w.kind === "caught" && (
            <WicketMarker
              key={w.id}
              wicket={w}
              x={w.x * SIZE}
              y={w.y * SIZE}
              number={i + 1}
              compactMarkers={compactMarkers}
              compactScale={compactMarkers ? compactScale : undefined}
              selected={selectedId === w.id}
              onSelect={() => setSelectedId(w.id)}
            />
          ))}
        </svg>
      </div>
      
      <section className="mt-3 rounded-[12px] border border-[#D7D6C7] bg-white/60 p-3" aria-label="Wicket information">
        <h4 className="text-[#244E33] text-[13px] font-bold">Wicket information</h4>
        <p className="mt-1 text-[#586758] text-[12px] leading-5">
          {editable
            ? wickets.length === 0
              ? "Add a catch, bowled or LBW wicket above, then enter the batter, over and how you got them out."
              : "Tap a numbered ball to enter the batter, over and how you got them out. Save your bowling stats or match to keep the details."
            : wickets.length === 0
              ? "No wickets mapped yet."
              : "Tap a numbered ball to read how that wicket was taken."}
        </p>
        {!selectedId && wickets.length > 0 && (
          <button type="button" onClick={() => setSelectedId(wickets[wickets.length - 1].id)}
            className="mt-2 min-h-[44px] rounded-[10px] bg-[#244E33] px-3 text-[13px] font-semibold text-white">
            {editable ? "Enter wicket information" : "View wicket information"}
          </button>
        )}
      </section>

      {selectedId && (() => {
        const selectedWicket = wickets.find((wicket) => wicket.id === selectedId);
        if (!selectedWicket) return null;
        const selectedNumber = wickets.findIndex((wicket) => wicket.id === selectedWicket.id) + 1;
        const kind = selectedWicket.kind === "caught" ? "Caught" : selectedWicket.kind === "lbw" ? "LBW" : "Bowled";
        return (
          <div className="mt-3 rounded-[12px] border border-[#D7D6C7] bg-white/60 p-3" aria-live="polite">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-[#244E33] text-[13px] font-bold">Wicket {selectedNumber} details</h4>
                <p className="text-[#56705B] text-[11px] mt-0.5">{kind}</p>
              </div>
              <button
                type="button"
                aria-label="Close wicket details"
                onClick={() => setSelectedId(null)}
                className="min-h-[32px] rounded-md px-2 text-[#56705B] hover:bg-black/5"
              >
                ×
              </button>
            </div>
            {editable ? (
              <div className="mt-2.5 grid gap-2">
                <label className="grid gap-1 text-[11px] text-[#56705B]">
                  Batter
                  <input
                    value={selectedWicket.batter ?? ""}
                    maxLength={120}
                    onChange={(event) => updateSelectedWicket("batter", event.target.value)}
                    className="min-h-[36px] rounded-md border border-[#C9CCBD] bg-white px-2 text-[12px] text-[#244E33] outline-none focus:border-[#356343]"
                    placeholder="Batter name"
                  />
                </label>
                <label className="grid gap-1 text-[11px] text-[#56705B]">
                  Over
                  <input
                    value={selectedWicket.over ?? ""}
                    maxLength={8}
                    inputMode="decimal"
                    pattern="(?:0|[1-9][0-9]*)(?:\.[0-5])?"
                    aria-invalid={!!selectedWicket.over && !/^(?:0|[1-9]\d*)(?:\.[0-5])?$/.test(selectedWicket.over)}
                    onChange={(event) => updateSelectedWicket("over", event.target.value)}
                    className="min-h-[36px] rounded-md border border-[#C9CCBD] bg-white px-2 text-[12px] text-[#244E33] outline-none focus:border-[#356343]"
                    placeholder="e.g. 7.3"
                    aria-describedby="wicket-over-help"
                  />
                </label>
                <p id="wicket-over-help" className="text-[10px] text-[#586758]">Completed overs use .0 to .5 (for example 7.3).</p>
                {!!selectedWicket.over && !/^(?:0|[1-9]\d*)(?:\.[0-5])?$/.test(selectedWicket.over) && (
                  <p role="alert" className="text-xs text-red-700">Invalid over. Enter a whole number or .0 to .5, such as 4.2. This wicket cannot be saved until corrected.</p>
                )}
                <label className="grid gap-1 text-[11px] text-[#56705B]">
                  How did you get the wicket?
                  <textarea
                    value={selectedWicket.note ?? ""}
                    maxLength={1000}
                    onChange={(event) => updateSelectedWicket("note", event.target.value)}
                    className="min-h-[64px] rounded-md border border-[#C9CCBD] bg-white px-2 py-1.5 text-[12px] text-[#244E33] outline-none focus:border-[#356343]"
                    placeholder="e.g. Inswinging yorker, or an edge caught at slip"
                  />
                </label>
              </div>
            ) : (
              <dl className="mt-2.5 grid gap-1 text-[12px] text-[#344D39]">
                <div><dt className="inline font-semibold">Batter: </dt><dd className="inline">{selectedWicket.batter || "—"}</dd></div>
                <div><dt className="inline font-semibold">Over: </dt><dd className="inline">{selectedWicket.over || "—"}</dd></div>
                <div><dt className="inline font-semibold">Note: </dt><dd className="inline whitespace-pre-wrap">{selectedWicket.note || "—"}</dd></div>
                {(selectedWicket.sourceOpponent || selectedWicket.sourceDate || selectedWicket.sourceMatchId !== undefined) && (
                  <div className="mt-1 border-t border-[#DDDCCB] pt-1 text-[11px] text-[#56705B]">
                    <dt className="inline font-semibold">Source match: </dt>
                    <dd className="inline">
                      {selectedWicket.sourceOpponent || "Unknown opponent"}
                      {selectedWicket.sourceDate ? ` · ${selectedWicket.sourceDate}` : ""}
                      {selectedWicket.sourceMatchId !== undefined ? ` · #${selectedWicket.sourceMatchId}` : ""}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        );
      })()}
      
      {!hideList && (
        <div className={cn("flex flex-col mt-2", scrollableList && "max-h-[200px] overflow-y-auto pr-2")}>
          {wickets.map((w, i) => (
            <div
              key={w.id}
              className={cn("flex flex-row items-center justify-between border-t border-[#DDDCCB] py-1", selectedId === w.id && "bg-[#EAE9D9]")}
            >
              <button
                type="button"
                onClick={() => setSelectedId(w.id)}
                className="min-h-[36px] flex-1 text-left text-[#344D39] text-[12px] hover:underline"
                aria-label={`View details for wicket ${i + 1}`}
              >
                Wicket {i + 1} &middot; {w.kind === "caught" ? "Caught" : w.kind === "lbw" ? "LBW" : "Bowled"}
              </button>
              {editable && (
                <button
                  type="button"
                  aria-label={`Remove wicket ${i + 1}`}
                  onClick={() => onChange?.(wickets.filter((item) => item.id !== w.id))}
                  className="min-h-[44px] flex items-center px-2 hover:bg-black/5 rounded-md transition-colors"
                >
                  <span className="text-[#A32C39] text-[12px]">Remove</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {editable && wickets.length > 0 && !hideList && <p className="text-[#586758] text-[11px] leading-[16px] mt-2 text-center">Removing a marker leaves your bowling totals unchanged.</p>}
    </div>
  );
}
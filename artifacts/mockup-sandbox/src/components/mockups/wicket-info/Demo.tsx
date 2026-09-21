import React, { useEffect, useRef, useState } from "react";
import {
  BowlingWicketMap,
  type BowlingWicket,
} from "./_bowling-wicket-map";

const SAMPLE_WICKETS: BowlingWicket[] = [
  {
    id: "sample-wicket-alex-smith",
    kind: "bowled",
    x: 0.5,
    y: 0.4,
    batter: "Alex Smith",
    over: "7.3",
    note: "Inswinging yorker",
  },
  {
    id: "sample-wicket-caught",
    kind: "caught",
    x: 0.69,
    y: 0.27,
    batter: "Jamie Patel",
    over: "9.1",
    note: "Top edge caught at deep square leg",
  },
];

export function Demo() {
  const [wickets, setWickets] = useState(SAMPLE_WICKETS);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const sampleMarker = previewRef.current?.querySelector<SVGGElement>(
        '[aria-label^="Wicket 1,"]',
      );
      sampleMarker?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#ECE7DA] px-3 py-4">
      <div className="mx-auto w-full max-w-[436px]">
        <p className="mb-2 text-center text-[11px] font-medium text-[#56705B]">
          Example only — not saved to your matches.
        </p>
        <div ref={previewRef}>
          <BowlingWicketMap wickets={wickets} onChange={setWickets} />
        </div>
      </div>
    </main>
  );
}
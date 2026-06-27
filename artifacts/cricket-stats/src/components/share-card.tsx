import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { format } from "date-fns";

type Summary = {
  batting: {
    totalRuns: number;
    highScore: number;
    highScoreHowOut?: string | null;
    innings: number;
    totalFours: number;
    totalSixes: number;
    averageStrikeRate: number;
  };
  bowling: {
    totalWickets: number;
    bestFigures: string;
    averageEconomyRate: number;
  };
  totalMatches: number;
};

export function ShareCard({
  summary,
  season,
  potmCount,
  winCount,
}: {
  summary: Summary;
  season: string;
  potmCount: number;
  winCount: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const png = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: "#166534",
      });
      const a = document.createElement("a");
      a.href = png;
      a.download = `cricvault-${season === "all" ? "career" : season}.png`;
      a.click();
    } catch (e) {
      console.error("Failed to generate image", e);
    } finally {
      setDownloading(false);
    }
  };

  const avg = summary.batting.innings > 0
    ? (summary.batting.totalRuns / summary.batting.innings).toFixed(1)
    : "—";

  const label = season === "all" ? "Career" : `${season} Season`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Stats Card</h2>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleDownload}
          disabled={downloading}
        >
          <Download className="h-4 w-4" />
          {downloading ? "Generating…" : "Download Image"}
        </Button>
      </div>

      {/* The card that gets captured */}
      <div
        ref={cardRef}
        style={{
          background: "linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)",
          borderRadius: 20,
          padding: 32,
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#fff",
          width: "100%",
          maxWidth: 560,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.7, fontWeight: 500, marginBottom: 2 }}>CricVault</div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>{label} Highlights</div>
          </div>
          <div style={{ fontSize: 32 }}>🏏</div>
        </div>

        {/* Hero stat */}
        <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1, letterSpacing: -2 }}>
            {summary.batting.totalRuns}
          </div>
          <div style={{ fontSize: 15, opacity: 0.75, marginTop: 4 }}>career runs</div>
        </div>

        {/* Batting row */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Batting</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "HS", val: `${summary.batting.highScore}${!summary.batting.highScoreHowOut || summary.batting.highScoreHowOut.toLowerCase() === 'not out' ? '*' : ''}` },
              { label: "Avg", val: avg },
              { label: "SR", val: summary.batting.averageStrikeRate.toFixed(0) },
              { label: "Inn", val: summary.batting.innings },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 6px" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bowling row */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
          <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Bowling</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Wickets", val: summary.bowling.totalWickets },
              { label: "Best", val: summary.bowling.bestFigures },
              { label: "Economy", val: summary.bowling.averageEconomyRate.toFixed(2) },
            ].map(({ label, val }) => (
              <div key={label} style={{ textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 6px" }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{val}</div>
                <div style={{ fontSize: 10, opacity: 0.65, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { icon: "🏆", label: "Matches", val: summary.totalMatches },
            { icon: "🎯", label: "Wins", val: winCount },
            ...(potmCount > 0 ? [{ icon: "⭐", label: "POTM", val: potmCount }] : []),
            { icon: "4️⃣", label: "Fours", val: summary.batting.totalFours },
            { icon: "6️⃣", label: "Sixes", val: summary.batting.totalSixes },
          ].map(({ icon, label, val }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>{icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{val}</div>
              <div style={{ fontSize: 9, opacity: 0.55 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Watermark */}
        <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, opacity: 0.4 }}>
          cricvault.app · {format(new Date(), "MMMM yyyy")}
        </div>
      </div>
    </div>
  );
}

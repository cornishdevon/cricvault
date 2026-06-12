import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  runs?: number | null;
  ballsFaced?: number | null;
  wickets?: number | null;
  overs?: number | null;
  result?: string | null;
};

interface Quote {
  text: string;
  author: string;
}

// ── Bad form quotes ────────────────────────────────────────────────────────────

const ENCOURAGEMENT_QUOTES: Quote[] = [
  {
    text: "Self-belief and hard work will always earn you success.",
    author: "Virat Kohli",
  },
  {
    text: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    author: "Muhammad Ali",
  },
  {
    text: "I've missed more than 9,000 shots in my career. I've failed over and over again in my life. And that is why I succeed.",
    author: "Michael Jordan",
  },
  {
    text: "It's not whether you get knocked down; it's whether you get up.",
    author: "Vince Lombardi",
  },
  {
    text: "Champions keep playing until they get it right.",
    author: "Billie Jean King",
  },
  {
    text: "Do not let what you cannot do interfere with what you can do.",
    author: "John Wooden",
  },
  {
    text: "The harder you work, the luckier you get.",
    author: "Gary Player",
  },
  {
    text: "A champion is defined not by their wins, but by how they can recover when they fall.",
    author: "Serena Williams",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "When you're going through a lean patch, you have to dig deeper than ever.",
    author: "Brian Lara",
  },
  {
    text: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth",
  },
  {
    text: "The more difficult the victory, the greater the happiness in winning.",
    author: "Pelé",
  },
  {
    text: "Today I will do what others won't, so tomorrow I can do what others can't.",
    author: "Jerry Rice",
  },
  {
    text: "You have to fight to reach your dream. You have to sacrifice and work hard for it.",
    author: "Lionel Messi",
  },
  {
    text: "Pressure is a privilege. It only comes to those who earn it.",
    author: "Billie Jean King",
  },
];

// ── Good form / grounding quotes ───────────────────────────────────────────────

const GROUNDING_QUOTES: Quote[] = [
  {
    text: "Complacency is the last hurdle standing between any team and its potential.",
    author: "Pat Riley",
  },
  {
    text: "Perfection is not attainable, but if we chase perfection we can catch excellence.",
    author: "Vince Lombardi",
  },
  {
    text: "Don't get too high when you win. Don't get too low when you lose.",
    author: "John Wooden",
  },
  {
    text: "The toughest opponent you will ever face is complacency.",
    author: "Ricky Ponting",
  },
  {
    text: "I never took anything for granted. Every innings was a new test.",
    author: "Sunil Gavaskar",
  },
  {
    text: "In this game, you are only as good as your next ball. The last one is already history.",
    author: "Shane Warne",
  },
  {
    text: "A champion is afraid of losing. Everyone else is afraid of winning.",
    author: "Billie Jean King",
  },
  {
    text: "It is not enough to have been a champion — you have to be one every day.",
    author: "Zinedine Zidane",
  },
  {
    text: "The moment you feel you have nothing more to learn is the moment you stop being great.",
    author: "Michael Jordan",
  },
  {
    text: "Talent is cheaper than table salt. What separates the talented individual from the successful one is a lot of hard work.",
    author: "Stephen King",
  },
  {
    text: "The biggest room in the world is the room for improvement.",
    author: "Helmut Schmidt",
  },
  {
    text: "When you're winning, you want to keep playing the same way that got you there. But you can't stand still — every opponent is studying you.",
    author: "Alastair Cook",
  },
];

// ── Form detection ─────────────────────────────────────────────────────────────

type BannerType = "good" | "bad" | null;

function detectForm(data: PerMatchStat[]): {
  banner: BannerType;
  message: string;
} {
  if (!data || data.length < 3) return { banner: null, message: "" };

  const recent = [...data].slice(-5);

  // ── Good form checks ──────────────────────────────────────────────────────
  const battingInningsGood = recent.filter(
    (m) => m.ballsFaced != null && (m.ballsFaced as number) > 0 && m.runs != null
  );
  if (battingInningsGood.length >= 3) {
    const avgRuns =
      battingInningsGood.reduce((s, m) => s + (m.runs ?? 0), 0) /
      battingInningsGood.length;
    if (avgRuns >= 30) {
      return {
        banner: "good",
        message: `You're averaging ${avgRuns.toFixed(0)} runs across your last ${battingInningsGood.length} innings — brilliant form. But remember: every innings starts at zero and every ball has to be earned all over again.`,
      };
    }
  }

  const bowlingAppearancesGood = recent.filter(
    (m) => m.overs != null && (m.overs as number) > 0
  );
  if (bowlingAppearancesGood.length >= 3) {
    const wicketSpells = bowlingAppearancesGood.filter(
      (m) => (m.wickets ?? 0) > 0
    );
    if (
      wicketSpells.length >= 3 &&
      wicketSpells.length === bowlingAppearancesGood.length
    ) {
      return {
        banner: "good",
        message: `Wickets in every recent spell — you're in a great rhythm. Don't let the confidence tip into assumption. Every batter you face starts fresh, and so do you.`,
      };
    }
  }

  const resultsRecentGood = recent
    .filter((m) => m.result && m.result !== "")
    .slice(-3);
  if (
    resultsRecentGood.length >= 3 &&
    resultsRecentGood.every((m) => m.result?.toLowerCase() === "win")
  ) {
    return {
      banner: "good",
      message: `Three wins on the bounce — the team is flying. Stay sharp. The game that catches a winning side out is always the next one.`,
    };
  }

  // ── Bad form checks ───────────────────────────────────────────────────────
  const battingInningsBad = recent.filter(
    (m) => m.ballsFaced != null && (m.ballsFaced as number) > 0 && m.runs != null
  );
  if (battingInningsBad.length >= 3) {
    const avgRuns =
      battingInningsBad.reduce((s, m) => s + (m.runs ?? 0), 0) /
      battingInningsBad.length;
    if (avgRuns < 12) {
      return {
        banner: "bad",
        message: `Your last ${battingInningsBad.length} innings have averaged just ${avgRuns.toFixed(0)} runs — but every batter goes through a lean spell.`,
      };
    }
  }

  const bowlingAppearancesBad = recent.filter(
    (m) => m.overs != null && (m.overs as number) > 0
  );
  if (bowlingAppearancesBad.length >= 3) {
    const wicketlessSpells = bowlingAppearancesBad.filter(
      (m) => (m.wickets ?? 0) === 0
    );
    if (
      wicketlessSpells.length >= 3 &&
      wicketlessSpells.length === bowlingAppearancesBad.length
    ) {
      return {
        banner: "bad",
        message: `${wicketlessSpells.length} wicketless spells on the trot — the breakthrough is coming, keep putting it in the right areas.`,
      };
    }
  }

  const resultsRecentBad = recent
    .filter((m) => m.result && m.result !== "")
    .slice(-3);
  if (
    resultsRecentBad.length >= 3 &&
    resultsRecentBad.every((m) => m.result?.toLowerCase() === "loss")
  ) {
    return {
      banner: "bad",
      message: `Three losses in a row is a tough run — every great team has been here and bounced back stronger.`,
    };
  }

  return { banner: null, message: "" };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function EncouragementBanner({ data }: { data: PerMatchStat[] }) {
  const { banner, message } = useMemo(() => detectForm(data), [data]);

  const [quoteIndex, setQuoteIndex] = useState<number>(() =>
    Math.floor(Math.random() * (banner === "good" ? GROUNDING_QUOTES.length : ENCOURAGEMENT_QUOTES.length))
  );
  const [dismissed, setDismissed] = useState(false);

  if (!banner || dismissed) return null;

  const isGood = banner === "good";
  const quotes = isGood ? GROUNDING_QUOTES : ENCOURAGEMENT_QUOTES;
  const quote = quotes[quoteIndex % quotes.length];

  function nextQuote() {
    setQuoteIndex((i) => (i + 1) % quotes.length);
  }

  if (isGood) {
    return (
      <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none mt-0.5">🌟</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200 mb-1">
                {message}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3 italic">
                Every innings starts on zero. Every ball has to be played on its own merit.
              </p>
              <blockquote className="border-l-2 border-emerald-400 pl-3">
                <p className="text-sm italic text-foreground leading-relaxed">
                  "{quote.text}"
                </p>
                <footer className="text-xs text-muted-foreground mt-1 font-medium">
                  — {quote.author}
                </footer>
              </blockquote>
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
                  onClick={nextQuote}
                >
                  Another quote
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setDismissed(true)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">💪</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-3">
              {message}
            </p>
            <blockquote className="border-l-2 border-amber-400 pl-3">
              <p className="text-sm italic text-foreground leading-relaxed">
                "{quote.text}"
              </p>
              <footer className="text-xs text-muted-foreground mt-1 font-medium">
                — {quote.author}
              </footer>
            </blockquote>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                onClick={nextQuote}
              >
                Another quote
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setDismissed(true)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

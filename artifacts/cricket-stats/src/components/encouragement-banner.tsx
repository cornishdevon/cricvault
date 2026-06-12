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

type SlumpType = "batting" | "bowling" | "results" | null;

interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  {
    text: "Self-belief and hard work will always earn you success.",
    author: "Virat Kohli",
  },
  {
    text: "It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    author: "Muhammad Ali",
  },
  {
    text: "I've missed more than 9,000 shots in my career. I've failed over and over and over again. And that is why I succeed.",
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
    text: "You have to expect things of yourself before you can do them.",
    author: "Michael Jordan",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "Courage is not the absence of fear, but taking action in spite of it.",
    author: "Mark Twain",
  },
  {
    text: "The only way to prove that you're a good sport is to lose.",
    author: "Ernie Banks",
  },
  {
    text: "A champion is defined not by their wins but by how they recover when they fall.",
    author: "Serena Williams",
  },
  {
    text: "You have to fight to reach your dream. You have to sacrifice and work hard for it.",
    author: "Lionel Messi",
  },
  {
    text: "If you can believe it, the mind can achieve it.",
    author: "Ronnie Lott",
  },
  {
    text: "Pressure is a privilege. It only comes to those who earn it.",
    author: "Billie Jean King",
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
    text: "When you're going through a lean patch, you have to dig deeper than ever.",
    author: "Brian Lara",
  },
  {
    text: "Never let the fear of striking out keep you from playing the game.",
    author: "Babe Ruth",
  },
  {
    text: "The road to success runs uphill.",
    author: "Willie Davis",
  },
];

function detectSlump(data: PerMatchStat[]): {
  slump: SlumpType;
  message: string;
} {
  if (!data || data.length < 3) return { slump: null, message: "" };

  const recent = [...data].slice(-5);

  // Batting slump: last 3+ innings with runs data averaging under 12
  const battingInnings = recent.filter(
    (m) => m.ballsFaced != null && m.ballsFaced > 0 && m.runs != null
  );
  if (battingInnings.length >= 3) {
    const avgRuns =
      battingInnings.reduce((s, m) => s + (m.runs ?? 0), 0) /
      battingInnings.length;
    if (avgRuns < 12) {
      return {
        slump: "batting",
        message: `Your last ${battingInnings.length} innings have averaged just ${avgRuns.toFixed(0)} runs — but every batter goes through a lean spell.`,
      };
    }
  }

  // Bowling slump: 3+ of last 5 bowling appearances with 0 wickets
  const bowlingAppearances = recent.filter(
    (m) => m.overs != null && (m.overs as number) > 0
  );
  if (bowlingAppearances.length >= 3) {
    const wicketlessSpells = bowlingAppearances.filter(
      (m) => (m.wickets ?? 0) === 0
    );
    if (
      wicketlessSpells.length >= 3 &&
      wicketlessSpells.length === bowlingAppearances.length
    ) {
      return {
        slump: "bowling",
        message: `${wicketlessSpells.length} wicketless spells on the trot — the breakthrough is coming, keep putting it in the right areas.`,
      };
    }
  }

  // Result slump: last 3 results all losses
  const resultsRecent = recent
    .filter((m) => m.result && m.result !== "")
    .slice(-3);
  if (
    resultsRecent.length >= 3 &&
    resultsRecent.every((m) => m.result?.toLowerCase() === "loss")
  ) {
    return {
      slump: "results",
      message: `Three losses in a row is a tough run — every great team has been here and bounced back stronger.`,
    };
  }

  return { slump: null, message: "" };
}

export function EncouragementBanner({ data }: { data: PerMatchStat[] }) {
  const { slump, message } = useMemo(() => detectSlump(data), [data]);

  const [quoteIndex, setQuoteIndex] = useState<number>(() =>
    Math.floor(Math.random() * QUOTES.length)
  );
  const [dismissed, setDismissed] = useState(false);

  if (!slump || dismissed) return null;

  const quote = QUOTES[quoteIndex];

  function nextQuote() {
    setQuoteIndex((i) => (i + 1) % QUOTES.length);
  }

  const icon =
    slump === "batting" ? "🏏" : slump === "bowling" ? "🎳" : "💪";

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">{icon}</span>
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

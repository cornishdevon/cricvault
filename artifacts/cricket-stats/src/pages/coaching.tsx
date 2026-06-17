import { useState, useEffect, useRef, useCallback } from "react";
import { useListCoachingTips, getListCoachingTipsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CATEGORIES = ["All", "Batting", "Bowling", "Fielding", "Fitness", "Mental"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Batting: "bg-primary/10 text-primary border-primary/20",
  Bowling: "bg-secondary/10 text-secondary border-secondary/20",
  Fielding: "bg-accent text-accent-foreground border-accent",
  Fitness: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Mental: "bg-chart-5/10 text-chart-5 border-chart-5/20",
};

const CATEGORY_BG: Record<string, string> = {
  Batting: "from-primary/20 to-primary/5",
  Bowling: "from-secondary/20 to-secondary/5",
  Fielding: "from-accent/30 to-accent/5",
  Fitness: "from-chart-4/20 to-chart-4/5",
  Mental: "from-chart-5/20 to-chart-5/5",
};

const ROTATE_INTERVAL = 5000;

function FeaturedCarousel({ tips }: { tips: Array<{ id: number; category: string; tip: string; detail?: string | null }> }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + tips.length) % tips.length);
  }, [tips.length]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % tips.length);
    }, ROTATE_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, tips.length]);

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${current * 100}%)`;
    }
  }, [current]);

  if (!tips.length) return null;

  const tip = tips[current];

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-border shadow-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide track */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex transition-transform duration-500 ease-in-out"
          style={{ width: `${tips.length * 100}%` }}
        >
          {tips.map((t, i) => (
            <div
              key={t.id}
              className={`flex-shrink-0 w-full bg-gradient-to-br ${CATEGORY_BG[t.category] || "from-muted/40 to-muted/10"} p-6 sm:p-8`}
              style={{ width: `${100 / tips.length}%` }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <Badge
                  variant="outline"
                  className={`text-xs shrink-0 ${CATEGORY_COLORS[t.category] || ""}`}
                >
                  {t.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {i + 1} / {tips.length}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug mb-3">
                {t.tip}
              </h2>
              {t.detail && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  {t.detail}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow hover:bg-background transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center shadow hover:bg-background transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Progress dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>

      {/* Auto-play progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-primary/30 w-full overflow-hidden">
          <div
            key={current}
            className="h-full bg-primary origin-left"
            style={{
              animation: `progress-fill ${ROTATE_INTERVAL}ms linear forwards`,
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress-fill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

export default function Coaching() {
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: allTips, isLoading: allLoading } = useListCoachingTips(
    {},
    { query: { queryKey: getListCoachingTipsQueryKey({}) } }
  );

  const { data: tips, isLoading } = useListCoachingTips(
    activeCategory !== "All" ? { category: activeCategory } : {},
    {
      query: {
        queryKey: getListCoachingTipsQueryKey(activeCategory !== "All" ? { category: activeCategory } : {}),
      },
    }
  );

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coaching Tips</h1>
        <p className="text-muted-foreground mt-1">Practical advice to sharpen every part of your game.</p>
      </div>

      {/* Featured carousel — rotates every 5s */}
      {allLoading ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : allTips && allTips.length > 0 ? (
        <FeaturedCarousel tips={allTips} />
      ) : null}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Horizontally scrollable tip row */}
      {!isLoading && tips && tips.length > 0 && (
        <div className="relative">
          <button
            onClick={scrollLeft}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border border-border shadow flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollRight}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background border border-border shadow flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            {tips.map((tip, i) => (
              <Card
                key={tip.id}
                className="flex-shrink-0 w-72 hover:border-primary/40 transition-all duration-200 animate-in fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-snug line-clamp-3">
                      {tip.tip}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${CATEGORY_COLORS[tip.category] || ""}`}
                    >
                      {tip.category}
                    </Badge>
                  </div>
                </CardHeader>
                {tip.detail && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                      {tip.detail}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-72 flex-shrink-0 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && tips?.length === 0 && (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-medium">No tips in this category yet</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon.</p>
          </CardContent>
        </Card>
      )}

      {/* Full grid — all tips for current category */}
      {!isLoading && tips && tips.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground">
            All {activeCategory !== "All" ? activeCategory : ""} Tips ({tips.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tips.map((tip, i) => (
              <Card
                key={tip.id}
                className="hover:border-primary/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base leading-snug">{tip.tip}</CardTitle>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-xs ${CATEGORY_COLORS[tip.category] || ""}`}
                    >
                      {tip.category}
                    </Badge>
                  </div>
                </CardHeader>
                {tip.detail && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tip.detail}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

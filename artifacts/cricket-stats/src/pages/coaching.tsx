import { useState } from "react";
import { useListCoachingTips, getListCoachingTipsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "Batting", "Bowling", "Fielding", "Fitness", "Mental"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  Batting: "bg-primary/10 text-primary border-primary/20",
  Bowling: "bg-secondary/10 text-secondary border-secondary/20",
  Fielding: "bg-accent text-accent-foreground border-accent",
  Fitness: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Mental: "bg-chart-5/10 text-chart-5 border-chart-5/20",
};

export default function Coaching() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: tips, isLoading } = useListCoachingTips(
    activeCategory !== "All" ? { category: activeCategory } : {},
    {
      query: {
        queryKey: getListCoachingTipsQueryKey(activeCategory !== "All" ? { category: activeCategory } : {}),
      },
    }
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coaching Tips</h1>
        <p className="text-muted-foreground mt-1">Practical advice to sharpen every part of your game.</p>
      </div>

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

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : tips?.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-medium">No tips in this category yet</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tips?.map((tip, i) => (
            <Card
              key={tip.id}
              className="hover:border-primary/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 60}ms` }}
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
      )}
    </div>
  );
}

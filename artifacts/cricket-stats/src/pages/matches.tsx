import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useListMatches, getListMatchesQueryKey, useGetPerMatchStats } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Search, PlusCircle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Matches() {
  const { data: matches, isLoading } = useListMatches({
    query: { queryKey: getListMatchesQueryKey() },
  });
  const { data: perMatchRaw } = useGetPerMatchStats();
  const statsByMatchId = useMemo(() => {
    const map = new Map<number, { runs: number | null; howOut: string | null; wickets: number | null; overs: number | null; runsConceded: number | null }>();
    for (const s of perMatchRaw ?? []) map.set(s.matchId, s as typeof s & { matchId: number });
    return map;
  }, [perMatchRaw]);

  const [search, setSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filtered = useMemo(() => {
    if (!matches) return [];
    let list = [...matches];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.opponent.toLowerCase().includes(q) ||
          (m.venue?.toLowerCase() ?? "").includes(q) ||
          (m.matchType?.toLowerCase() ?? "").includes(q)
      );
    }

    if (resultFilter !== "all") {
      list = list.filter((m) =>
        resultFilter === "pending"
          ? !m.result
          : m.result?.toLowerCase() === resultFilter
      );
    }

    list.sort((a, b) =>
      sortOrder === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date)
    );

    return list;
  }, [matches, search, resultFilter, sortOrder]);

  const isWin  = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "win" || l.startsWith("won"); };
  const isLoss = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "loss" || l.startsWith("lost"); };
  const isDraw = (r?: string | null) => { const l = r?.toLowerCase() ?? ""; return l === "draw" || l.startsWith("drew"); };

  const wins   = matches?.filter((m) => isWin(m.result)).length ?? 0;
  const losses = matches?.filter((m) => isLoss(m.result)).length ?? 0;
  const draws  = matches?.filter((m) => isDraw(m.result)).length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">
            {matches
              ? `${matches.length} match${matches.length !== 1 ? "es" : ""} logged`
              : "All your logged matches"}
          </p>
        </div>
        <Link href="/matches/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Log Match
          </Button>
        </Link>
      </div>

      {/* Quick stats strip */}
      {!isLoading && matches && matches.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Wins", value: wins, color: "text-primary" },
            { label: "Losses", value: losses, color: "text-destructive" },
            { label: "Draws", value: draws, color: "text-muted-foreground" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search opponent, venue, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="win">Win</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
            <SelectItem value="draw">Draw</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
          title={sortOrder === "newest" ? "Showing newest first" : "Showing oldest first"}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : matches?.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-medium">No matches logged yet</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Start tracking your stats by logging your first match.
            </p>
            <Link href="/matches/new">
              <Button>Log Your First Match</Button>
            </Link>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground">No matches match your filters.</p>
            <button
              className="text-sm text-primary mt-2 hover:underline"
              onClick={() => { setSearch(""); setResultFilter("all"); }}
            >
              Clear filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((match, i) => (
            <Link key={match.id} href={`/matches/${match.id}`} className="block">
              <Card
                className="hover:border-primary/50 transition-colors animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg">vs {match.opponent}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(match.date), "d MMM yyyy")} • {match.matchType}
                      {match.venue ? ` • ${match.venue}` : ""}
                    </div>
                    {match.playingFor && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Playing for {match.playingFor}
                      </div>
                    )}
                    {(() => {
                      const s = statsByMatchId.get(match.id);
                      if (!s) return null;
                      const hasBat = s.runs != null;
                      const hasBowl = s.wickets != null && s.overs != null;
                      if (!hasBat && !hasBowl) return null;
                      const notOut = !s.howOut || s.howOut.toLowerCase() === "not out";
                      return (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {hasBat && (
                            <span className="text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                              🏏 {s.runs}{notOut ? "*" : ""} runs
                            </span>
                          )}
                          {hasBowl && (
                            <span className="text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                              ⚪ {s.wickets}/{s.runsConceded} ({s.overs} ov)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        match.result === "Win"
                          ? "bg-primary/10 text-primary"
                          : match.result === "Loss"
                          ? "bg-destructive/10 text-destructive"
                          : match.result === "Draw"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {match.result || "Pending"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

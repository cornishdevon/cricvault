import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateMatch } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListMatchesQueryKey, getGetStatsSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FreeTextSelect } from "@/components/ui/free-text-select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const MATCH_TYPE_SUGGESTIONS = [
  "Club", "League", "Cup", "T20", "ODI", "Test", "Friendly", "Social",
  "Tournament", "Charity", "Practice", "School", "Indoor", "Beach",
  "Backyard", "Street", "Garden", "Tape ball", "Tennis ball",
  "The Hundred", "Twenty20", "Ten10",
];

export default function NewMatch() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMatch = useCreateMatch();

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    opponent: "",
    venue: "",
    matchType: "Club",
    result: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.opponent.trim()) {
      toast({ title: "Opponent name is required", variant: "destructive" });
      return;
    }
    createMatch.mutate(
      {
        data: {
          date: form.date,
          opponent: form.opponent,
          venue: form.venue || undefined,
          matchType: form.matchType as any,
          result: (form.result as any) || undefined,
        },
      },
      {
        onSuccess: (match) => {
          queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          toast({ title: "Match created", description: `vs ${match.opponent}` });
          navigate(`/matches/${match.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create match", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log a Match</h1>
          <p className="text-muted-foreground mt-1">Record the details of your match.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="matchType">Match Type</Label>
                <FreeTextSelect
                  id="matchType"
                  value={form.matchType}
                  onChange={(v) => setForm({ ...form, matchType: v })}
                  suggestions={MATCH_TYPE_SUGGESTIONS}
                  placeholder="e.g. League, Backyard, Street…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="opponent">Opponent <span className="text-destructive">*</span></Label>
              <Input
                id="opponent"
                placeholder="e.g. Riverside CC"
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                placeholder="e.g. Home ground"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="result">Result</Label>
              <Select
                value={form.result}
                onValueChange={(v) => setForm({ ...form, result: v === "none" ? "" : v })}
              >
                <SelectTrigger id="result">
                  <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not decided</SelectItem>
                  {["Win", "Loss", "Draw", "No Result"].map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMatch.isPending}
              >
                {createMatch.isPending ? "Creating..." : "Create Match"}
              </Button>
              <Link href="/">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

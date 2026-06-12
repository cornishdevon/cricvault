import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMatch,
  useGetBattingStats,
  useGetBowlingStats,
  useGetFieldingStats,
  useGetMatchReport,
  useListMatchPhotos,
  useUpdateMatch,
  useDeleteMatch,
  useCreateBattingStats,
  useUpdateBattingStats,
  useCreateBowlingStats,
  useUpdateBowlingStats,
  useCreateFieldingStats,
  useUpdateFieldingStats,
  useCreateMatchReport,
  useUpdateMatchReport,
  useAddMatchPhoto,
  useDeletePhoto,
  getGetMatchQueryKey,
  getGetBattingStatsQueryKey,
  getGetBowlingStatsQueryKey,
  getGetFieldingStatsQueryKey,
  getGetMatchReportQueryKey,
  getListMatchPhotosQueryKey,
  getListMatchesQueryKey,
  getGetStatsSummaryQueryKey,
} from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, Save, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted px-4 py-3 text-center min-w-[80px]">
      <span className="text-xl font-bold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ── Batting Tab ───────────────────────────────────────────────────────────────

function BattingTab({ matchId }: { matchId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading } = useGetBattingStats(matchId, {
    query: { queryKey: getGetBattingStatsQueryKey(matchId) },
  });
  const createBatting = useCreateBattingStats();
  const updateBatting = useUpdateBattingStats();

  const [form, setForm] = useState({
    runs: "",
    ballsFaced: "",
    fours: "",
    sixes: "",
    battingPosition: "",
    howOut: "",
  });
  const [editing, setEditing] = useState(false);

  const hasStats = stats && (stats as any) !== null;

  const handleEdit = () => {
    if (hasStats) {
      setForm({
        runs: String(stats.runs),
        ballsFaced: String(stats.ballsFaced),
        fours: String(stats.fours),
        sixes: String(stats.sixes),
        battingPosition: stats.battingPosition ? String(stats.battingPosition) : "",
        howOut: stats.howOut || "",
      });
    }
    setEditing(true);
  };

  const handleSave = () => {
    const runs = Number(form.runs) || 0;
    const ballsFaced = Number(form.ballsFaced) || 0;
    const fours = Number(form.fours) || 0;
    const sixes = Number(form.sixes) || 0;
    const payload = {
      runs,
      ballsFaced,
      fours,
      sixes,
      battingPosition: form.battingPosition ? Number(form.battingPosition) : undefined,
      howOut: (form.howOut as any) || undefined,
    };
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: getGetBattingStatsQueryKey(matchId) });
      qc.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    };
    if (hasStats) {
      updateBatting.mutate(
        { matchId, data: payload },
        { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Batting stats updated" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) }
      );
    } else {
      createBatting.mutate(
        { matchId, data: payload },
        { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Batting stats saved" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) }
      );
    }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  const strikeRate = hasStats
    ? stats.ballsFaced > 0
      ? ((stats.runs / stats.ballsFaced) * 100).toFixed(1)
      : "0.0"
    : null;

  return (
    <div className="space-y-4">
      {hasStats && !editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Batting Performance</CardTitle>
            <Button size="sm" variant="outline" onClick={handleEdit}>Edit</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatBadge label="Runs" value={stats.runs} />
              <StatBadge label="Balls" value={stats.ballsFaced} />
              <StatBadge label="Strike Rate" value={`${strikeRate}`} />
              <StatBadge label="Fours" value={stats.fours} />
              <StatBadge label="Sixes" value={stats.sixes} />
              {stats.battingPosition && <StatBadge label="Position" value={`#${stats.battingPosition}`} />}
            </div>
            {stats.howOut && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Dismissal:</span>
                <Badge variant="outline">{stats.howOut}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ) : editing ? (
        <Card>
          <CardHeader>
            <CardTitle>{hasStats ? "Edit" : "Log"} Batting Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: "runs", label: "Runs" },
                { id: "ballsFaced", label: "Balls Faced" },
                { id: "fours", label: "Fours" },
                { id: "sixes", label: "Sixes" },
                { id: "battingPosition", label: "Bat Position" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type="number"
                    min="0"
                    value={form[id as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>How Out</Label>
                <Select
                  value={form.howOut}
                  onValueChange={(v) => setForm({ ...form, howOut: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    {["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Not Out", "Retired"].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.runs && form.ballsFaced && Number(form.ballsFaced) > 0 && (
              <p className="text-sm text-muted-foreground">
                Strike Rate: <span className="font-semibold text-foreground">{((Number(form.runs) / Number(form.ballsFaced)) * 100).toFixed(1)}</span>
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={createBatting.isPending || updateBatting.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground mb-4">No batting stats recorded for this match.</p>
            <Button onClick={() => setEditing(true)}>Log Batting Stats</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Bowling Tab ───────────────────────────────────────────────────────────────

function BowlingTab({ matchId }: { matchId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading } = useGetBowlingStats(matchId, {
    query: { queryKey: getGetBowlingStatsQueryKey(matchId) },
  });
  const createBowling = useCreateBowlingStats();
  const updateBowling = useUpdateBowlingStats();

  const [form, setForm] = useState({ overs: "", maidens: "", runsConceded: "", wickets: "", noBalls: "", wides: "", hatTrick: false, bowledWickets: "", lbwWickets: "" });
  const [editing, setEditing] = useState(false);

  const hasStats = stats && (stats as any) !== null;

  const handleEdit = () => {
    if (hasStats) {
      setForm({
        overs: String(stats.overs),
        maidens: String(stats.maidens),
        runsConceded: String(stats.runsConceded),
        wickets: String(stats.wickets),
        noBalls: String(stats.noBalls),
        wides: String(stats.wides),
        hatTrick: !!(stats as any).hatTrick,
        bowledWickets: String((stats as any).bowledWickets ?? 0),
        lbwWickets: String((stats as any).lbwWickets ?? 0),
      });
    }
    setEditing(true);
  };

  const handleSave = () => {
    const payload = {
      overs: Number(form.overs) || 0,
      maidens: Number(form.maidens) || 0,
      runsConceded: Number(form.runsConceded) || 0,
      wickets: Number(form.wickets) || 0,
      noBalls: Number(form.noBalls) || 0,
      wides: Number(form.wides) || 0,
      hatTrick: form.hatTrick,
      bowledWickets: Number(form.bowledWickets) || 0,
      lbwWickets: Number(form.lbwWickets) || 0,
    };
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: getGetBowlingStatsQueryKey(matchId) });
      qc.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    };
    if (hasStats) {
      updateBowling.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Bowling stats updated" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    } else {
      createBowling.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Bowling stats saved" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  const economy = hasStats && stats.overs > 0 ? (stats.runsConceded / stats.overs).toFixed(2) : "0.00";

  return (
    <div className="space-y-4">
      {hasStats && !editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Bowling Figures</CardTitle>
            <Button size="sm" variant="outline" onClick={handleEdit}>Edit</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <StatBadge label="Figures" value={`${stats.wickets}/${stats.runsConceded}`} />
              <StatBadge label="Overs" value={stats.overs} />
              <StatBadge label="Maidens" value={stats.maidens} />
              <StatBadge label="Economy" value={economy} />
              {stats.wides > 0 && <StatBadge label="Wides" value={stats.wides} />}
              {stats.noBalls > 0 && <StatBadge label="No Balls" value={stats.noBalls} />}
              {(stats as any).hatTrick && (
                <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
                  <span className="text-base">🪄</span>
                  <span className="text-xs font-semibold text-primary">Hat Trick</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : editing ? (
        <Card>
          <CardHeader><CardTitle>{hasStats ? "Edit" : "Log"} Bowling Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: "overs", label: "Overs" },
                { id: "maidens", label: "Maidens" },
                { id: "runsConceded", label: "Runs Conceded" },
                { id: "wickets", label: "Wickets" },
                { id: "noBalls", label: "No Balls" },
                { id: "wides", label: "Wides" },
                { id: "bowledWickets", label: "Bowled (wkts)" },
                { id: "lbwWickets", label: "LBW (wkts)" },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input
                    id={id}
                    type="number"
                    min="0"
                    value={form[id as keyof typeof form] as string}
                    onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                    placeholder="0"
                  />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3 flex items-center gap-3 pt-1">
                <input
                  id="hatTrick"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  checked={form.hatTrick}
                  onChange={(e) => setForm({ ...form, hatTrick: e.target.checked })}
                />
                <Label htmlFor="hatTrick" className="cursor-pointer flex items-center gap-1.5">
                  <span>Hat Trick taken this spell</span>
                  <span>🪄</span>
                </Label>
              </div>
            </div>
            {form.overs && form.runsConceded && Number(form.overs) > 0 && (
              <p className="text-sm text-muted-foreground">
                Economy: <span className="font-semibold text-foreground">{(Number(form.runsConceded) / Number(form.overs)).toFixed(2)}</span>
                {" "}• Figures: <span className="font-semibold text-foreground">{form.wickets || 0}/{form.runsConceded}</span>
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={createBowling.isPending || updateBowling.isPending}>
                <Save className="h-4 w-4 mr-2" /> Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground mb-4">No bowling stats recorded for this match.</p>
            <Button onClick={() => setEditing(true)}>Log Bowling Stats</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Fielding Tab ──────────────────────────────────────────────────────────────

function FieldingTab({ matchId }: { matchId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: stats, isLoading } = useGetFieldingStats(matchId, {
    query: { queryKey: getGetFieldingStatsQueryKey(matchId) },
  });
  const createFielding = useCreateFieldingStats();
  const updateFielding = useUpdateFieldingStats();

  const [form, setForm] = useState({ catches: "", droppedCatches: "", runOuts: "", stumpings: "", missedStumpings: "" });
  const [editing, setEditing] = useState(false);

  const hasStats = stats && (stats as any) !== null;

  const handleEdit = () => {
    if (hasStats) {
      setForm({ catches: String(stats.catches), droppedCatches: String(stats.droppedCatches), runOuts: String(stats.runOuts), stumpings: String(stats.stumpings), missedStumpings: String((stats as any).missedStumpings ?? 0) });
    }
    setEditing(true);
  };

  const handleSave = () => {
    const payload = { catches: Number(form.catches) || 0, droppedCatches: Number(form.droppedCatches) || 0, runOuts: Number(form.runOuts) || 0, stumpings: Number(form.stumpings) || 0, missedStumpings: Number(form.missedStumpings) || 0 };
    const invalidate = () => {
      qc.invalidateQueries({ queryKey: getGetFieldingStatsQueryKey(matchId) });
      qc.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
    };
    if (hasStats) {
      updateFielding.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Fielding stats updated" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    } else {
      createFielding.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Fielding stats saved" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <div className="space-y-4">
      {hasStats && !editing ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Fielding Performance</CardTitle>
            <Button size="sm" variant="outline" onClick={handleEdit}>Edit</Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <StatBadge label="Catches" value={stats.catches} />
              <StatBadge label="Dropped" value={stats.droppedCatches} />
              <StatBadge label="Run Outs" value={stats.runOuts} />
              <StatBadge label="Stumpings" value={stats.stumpings} />
              {(stats as any).missedStumpings > 0 && <StatBadge label="Missed St." value={(stats as any).missedStumpings} />}
            </div>
          </CardContent>
        </Card>
      ) : editing ? (
        <Card>
          <CardHeader><CardTitle>{hasStats ? "Edit" : "Log"} Fielding Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { id: "catches", label: "Catches" },
                { id: "droppedCatches", label: "Dropped" },
                { id: "runOuts", label: "Run Outs" },
                { id: "stumpings", label: "Stumpings" },
                { id: "missedStumpings", label: "Missed St." },
              ].map(({ id, label }) => (
                <div key={id} className="space-y-1.5">
                  <Label htmlFor={id}>{label}</Label>
                  <Input id={id} type="number" min="0" value={form[id as keyof typeof form]} onChange={(e) => setForm({ ...form, [id]: e.target.value })} placeholder="0" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={createFielding.isPending || updateFielding.isPending}><Save className="h-4 w-4 mr-2" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground mb-4">No fielding stats recorded for this match.</p>
            <Button onClick={() => setEditing(true)}>Log Fielding Stats</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Report Tab ────────────────────────────────────────────────────────────────

function ReportTab({ matchId }: { matchId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: report, isLoading } = useGetMatchReport(matchId, {
    query: { queryKey: getGetMatchReportQueryKey(matchId) },
  });
  const createReport = useCreateMatchReport();
  const updateReport = useUpdateMatchReport();

  const hasReport = report && (report as any) !== null;
  const [notes, setNotes] = useState("");
  const [areas, setAreas] = useState("");
  const [editing, setEditing] = useState(false);

  const handleEdit = () => {
    setNotes(hasReport ? (report.notes || "") : "");
    setAreas(hasReport ? (report.areasToImprove || "") : "");
    setEditing(true);
  };

  const handleSave = () => {
    const payload = { notes, areasToImprove: areas };
    const invalidate = () => qc.invalidateQueries({ queryKey: getGetMatchReportQueryKey(matchId) });
    if (hasReport) {
      updateReport.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Report saved" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    } else {
      createReport.mutate({ matchId, data: payload }, { onSuccess: () => { invalidate(); setEditing(false); toast({ title: "Report saved" }); }, onError: () => toast({ title: "Failed to save", variant: "destructive" }) });
    }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <div className="space-y-4">
      {hasReport && !editing ? (
        <div className="space-y-4">
          {report.notes && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Match Report</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{report.notes}</p></CardContent>
            </Card>
          )}
          {report.areasToImprove && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Areas to Improve</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{report.areasToImprove}</p></CardContent>
            </Card>
          )}
          {!report.notes && !report.areasToImprove && (
            <p className="text-muted-foreground text-sm">Report is empty.</p>
          )}
          <Button variant="outline" onClick={handleEdit}>Edit Report</Button>
        </div>
      ) : editing ? (
        <Card>
          <CardHeader><CardTitle>{hasReport ? "Edit" : "Write"} Match Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Match Notes</Label>
              <Textarea
                placeholder="How did the match go? Key moments, what went well..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Areas to Improve</Label>
              <Textarea
                placeholder="What do you want to work on before the next match?"
                value={areas}
                onChange={(e) => setAreas(e.target.value)}
                rows={4}
                className="resize-y"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={createReport.isPending || updateReport.isPending}><Save className="h-4 w-4 mr-2" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground mb-4">No match report yet. Write your reflections.</p>
            <Button onClick={() => setEditing(true)}>Write Report</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Photos Tab ────────────────────────────────────────────────────────────────

function PhotosTab({ matchId }: { matchId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: photos, isLoading } = useListMatchPhotos(matchId, {
    query: { queryKey: getListMatchPhotosQueryKey(matchId) },
  });
  const addPhoto = useAddMatchPhoto();
  const deletePhoto = useDeletePhoto();

  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!url.trim()) { toast({ title: "Photo URL is required", variant: "destructive" }); return; }
    addPhoto.mutate(
      { matchId, data: { url, caption: caption || undefined } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListMatchPhotosQueryKey(matchId) });
          setUrl(""); setCaption(""); setAdding(false);
          toast({ title: "Photo added" });
        },
        onError: () => toast({ title: "Failed to add photo", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (photoId: number) => {
    deletePhoto.mutate({ photoId }, {
      onSuccess: () => { qc.invalidateQueries({ queryKey: getListMatchPhotosQueryKey(matchId) }); toast({ title: "Photo removed" }); },
    });
  };

  if (isLoading) return <Skeleton className="h-48 rounded-xl" />;

  return (
    <div className="space-y-4">
      {adding ? (
        <Card>
          <CardHeader><CardTitle>Add Photo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Image URL</Label>
              <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Caption (optional)</Label>
              <Input placeholder="e.g. Taking the catch at mid-off" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
            {url && (
              <img src={url} alt="preview" className="rounded-lg max-h-48 object-cover w-full border" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={addPhoto.isPending}><Save className="h-4 w-4 mr-2" /> Add</Button>
              <Button variant="outline" onClick={() => setAdding(false)}><X className="h-4 w-4 mr-2" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>Add Photo</Button>
      )}

      {photos && photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border bg-muted aspect-square">
              <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                {photo.caption && <p className="text-white text-xs text-center">{photo.caption}</p>}
                <button onClick={() => handleDelete(photo.id)} className="text-white hover:text-red-300 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !adding ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <p className="text-muted-foreground">No photos for this match yet.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MatchDetail() {
  const { matchId: matchIdStr } = useParams<{ matchId: string }>();
  const matchId = Number(matchIdStr);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: match, isLoading } = useGetMatch(matchId, {
    query: { enabled: !!matchId, queryKey: getGetMatchQueryKey(matchId) },
  });
  const deleteMatch = useDeleteMatch();

  const handleDelete = () => {
    if (!confirm("Delete this match and all its stats? This cannot be undone.")) return;
    deleteMatch.mutate({ matchId }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListMatchesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
        toast({ title: "Match deleted" });
        navigate("/");
      },
      onError: () => toast({ title: "Failed to delete match", variant: "destructive" }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Match not found.</p>
        <Link href="/" className="text-primary hover:underline mt-2 block">Back to Dashboard</Link>
      </div>
    );
  }

  const resultColor =
    match.result === "Win"
      ? "bg-primary/10 text-primary border-primary/20"
      : match.result === "Loss"
      ? "bg-destructive/10 text-destructive border-destructive/20"
      : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-3">
        <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">vs {match.opponent}</h1>
            {match.result && (
              <Badge variant="outline" className={resultColor}>{match.result}</Badge>
            )}
            <Badge variant="outline">{match.matchType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(match.date), "MMMM d, yyyy")}
            {match.venue ? ` • ${match.venue}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Player of the Match toggle */}
          <button
            title={(match as any).playerOfTheMatch ? "Remove Player of the Match" : "Mark as Player of the Match"}
            onClick={() => {
              updateMatch.mutate(
                { matchId: match.id, data: { playerOfTheMatch: !(match as any).playerOfTheMatch } as any },
                {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: getGetMatchQueryKey(match.id) });
                    toast({ title: (match as any).playerOfTheMatch ? "POTM removed" : "⭐ Marked as Player of the Match!" });
                  },
                }
              );
            }}
            className={`transition-colors ${(match as any).playerOfTheMatch ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground hover:text-amber-400"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill={(match as any).playerOfTheMatch ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </button>
          <Link href={`/matches/${match.id}/report`} className="text-muted-foreground hover:text-foreground transition-colors" title="View printable report">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </Link>
          <button
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Delete match"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Tabs defaultValue="batting" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="batting">Batting</TabsTrigger>
          <TabsTrigger value="bowling">Bowling</TabsTrigger>
          <TabsTrigger value="fielding">Fielding</TabsTrigger>
          <TabsTrigger value="report">Report</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="batting" className="mt-4"><BattingTab matchId={matchId} /></TabsContent>
        <TabsContent value="bowling" className="mt-4"><BowlingTab matchId={matchId} /></TabsContent>
        <TabsContent value="fielding" className="mt-4"><FieldingTab matchId={matchId} /></TabsContent>
        <TabsContent value="report" className="mt-4"><ReportTab matchId={matchId} /></TabsContent>
        <TabsContent value="photos" className="mt-4"><PhotosTab matchId={matchId} /></TabsContent>
      </Tabs>
    </div>
  );
}

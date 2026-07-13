import { useState, useRef } from "react";
import { useLocation } from "wouter";
import {
  useCreateMatch,
  useAddMatchPhoto,
  useAddMatchVideo,
  useCreateMatchReport,
  useListMatchPhotos,
  useListMatchVideos,
  getListMatchesQueryKey,
  getGetStatsSummaryQueryKey,
  getListMatchPhotosQueryKey,
  getListMatchVideosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Film, Link2, Save, Trash2, X, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { useUpload } from "@workspace/object-storage-web";

const MATCH_TYPES = [
  "League", "Cup", "Friendly", "County", "Country",
  "T20", "ODI", "Test", "The Hundred", "Tournament",
  "Practice", "School", "Social", "Other",
];

// ── Step 2: Media upload ───────────────────────────────────────────────────────

function MediaStep({ matchId, onDone }: { matchId: number; onDone: () => void }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [highlights, setHighlights] = useState("");
  const [savingHighlights, setSavingHighlights] = useState(false);
  const [highlightsSaved, setHighlightsSaved] = useState(false);

  const { data: photos } = useListMatchPhotos(matchId, {
    query: { queryKey: getListMatchPhotosQueryKey(matchId) },
  });
  const { data: videos } = useListMatchVideos(matchId, {
    query: { queryKey: getListMatchVideosQueryKey(matchId) },
  });
  const addPhoto = useAddMatchPhoto();
  const addVideo = useAddMatchVideo();
  const createReport = useCreateMatchReport();

  const { uploadFile: uploadPhoto, isUploading: uploadingPhoto } = useUpload({
    onSuccess: (res: { objectPath: string }) => {
      addPhoto.mutate(
        { matchId, data: { url: `/api/storage${res.objectPath}` } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListMatchPhotosQueryKey(matchId) });
            toast({ title: "Photo added" });
          },
          onError: () => toast({ title: "Failed to save photo", variant: "destructive" }),
        }
      );
    },
    onError: () => toast({ title: "Photo upload failed", variant: "destructive" }),
  });

  const { uploadFile: uploadVideo, isUploading: uploadingVideo } = useUpload({
    onSuccess: (res: { objectPath: string }) => {
      addVideo.mutate(
        { matchId, data: { objectPath: res.objectPath } },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: getListMatchVideosQueryKey(matchId) });
            toast({ title: "Video added" });
          },
          onError: () => toast({ title: "Failed to save video", variant: "destructive" }),
        }
      );
    },
    onError: () => toast({ title: "Video upload failed", variant: "destructive" }),
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadPhoto(file);
    e.target.value = "";
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadVideo(file);
    e.target.value = "";
  };

  const handleSaveHighlights = () => {
    if (!highlights.trim()) return;
    setSavingHighlights(true);
    createReport.mutate(
      { matchId, data: { highlightsUrl: highlights.trim() } as any },
      {
        onSuccess: () => {
          setSavingHighlights(false);
          setHighlightsSaved(true);
          toast({ title: "Highlights link saved" });
        },
        onError: () => {
          setSavingHighlights(false);
          toast({ title: "Failed to save link", variant: "destructive" });
        },
      }
    );
  };

  const photoCount = photos?.length ?? 0;
  const videoCount = videos?.length ?? 0;

  return (
    <div className="space-y-5">
      {/* Photos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Photos</CardTitle>
              {photoCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {photoCount}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? "Uploading…" : "+ Add Photo"}
            </Button>
          </div>
        </CardHeader>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        {photoCount > 0 ? (
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photos!.map((photo) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img src={photo.url} alt={photo.caption || ""} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="pt-0">
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors"
            >
              <Camera className="h-6 w-6" />
              <p className="text-sm">{uploadingPhoto ? "Uploading…" : "Click to add match photos"}</p>
            </button>
          </CardContent>
        )}
      </Card>

      {/* Videos */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Videos</CardTitle>
              {videoCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {videoCount}
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
            >
              {uploadingVideo ? "Uploading…" : "+ Add Video"}
            </Button>
          </div>
        </CardHeader>
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
        {videoCount > 0 ? (
          <CardContent className="pt-0 space-y-2">
            {videos!.map((video, i) => (
              <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Film className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="text-sm truncate">{video.caption || `Video ${i + 1}`}</p>
              </div>
            ))}
          </CardContent>
        ) : (
          <CardContent className="pt-0">
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={uploadingVideo}
              className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 transition-colors"
            >
              <Film className="h-6 w-6" />
              <p className="text-sm">{uploadingVideo ? "Uploading…" : "Click to add match videos"}</p>
            </button>
          </CardContent>
        )}
      </Card>

      {/* Highlights URL */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">YouTube / Highlights Link</CardTitle>
            {highlightsSaved && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={highlights}
              onChange={(e) => { setHighlights(e.target.value); setHighlightsSaved(false); }}
              disabled={highlightsSaved}
            />
            <Button
              variant="outline"
              onClick={handleSaveHighlights}
              disabled={!highlights.trim() || savingHighlights || highlightsSaved}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
          {highlightsSaved && (
            <p className="text-xs text-green-600 mt-1.5">Link saved ✓</p>
          )}
        </CardContent>
      </Card>

      {/* Done */}
      <Button className="w-full" size="lg" onClick={onDone}>
        Done — View Match
      </Button>
      <p className="text-center text-xs text-muted-foreground -mt-2">
        You can also add and manage media from the match detail page.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function NewMatch() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMatch = useCreateMatch();

  const [step, setStep] = useState<1 | 2>(1);
  const [createdMatchId, setCreatedMatchId] = useState<number | null>(null);
  const [createdOpponent, setCreatedOpponent] = useState("");

  function isoToDisplay(iso: string) {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  }
  function displayToIso(display: string) {
    const m = display.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : display;
  }

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    opponent: "",
    venue: "",
    matchType: "League",
    playingFor: "",
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
          playingFor: form.playingFor || undefined,
          result: (form.result as any) || undefined,
        },
      },
      {
        onSuccess: (match) => {
          queryClient.invalidateQueries({ queryKey: getListMatchesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          setCreatedMatchId(match.id);
          setCreatedOpponent(match.opponent);
          setStep(2);
        },
        onError: () => {
          toast({ title: "Failed to create match", variant: "destructive" });
        },
      }
    );
  };

  const handleDone = () => {
    if (createdMatchId) navigate(`/matches/${createdMatchId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        {step === 2 ? (
          <button
            onClick={() => setStep(1)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Log a Match</h1>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className={`h-2 w-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-1 w-6 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-2 w-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>
          </div>
          <p className="text-muted-foreground mt-1">
            {step === 1 ? "Step 1 of 2 — Match details" : `Step 2 of 2 — Media for vs ${createdOpponent}`}
          </p>
        </div>
      </div>

      {step === 1 ? (
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
                    type="text"
                    value={isoToDisplay(form.date)}
                    onChange={(e) => setForm({ ...form, date: displayToIso(e.target.value) })}
                    placeholder="DD/MM/YYYY"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="matchType">Match Type</Label>
                  <Select value={form.matchType} onValueChange={(v) => setForm({ ...form, matchType: v })}>
                    <SelectTrigger id="matchType">
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATCH_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label htmlFor="playingFor">Playing For</Label>
                <Input
                  id="playingFor"
                  placeholder="e.g. City CC, School XI"
                  value={form.playingFor}
                  onChange={(e) => setForm({ ...form, playingFor: e.target.value })}
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
                  {createMatch.isPending ? "Creating…" : "Next — Add Media →"}
                </Button>
                <Link href="/">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        createdMatchId && <MediaStep matchId={createdMatchId} onDone={handleDone} />
      )}
    </div>
  );
}

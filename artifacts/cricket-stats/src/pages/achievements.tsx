import { useGetPerMatchStats, getGetPerMatchStatsQueryKey } from "@workspace/api-client-react";
import { Achievements } from "@/components/achievements";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AchievementsPage() {
  const { data: perMatch, isLoading } = useGetPerMatchStats({
    query: { queryKey: getGetPerMatchStatsQueryKey() },
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Badges</h1>
        <p className="text-muted-foreground mt-1">
          Badges and milestones earned across your career.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : !perMatch || perMatch.length === 0 ? (
        <Card className="border-dashed bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-4xl mb-4">🏆</p>
            <p className="text-lg font-medium">No achievements yet</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Log some matches and start earning badges.
            </p>
            <Link href="/matches/new">
              <Button>Log Your First Match</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Achievements data={perMatch} />
      )}
    </div>
  );
}

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, BarChart2, Medal, LineChart } from "lucide-react";

const FEATURES = [
  {
    icon: BarChart2,
    title: "Every innings, tracked",
    text: "Log batting, bowling and fielding for every match — from club games to back-garden knocks.",
  },
  {
    icon: LineChart,
    title: "See your form",
    text: "Charts, form guides and per-season breakdowns show exactly how your game is trending.",
  },
  {
    icon: Medal,
    title: "Earn your badges",
    text: "Centuries, five-fors, streaks and milestones unlock achievements as your career grows.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex flex-col">
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="flex items-center gap-2 mb-6 text-primary">
          <Trophy className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">CricVault</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight max-w-2xl">
          Your entire cricket career, in one place
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl">
          Track every match, watch your averages climb, and celebrate every
          milestone — batting, bowling and fielding stats made beautiful.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Create free account</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>
      <section className="border-t bg-card/50">
        <div className="container max-w-5xl mx-auto px-4 py-14 grid gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

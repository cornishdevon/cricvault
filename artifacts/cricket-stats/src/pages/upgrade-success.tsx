import { Link } from "wouter";
import { CheckCircle, Trophy } from "lucide-react";

export default function UpgradeSuccess() {
  return (
    <div className="container max-w-lg mx-auto px-4 py-20 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
        <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h1 className="text-3xl font-bold mb-3">You're now Pro!</h1>
      <p className="text-muted-foreground mb-8">
        Welcome to CricVault Pro. Your subscription is active and all Pro features are unlocked.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
      >
        <Trophy className="h-4 w-4" />
        Go to Dashboard
      </Link>
    </div>
  );
}

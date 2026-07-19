import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Mail, MessageCircle, BookOpen } from "lucide-react";

export default function Support() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-2">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Support</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">We're here to help with any questions about CricVault.</p>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 text-sm leading-relaxed text-foreground space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">Email Support</p>
                <p className="text-muted-foreground mb-1">For account issues, bug reports, or anything else, email us and we'll get back to you as soon as we can.</p>
                <a
                  href="mailto:support@cricvault.app"
                  className="text-primary font-medium hover:underline"
                >
                  support@cricvault.app
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-sm leading-relaxed text-foreground space-y-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-2">Frequently Asked Questions</p>

                <div className="space-y-4">
                  <div>
                    <p className="font-medium">How do I log a match?</p>
                    <p className="text-muted-foreground mt-0.5">Tap the green "Log Match" button in the top right of the dashboard, or use the + button on the Matches screen.</p>
                  </div>
                  <div>
                    <p className="font-medium">Can I edit a match after logging it?</p>
                    <p className="text-muted-foreground mt-0.5">Yes — go to the Matches screen, tap the match, and use the Edit button to update any details.</p>
                  </div>
                  <div>
                    <p className="font-medium">How does the career level work?</p>
                    <p className="text-muted-foreground mt-0.5">Your level is calculated from your career XP, which is earned from runs, wickets, catches, POTM awards, and matches played. The more you log, the higher you climb.</p>
                  </div>
                  <div>
                    <p className="font-medium">How do I export my stats?</p>
                    <p className="text-muted-foreground mt-0.5">From the Dashboard, tap "Export CSV" to download all your match data as a spreadsheet.</p>
                  </div>
                  <div>
                    <p className="font-medium">Is my data backed up?</p>
                    <p className="text-muted-foreground mt-0.5">Your stats are stored securely on our servers and are available whenever you log in.</p>
                  </div>
                  <div>
                    <p className="font-medium">How do I cancel my subscription?</p>
                    <p className="text-muted-foreground mt-0.5">Subscriptions are managed through the App Store. Go to Settings → Apple ID → Subscriptions on your iPhone and cancel from there.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-sm leading-relaxed text-foreground">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold mb-1">Privacy Policy</p>
                <p className="text-muted-foreground mb-1">Read how we handle your data.</p>
                <a href="/privacy" className="text-primary font-medium hover:underline">
                  View Privacy Policy
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

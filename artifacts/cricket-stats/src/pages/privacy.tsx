import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const LAST_UPDATED = "July 15, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-2 mt-6 first:mt-0">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-4 px-2">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Last updated: {LAST_UPDATED}</p>

      <Card>
        <CardContent className="pt-6 space-y-0 text-sm leading-relaxed text-foreground">

          <p className="mb-4">
            CricVault ("we", "our", "the app") helps cricketers track and analyse their personal
            statistics. This policy explains what information CricVault collects, how it is used,
            and the choices you have. It applies to both the CricVault iOS/Android mobile app and
            the CricVault web dashboard.
          </p>

          {/* ── Apple App Store privacy nutrition label equivalent ── */}
          <Section title="Data Linked to You">
            <p className="mb-2">The following data is associated with your account and stored on our servers:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="font-medium">Identifiers</span> — your account identifier used to sync your data across devices.</li>
              <li><span className="font-medium">Cricket &amp; performance data</span> — match results, runs, wickets, catches, venues, opponents, and other statistics you enter yourself.</li>
              <li><span className="font-medium">Photos &amp; media</span> — photos you choose to attach to match records, stored privately in your account.</li>
              <li>
                <span className="font-medium">Purchase history</span> — a record that you hold an active CricVault Pro subscription. Payment card details are handled entirely by Stripe (see Third-Party Services below) and are never stored by CricVault.
              </li>
            </ul>
          </Section>

          <Section title="Data Not Linked to You">
            <ul className="list-disc pl-5 space-y-1.5">
              <li><span className="font-medium">Usage data</span> — anonymous crash reports and performance diagnostics used to improve app stability. This data cannot be traced back to you.</li>
            </ul>
          </Section>

          <Section title="Data Not Collected">
            <p>CricVault does <strong>not</strong> collect:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Precise or coarse location (location access is never requested by the app)</li>
              <li>Contacts or address book data</li>
              <li>Browsing or search history</li>
              <li>Health or fitness data</li>
              <li>Sensitive information of any kind</li>
            </ul>
          </Section>

          <Section title="Optional Permissions">
            <p>The following device permissions are entirely optional. The app works without them, and you can change them at any time in your device Settings:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><span className="font-medium">Camera &amp; Photo Library</span> — to attach match photos to your records.</li>
              <li><span className="font-medium">Calendar</span> — to add fixture reminders to your device calendar.</li>
            </ul>
          </Section>

          <Section title="How We Use Your Information">
            <p>We use the data you provide solely to:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Display your career stats, trends, level badges, and achievements back to you</li>
              <li>Sync your data between the CricVault mobile app and web dashboard</li>
              <li>Generate match and season reports you request</li>
              <li>Manage your CricVault Pro subscription</li>
              <li>Improve app performance and fix issues</li>
            </ul>
            <p className="mt-3 font-medium">We do not sell your personal data. We do not use your data for advertising or share it with third parties for marketing purposes.</p>
          </Section>

          <Section title="Third-Party Services">
            <ul className="list-disc pl-5 space-y-3">
              <li>
                <span className="font-medium">Stripe</span> — payment processing for CricVault Pro subscriptions. When you subscribe, payment information is collected and stored directly by Stripe, Inc. CricVault only receives confirmation that a payment succeeded. Stripe's privacy policy is available at{" "}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">stripe.com/privacy</a>.
              </li>
              <li>
                <span className="font-medium">Cloud infrastructure</span> — our servers and object storage run on third-party cloud providers. These providers process data only as needed to operate the service and are contractually prohibited from using your data for any other purpose.
              </li>
            </ul>
          </Section>

          <Section title="Data Retention &amp; Deletion">
            <p>Your data is retained for as long as you hold an account. You can:</p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Edit or delete any individual match, photo, or stat directly in the app at any time.</li>
              <li>Request full deletion of your account and all associated data by emailing us at{" "}
                <a href="mailto:support@cricvault.app" className="text-primary underline">support@cricvault.app</a>. We will action deletion requests within 30 days.
              </li>
            </ul>
          </Section>

          <Section title="Data Security">
            <p>
              Your data is stored on secure servers protected by industry-standard measures including
              encryption in transit (TLS) and access controls. Photos are stored privately — they are
              accessible only through your authenticated account and are not visible to other users.
            </p>
          </Section>

          <Section title="Children's Privacy">
            <p>
              CricVault is not directed at children under the age of 13 (or the applicable minimum
              age in your jurisdiction). We do not knowingly collect personal information from
              children under 13. If you believe a child has provided us with personal data, please
              contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="Your Rights">
            <p>
              Depending on where you live, you may have rights including the right to access, correct,
              export, or delete your personal data. To exercise any of these rights, contact us at the
              address below. We will respond within 30 days.
            </p>
          </Section>

          <Section title="Changes to This Policy">
            <p>
              We may update this privacy policy from time to time. If changes are material, we will
              notify you via the app or by email. The "Last updated" date at the top of this page
              always reflects the most recent version.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              For questions about this privacy policy or to make a data request, contact:{" "}
              <a href="mailto:support@cricvault.app" className="text-primary underline">
                support@cricvault.app
              </a>
            </p>
          </Section>

        </CardContent>
      </Card>
    </div>
  );
}

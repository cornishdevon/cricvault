import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const LAST_UPDATED = "July 8, 2026";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-4">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {LAST_UPDATED}</p>

      <Card>
        <CardContent className="pt-6 space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <p>
              CricVault ("we", "our", "the app") helps you track and analyse your personal
              cricket statistics. This policy explains what information CricVault collects,
              how it is used, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="font-medium">Match &amp; performance data</span> — runs,
                wickets, catches, venues, teams, and other cricket statistics you enter
                yourself when logging matches.
              </li>
              <li>
                <span className="font-medium">Photos</span> — if you choose to attach match
                photos, we access your camera or photo library only for the images you
                select.
              </li>
              <li>
                <span className="font-medium">Location</span> — used only if you allow it, to
                help auto-fill the venue when logging a match. Location is not tracked in the
                background and is not stored beyond the match record you create.
              </li>
              <li>
                <span className="font-medium">Calendar access</span> — used only if you choose
                to add a fixture reminder to your device calendar.
              </li>
              <li>
                <span className="font-medium">Account information</span> — basic details
                needed to identify your account and sync your data across devices.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">How We Use Your Information</h2>
            <p>We use the information you provide solely to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Display your career stats, trends, and achievements back to you</li>
              <li>Sync your data between the CricVault mobile app and web dashboard</li>
              <li>Generate season and match reports you request</li>
              <li>Improve app performance and reliability</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data, and we do not use your cricket statistics or
              photos for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Data Storage &amp; Security</h2>
            <p>
              Your data is stored on secure servers used to operate CricVault. We take
              reasonable technical measures to protect your information from unauthorized
              access, alteration, or loss. Photos you attach are stored only for your own
              account and are not shared with other users unless you explicitly choose to
              share them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Third-Party Services</h2>
            <p>
              CricVault relies on infrastructure providers (such as cloud hosting and storage)
              to operate the app. These providers process data only as needed to deliver the
              service and are not permitted to use your data for their own purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Your Choices</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Camera, photo library, location, and calendar permissions are optional and can be changed at any time in your device settings.</li>
              <li>You can edit or delete any match, photo, or stat you've entered directly in the app.</li>
              <li>You can request deletion of your account and all associated data by contacting us (see below).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Children's Privacy</h2>
            <p>
              CricVault is not directed at children under 13, and we do not knowingly collect
              personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Material changes will be
              reflected by updating the "Last updated" date above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
            <p>
              If you have questions about this privacy policy or your data, please contact us
              at{" "}
              <a href="mailto:support@cricvault.app" className="text-primary underline">
                support@cricvault.app
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

import { logger } from "./logger";

/**
 * Ensures the mobile app's OAuth redirect URL is allowlisted on the Clerk
 * instance this server is running against.
 *
 * Why: the iOS app signs users in with Apple/Google via Clerk's SSO browser
 * flow, which returns to the app at `cricvault://`. Clerk rejects redirect
 * URLs that are not allowlisted. The production Clerk secret key is only
 * available inside the deployed server (Replit-managed Clerk), so the server
 * self-registers the URL at startup. Idempotent — skips if already present.
 */
const MOBILE_REDIRECT_URLS = ["cricvault://"];

export async function ensureClerkRedirectUrls(): Promise<void> {
  const secretKey = process.env["CLERK_SECRET_KEY"];
  if (!secretKey) {
    logger.warn("CLERK_SECRET_KEY not set; skipping redirect URL registration");
    return;
  }
  const headers = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
  try {
    const listRes = await fetch("https://api.clerk.com/v1/redirect_urls", { headers });
    if (!listRes.ok) {
      logger.error({ status: listRes.status }, "Failed to list Clerk redirect URLs");
      return;
    }
    const existing = (await listRes.json()) as Array<{ url: string }>;
    const existingUrls = new Set(existing.map((r) => r.url));
    for (const url of MOBILE_REDIRECT_URLS) {
      if (existingUrls.has(url)) continue;
      const res = await fetch("https://api.clerk.com/v1/redirect_urls", {
        method: "POST",
        headers,
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        logger.info({ url }, "Registered Clerk redirect URL");
      } else {
        logger.error({ url, status: res.status }, "Failed to register Clerk redirect URL");
      }
    }
  } catch (err) {
    logger.error({ err }, "Error ensuring Clerk redirect URLs");
  }
}

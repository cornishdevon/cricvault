import { createHmac, timingSafeEqual } from "crypto";

// Short-lived HMAC tokens that authorize reading a single private object.
//
// Why: <img>/<video> tags (web) and native media players (mobile) cannot
// attach Authorization headers, so path secrecy alone would be the only
// protection for private media. Instead, the API appends a signed token to
// every media URL it returns to the *owner* of the row; the storage route
// refuses to stream a private object without a valid, unexpired token for
// that exact object path.

const SECRET = process.env.SESSION_SECRET;
const DEFAULT_TTL_SECONDS = 6 * 60 * 60; // 6h — longer than any viewing session; queries refetch well before expiry.

function hmac(objectPath: string, exp: number): string {
  if (!SECRET) throw new Error("SESSION_SECRET is required to sign object URLs");
  return createHmac("sha256", SECRET).update(`${objectPath}\n${exp}`).digest("base64url");
}

/** Create a token authorizing GET of `objectPath` (e.g. "/objects/uploads/uuid") until expiry. */
export function signObjectToken(objectPath: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  return `${exp}.${hmac(objectPath, exp)}`;
}

/** Verify a token minted by signObjectToken for the given object path. */
export function verifyObjectToken(objectPath: string, token: string | undefined): boolean {
  if (!token || !SECRET) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(hmac(objectPath, exp));
  const actual = Buffer.from(token.slice(dot + 1));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const OBJECTS_RE = /(\/objects\/[^?#]+)/;

/**
 * Append a signed `token` query param to any URL/path string that references
 * a private object (contains "/objects/..."). Strings without a private
 * object path (e.g. external URLs, public objects) are returned unchanged.
 * Any pre-existing token is replaced.
 */
export function withObjectToken<T extends string | null | undefined>(url: T): T {
  if (!url) return url;
  const match = OBJECTS_RE.exec(url);
  if (!match) return url;
  const objectPath = match[1];
  const base = url.split("?")[0];
  return `${base}?token=${signObjectToken(objectPath)}` as T;
}

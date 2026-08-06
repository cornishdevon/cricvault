/**
 * Returns the full URL for an API endpoint, respecting the Vite BASE_URL.
 * Paths like "stats/summary" → "/cricket-stats/api/stats/summary"
 */
export function getApiUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `${base}/api/${clean}`;
}

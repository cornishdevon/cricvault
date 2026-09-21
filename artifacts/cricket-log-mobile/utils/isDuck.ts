/** A blank score or an unbeaten/retired innings is not a duck. */
export function isDuck(hasBatting: boolean, runs: string, howOut: string): boolean {
  const dismissal = howOut.trim().toLowerCase();
  return hasBatting
    && runs.trim() !== ""
    && Number(runs) === 0
    && dismissal !== ""
    && !["not out", "retired", "retired hurt", "did not bat", "absent hurt"].includes(dismissal);
}
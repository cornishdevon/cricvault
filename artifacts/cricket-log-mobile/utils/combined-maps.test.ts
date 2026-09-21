import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregateWheelsData, filterCombinedMatches, parseWheelShots, type PerMatchData } from "./combined-maps";

const shotData = JSON.stringify([{ x: -0.1, y: 1.1, runs: 6 }, { x: 0.3, y: 0.4, runs: 4 }]);
const wicketMap = JSON.stringify([
  { id: "same", kind: "caught", x: 0.2, y: 0.8, batter: "A", over: "2.3" },
  { id: "same", kind: "lbw", x: 0.5, y: 0.5 },
]);
const matches: PerMatchData[] = [
  { matchId: 2, date: "2026-01-01", opponent: "Rivals", matchType: "Back Garden", shotData, wicketMap },
  { matchId: 1, date: "2025-01-01", opponent: "Club", matchType: "T20", wicketMap },
  { matchId: 3, date: "2026-02-01", opponent: "Rivals", matchType: "ODI", shotData: "broken", wicketMap: "[]" },
];

test("filters intersect and support all years and every stored format", () => {
  assert.deepEqual(filterCombinedMatches(matches, { year: "2026", matchType: "Back Garden", opponent: "Rivals" }), [matches[0]]);
  assert.equal(filterCombinedMatches(matches, { year: "all", matchType: "all", opponent: "all" }).length, 3);
  assert.equal(filterCombinedMatches(matches, { year: "2025", matchType: "all", opponent: "Rivals" }).length, 0);
});

test("coverage counts only usable maps, totals are mapped-only, geometry is unchanged", () => {
  const before = JSON.stringify(matches);
  const stats = aggregateWheelsData(matches);
  assert.equal(stats.totalMatches, 3);
  assert.equal(stats.matchesWithShots, 1);
  assert.equal(stats.matchesWithWickets, 2);
  assert.equal(stats.totalMappedRuns, 10);
  assert.equal(stats.totalMappedWickets, 4);
  assert.deepEqual(stats.shots, JSON.parse(shotData));
  assert.equal(stats.wickets[0].sourceMatchId, 1);
  assert.equal(stats.wickets[0].x, 0.2);
  assert.equal(new Set(stats.wickets.map(w => w.id)).size, 4);
  assert.equal(JSON.stringify(matches), before);
});

test("invalid shots do not masquerade as coverage", () => {
  for (const value of ["oops", "{}", '[{"x":2,"y":0,"runs":4}]', '[{"x":0,"y":0,"runs":3}]', null]) {
    assert.deepEqual(parseWheelShots(value), []);
  }
  assert.equal(aggregateWheelsData([]).totalMappedRuns, 0);
});

test("combined wickets are not truncated to the per-match limit", () => {
  const data = Array.from({ length: 150 }, (_, index) => ({ ...matches[0], matchId: index }));
  const stats = aggregateWheelsData(data);
  assert.equal(stats.totalMappedWickets, 300);
  assert.equal(new Set(stats.wickets.map(w => w.id)).size, 300);
});
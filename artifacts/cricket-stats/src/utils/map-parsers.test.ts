import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { aggregateWheelsData, parseWheelShots } from "./map-parsers.js";
import { parseWicketMap } from "../components/bowling-wicket-map.js";

describe("map-parsers", () => {
  it("parses valid wheel shots safely", () => {
    const valid = JSON.stringify([{ x: 0.5, y: 0.5, runs: 4 }]);
    assert.deepEqual(parseWheelShots(valid), [{ x: 0.5, y: 0.5, runs: 4 }]);
    
    // Bounds check
    const invalid = JSON.stringify([{ x: 2.5, y: 0.5, runs: 4 }]);
    assert.deepEqual(parseWheelShots(invalid), []);
  });

  it("keeps valid wicket metadata without letting malformed metadata hide a map", () => {
    const value = JSON.stringify([
      {
        id: "w1",
        kind: "caught",
        x: 0.2,
        y: 0.8,
        batter: "A Batter",
        over: "7.3",
        note: "Fine edge to slip",
      },
      {
        id: "w2",
        kind: "bowled",
        x: 0.5,
        y: 0.4,
        batter: "x".repeat(121),
        over: "7.6",
        note: "x".repeat(1001),
      },
    ]);

    // The second entry remains visible, while each invalid optional field is
    // ignored independently.
    const parsed = parseWicketMap(value);
    assert.equal(parsed.length, 2);
    assert.deepEqual(parsed[0], {
      id: "w1",
      kind: "caught",
      x: 0.2,
      y: 0.8,
      batter: "A Batter",
      over: "7.3",
      note: "Fine edge to slip",
    });
    assert.deepEqual(parsed[1], {
      id: "w2",
      kind: "bowled",
      x: 0.5,
      y: 0.4,
    });
  });

  it("aggregates data correctly chronologically with unique wicket prefixes", () => {
    const matches = [
      {
        matchId: 2,
        date: "2023-02-01",
        opponent: "B",
        matchType: "T20",
        shotData: JSON.stringify([{ x: 0.1, y: 0.1, runs: 6 }]),
        wicketMap: JSON.stringify([{ id: "w1", kind: "bowled", x: 0.5, y: 0.4 }]),
      },
      {
        matchId: 1,
        date: "2023-01-01",
        opponent: "A",
        matchType: "Test",
        shotData: JSON.stringify([{ x: 0.2, y: 0.2, runs: 4 }]),
        wicketMap: JSON.stringify([{ id: "w1", kind: "caught", x: 0.8, y: 0.8 }]),
      },
    ];

    const result = aggregateWheelsData(matches);
    
    assert.equal(result.matchesCount, 2);
    assert.equal(result.matchesWithShots, 2);
    assert.equal(result.matchesWithWickets, 2);
    assert.equal(result.totalMappedRuns, 10);
    assert.equal(result.mappedFours, 1);
    assert.equal(result.mappedSixes, 1);
    assert.equal(result.caught, 1);
    assert.equal(result.bowled, 1);
    assert.equal(result.lbw, 0);
    
    // Check chronological order (match 1 then match 2)
    assert.equal(result.shots[0].runs, 4);
    assert.equal(result.shots[1].runs, 6);
    
    // Check unique wicket IDs
    assert.equal(result.wickets[0].id, "m1-w1");
    assert.equal(result.wickets[1].id, "m2-w1");
    assert.equal(result.wickets[0].sourceMatchId, 1);
    assert.equal(result.wickets[0].sourceOpponent, "A");
    assert.equal(result.wickets[0].sourceDate, "2023-01-01");
  });

  it("counts boundary shots rather than boundary runs and respects the supplied matches", () => {
    const match = {
      matchId: 1, date: "2026-09-15", opponent: "A", matchType: "T20",
      shotData: JSON.stringify([1, 2, 4, 4, 6].map(runs => ({ x: 0.5, y: 0.5, runs }))),
    };
    const totals = aggregateWheelsData([match, { ...match, matchId: 2, shotData: null }]);
    assert.equal(totals.mappedFours, 2);
    assert.equal(totals.mappedSixes, 1);
    assert.equal(totals.totalMappedRuns, 17);
    const empty = aggregateWheelsData([]);
    assert.equal(empty.mappedFours, 0);
    assert.equal(empty.mappedSixes, 0);
  });
});

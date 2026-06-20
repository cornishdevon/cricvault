import { useState } from "react";
import { Link } from "wouter";

type PerMatchStat = {
  matchId: number;
  date: string;
  opponent: string;
  matchType: string;
  runs?: number | null;
  ballsFaced?: number | null;
  strikeRate?: number | null;
  fours?: number | null;
  sixes?: number | null;
  howOut?: string | null;
  wickets?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  overs?: number | null;
  hatTrick?: boolean | null;
  bowledWickets?: number | null;
  lbwWickets?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  droppedCatches?: number | null;
  missedStumpings?: number | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
  badUmpireDecision?: boolean | null;
  wouldHaveReferred?: boolean | null;
};

type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
  imageKey?: string;
  earned: boolean;
  matchId?: number;
  opponent?: string;
  date?: string;
  detail?: string;
  shareText?: string;
  isNegative?: boolean;
};

function computeBadges(data: PerMatchStat[]): Badge[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const battingInnings = sorted.filter((d) => d.runs !== null && d.runs !== undefined);
  const bowlingInnings = sorted.filter((d) => d.wickets !== null && d.wickets !== undefined);
  const bowlingSpells  = sorted.filter((d) => d.overs != null && (d.overs as number) > 0);

  // ── Career totals ──────────────────────────────────────────────────────────
  const careerRuns    = battingInnings.reduce((s, d) => s + (d.runs ?? 0), 0);
  const careerWickets = bowlingInnings.reduce((s, d) => s + (d.wickets ?? 0), 0);
  const totalOvers    = bowlingSpells.reduce((s, d) => s + (d.overs ?? 0), 0);
  const totalRunsConceded = bowlingSpells.reduce((s, d) => s + (d.runsConceded ?? 0), 0);
  const careerEconomy = totalOvers > 0 ? totalRunsConceded / totalOvers : Infinity;

  const careerBowledWickets = bowlingInnings.reduce((s, d) => s + (d.bowledWickets ?? 0), 0);
  const careerLbwWickets    = bowlingInnings.reduce((s, d) => s + (d.lbwWickets ?? 0), 0);
  const careerDropped       = sorted.reduce((s, d) => s + (d.droppedCatches ?? 0), 0);
  const careerMissedSt      = sorted.reduce((s, d) => s + (d.missedStumpings ?? 0), 0);
  const careerStumpings     = sorted.reduce((s, d) => s + (d.stumpings ?? 0), 0);
  const careerHundreds      = battingInnings.filter((d) => (d.runs ?? 0) >= 100);

  // ── Per-season run totals ──────────────────────────────────────────────────
  const runsBySeason: Record<string, number> = {};
  for (const d of battingInnings) {
    const y = d.date.slice(0, 4);
    runsBySeason[y] = (runsBySeason[y] ?? 0) + (d.runs ?? 0);
  }
  const strokeMakerEarned = Object.values(runsBySeason).some((v) => v >= 500);
  const strokeMakerSeason = Object.entries(runsBySeason).find(([, v]) => v >= 500)?.[0];
  const runMachineEarned  = Object.values(runsBySeason).some((v) => v >= 750);
  const runMachineSeason  = Object.entries(runsBySeason).find(([, v]) => v >= 750)?.[0];
  const proEarned         = Object.values(runsBySeason).some((v) => v >= 1000);
  const proSeason         = Object.entries(runsBySeason).find(([, v]) => v >= 1000)?.[0];

  // ── Per-season fifty counts ────────────────────────────────────────────────
  const fiftiesBySeason: Record<string, number> = {};
  for (const d of battingInnings) {
    if ((d.runs ?? 0) >= 50) {
      const y = d.date.slice(0, 4);
      fiftiesBySeason[y] = (fiftiesBySeason[y] ?? 0) + 1;
    }
  }
  const raiseTheBatEarned = Object.values(fiftiesBySeason).some((c) => c >= 5);
  const raiseTheBatSeason = Object.entries(fiftiesBySeason).find(([, c]) => c >= 5)?.[0];

  // ── Batting milestones ─────────────────────────────────────────────────────
  // Escalation: Half-Century fires for 50–99, Century for 100–149, 150 Club for 150+.
  const first50any = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 50 && r < 100; });
  const first100   = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 100 && r < 150; });
  const first150   = battingInnings.find((d) => (d.runs ?? 0) >= 150);

  // ── Five-for ───────────────────────────────────────────────────────────────
  const first5wkt = bowlingInnings.find((d) => (d.wickets ?? 0) >= 5);

  // ── Not outs ──────────────────────────────────────────────────────────────
  const notOuts = sorted.filter((d) => d.howOut === "Not Out");
  const redInkEarned = notOuts.length >= 5;

  // ── Fielding feats ────────────────────────────────────────────────────────
  const bucketHandsMatch = sorted.find((d) => (d.catches ?? 0) >= 3);
  const safeGlovesEarned = careerStumpings >= 5;

  // ── Bowling feats ─────────────────────────────────────────────────────────
  const magicianMatch  = sorted.find((d) => d.hatTrick === true);
  const bigHitterMatch = sorted.find((d) => (d.sixes ?? 0) >= 5);
  const boundaryMatch  = sorted.find((d) => (d.fours ?? 0) >= 10);

  // ── Personal best ─────────────────────────────────────────────────────────
  let trophyEarned = false;
  let trophyMatch: PerMatchStat | undefined;
  if (battingInnings.length >= 2) {
    let runningBest = battingInnings[0].runs ?? 0;
    for (let i = 1; i < battingInnings.length; i++) {
      const r = battingInnings[i].runs ?? 0;
      if (r > runningBest) { trophyEarned = true; trophyMatch = battingInnings[i]; runningBest = r; }
    }
  }

  // ── Consistent — 5 consecutive 25+ innings ────────────────────────────────
  let consistentEarned = false;
  let streak = 0;
  for (const d of battingInnings) {
    if ((d.runs ?? 0) >= 25) { streak++; if (streak >= 5) { consistentEarned = true; break; } }
    else streak = 0;
  }

  // ── TFC ───────────────────────────────────────────────────────────────────
  const tfcMatch = sorted.find(
    (d) => d.runs !== null && d.runs !== undefined &&
      (d.runs ?? 10) < 10 && (d.wickets ?? 0) === 0 && (d.catches ?? 0) === 0
  );

  // ── Batting dismissal counts ──────────────────────────────────────────────
  const lbwOuts    = battingInnings.filter((d) => d.howOut?.toLowerCase() === "lbw").length;
  const bowledOuts = battingInnings.filter((d) => d.howOut?.toLowerCase() === "bowled").length;
  const caughtOuts = battingInnings.filter((d) => (d.howOut?.toLowerCase() ?? "").includes("caught")).length;
  const runOutOuts = battingInnings.filter((d) => d.howOut?.toLowerCase() === "run out").length;

  // ── Pinch Hitter ─────────────────────────────────────────────────────────
  const pinchHitterMatch = battingInnings.find(
    (d) => (d.runs ?? 0) >= 50 && (d.ballsFaced ?? 999) < 20 && (d.ballsFaced ?? 0) > 0
  );

  // ── Golden Duck — out first ball ──────────────────────────────────────────
  const isDismissed = (d: PerMatchStat) =>
    !!d.howOut && d.howOut !== "Not Out" && d.howOut !== "Retired";
  const goldenDuckMatch = battingInnings.find(
    (d) => (d.runs ?? 0) === 0 && (d.ballsFaced ?? 0) === 1 && isDismissed(d)
  );

  // ── Duck Hunting — ducks (0 off any balls, dismissed) ────────────────────
  const duckMatches = battingInnings.filter(
    (d) => (d.runs ?? 0) === 0 && isDismissed(d)
  );
  const duckCount = duckMatches.length;

  // ── Nervous 90s — out between 90 and 99 ──────────────────────────────────
  const nervousNinetiesMatches = battingInnings.filter(
    (d) => (d.runs ?? 0) >= 90 && (d.runs ?? 0) <= 99 && isDismissed(d)
  );
  const nervousNinetiesMatch = nervousNinetiesMatches[0];

  // ── One Short — out at 49, 99, 149, 199… ─────────────────────────────────
  const oneShortMatches = battingInnings.filter(
    (d) => {
      const r = d.runs ?? 0;
      return r >= 49 && r % 50 === 49 && isDismissed(d);
    }
  );
  const oneShortCount = oneShortMatches.length;
  const oneShortFirst = oneShortMatches[0];

  // ── Line and Length ───────────────────────────────────────────────────────
  const lineAndLengthEarned = totalOvers >= 40 && careerEconomy < 3;

  // ── NEW: Debut — first ever match logged ─────────────────────────────────
  const debutMatch = sorted[0];
  const debutEarned = sorted.length >= 1;

  // ── NEW: Smell of Cut Grass — 10+ matches played ─────────────────────────
  const smellGrassEarned = sorted.length >= 10;

  // ── NEW: Welcome to New Season — matches in 2+ calendar years ────────────
  const years = [...new Set(sorted.map((d) => d.date.slice(0, 4)))].sort();
  const newSeasonEarned = years.length >= 2;
  const newSeasonYear = years.length >= 2 ? years[years.length - 1] : undefined;

  // ── NEW: Leather on Willow — avg 40+ over 10+ innings ────────────────────
  const lwEarned =
    battingInnings.length >= 10 &&
    careerRuns / battingInnings.length >= 40;
  const lwAvg = battingInnings.length > 0 ? (careerRuns / battingInnings.length).toFixed(1) : "0";

  // ── NEW: Wicket Taker — 20 wickets over 10+ bowling appearances ──────────
  const wtEarned = bowlingSpells.length >= 10 && careerWickets >= 20;

  // ── NEW: Match Winner — 8 wins in any 10-match window ────────────────────
  let matchWinnerEarned = false;
  let matchWinnerDetail = "";
  const withResults = sorted.filter((m) => m.result && m.result !== "");
  if (withResults.length >= 10) {
    for (let i = 0; i <= withResults.length - 10; i++) {
      const window = withResults.slice(i, i + 10);
      const wins = window.filter((m) => m.result?.toLowerCase() === "win").length;
      if (wins >= 8) {
        matchWinnerEarned = true;
        matchWinnerDetail = `${wins}/10 wins`;
        break;
      }
    }
  }

  // ── NEW: Player of the Match ──────────────────────────────────────────────
  const potmMatches = sorted.filter((d) => d.playerOfTheMatch === true);
  const potmEarned  = potmMatches.length > 0;
  const potmFirst   = potmMatches[0];

  // ── NEW: All Rounder — 30 runs AND 3 wickets OR 3 keeper catches in one game
  const allRounderMatch = sorted.find(
    (d) =>
      (d.runs ?? 0) >= 30 &&
      ((d.wickets ?? 0) >= 3 || (d.catches ?? 0) + (d.stumpings ?? 0) >= 3)
  );

  // ── Triggered — bad umpire decision (batting, LBW or caught behind) ──────
  const triggeredMatches = sorted.filter((d) => d.badUmpireDecision === true);
  const triggeredCount   = triggeredMatches.length;
  const triggeredFirst   = triggeredMatches[0];

  // ── DRS — would have referred a not-out while bowling ────────────────────
  const drsMatches = sorted.filter((d) => d.wouldHaveReferred === true);
  const drsCount   = drsMatches.length;
  const drsFirst   = drsMatches[0];

  // ── NEW: Teflon (shame) — drops 2+ catches in one game ───────────────────
  const teflonMatch = sorted.find((d) => (d.droppedCatches ?? 0) >= 2);

  // ── Build badge list ──────────────────────────────────────────────────────
  const fmtDate = (d: string) => d.split("-").reverse().join("/");
  const badges: Badge[] = [
    // ─ First steps ─
    {
      id: "debut",
      label: "Debut",
      description: "First match logged in CricVault",
      icon: "🎖️",
      imageKey: "debut",
      earned: debutEarned,
      matchId: debutMatch?.matchId,
      opponent: debutMatch?.opponent,
    },
    {
      id: "smellGrass",
      label: "Smell of Cut Grass",
      description: "10 matches played — you're a regular",
      icon: "🌿",
      earned: smellGrassEarned,
      detail: smellGrassEarned ? `${sorted.length} matches` : undefined,
    },
    {
      id: "newSeason",
      label: "Welcome to the New Season",
      description: "First stats logged in a brand new season",
      icon: "🌱",
      earned: newSeasonEarned,
      detail: newSeasonYear ? `${newSeasonYear} season` : undefined,
    },

    // ─ Batting milestones ─
    {
      id: "first50",
      label: "Half-Century",
      description: "Scored 50+ runs in an innings",
      icon: "🏏",
      earned: !!first50any,
      matchId: first50any?.matchId,
      opponent: first50any?.opponent,
      shareText: first50any ? `🏏 Half-Century\n${first50any.runs} runs vs ${first50any.opponent}\n${fmtDate(first50any.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "first100",
      label: "Century",
      description: "Scored 100–149 runs in an innings",
      icon: "💯",
      imageKey: "century",
      earned: !!first100,
      matchId: first100?.matchId,
      opponent: first100?.opponent,
      shareText: first100 ? `💯 Century\n${first100.runs} runs vs ${first100.opponent}\n${fmtDate(first100.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "first150",
      label: "150 Club",
      description: "Scored 150+ runs in an innings",
      icon: "💎",
      imageKey: "150club",
      earned: !!first150,
      matchId: first150?.matchId,
      opponent: first150?.opponent,
      detail: first150 ? `${first150.runs} runs` : undefined,
      shareText: first150 ? `💎 150 Club\n${first150.runs} runs vs ${first150.opponent}\n${fmtDate(first150.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "pinchHitter",
      label: "Pinch Hitter",
      description: "50 runs in fewer than 20 balls",
      icon: "⚡",
      imageKey: "pinch-hitter",
      earned: !!pinchHitterMatch,
      matchId: pinchHitterMatch?.matchId,
      opponent: pinchHitterMatch?.opponent,
      detail: pinchHitterMatch ? `${pinchHitterMatch.runs} off ${pinchHitterMatch.ballsFaced}b` : undefined,
      shareText: pinchHitterMatch ? `⚡ Pinch Hitter\n${pinchHitterMatch.runs} off ${pinchHitterMatch.ballsFaced}b vs ${pinchHitterMatch.opponent}\n${fmtDate(pinchHitterMatch.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "nervousNineties",
      label: "Nervous 90s",
      description: "Got out between 90 and 99",
      icon: "😰",
      earned: !!nervousNinetiesMatch,
      matchId: nervousNinetiesMatch?.matchId,
      opponent: nervousNinetiesMatch?.opponent,
      detail: nervousNinetiesMatch ? `${nervousNinetiesMatch.runs} runs` : undefined,
    },
    // One Short milestones — 49, 99, 149… out on the last before a milestone
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `oneShort_${milestone}`,
      label: milestone === 1 ? "One Short" : `One Short ×${milestone}`,
      description: milestone === 1
        ? "Out one run short of a milestone (49, 99, 149…)"
        : `One short of a milestone ${milestone} times`,
      icon: "1️⃣",
      earned: oneShortCount >= milestone,
      matchId: milestone === 1 ? oneShortFirst?.matchId : undefined,
      opponent: milestone === 1 ? oneShortFirst?.opponent : undefined,
      detail: oneShortCount >= milestone
        ? milestone === 1
          ? `${oneShortFirst?.runs} runs`
          : `${oneShortCount} times`
        : undefined,
    })),
    {
      id: "leatherOnWillow",
      label: "Leather on Willow",
      description: "Batting average of 40+ over 10 games",
      icon: "🪵",
      earned: lwEarned,
      detail: lwEarned ? `Avg ${lwAvg}` : undefined,
    },
    {
      id: "consistent",
      label: "Consistent",
      description: "5 consecutive innings scoring 25+",
      icon: "📈",
      earned: consistentEarned,
    },
    {
      id: "raisethebat",
      label: "Raise the Bat",
      description: "5 fifties in a single season",
      icon: "🏏",
      earned: raiseTheBatEarned,
      detail: raiseTheBatSeason ? `${raiseTheBatSeason} season` : undefined,
    },
    {
      id: "doffhelmet",
      label: "Doff Your Helmet",
      description: "3 centuries in your career",
      icon: "⛑️",
      imageKey: "doffYourHelmet",
      earned: careerHundreds.length >= 3,
      detail: careerHundreds.length >= 3 ? `${careerHundreds.length} hundreds` : undefined,
    },

    // ─ Season run targets ─
    {
      id: "strokemaker",
      label: "Stroke Maker",
      description: "500 runs in a season",
      icon: "✨",
      earned: strokeMakerEarned,
      detail: strokeMakerSeason ? `${strokeMakerSeason} season` : undefined,
    },
    {
      id: "runmachine",
      label: "Run Machine",
      description: "750 runs in a season",
      icon: "⚙️",
      earned: runMachineEarned,
      detail: runMachineSeason ? `${runMachineSeason} season` : undefined,
    },
    {
      id: "pro",
      label: "Pro",
      description: "1,000 runs in a season",
      icon: "🌟",
      earned: proEarned,
      detail: proSeason ? `${proSeason} season` : undefined,
    },

    // ─ Big career targets ─
    {
      id: "career2000",
      label: "2,000 Club",
      description: "2,000 career runs",
      icon: "🏆",
      earned: careerRuns >= 2000,
      detail: careerRuns >= 2000 ? `${careerRuns} career runs` : undefined,
    },
    {
      id: "career100wkt",
      label: "100 Wickets",
      description: "100 career wickets",
      icon: "🎳",
      earned: careerWickets >= 100,
      detail: careerWickets >= 100 ? `${careerWickets} wickets` : undefined,
    },

    // ─ Bowling feats ─
    {
      id: "fivewkt",
      label: "Five-For",
      description: "Took 5 wickets in a spell",
      icon: "🔥",
      imageKey: "fiveFor",
      earned: !!first5wkt,
      matchId: first5wkt?.matchId,
      opponent: first5wkt?.opponent,
      shareText: first5wkt ? `🔥 Five-For\n${first5wkt.wickets}/${first5wkt.runsConceded} off ${Number(first5wkt.overs ?? 0).toFixed(1)} overs vs ${first5wkt.opponent}\n${fmtDate(first5wkt.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "wicketTaker",
      label: "Wicket Taker",
      description: "20 wickets over 10+ bowling appearances",
      icon: "🎯",
      earned: wtEarned,
      detail: wtEarned ? `${careerWickets} wickets` : undefined,
    },
    {
      id: "magician",
      label: "Magician",
      description: "Hat trick in a match",
      icon: "🪄",
      earned: !!magicianMatch,
      matchId: magicianMatch?.matchId,
      opponent: magicianMatch?.opponent,
      shareText: magicianMatch ? `🪄 Hat Trick!\nvs ${magicianMatch.opponent}\n${fmtDate(magicianMatch.date)}\n\nLogged on CricVault 🏏` : undefined,
    },
    {
      id: "deadEye",
      label: "Dead Eye",
      description: "10 career wickets taken bowled",
      icon: "🎯",
      earned: careerBowledWickets >= 10,
      detail: careerBowledWickets >= 10 ? `${careerBowledWickets} bowled` : undefined,
    },
    {
      id: "hitThosePads",
      label: "Hit Those Pads",
      description: "10 career LBW wickets taken",
      icon: "🦵",
      earned: careerLbwWickets >= 10,
      detail: careerLbwWickets >= 10 ? `${careerLbwWickets} LBWs` : undefined,
    },
    {
      id: "lineLength",
      label: "Line and Length",
      description: "Economy < 3 over 40+ career overs",
      icon: "📏",
      earned: lineAndLengthEarned,
      detail: lineAndLengthEarned ? `Econ ${careerEconomy.toFixed(2)} / ${totalOvers.toFixed(1)} ovs` : undefined,
    },

    // ─ Fielding feats ─
    {
      id: "buckethands",
      label: "Bucket Hands",
      description: "3 catches in a single match",
      icon: "🧤",
      earned: !!bucketHandsMatch,
      matchId: bucketHandsMatch?.matchId,
      opponent: bucketHandsMatch?.opponent,
    },
    {
      id: "safegloves",
      label: "Safe Gloves",
      description: "5 career stumpings as keeper",
      icon: "🥅",
      earned: safeGlovesEarned,
      detail: safeGlovesEarned ? `${careerStumpings} stumpings` : undefined,
    },

    // ─ Batting feats ─
    {
      id: "bighitter",
      label: "Big Hitter",
      description: "5+ sixes in one innings",
      icon: "💥",
      earned: !!bigHitterMatch,
      matchId: bigHitterMatch?.matchId,
      opponent: bigHitterMatch?.opponent,
    },
    {
      id: "boundary",
      label: "Boundary Getter",
      description: "10+ fours in one innings",
      icon: "🏅",
      earned: !!boundaryMatch,
      matchId: boundaryMatch?.matchId,
      opponent: boundaryMatch?.opponent,
    },
    {
      id: "redink",
      label: "Red Ink",
      description: "5 or more career not outs",
      icon: "🛡️",
      earned: redInkEarned,
      detail: redInkEarned ? `${notOuts.length} not outs` : undefined,
    },
    {
      id: "trophy",
      label: "Personal Best",
      description: "Beat your own batting high score",
      icon: "🏆",
      imageKey: "personalBest",
      earned: trophyEarned,
      matchId: trophyMatch?.matchId,
      opponent: trophyMatch?.opponent,
      shareText: trophyMatch ? `🏆 Personal Best\n${trophyMatch.runs} runs vs ${trophyMatch.opponent}\n${fmtDate(trophyMatch.date)}\n\nLogged on CricVault 🏏` : undefined,
    },

    // ─ Team achievements ─
    {
      id: "matchWinner",
      label: "Match Winner",
      description: "8 wins in any 10-match window",
      icon: "🥇",
      earned: matchWinnerEarned,
      detail: matchWinnerDetail || undefined,
    },
    {
      id: "potm",
      label: "Player of the Match",
      description: "Awarded Player of the Match",
      icon: "⭐",
      earned: potmEarned,
      matchId: potmFirst?.matchId,
      opponent: potmFirst?.opponent,
      detail: potmMatches.length > 1 ? `${potmMatches.length}× POTM` : undefined,
    },
    {
      id: "allRounder",
      label: "All Rounder",
      description: "30 runs & 3 wickets (or 3 keeper takes) in one game",
      icon: "🌟",
      earned: !!allRounderMatch,
      matchId: allRounderMatch?.matchId,
      opponent: allRounderMatch?.opponent,
      detail: allRounderMatch
        ? `${allRounderMatch.runs}r / ${allRounderMatch.wickets ?? 0}wkt`
        : undefined,
    },

    // ─ Triggered milestones (batting bad umpire decisions) ─
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `triggered_${milestone}`,
      label: milestone === 1 ? "Triggered" : `Triggered ×${milestone}`,
      description: milestone === 1
        ? "Given out on a bad umpire decision (LBW or caught behind)"
        : `Robbed by the umpire ${milestone} times`,
      icon: "😤",
      earned: triggeredCount >= milestone,
      matchId: milestone === 1 ? triggeredFirst?.matchId : undefined,
      opponent: milestone === 1 ? triggeredFirst?.opponent : undefined,
      detail: triggeredCount >= milestone && triggeredCount > milestone
        ? `${triggeredCount} times total`
        : undefined,
      isNegative: true,
    })),

    // ─ DRS milestones (bowling not-out referrals) ─
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `drs_${milestone}`,
      label: milestone === 1 ? "DRS" : `DRS ×${milestone}`,
      description: milestone === 1
        ? "Would have referred a not-out decision while bowling"
        : `Would have referred ${milestone} not-out decisions`,
      icon: "📺",
      earned: drsCount >= milestone,
      matchId: milestone === 1 ? drsFirst?.matchId : undefined,
      opponent: milestone === 1 ? drsFirst?.opponent : undefined,
      detail: drsCount >= milestone && drsCount > milestone
        ? `${drsCount} times total`
        : undefined,
      isNegative: true,
    })),

    // ─ Batting mishaps ─
    {
      id: "goldenDuck",
      label: "Golden Duck",
      description: "Out first ball for a duck",
      icon: "🦆",
      imageKey: "goldenDuck",
      earned: !!goldenDuckMatch,
      matchId: goldenDuckMatch?.matchId,
      opponent: goldenDuckMatch?.opponent,
      isNegative: true,
    },
    // Duck Hunting milestones — every 5 ducks starting at 5
    ...[5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `duckHunting_${milestone}`,
      label: `Duck Hunting ×${milestone}`,
      description: `${milestone} ducks in your career`,
      icon: "🦆",
      earned: duckCount >= milestone,
      detail: duckCount >= milestone ? `${duckCount} ducks total` : undefined,
      isNegative: true,
    })),
    {
      id: "billyBigPads",
      label: "Billy Big Pads",
      description: "Out LBW 5 times",
      icon: "😬",
      imageKey: "billyBigPads",
      earned: lbwOuts >= 5,
      detail: lbwOuts >= 5 ? `${lbwOuts}× LBW` : undefined,
      isNegative: true,
    },
    // Garden Gate — bowled through the gate — tiered
    ...[1, 3, 5, 10, 20].map((milestone) => ({
      id: `gardenGate_${milestone}`,
      label: milestone === 1 ? "Garden Gate" : `Garden Gate ×${milestone}`,
      description: milestone === 1
        ? "Bowled through the gate — ball beats bat and pad"
        : `Bowled through the gate ${milestone} times`,
      icon: "🚪",
      imageKey: "garden-gate",
      earned: bowledOuts >= milestone,
      detail: bowledOuts >= milestone
        ? bowledOuts > milestone ? `${bowledOuts}× bowled total` : `Bowled ${bowledOuts}×`
        : undefined,
      isNegative: true as const,
    })),
    {
      id: "catchingPractice",
      label: "Catching Practice",
      description: "Out caught 10 times",
      icon: "🙈",
      earned: caughtOuts >= 10,
      detail: caughtOuts >= 10 ? `${caughtOuts}× caught` : undefined,
      isNegative: true,
    },
    {
      id: "keepOnRunning",
      label: "Keep on Running",
      description: "Run out 3 times",
      icon: "🏃",
      earned: runOutOuts >= 3,
      detail: runOutOuts >= 3 ? `${runOutOuts}× run out` : undefined,
      isNegative: true,
    },

    // ─ Fielding mishaps ─
    {
      id: "butterFingers",
      label: "Butter Fingers",
      description: "Dropped a catch in the field",
      icon: "🧈",
      earned: careerDropped > 0,
      detail: careerDropped > 0 ? `${careerDropped} dropped` : undefined,
      isNegative: true,
    },
    {
      id: "dontSnatch",
      label: "Don't Snatch",
      description: "Missed a stumping",
      icon: "🙅",
      earned: careerMissedSt > 0,
      detail: careerMissedSt > 0 ? `${careerMissedSt} missed` : undefined,
      isNegative: true,
    },
    {
      id: "teflon",
      label: "Teflon",
      description: "Dropped 2+ catches in a single game as keeper",
      icon: "🫳",
      earned: !!teflonMatch,
      matchId: teflonMatch?.matchId,
      opponent: teflonMatch?.opponent,
      detail: teflonMatch ? `${teflonMatch.droppedCatches} drops` : undefined,
      isNegative: true,
    },

    // ─ Shame badge ─
    {
      id: "tfc",
      label: "Thanks For Coming",
      description: "<10 runs, 0 wickets & 0 catches",
      icon: "🚌",
      earned: !!tfcMatch,
      matchId: tfcMatch?.matchId,
      opponent: tfcMatch?.opponent,
      isNegative: true,
    },
  ];

  return badges;
}

function computeMilestones(data: PerMatchStat[]) {
  const innings = data.filter((d) => d.runs !== null && d.runs !== undefined);
  return {
    twentyFives: innings.filter((d) => (d.runs ?? 0) >= 25).length,
    fifties:     innings.filter((d) => (d.runs ?? 0) >= 50).length,
    hundreds:    innings.filter((d) => (d.runs ?? 0) >= 100).length,
    totalInnings: innings.length,
  };
}

function BadgeModal({ badge, onClose }: { badge: Badge | null; onClose: () => void }) {
  const [shared, setShared] = useState(false);
  if (!badge) return null;

  const accentClass = badge.isNegative ? "text-destructive" : "text-primary";
  const pillClass   = badge.isNegative
    ? "bg-destructive/10 border-destructive/30 text-destructive"
    : "bg-primary/10 border-primary/30 text-primary";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl border p-8 flex flex-col items-center text-center gap-4 shadow-2xl ${
          badge.earned
            ? badge.isNegative
              ? "bg-zinc-900 border-destructive/40"
              : "bg-zinc-900 border-primary/40"
            : "bg-zinc-900 border-zinc-700"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon / image */}
        <div className="flex items-center justify-center w-36 h-36">
          {badge.earned && badge.imageKey ? (
            <img
              src={`/badges/${badge.imageKey}.png`}
              alt={badge.label}
              className="w-36 h-36 object-contain rounded-full"
            />
          ) : (
            <span className="text-8xl leading-none" role="img" aria-label={badge.label}>
              {badge.earned ? badge.icon : "🔒"}
            </span>
          )}
        </div>

        {/* Earned pill */}
        {badge.earned && (
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${pillClass}`}>
            {badge.isNegative ? "Unlocked 😬" : "Earned ✓"}
          </span>
        )}

        <div>
          <p className={`text-xl font-extrabold ${badge.earned ? (badge.isNegative ? "text-destructive" : "text-foreground") : "text-zinc-400"}`}>
            {badge.label}
          </p>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">{badge.description}</p>
        </div>

        {badge.earned && badge.detail && (
          <p className={`text-sm font-bold ${accentClass}`}>{badge.detail}</p>
        )}
        {badge.earned && !badge.detail && badge.opponent && (
          <p className={`text-sm font-bold ${accentClass}`}>vs {badge.opponent}</p>
        )}
        {!badge.earned && (
          <p className="text-xs text-muted-foreground italic">Keep playing to unlock this badge</p>
        )}

        {badge.earned && badge.matchId && (
          <Link
            href={`/matches/${badge.matchId}`}
            onClick={onClose}
            className="text-xs text-primary underline underline-offset-2"
          >
            View match →
          </Link>
        )}

        {badge.earned && badge.shareText && (
          <button
            onClick={async () => {
              if (navigator.share) {
                try { await navigator.share({ title: `CricVault — ${badge.label}`, text: badge.shareText! }); } catch {}
              } else {
                await navigator.clipboard.writeText(badge.shareText!);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl border text-sm transition-colors ${
              badge.isNegative
                ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                : "border-primary/40 text-primary hover:bg-primary/10"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            {shared ? "Copied!" : "Share Badge"}
          </button>
        )}
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 rounded-xl border border-zinc-700 text-sm text-muted-foreground hover:text-foreground hover:border-zinc-500 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
  const inner = (
    <div
      className={`rounded-xl border p-3 flex flex-col items-center text-center gap-1.5 transition-all duration-200 h-full cursor-pointer ${
        badge.earned
          ? badge.isNegative
            ? "bg-destructive/5 border-destructive/30 shadow-sm hover:border-destructive/60 hover:shadow-md"
            : "bg-card border-primary/30 shadow-sm hover:border-primary/60 hover:shadow-md"
          : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
      }`}
      onClick={onClick}
    >
      {badge.earned && badge.imageKey ? (
        <img
          src={`/badges/${badge.imageKey}.png`}
          alt={badge.label}
          className="w-10 h-10 object-contain rounded-full"
        />
      ) : (
        <span className="text-2xl" role="img" aria-label={badge.label}>
          {badge.earned ? badge.icon : "🔒"}
        </span>
      )}
      <div>
        <p className={`font-semibold text-xs leading-tight ${badge.earned ? (badge.isNegative ? "text-destructive" : "text-foreground") : "text-zinc-400"}`}>
          {badge.label}
        </p>
        <p className={`text-[10px] mt-0.5 leading-snug ${badge.earned ? "text-muted-foreground" : "text-zinc-500"}`}>{badge.description}</p>
      </div>
      {badge.earned && badge.detail && (
        <p className={`text-[11px] font-medium mt-auto ${badge.isNegative ? "text-destructive/80" : "text-primary"}`}>
          {badge.detail}
        </p>
      )}
      {badge.earned && !badge.detail && badge.opponent && (
        <p className="text-[11px] text-primary font-medium mt-auto truncate w-full">
          vs {badge.opponent}
        </p>
      )}
    </div>
  );

  return <div className="h-full">{inner}</div>;
}

function MilestonesBar({ milestones }: { milestones: ReturnType<typeof computeMilestones> }) {
  const items = [
    { label: "25+", count: milestones.twentyFives, color: "bg-chart-3" },
    { label: "50+", count: milestones.fifties, color: "bg-primary" },
    { label: "100+", count: milestones.hundreds, color: "bg-amber-400" },
  ];
  return (
    <div className="flex gap-4 flex-wrap">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${item.color}`} />
          <span className="text-sm font-semibold text-foreground">{item.count}</span>
          <span className="text-sm text-muted-foreground">innings of {item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-sm text-muted-foreground">{milestones.totalInnings} innings total</span>
      </div>
    </div>
  );
}

export function Achievements({ data }: { data: PerMatchStat[] }) {
  const badges     = computeBadges(data);
  const milestones = computeMilestones(data);
  const positive   = badges.filter((b) => !b.isNegative);
  const negative   = badges.filter((b) => b.isNegative);
  const earned     = badges.filter((b) => b.earned).length;

  const [selected, setSelected] = useState<Badge | null>(null);

  return (
    <>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Achievements</h2>
            <span className="text-sm text-muted-foreground font-medium">
              {earned} / {badges.length} earned
            </span>
          </div>
          {milestones.totalInnings > 0 && (
            <div className="mt-3">
              <MilestonesBar milestones={milestones} />
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
          {positive.filter((b) => b.earned).map((badge, i) => (
            <div
              key={badge.id}
              className="animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <BadgeCard badge={badge} onClick={() => setSelected(badge)} />
            </div>
          ))}
        </div>

        {negative.some((b) => b.earned) && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Unlucky badges</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {negative.filter((b) => b.earned).map((badge, i) => (
                <div
                  key={badge.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <BadgeCard badge={badge} onClick={() => setSelected(badge)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BadgeModal badge={selected} onClose={() => setSelected(null)} />
    </>
  );
}

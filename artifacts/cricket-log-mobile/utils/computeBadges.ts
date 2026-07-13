export type PerMatchStat = {
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
  overs?: number | null;
  runsConceded?: number | null;
  economyRate?: number | null;
  bowledWickets?: number | null;
  lbwWickets?: number | null;
  catches?: number | null;
  stumpings?: number | null;
  droppedCatches?: number | null;
  missedStumpings?: number | null;
  hatTrick?: boolean | null;
  result?: string | null;
  playerOfTheMatch?: boolean | null;
  badUmpireDecision?: boolean | null;
  wouldHaveReferred?: boolean | null;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
  imageKey?: string;
  imageScale?: number;
  earned: boolean;
  detail?: string;
  shareText?: string;
  isNegative?: boolean;
};

export function computeBadges(data: PerMatchStat[]): Badge[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

  const battingInnings = sorted.filter((d) => d.runs !== null && d.runs !== undefined);
  const bowlingInnings = sorted.filter((d) => d.wickets !== null && d.wickets !== undefined);
  const bowlingSpells  = sorted.filter((d) => d.overs != null && (d.overs as number) > 0);

  const careerRuns        = battingInnings.reduce((s, d) => s + (d.runs ?? 0), 0);
  const careerWickets     = bowlingInnings.reduce((s, d) => s + (d.wickets ?? 0), 0);
  const totalOvers        = bowlingSpells.reduce((s, d) => s + (d.overs ?? 0), 0);
  const totalRunsConceded = bowlingSpells.reduce((s, d) => s + (d.runsConceded ?? 0), 0);
  const careerEconomy     = totalOvers > 0 ? totalRunsConceded / totalOvers : Infinity;
  const careerBowledWkts  = bowlingInnings.reduce((s, d) => s + (d.bowledWickets ?? 0), 0);
  const careerLbwWkts     = bowlingInnings.reduce((s, d) => s + (d.lbwWickets ?? 0), 0);
  const careerDropped     = sorted.reduce((s, d) => s + (d.droppedCatches ?? 0), 0);
  const careerMissedSt    = sorted.reduce((s, d) => s + (d.missedStumpings ?? 0), 0);
  const careerStumpings   = sorted.reduce((s, d) => s + (d.stumpings ?? 0), 0);
  const careerHundreds    = battingInnings.filter((d) => (d.runs ?? 0) >= 100);

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

  const fiftiesBySeason: Record<string, number> = {};
  for (const d of battingInnings) {
    if ((d.runs ?? 0) >= 50) {
      const y = d.date.slice(0, 4);
      fiftiesBySeason[y] = (fiftiesBySeason[y] ?? 0) + 1;
    }
  }
  const raiseTheBatEarned = Object.values(fiftiesBySeason).some((c) => c >= 5);
  const raiseTheBatSeason = Object.entries(fiftiesBySeason).find(([, c]) => c >= 5)?.[0];

  const first50  = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 50 && r < 100; });
  const first100 = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 100 && r < 150; });
  const first150 = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 150 && r < 200; });
  const first200 = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 200 && r < 300; });
  const first300 = battingInnings.find((d) => { const r = d.runs ?? 0; return r >= 300 && r < 400; });
  const first400 = battingInnings.find((d) => (d.runs ?? 0) >= 400);
  const first5wkt = bowlingInnings.find((d) => (d.wickets ?? 0) >= 5);

  const notOuts = sorted.filter((d) => d.howOut === "Not Out");

  const rainStoppedPlayMatch = sorted.find((d) => d.result?.toLowerCase().includes("abandon"));
  const rainStoppedPlayEarned = !!rainStoppedPlayMatch;

  const bucketHandsEarned = sorted.some((d) => (d.catches ?? 0) >= 3);
  const magicianEarned    = sorted.some((d) => d.hatTrick === true);
  const bigHitterEarned   = sorted.some((d) => (d.sixes ?? 0) >= 5);
  const boundaryEarned    = sorted.some((d) => (d.fours ?? 0) >= 10);

  let trophyEarned = false;
  let trophyMatch: PerMatchStat | undefined;
  const fmtDate = (d: string) => d.split("-").reverse().join("/");
  if (battingInnings.length >= 2) {
    let best = battingInnings[0].runs ?? 0;
    for (let i = 1; i < battingInnings.length; i++) {
      const r = battingInnings[i].runs ?? 0;
      if (r > best) { trophyEarned = true; trophyMatch = battingInnings[i]; best = r; }
    }
  }

  let consistentEarned = false;
  let streak = 0;
  let prevConsistentYear = "";
  for (const d of battingInnings) {
    const yr = d.date.slice(0, 4);
    if (yr !== prevConsistentYear) streak = 0;
    prevConsistentYear = yr;
    if ((d.runs ?? 0) >= 25) { streak++; if (streak >= 5) { consistentEarned = true; break; } }
    else streak = 0;
  }

  // Wicket streak: 2+ wickets in 3 consecutive bowling matches — within same season only
  let maxWicketStreak = 0;
  let curWicketStreak = 0;
  let prevWicketYear = "";
  for (const d of bowlingInnings) {
    const yr = d.date.slice(0, 4);
    if (yr !== prevWicketYear) curWicketStreak = 0;
    prevWicketYear = yr;
    if ((d.wickets ?? 0) >= 2) { curWicketStreak++; maxWicketStreak = Math.max(maxWicketStreak, curWicketStreak); }
    else curWicketStreak = 0;
  }
  const wicketStreakEarned = maxWicketStreak >= 3;

  // Boundary streak: innings with 2+ boundaries (4s + 6s) in a row, 5+ times — within same season only
  let maxBoundaryStreak = 0;
  let curBoundaryStreak = 0;
  let prevBoundaryYear = "";
  for (const d of battingInnings) {
    const yr = d.date.slice(0, 4);
    if (yr !== prevBoundaryYear) curBoundaryStreak = 0;
    prevBoundaryYear = yr;
    if ((d.fours ?? 0) + (d.sixes ?? 0) >= 2) { curBoundaryStreak++; maxBoundaryStreak = Math.max(maxBoundaryStreak, curBoundaryStreak); }
    else curBoundaryStreak = 0;
  }
  const boundaryStreakEarned = maxBoundaryStreak >= 5;

  // Run streak: 30+ runs in 5 consecutive innings — within same season only
  let maxRunStreak30 = 0;
  let curRunStreak30 = 0;
  let prevRunYear = "";
  for (const d of battingInnings) {
    const yr = d.date.slice(0, 4);
    if (yr !== prevRunYear) curRunStreak30 = 0;
    prevRunYear = yr;
    if ((d.runs ?? 0) >= 30) { curRunStreak30++; maxRunStreak30 = Math.max(maxRunStreak30, curRunStreak30); }
    else curRunStreak30 = 0;
  }
  const hotStreak30Earned = maxRunStreak30 >= 5;

  const lineAndLengthEarned = totalOvers >= 40 && careerEconomy < 3;
  const lwEarned = battingInnings.length >= 10 && careerRuns / battingInnings.length >= 40;
  const lwAvg    = battingInnings.length > 0 ? (careerRuns / battingInnings.length).toFixed(1) : "0";
  const wtEarned = bowlingSpells.length >= 10 && careerWickets >= 20;

  const years        = [...new Set(sorted.map((d) => d.date.slice(0, 4)))].sort();
  const newSeasonEarned = years.length >= 2;
  const newSeasonYear   = years.length >= 2 ? years[years.length - 1] : undefined;

  const potmMatches = sorted.filter((d) => d.playerOfTheMatch === true);
  const potmEarned  = potmMatches.length > 0;

  const allRounderEarned = sorted.some(
    (d) => (d.runs ?? 0) >= 30 && ((d.wickets ?? 0) >= 3 || (d.catches ?? 0) + (d.stumpings ?? 0) >= 3)
  );

  let matchWinnerEarned = false;
  let matchWinnerDetail = "";
  const withResults = sorted.filter((m) => m.result && m.result !== "");
  if (withResults.length >= 10) {
    for (let i = 0; i <= withResults.length - 10; i++) {
      const window = withResults.slice(i, i + 10);
      const wins = window.filter((m) => m.result?.toLowerCase() === "win").length;
      if (wins >= 8) { matchWinnerEarned = true; matchWinnerDetail = `${wins}/10 wins`; break; }
    }
  }

  const pinchHitterMatch = battingInnings.find(
    (d) => (d.runs ?? 0) >= 50 && (d.ballsFaced ?? 999) < 20 && (d.ballsFaced ?? 0) > 0
  );

  const isDismissed = (d: PerMatchStat) =>
    !!d.howOut && d.howOut !== "Not Out" && d.howOut !== "Retired";

  const goldenDuckEarned = battingInnings.some(
    (d) => (d.runs ?? 0) === 0 && (d.ballsFaced ?? 0) === 1 && isDismissed(d)
  );
  const duckCount  = battingInnings.filter((d) => (d.runs ?? 0) === 0 && isDismissed(d)).length;

  const nervousEarned = battingInnings.some(
    (d) => (d.runs ?? 0) >= 90 && (d.runs ?? 0) <= 99 && isDismissed(d)
  );
  const nervousRuns = battingInnings.find(
    (d) => (d.runs ?? 0) >= 90 && (d.runs ?? 0) <= 99 && isDismissed(d)
  )?.runs;

  const lbwOuts    = battingInnings.filter((d) => d.howOut?.toLowerCase() === "lbw").length;
  const bowledOuts = battingInnings.filter((d) => d.howOut?.toLowerCase() === "bowled").length;
  const caughtOuts = battingInnings.filter((d) => (d.howOut?.toLowerCase() ?? "").includes("caught")).length;
  const runOutOuts = battingInnings.filter((d) => d.howOut?.toLowerCase() === "run out").length;
  const teflonEarned = sorted.some((d) => (d.droppedCatches ?? 0) >= 2);

  const oneShortMatches = battingInnings.filter((d) => {
    const r = d.runs ?? 0;
    return r >= 49 && r % 50 === 49 && isDismissed(d);
  });
  const oneShortCount = oneShortMatches.length;
  const oneShortFirst = oneShortMatches[0];

  const triggeredMatches = sorted.filter((d) => d.badUmpireDecision === true);
  const triggeredCount   = triggeredMatches.length;
  const triggeredFirst   = triggeredMatches[0];

  const drsMatches = sorted.filter((d) => d.wouldHaveReferred === true);
  const drsCount   = drsMatches.length;
  const drsFirst   = drsMatches[0];

  const badges: Badge[] = [
    { id: "debut",     label: "Debut",               description: "First match logged",            icon: "🎖️", imageKey: "debut", imageScale: 1.4, earned: sorted.length >= 1 },
    { id: "smellGrass", label: "Smell of Cut Grass", description: "10 matches played",             icon: "🌿", earned: sorted.length >= 10, detail: sorted.length >= 10 ? `${sorted.length} matches` : undefined },
    { id: "newSeason",  label: "New Season",          description: "Matches in 2+ seasons",         icon: "🌱", imageKey: "newSeason", earned: newSeasonEarned, detail: newSeasonYear ? `${newSeasonYear} season` : undefined },

    { id: "first50",       label: "Half-Century",    description: "50–99 runs in an innings",       icon: "🏏", earned: !!first50,  detail: first50  ? `${first50.runs} vs ${first50.opponent}` : undefined, shareText: first50 ? `🏏 Half-Century\n${first50.runs} runs vs ${first50.opponent}\n${fmtDate(first50.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "first100",      label: "Century",         description: "100–149 runs in an innings",     icon: "💯", imageKey: "century", earned: !!first100, detail: first100 ? `${first100.runs} vs ${first100.opponent}` : undefined, shareText: first100 ? `💯 Century\n${first100.runs} runs vs ${first100.opponent}\n${fmtDate(first100.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "first150",      label: "150 Club",        description: "150–199 runs in an innings",      icon: "💎", imageKey: "150club",        earned: !!first150, detail: first150 ? `${first150.runs} runs` : undefined, shareText: first150 ? `💎 150 Club\n${first150.runs} runs vs ${first150.opponent}\n${fmtDate(first150.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "first200",      label: "Double Century",  description: "200–299 runs in an innings",       icon: "👑", imageKey: "doubleCentury", earned: !!first200, detail: first200 ? `${first200.runs} runs` : undefined, shareText: first200 ? `👑 Double Century\n${first200.runs} runs vs ${first200.opponent}\n${fmtDate(first200.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "first300",      label: "Triple Century",    description: "300–399 runs in an innings",       icon: "🌟", imageKey: "tripleCentury",    earned: !!first300, detail: first300 ? `${first300.runs} runs` : undefined, shareText: first300 ? `🌟 Triple Century\n${first300.runs} runs vs ${first300.opponent}\n${fmtDate(first300.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "first400",      label: "Quadruple Century", description: "400+ runs in an innings",          icon: "🔱", imageKey: "quadrupleCentury", earned: !!first400, detail: first400 ? `${first400.runs} runs` : undefined, shareText: first400 ? `🔱 Quadruple Century\n${first400.runs} runs vs ${first400.opponent}\n${fmtDate(first400.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "pinchHitter",   label: "Pinch Hitter",    description: "50 runs off <20 balls",         icon: "⚡", imageKey: "pinch-hitter", earned: !!pinchHitterMatch, detail: pinchHitterMatch ? `${pinchHitterMatch.runs} off ${pinchHitterMatch.ballsFaced}b` : undefined, shareText: pinchHitterMatch ? `⚡ Pinch Hitter\n${pinchHitterMatch.runs} off ${pinchHitterMatch.ballsFaced}b vs ${pinchHitterMatch.opponent}\n${fmtDate(pinchHitterMatch.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "nervousNineties", label: "Nervous 90s",   description: "Out between 90 and 99",         icon: "😰", earned: nervousEarned, detail: nervousEarned ? `${nervousRuns} runs` : undefined },

    // One Short milestones — 49, 99, 149… out on the last before a milestone
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `oneShort_${milestone}`,
      label: milestone === 1 ? "One Short" : `One Short ×${milestone}`,
      description: milestone === 1
        ? "Out one run short of a milestone (49, 99, 149…)"
        : `One short of a milestone ${milestone} times`,
      icon: "1️⃣",
      earned: oneShortCount >= milestone,
      detail: oneShortCount >= milestone
        ? milestone === 1
          ? `${oneShortFirst?.runs} runs`
          : `${oneShortCount} times`
        : undefined,
    })),

    { id: "consistent",    label: "Consistent",      description: "5 consecutive innings of 25+",  icon: "📈", earned: consistentEarned },
    { id: "hotStreak",     label: "Hot Streak",      description: "30+ runs in 5 consecutive innings", icon: "🔥", earned: hotStreak30Earned, detail: hotStreak30Earned ? `${maxRunStreak30} in a row` : undefined },
    { id: "wicketStreak",  label: "On The Hunt",     description: "2+ wickets in 3 consecutive matches", icon: "🎯", earned: wicketStreakEarned, detail: wicketStreakEarned ? `${maxWicketStreak} in a row` : undefined },
    { id: "boundaryStreak", label: "Boundary Machine", description: "Boundaries in 5 consecutive innings", icon: "🏅", earned: boundaryStreakEarned, detail: boundaryStreakEarned ? `${maxBoundaryStreak} innings` : undefined },
    { id: "raisethebat",   label: "Raise the Bat",   description: "5 fifties in a single season",  icon: "🏏", earned: raiseTheBatEarned, detail: raiseTheBatSeason ? `${raiseTheBatSeason} season` : undefined },
    { id: "doffhelmet",    label: "Doff Your Helmet", description: "3 centuries in your career",   icon: "⛑️", imageKey: "doffYourHelmet", earned: careerHundreds.length >= 3, detail: careerHundreds.length >= 3 ? `${careerHundreds.length} hundreds` : undefined },
    { id: "leatherWillow", label: "Leather on Willow", description: "Avg 40+ over 10 innings",    icon: "🪵", earned: lwEarned, detail: lwEarned ? `Avg ${lwAvg}` : undefined },
    { id: "bighitter",     label: "Big Hitter",      description: "5+ sixes in one innings",       icon: "💥", imageKey: "bigHitter", earned: bigHitterEarned },
    { id: "boundary",      label: "Boundary Getter", description: "10+ fours in one innings",      icon: "🏅", imageKey: "boundaryGetter", earned: boundaryEarned },
    { id: "redink",        label: "Red Ink",         description: "5+ career not outs",            icon: "🛡️", earned: notOuts.length >= 5, detail: notOuts.length >= 5 ? `${notOuts.length} not outs` : undefined },
    { id: "trophy",        label: "Personal Best",   description: "Beat your own batting high score", icon: "🏆", imageKey: "personalBest", earned: trophyEarned, shareText: trophyMatch ? `🏆 Personal Best\n${trophyMatch.runs} runs vs ${trophyMatch.opponent}\n${fmtDate(trophyMatch.date)}\n\nLogged on CricVault 🏏` : undefined },

    { id: "strokemaker", label: "Stroke Maker", description: "500 runs in a season",   icon: "✨", earned: strokeMakerEarned, detail: strokeMakerSeason ? `${strokeMakerSeason} season` : undefined },
    { id: "runmachine",  label: "Run Machine",  description: "750 runs in a season",   icon: "⚙️", earned: runMachineEarned, detail: runMachineSeason ? `${runMachineSeason} season` : undefined },
    { id: "pro",         label: "Pro",          description: "1,000 runs in a season", icon: "🌟", earned: proEarned, detail: proSeason ? `${proSeason} season` : undefined },
    { id: "career2000",  label: "2,000 Club",   description: "2,000 career runs",      icon: "🏆", earned: careerRuns >= 2000, detail: careerRuns >= 2000 ? `${careerRuns} runs` : undefined },
    { id: "career100wkt", label: "100 Wickets", description: "100 career wickets",     icon: "🎳", earned: careerWickets >= 100, detail: careerWickets >= 100 ? `${careerWickets} wickets` : undefined },

    { id: "fivewkt",      label: "Five-For",       description: "5 wickets in a spell",             imageKey: "fiveFor",             icon: "🔥", earned: !!first5wkt, detail: first5wkt ? `${first5wkt.wickets}/${first5wkt.runsConceded} vs ${first5wkt.opponent}` : undefined, shareText: first5wkt ? `🔥 Five-For\n${first5wkt.wickets}/${first5wkt.runsConceded} off ${Number(first5wkt.overs ?? 0).toFixed(1)} overs vs ${first5wkt.opponent}\n${fmtDate(first5wkt.date)}\n\nLogged on CricVault 🏏` : undefined },
    { id: "magician",     label: "Magician",       description: "Hat trick in a match",             icon: "🪄", imageKey: "hatTrick", earned: magicianEarned },
    { id: "wicketTaker",  label: "Wicket Taker",   description: "20 wickets over 10+ appearances", icon: "🎯", earned: wtEarned, detail: wtEarned ? `${careerWickets} wickets` : undefined },
    { id: "deadEye",      label: "Dead Eye",       description: "10 career wickets taken bowled",  icon: "🎯", earned: careerBowledWkts >= 10, detail: careerBowledWkts >= 10 ? `${careerBowledWkts} bowled` : undefined },
    { id: "hitThosePads", label: "Hit Those Pads", description: "10 career LBW wickets",           icon: "🦵", earned: careerLbwWkts >= 10, detail: careerLbwWkts >= 10 ? `${careerLbwWkts} LBWs` : undefined },
    { id: "lineLength",   label: "Line & Length",  description: "Economy <3 over 40+ career overs", icon: "📏", earned: lineAndLengthEarned, detail: lineAndLengthEarned ? `Econ ${careerEconomy.toFixed(2)}` : undefined },

    { id: "buckethands", label: "Bucket Hands", description: "3 catches in a single match", icon: "🧤", earned: bucketHandsEarned },
    { id: "safegloves",  label: "Safe Gloves",  description: "5 career stumpings as keeper", icon: "🥅", earned: careerStumpings >= 5, detail: careerStumpings >= 5 ? `${careerStumpings} stumpings` : undefined },

    { id: "potm",        label: "Player of the Match", description: "Awarded POTM",                          icon: "⭐", imageKey: "playerOfTheMatch", earned: potmEarned, detail: potmMatches.length > 1 ? `${potmMatches.length}× POTM` : undefined },
    { id: "rainStoppedPlay", label: "Rain Stopped Play", description: "Played in an abandoned match",      icon: "🌧️", imageKey: "rainStoppedPlay", earned: rainStoppedPlayEarned, detail: rainStoppedPlayMatch ? `vs ${rainStoppedPlayMatch.opponent}` : undefined },
    { id: "allRounder",  label: "All Rounder",         description: "30 runs & 3 wkts in one game",         icon: "🌟", earned: allRounderEarned },
    { id: "matchWinner", label: "Match Winner",         description: "8 wins in any 10-match window",        icon: "🥇", earned: matchWinnerEarned, detail: matchWinnerDetail || undefined },

    // Triggered milestones — bad umpire decisions (LBW / caught behind)
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `triggered_${milestone}`,
      label: milestone === 1 ? "Triggered" : `Triggered ×${milestone}`,
      description: milestone === 1
        ? "Given out on a bad umpire decision (LBW or caught behind)"
        : `Robbed by the umpire ${milestone} times`,
      icon: "😤",
      earned: triggeredCount >= milestone,
      detail: triggeredCount >= milestone && triggeredCount > milestone
        ? `${triggeredCount} times total`
        : undefined,
      isNegative: true as const,
    })),

    // DRS milestones — would have referred a not-out while bowling
    ...[1, 5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `drs_${milestone}`,
      label: milestone === 1 ? "DRS" : `DRS ×${milestone}`,
      description: milestone === 1
        ? "Would have referred a not-out decision while bowling"
        : `Would have referred ${milestone} not-out decisions`,
      icon: "📺",
      imageKey: "drs",
      earned: drsCount >= milestone,
      detail: drsCount >= milestone && drsCount > milestone
        ? `${drsCount} times total`
        : undefined,
      isNegative: true as const,
    })),

    { id: "goldenDuck",      label: "Golden Duck",      description: "Out first ball for a duck", icon: "🦆", imageKey: "goldenDuck", earned: goldenDuckEarned, isNegative: true },

    // Duck Hunting milestones — every 5 ducks
    ...[5, 10, 15, 20, 25, 30].map((milestone) => ({
      id: `duckHunting_${milestone}`,
      label: `Duck Hunting ×${milestone}`,
      description: `${milestone} ducks in your career`,
      icon: "🦆",
      earned: duckCount >= milestone,
      detail: duckCount >= milestone ? `${duckCount} ducks total` : undefined,
      isNegative: true as const,
    })),

    { id: "billyBigPads",    label: "Billy Big Pads",   description: "Out LBW 5 times",           icon: "😬", imageKey: "billyBigPads", earned: lbwOuts >= 5, detail: lbwOuts >= 5 ? `${lbwOuts}× LBW` : undefined, isNegative: true },

    // Garden Gate — bowled through the gate (bat & pad) — tiered
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
    { id: "catchingPractice", label: "Catching Practice", description: "Out caught 10 times",    icon: "🙈", earned: caughtOuts >= 10, detail: caughtOuts >= 10 ? `${caughtOuts}× caught` : undefined, isNegative: true },
    { id: "keepRunning",     label: "Keep on Running",  description: "Run out 3 times",           icon: "🏃", earned: runOutOuts >= 3, detail: runOutOuts >= 3 ? `${runOutOuts}× run out` : undefined, isNegative: true },
    { id: "butterFingers",   label: "Butter Fingers",   description: "Dropped a catch in the field", icon: "🧈", earned: careerDropped > 0, detail: careerDropped > 0 ? `${careerDropped} dropped` : undefined, isNegative: true },
    { id: "dontSnatch",      label: "Don't Snatch",     description: "Missed a stumping",         icon: "🙅", earned: careerMissedSt > 0, detail: careerMissedSt > 0 ? `${careerMissedSt} missed` : undefined, isNegative: true },
    { id: "teflon",          label: "Teflon",           description: "Dropped 2+ catches in one game", icon: "🫳", earned: teflonEarned, isNegative: true },
    { id: "tfc",             label: "Thanks For Coming", description: "<10 runs, 0 wkts & 0 catches", icon: "🚌", earned: sorted.some((d) => (d.runs ?? 10) < 10 && (d.wickets ?? 0) === 0 && (d.catches ?? 0) === 0 && d.runs !== null), isNegative: true },
  ];

  return badges;
}

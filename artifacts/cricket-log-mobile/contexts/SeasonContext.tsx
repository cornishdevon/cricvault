import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CricketRegion = "england" | "subcontinent";

interface SeasonContextValue {
  region: CricketRegion;
  setRegion: (r: CricketRegion) => void;
  seasonLabel: string;
  isMatchInSeason: (date: string | null | undefined) => boolean;
}

const STORAGE_KEY = "@cricvault:region";

const SeasonContext = createContext<SeasonContextValue>({
  region: "england",
  setRegion: () => {},
  seasonLabel: String(new Date().getFullYear()),
  isMatchInSeason: () => false,
});

function computeSeason(region: CricketRegion) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (region === "subcontinent") {
    // Season runs Oct 1 Y → Sep 30 Y+1
    const startYear = month >= 9 ? year : year - 1;
    const endYear = startYear + 1;
    const label = `${startYear}/${String(endYear).slice(2)}`;
    const startDate = `${startYear}-10-01`;
    const endDate = `${endYear}-09-30`;
    return { label, startDate, endDate, startYear: String(startYear) };
  } else {
    // Calendar year
    const label = String(year);
    return { label, startDate: `${year}-01-01`, endDate: `${year}-12-31`, startYear: String(year) };
  }
}

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegionState] = useState<CricketRegion>("england");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "england" || v === "subcontinent") setRegionState(v);
    });
  }, []);

  const setRegion = useCallback((r: CricketRegion) => {
    setRegionState(r);
    AsyncStorage.setItem(STORAGE_KEY, r);
  }, []);

  const { label, startDate, endDate } = useMemo(() => computeSeason(region), [region]);

  const isMatchInSeason = useCallback(
    (date: string | null | undefined) => {
      if (!date) return false;
      return date >= startDate && date <= endDate;
    },
    [startDate, endDate]
  );

  return (
    <SeasonContext.Provider value={{ region, setRegion, seasonLabel: label, isMatchInSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeasonContext() {
  return useContext(SeasonContext);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CricketRegion = "england" | "subcontinent";

export interface CricketCountry {
  code: string;
  name: string;
  flag: string;
  region: CricketRegion;
}

export const CRICKET_COUNTRIES: CricketCountry[] = [
  { code: "ENG", name: "England",          flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", region: "england" },
  { code: "AUS", name: "Australia",        flag: "🇦🇺", region: "subcontinent" },
  { code: "NZL", name: "New Zealand",      flag: "🇳🇿", region: "england" },
  { code: "ZIM", name: "Zimbabwe",         flag: "🇿🇼", region: "england" },
  { code: "IRE", name: "Ireland",          flag: "🇮🇪", region: "england" },
  { code: "SCO", name: "Scotland",         flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", region: "england" },
  { code: "NET", name: "Netherlands",      flag: "🇳🇱", region: "england" },
  { code: "USA", name: "USA",              flag: "🇺🇸", region: "england" },
  { code: "CAN", name: "Canada",           flag: "🇨🇦", region: "england" },
  { code: "PNG", name: "Papua New Guinea", flag: "🇵🇬", region: "england" },
  { code: "IND", name: "India",            flag: "🇮🇳", region: "subcontinent" },
  { code: "PAK", name: "Pakistan",         flag: "🇵🇰", region: "subcontinent" },
  { code: "BAN", name: "Bangladesh",       flag: "🇧🇩", region: "subcontinent" },
  { code: "SRI", name: "Sri Lanka",        flag: "🇱🇰", region: "subcontinent" },
  { code: "RSA", name: "South Africa",     flag: "🇿🇦", region: "subcontinent" },
  { code: "WI",  name: "West Indies",      flag: "🌴", region: "subcontinent" },
  { code: "AFG", name: "Afghanistan",      flag: "🇦🇫", region: "subcontinent" },
  { code: "UAE", name: "UAE",              flag: "🇦🇪", region: "subcontinent" },
  { code: "NEP", name: "Nepal",            flag: "🇳🇵", region: "subcontinent" },
  { code: "KEN", name: "Kenya",            flag: "🇰🇪", region: "subcontinent" },
];

interface SeasonContextValue {
  region: CricketRegion;
  setRegion: (r: CricketRegion) => void;
  country: CricketCountry;
  setCountry: (c: CricketCountry) => void;
  setSeasonFormat: (r: CricketRegion) => void;
  seasonLabel: string;
  isMatchInSeason: (date: string | null | undefined) => boolean;
}

const REGION_KEY    = "@cricvault:region";
const COUNTRY_KEY   = "@cricvault:country";
const FORMAT_KEY    = "@cricvault:format";

const DEFAULT_COUNTRY = CRICKET_COUNTRIES[0]; // England

const SeasonContext = createContext<SeasonContextValue>({
  region: "england",
  setRegion: () => {},
  country: DEFAULT_COUNTRY,
  setCountry: () => {},
  setSeasonFormat: () => {},
  seasonLabel: String(new Date().getFullYear()),
  isMatchInSeason: () => false,
});

function computeSeason(region: CricketRegion) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (region === "subcontinent") {
    const startYear = month >= 9 ? year : year - 1;
    const endYear = startYear + 1;
    const label = `${startYear}/${String(endYear).slice(2)}`;
    return { label, startDate: `${startYear}-10-01`, endDate: `${endYear}-09-30` };
  }
  return { label: String(year), startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<CricketCountry>(DEFAULT_COUNTRY);
  // null = use country default; set explicitly when user overrides
  const [formatOverride, setFormatOverride] = useState<CricketRegion | null>(null);

  useEffect(() => {
    AsyncStorage.multiGet([REGION_KEY, COUNTRY_KEY, FORMAT_KEY]).then(
      ([regionPair, countryPair, formatPair]) => {
        const savedCode   = countryPair[1];
        const savedFormat = formatPair[1];

        if (savedCode) {
          const found = CRICKET_COUNTRIES.find((c) => c.code === savedCode);
          if (found) setCountryState(found);
        } else {
          // Legacy: restore from old region key
          const savedRegion = regionPair[1];
          if (savedRegion === "subcontinent") {
            const fallback = CRICKET_COUNTRIES.find((c) => c.code === "IND") ?? DEFAULT_COUNTRY;
            setCountryState(fallback);
          }
        }

        if (savedFormat === "england" || savedFormat === "subcontinent") {
          setFormatOverride(savedFormat);
        }
      }
    );
  }, []);

  // Pick country and reset any format override to that country's default
  const setCountry = useCallback((c: CricketCountry) => {
    setCountryState(c);
    setFormatOverride(null);
    AsyncStorage.multiSet([[COUNTRY_KEY, c.code], [REGION_KEY, c.region], [FORMAT_KEY, ""]]);
  }, []);

  // Override just the season format without changing the country
  const setSeasonFormat = useCallback((r: CricketRegion) => {
    setFormatOverride(r);
    AsyncStorage.setItem(FORMAT_KEY, r);
  }, []);

  // Legacy shim
  const setRegion = useCallback((r: CricketRegion) => {
    setFormatOverride(r);
    AsyncStorage.setItem(FORMAT_KEY, r);
  }, []);

  const region: CricketRegion = formatOverride ?? country.region;
  const { label, startDate, endDate } = useMemo(() => computeSeason(region), [region]);

  const isMatchInSeason = useCallback(
    (date: string | null | undefined) => {
      if (!date) return false;
      return date >= startDate && date <= endDate;
    },
    [startDate, endDate]
  );

  return (
    <SeasonContext.Provider value={{ region, setRegion, country, setCountry, setSeasonFormat, seasonLabel: label, isMatchInSeason }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeasonContext() {
  return useContext(SeasonContext);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { type PaletteId } from "@/constants/colors";

type Scheme = "light" | "dark";
type Override = "light" | "dark" | "system";

interface AppearanceContextValue {
  scheme: Scheme;
  override: Override;
  setOverride: (v: Override) => void;
  palette: PaletteId;
  setPalette: (v: PaletteId) => void;
}

const SCHEME_KEY = "@cricvault:appearance";
const PALETTE_KEY = "@cricvault:palette";

const AppearanceContext = createContext<AppearanceContextValue>({
  scheme: "light",
  override: "system",
  setOverride: () => {},
  palette: "green",
  setPalette: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [override, setOverrideState] = useState<Override>("system");
  const [palette, setPaletteState] = useState<PaletteId>("green");

  useEffect(() => {
    AsyncStorage.multiGet([SCHEME_KEY, PALETTE_KEY]).then((pairs) => {
      const schemeVal = pairs[0][1];
      const paletteVal = pairs[1][1];
      if (schemeVal === "light" || schemeVal === "dark" || schemeVal === "system") {
        setOverrideState(schemeVal);
      }
      if (
        paletteVal === "green" ||
        paletteVal === "navy" ||
        paletteVal === "maroon" ||
        paletteVal === "dusk" ||
        paletteVal === "tawny"
      ) {
        setPaletteState(paletteVal as PaletteId);
      }
    });
  }, []);

  const setOverride = useCallback((v: Override) => {
    setOverrideState(v);
    AsyncStorage.setItem(SCHEME_KEY, v);
  }, []);

  const setPalette = useCallback((v: PaletteId) => {
    setPaletteState(v);
    AsyncStorage.setItem(PALETTE_KEY, v);
  }, []);

  const scheme: Scheme = override === "system" ? systemScheme : override;

  return (
    <AppearanceContext.Provider value={{ scheme, override, setOverride, palette, setPalette }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}

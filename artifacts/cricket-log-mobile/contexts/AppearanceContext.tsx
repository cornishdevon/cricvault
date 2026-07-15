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
  customHue: number;
  setCustomHue: (h: number) => void;
}

const SCHEME_KEY = "@cricvault:appearance";
const PALETTE_KEY = "@cricvault:palette";
const CUSTOM_HUE_KEY = "@cricvault:customHue";

const VALID_PALETTES: PaletteId[] = ["green", "navy", "maroon", "dusk", "tawny", "custom"];

const AppearanceContext = createContext<AppearanceContextValue>({
  scheme: "light",
  override: "system",
  setOverride: () => {},
  palette: "green",
  setPalette: () => {},
  customHue: 148,
  setCustomHue: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [override, setOverrideState] = useState<Override>("system");
  const [palette, setPaletteState] = useState<PaletteId>("green");
  const [customHue, setCustomHueState] = useState<number>(148);

  useEffect(() => {
    AsyncStorage.multiGet([SCHEME_KEY, PALETTE_KEY, CUSTOM_HUE_KEY]).then((pairs) => {
      const schemeVal = pairs[0][1];
      const paletteVal = pairs[1][1];
      const hueVal = pairs[2][1];
      if (schemeVal === "light" || schemeVal === "dark" || schemeVal === "system") {
        setOverrideState(schemeVal);
      }
      if (paletteVal && VALID_PALETTES.includes(paletteVal as PaletteId)) {
        setPaletteState(paletteVal as PaletteId);
      }
      if (hueVal !== null) {
        const h = parseInt(hueVal, 10);
        if (!isNaN(h) && h >= 0 && h < 360) setCustomHueState(h);
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

  const setCustomHue = useCallback((h: number) => {
    setCustomHueState(h);
    AsyncStorage.setItem(CUSTOM_HUE_KEY, String(h));
  }, []);

  const scheme: Scheme = override === "system" ? systemScheme : override;

  return (
    <AppearanceContext.Provider value={{ scheme, override, setOverride, palette, setPalette, customHue, setCustomHue }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

type Scheme = "light" | "dark";
type Override = "light" | "dark" | "system";

interface AppearanceContextValue {
  scheme: Scheme;
  override: Override;
  setOverride: (v: Override) => void;
}

const STORAGE_KEY = "@cricvault:appearance";

const AppearanceContext = createContext<AppearanceContextValue>({
  scheme: "light",
  override: "system",
  setOverride: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? "light";
  const [override, setOverrideState] = useState<Override>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === "light" || v === "dark" || v === "system") {
        setOverrideState(v as Override);
      }
    });
  }, []);

  const setOverride = useCallback((v: Override) => {
    setOverrideState(v);
    AsyncStorage.setItem(STORAGE_KEY, v);
  }, []);

  const scheme: Scheme = override === "system" ? systemScheme : override;

  return (
    <AppearanceContext.Provider value={{ scheme, override, setOverride }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  return useContext(AppearanceContext);
}

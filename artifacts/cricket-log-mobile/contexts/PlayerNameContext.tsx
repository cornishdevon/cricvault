import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@cricvault:player_name";

interface PlayerNameContextValue {
  playerName: string;
  loaded: boolean;
  saveName: (name: string) => Promise<void>;
}

const PlayerNameContext = createContext<PlayerNameContextValue | null>(null);

export function PlayerNameProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setPlayerName(raw); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setPlayerName(trimmed);
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  }, []);

  return (
    <PlayerNameContext.Provider value={{ playerName, loaded, saveName }}>
      {children}
    </PlayerNameContext.Provider>
  );
}

export function usePlayerNameContext() {
  const ctx = useContext(PlayerNameContext);
  if (!ctx) throw new Error("usePlayerNameContext must be inside PlayerNameProvider");
  return ctx;
}

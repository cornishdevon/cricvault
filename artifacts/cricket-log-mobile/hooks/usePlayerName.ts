import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@cricvault:player_name";

export function usePlayerName() {
  const [playerName, setPlayerName] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPlayerName(raw);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setPlayerName(trimmed);
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  }, []);

  return { playerName, loaded, saveName };
}

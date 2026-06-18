import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@cricvault:tab_labels";

export const DEFAULT_LABELS = {
  index:        "Dashboard",
  matches:      "Matches",
  achievements: "Badges",
  coaching:     "Coaching",
  media:        "Media",
  log:          "Log Match",
} as const;

export type TabKey = keyof typeof DEFAULT_LABELS;

export type TabLabels = Record<TabKey, string>;

export function useTabLabels() {
  const [labels, setLabels] = useState<TabLabels>({ ...DEFAULT_LABELS });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as Partial<TabLabels>;
          setLabels({ ...DEFAULT_LABELS, ...saved });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveLabels = useCallback(async (next: TabLabels) => {
    setLabels(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const updateLabel = useCallback(
    async (key: TabKey, value: string) => {
      const trimmed = value.trim() || DEFAULT_LABELS[key];
      const next = { ...labels, [key]: trimmed };
      await saveLabels(next);
    },
    [labels, saveLabels]
  );

  const resetLabels = useCallback(async () => {
    const next = { ...DEFAULT_LABELS };
    await saveLabels(next);
  }, [saveLabels]);

  return { labels, updateLabel, resetLabels, loaded };
}

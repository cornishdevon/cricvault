import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetPerMatchStats } from "@workspace/api-client-react";
import { computeBadges, type Badge, type PerMatchStat } from "@/utils/computeBadges";
import { BadgeEarnedOverlay } from "@/components/BadgeEarnedOverlay";

const STORAGE_KEY = "@cricvault/seen_badge_ids";

interface BadgeNotificationContextValue {
  seenIds: Set<string>;
}

const BadgeNotificationContext = createContext<BadgeNotificationContextValue>({
  seenIds: new Set(),
});

export function BadgeNotificationProvider({ children }: { children: React.ReactNode }) {
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<Badge[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const loadedRef = useRef(false);

  const { data: perMatch } = useGetPerMatchStats();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const ids: string[] = JSON.parse(raw);
          const s = new Set(ids);
          seenIdsRef.current = s;
          setSeenIds(s);
        } catch {}
      }
      loadedRef.current = true;
    });
  }, []);

  useEffect(() => {
    if (!loadedRef.current || !perMatch || perMatch.length === 0) return;

    const badges = computeBadges(perMatch as PerMatchStat[]);
    const newlyEarned = badges.filter(
      (b) => b.earned && !seenIdsRef.current.has(b.id)
    );

    if (newlyEarned.length === 0) return;

    const updatedIds = new Set([...seenIdsRef.current, ...newlyEarned.map((b) => b.id)]);
    seenIdsRef.current = updatedIds;
    setSeenIds(updatedIds);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...updatedIds])).catch(() => {});

    setQueue((q) => [...q, ...newlyEarned]);
  }, [perMatch]);

  const dismissTop = useCallback(() => {
    setQueue((q) => q.slice(1));
  }, []);

  return (
    <BadgeNotificationContext.Provider value={{ seenIds }}>
      {children}
      {queue[0] ? (
        <BadgeEarnedOverlay badge={queue[0]} onDismiss={dismissTop} />
      ) : null}
    </BadgeNotificationContext.Provider>
  );
}

export function useBadgeNotification() {
  return useContext(BadgeNotificationContext);
}

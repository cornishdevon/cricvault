import { usePlayerNameContext } from "@/contexts/PlayerNameContext";

/**
 * Thin hook that forwards to the shared PlayerNameContext so all screens
 * see the same name and updates propagate instantly without re-reading
 * AsyncStorage on every mount.
 */
export function usePlayerName() {
  return usePlayerNameContext();
}

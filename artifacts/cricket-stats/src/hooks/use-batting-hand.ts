import { useEffect, useState } from "react";

export type BattingHand = "right" | "left";

const BATTING_HAND_STORAGE_KEY = "cricvault-batting-hand";
const BATTING_HAND_CHANGE_EVENT = "cricvault-batting-hand-change";

function isBattingHand(value: unknown): value is BattingHand {
  return value === "right" || value === "left";
}

function readBattingHand(): BattingHand {
  if (typeof window === "undefined") return "right";
  try {
    const stored = localStorage.getItem(BATTING_HAND_STORAGE_KEY);
    return isBattingHand(stored) ? stored : "right";
  } catch {
    return "right";
  }
}

/**
 * The web client keeps the batting hand alongside the mobile client's local
 * profile preferences. It is intentionally not sent to the API.
 */
export function useBattingHand() {
  const [battingHand, setBattingHandState] = useState<BattingHand>(readBattingHand);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(BATTING_HAND_STORAGE_KEY, battingHand);
    } catch {
      // A blocked or unavailable localStorage should not prevent the form
      // from using the in-memory preference.
    }
  }, [battingHand]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== BATTING_HAND_STORAGE_KEY || !isBattingHand(event.newValue)) return;
      setBattingHandState(event.newValue);
    };
    const handleLocalChange = (event: Event) => {
      const next = (event as CustomEvent<unknown>).detail;
      if (isBattingHand(next)) setBattingHandState(next);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BATTING_HAND_CHANGE_EVENT, handleLocalChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BATTING_HAND_CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  const setBattingHand = (next: BattingHand) => {
    setBattingHandState(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(BATTING_HAND_STORAGE_KEY, next);
      } catch {
        // Keep the preference in state when persistent storage is unavailable.
      }
      window.dispatchEvent(new CustomEvent(BATTING_HAND_CHANGE_EVENT, { detail: next }));
    }
  };

  return { battingHand, setBattingHand };
}
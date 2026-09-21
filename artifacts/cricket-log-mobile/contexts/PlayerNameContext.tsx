import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const NAME_STORAGE_KEY = "@cricvault:player_name";
const BATTING_HAND_STORAGE_KEY = "@cricvault:batting_hand";
const PLAYING_ROLE_STORAGE_KEY = "@cricvault:playing_role";

export type BattingHand = "right" | "left";
export type PlayingRole = "rightArmBowler" | "leftArmBowler" | "wicketKeeper";

interface PlayerNameContextValue {
  playerName: string;
  battingHand: BattingHand;
  playingRole: PlayingRole;
  loaded: boolean;
  saveName: (name: string) => Promise<void>;
  saveProfile: (profile: {
    name: string;
    battingHand: BattingHand;
    playingRole: PlayingRole;
  }) => Promise<void>;
}

const PlayerNameContext = createContext<PlayerNameContextValue | null>(null);

export function PlayerNameProvider({ children }: { children: React.ReactNode }) {
  const [playerName, setPlayerName] = useState("");
  const [battingHand, setBattingHand] = useState<BattingHand>("right");
  const [playingRole, setPlayingRole] = useState<PlayingRole>("rightArmBowler");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([NAME_STORAGE_KEY, BATTING_HAND_STORAGE_KEY, PLAYING_ROLE_STORAGE_KEY])
      .then((entries) => {
        const values = Object.fromEntries(entries);
        if (values[NAME_STORAGE_KEY]) setPlayerName(values[NAME_STORAGE_KEY]);
        if (values[BATTING_HAND_STORAGE_KEY] === "left" || values[BATTING_HAND_STORAGE_KEY] === "right") {
          setBattingHand(values[BATTING_HAND_STORAGE_KEY]);
        }
        if (
          values[PLAYING_ROLE_STORAGE_KEY] === "rightArmBowler"
          || values[PLAYING_ROLE_STORAGE_KEY] === "leftArmBowler"
          || values[PLAYING_ROLE_STORAGE_KEY] === "wicketKeeper"
        ) {
          setPlayingRole(values[PLAYING_ROLE_STORAGE_KEY]);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const saveName = useCallback(async (name: string) => {
    const trimmed = name.trim();
    setPlayerName(trimmed);
    await AsyncStorage.setItem(NAME_STORAGE_KEY, trimmed);
  }, []);

  const saveProfile = useCallback(async (profile: {
    name: string;
    battingHand: BattingHand;
    playingRole: PlayingRole;
  }) => {
    const trimmed = profile.name.trim();
    setPlayerName(trimmed);
    setBattingHand(profile.battingHand);
    setPlayingRole(profile.playingRole);
    await AsyncStorage.multiSet([
      [NAME_STORAGE_KEY, trimmed],
      [BATTING_HAND_STORAGE_KEY, profile.battingHand],
      [PLAYING_ROLE_STORAGE_KEY, profile.playingRole],
    ]);
  }, []);

  return (
    <PlayerNameContext.Provider value={{ playerName, battingHand, playingRole, loaded, saveName, saveProfile }}>
      {children}
    </PlayerNameContext.Provider>
  );
}

export function usePlayerNameContext() {
  const ctx = useContext(PlayerNameContext);
  if (!ctx) throw new Error("usePlayerNameContext must be inside PlayerNameProvider");
  return ctx;
}

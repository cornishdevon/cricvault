import { useAppearance } from "@/contexts/AppearanceContext";
import { PALETTES } from "@/constants/colors";

/**
 * Returns design tokens for the active colour scheme + palette.
 * Both are controlled by AppearanceContext, persisted in AsyncStorage.
 */
export function useColors() {
  const { scheme, palette } = useAppearance();
  const paletteEntry = PALETTES[palette] ?? PALETTES.green;
  const tokens = scheme === "dark" ? paletteEntry.schemes.dark : paletteEntry.schemes.light;
  return { ...tokens, radius: 10 };
}

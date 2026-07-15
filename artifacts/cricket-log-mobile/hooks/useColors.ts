import { useAppearance } from "@/contexts/AppearanceContext";
import { PALETTES, generatePaletteFromHue } from "@/constants/colors";
import type { PresetPaletteId } from "@/constants/colors";

/**
 * Returns design tokens for the active colour scheme + palette.
 * Both are controlled by AppearanceContext, persisted in AsyncStorage.
 */
export function useColors() {
  const { scheme, palette, customHue } = useAppearance();
  const paletteEntry =
    palette === "custom"
      ? generatePaletteFromHue(customHue)
      : (PALETTES[palette as PresetPaletteId] ?? PALETTES.green);
  const tokens = scheme === "dark" ? paletteEntry.schemes.dark : paletteEntry.schemes.light;
  return { ...tokens, radius: 10 };
}

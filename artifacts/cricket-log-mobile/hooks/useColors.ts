import { useAppearance } from "@/contexts/AppearanceContext";
import colors from "@/constants/colors";

/**
 * Returns design tokens for the active colour scheme.
 * The scheme is controlled by AppearanceContext, which persists a user
 * override in AsyncStorage and falls back to the OS setting.
 */
export function useColors() {
  const { scheme } = useAppearance();
  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;
  return { ...palette, radius: colors.radius };
}

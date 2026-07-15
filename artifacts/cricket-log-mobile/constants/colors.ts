export type PaletteId = "green" | "navy" | "maroon" | "dusk" | "tawny" | "custom";
export type PresetPaletteId = "green" | "navy" | "maroon" | "dusk" | "tawny";

export interface ColorTokens {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  success: string;
  warning: string;
  info: string;
  pavilion: string;
  pavilionForeground: string;
  pavilionMuted: string;
}

type SchemeTokens = { light: ColorTokens; dark: ColorTokens };

// ── Colour utilities ──────────────────────────────────────────────────────────

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
  }
  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function generatePaletteFromHue(h: number): { label: string; swatch: string; schemes: SchemeTokens } {
  const swatch = hslToHex(h, 55, 30);
  return {
    label: "Custom",
    swatch,
    schemes: {
      light: {
        text: "#1A1A2E",
        tint: hslToHex(h, 55, 28),
        background: hslToHex(h, 14, 97),
        foreground: "#1A1A2E",
        card: hslToHex(h, 8, 99),
        cardForeground: "#1A1A2E",
        primary: hslToHex(h, 55, 28),
        primaryForeground: "#FFFFFF",
        secondary: hslToHex(h, 20, 90),
        secondaryForeground: "#1A1A2E",
        muted: hslToHex(h, 20, 90),
        mutedForeground: hslToHex(h, 10, 46),
        accent: "#C0392B",
        accentForeground: "#FFFFFF",
        destructive: "#C0392B",
        destructiveForeground: "#FFFFFF",
        border: hslToHex(h, 14, 85),
        input: hslToHex(h, 14, 85),
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#1E40AF",
        pavilion: hslToHex(h, 42, 14),
        pavilionForeground: "#FFFDF8",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: hslToHex(h, 14, 90),
        tint: hslToHex(h, 38, 52),
        background: hslToHex(h, 22, 8),
        foreground: hslToHex(h, 14, 90),
        card: hslToHex(h, 20, 11),
        cardForeground: hslToHex(h, 14, 90),
        primary: hslToHex(h, 38, 52),
        primaryForeground: hslToHex(h, 22, 8),
        secondary: hslToHex(h, 18, 18),
        secondaryForeground: hslToHex(h, 14, 90),
        muted: hslToHex(h, 18, 18),
        mutedForeground: hslToHex(h, 8, 56),
        accent: "#C0392B",
        accentForeground: "#FFFFFF",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: hslToHex(h, 15, 22),
        input: hslToHex(h, 15, 22),
        success: "#3D8B52",
        warning: "#D97706",
        info: "#3B82F6",
        pavilion: hslToHex(h, 25, 6),
        pavilionForeground: hslToHex(h, 8, 95),
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  };
}

export const PALETTES: Record<PresetPaletteId, { label: string; swatch: string; schemes: SchemeTokens }> = {
  green: {
    label: "Cricket Green",
    swatch: "#1B5E2B",
    schemes: {
      light: {
        text: "#1A1A2E",
        tint: "#1B5E2B",
        background: "#F5F0E8",
        foreground: "#1A1A2E",
        card: "#FFFDF8",
        cardForeground: "#1A1A2E",
        primary: "#1B5E2B",
        primaryForeground: "#FFFFFF",
        secondary: "#EDE8DC",
        secondaryForeground: "#1A1A2E",
        muted: "#EDE8DC",
        mutedForeground: "#7A6E5F",
        accent: "#C0392B",
        accentForeground: "#FFFFFF",
        destructive: "#C0392B",
        destructiveForeground: "#FFFFFF",
        border: "#D4CCBA",
        input: "#D4CCBA",
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#1E40AF",
        pavilion: "#1A3520",
        pavilionForeground: "#FFFDF8",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: "#E8E0CC",
        tint: "#3D8B52",
        background: "#0D1A10",
        foreground: "#E8E0CC",
        card: "#142019",
        cardForeground: "#E8E0CC",
        primary: "#3D8B52",
        primaryForeground: "#0D1A10",
        secondary: "#1E2E20",
        secondaryForeground: "#E8E0CC",
        muted: "#1E2E20",
        mutedForeground: "#9A9080",
        accent: "#C0392B",
        accentForeground: "#FFFFFF",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: "#2A3D2C",
        input: "#2A3D2C",
        success: "#3D8B52",
        warning: "#D97706",
        info: "#3B82F6",
        pavilion: "#0D1F14",
        pavilionForeground: "#FFFDF8",
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  },

  navy: {
    label: "Navy Blue",
    swatch: "#0D2B6E",
    schemes: {
      light: {
        text: "#0A1428",
        tint: "#0D2B6E",
        background: "#EEF1F8",
        foreground: "#0A1428",
        card: "#F8FAFF",
        cardForeground: "#0A1428",
        primary: "#0D2B6E",
        primaryForeground: "#FFFFFF",
        secondary: "#D8DEEE",
        secondaryForeground: "#0A1428",
        muted: "#D8DEEE",
        mutedForeground: "#5A6480",
        accent: "#CF142B",
        accentForeground: "#FFFFFF",
        destructive: "#CF142B",
        destructiveForeground: "#FFFFFF",
        border: "#C0C8DC",
        input: "#C0C8DC",
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#0D2B6E",
        pavilion: "#071847",
        pavilionForeground: "#F0F4FF",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: "#D0D8F0",
        tint: "#4D72C8",
        background: "#090F1E",
        foreground: "#D0D8F0",
        card: "#101828",
        cardForeground: "#D0D8F0",
        primary: "#4D72C8",
        primaryForeground: "#090F1E",
        secondary: "#151F38",
        secondaryForeground: "#D0D8F0",
        muted: "#151F38",
        mutedForeground: "#7A86A8",
        accent: "#CF142B",
        accentForeground: "#FFFFFF",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: "#202D50",
        input: "#202D50",
        success: "#3D8B52",
        warning: "#D97706",
        info: "#4D72C8",
        pavilion: "#060C18",
        pavilionForeground: "#D0D8F0",
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  },

  maroon: {
    label: "Maroon",
    swatch: "#7B1C3C",
    schemes: {
      light: {
        text: "#2A0A14",
        tint: "#7B1C3C",
        background: "#F5EDE8",
        foreground: "#2A0A14",
        card: "#FFF8F5",
        cardForeground: "#2A0A14",
        primary: "#7B1C3C",
        primaryForeground: "#FFFFFF",
        secondary: "#EDD8D0",
        secondaryForeground: "#2A0A14",
        muted: "#EDD8D0",
        mutedForeground: "#7A5A52",
        accent: "#C8A84B",
        accentForeground: "#2A0A14",
        destructive: "#B91C1C",
        destructiveForeground: "#FFFFFF",
        border: "#DEC4B8",
        input: "#DEC4B8",
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#1E40AF",
        pavilion: "#4A0E22",
        pavilionForeground: "#FFF4EE",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: "#F0D8D0",
        tint: "#C05878",
        background: "#1A080E",
        foreground: "#F0D8D0",
        card: "#281018",
        cardForeground: "#F0D8D0",
        primary: "#C05878",
        primaryForeground: "#1A080E",
        secondary: "#301018",
        secondaryForeground: "#F0D8D0",
        muted: "#301018",
        mutedForeground: "#A07878",
        accent: "#C8A84B",
        accentForeground: "#1A080E",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: "#401828",
        input: "#401828",
        success: "#3D8B52",
        warning: "#D97706",
        info: "#3B82F6",
        pavilion: "#120609",
        pavilionForeground: "#F0D8D0",
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  },

  dusk: {
    label: "Dusk",
    swatch: "#4C3D8F",
    schemes: {
      light: {
        text: "#1A1530",
        tint: "#4C3D8F",
        background: "#F0EEF8",
        foreground: "#1A1530",
        card: "#FAF9FF",
        cardForeground: "#1A1530",
        primary: "#4C3D8F",
        primaryForeground: "#FFFFFF",
        secondary: "#DDD8F0",
        secondaryForeground: "#1A1530",
        muted: "#DDD8F0",
        mutedForeground: "#6A6080",
        accent: "#E67E22",
        accentForeground: "#FFFFFF",
        destructive: "#C0392B",
        destructiveForeground: "#FFFFFF",
        border: "#C8C2DC",
        input: "#C8C2DC",
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#4C3D8F",
        pavilion: "#2C2057",
        pavilionForeground: "#F0EEFF",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: "#D8D0F0",
        tint: "#8070C8",
        background: "#0E0C1C",
        foreground: "#D8D0F0",
        card: "#181428",
        cardForeground: "#D8D0F0",
        primary: "#8070C8",
        primaryForeground: "#0E0C1C",
        secondary: "#201A38",
        secondaryForeground: "#D8D0F0",
        muted: "#201A38",
        mutedForeground: "#8878A8",
        accent: "#E67E22",
        accentForeground: "#FFFFFF",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: "#2C2450",
        input: "#2C2450",
        success: "#3D8B52",
        warning: "#D97706",
        info: "#8070C8",
        pavilion: "#090714",
        pavilionForeground: "#D8D0F0",
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  },

  tawny: {
    label: "Tawny",
    swatch: "#7A4F1D",
    schemes: {
      light: {
        text: "#2A1A08",
        tint: "#7A4F1D",
        background: "#F5EDE0",
        foreground: "#2A1A08",
        card: "#FFFCF5",
        cardForeground: "#2A1A08",
        primary: "#7A4F1D",
        primaryForeground: "#FFFFFF",
        secondary: "#EAD8BC",
        secondaryForeground: "#2A1A08",
        muted: "#EAD8BC",
        mutedForeground: "#7A6040",
        accent: "#1B5E2B",
        accentForeground: "#FFFFFF",
        destructive: "#C0392B",
        destructiveForeground: "#FFFFFF",
        border: "#D9C8A8",
        input: "#D9C8A8",
        success: "#1B5E2B",
        warning: "#B45309",
        info: "#1E40AF",
        pavilion: "#4A2E0D",
        pavilionForeground: "#FFF8EC",
        pavilionMuted: "rgba(255,255,255,0.55)",
      },
      dark: {
        text: "#EED8B8",
        tint: "#B8803A",
        background: "#180E04",
        foreground: "#EED8B8",
        card: "#22140A",
        cardForeground: "#EED8B8",
        primary: "#B8803A",
        primaryForeground: "#180E04",
        secondary: "#2C1C0C",
        secondaryForeground: "#EED8B8",
        muted: "#2C1C0C",
        mutedForeground: "#9A7850",
        accent: "#3D8B52",
        accentForeground: "#FFFFFF",
        destructive: "#E55A4A",
        destructiveForeground: "#FFFFFF",
        border: "#3C2A10",
        input: "#3C2A10",
        success: "#3D8B52",
        warning: "#D97706",
        info: "#3B82F6",
        pavilion: "#100900",
        pavilionForeground: "#EED8B8",
        pavilionMuted: "rgba(255,255,255,0.50)",
      },
    },
  },
};

const colors = {
  light: PALETTES.green.schemes.light,
  dark: PALETTES.green.schemes.dark,
  radius: 10,
};

export default colors;

/**
 * Génère une palette de 10 nuances (50 → 900) à partir d'une seule couleur
 * d'accent choisie par l'organisation, dans le même esprit que la palette
 * "brand" par défaut de Tailwind. Permet à chaque organisation de personnaliser
 * ses couleurs sans devoir maintenir 10 valeurs manuellement.
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return [47, 143, 114]; // repli : brand-500 par défaut
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function mix(rgb: [number, number, number], target: [number, number, number], ratio: number): [number, number, number] {
  return [
    Math.round(rgb[0] + (target[0] - rgb[0]) * ratio),
    Math.round(rgb[1] + (target[1] - rgb[1]) * ratio),
    Math.round(rgb[2] + (target[2] - rgb[2]) * ratio),
  ];
}

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

// Ratios calibrés pour se rapprocher visuellement de l'échelle Tailwind par défaut.
const SHADE_RATIOS: Record<number, { target: [number, number, number]; ratio: number }> = {
  50: { target: WHITE, ratio: 0.94 },
  100: { target: WHITE, ratio: 0.84 },
  200: { target: WHITE, ratio: 0.64 },
  300: { target: WHITE, ratio: 0.44 },
  400: { target: WHITE, ratio: 0.22 },
  500: { target: WHITE, ratio: 0 },
  600: { target: BLACK, ratio: 0.15 },
  700: { target: BLACK, ratio: 0.32 },
  800: { target: BLACK, ratio: 0.5 },
  900: { target: BLACK, ratio: 0.68 },
};

/** Retourne les 10 nuances "r g b" (triplet, sans virgules) prêtes à être posées dans des variables CSS. */
export function generateShadeTriplets(baseHex: string): Record<number, string> {
  const base = hexToRgb(baseHex);
  const shades: Record<number, string> = {};
  for (const [shade, { target, ratio }] of Object.entries(SHADE_RATIOS)) {
    const [r, g, b] = mix(base, target, ratio);
    shades[Number(shade)] = `${r} ${g} ${b}`;
  }
  return shades;
}

export function hexToTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/** Le palette "brand" par défaut de l'app (identique à tailwind.config.ts), utilisée en repli. */
export const DEFAULT_BRAND_HEX = "#2f8f72";

export const FONT_SIZE_PX: Record<"sm" | "base" | "lg", number> = {
  sm: 14,
  base: 16,
  lg: 18,
};

export const DEFAULT_ORG_THEME = {
  bg_color: "#f9fafb",
  accent_color: DEFAULT_BRAND_HEX,
  font_family: "sans",
  font_size: "base" as const,
};

export const FONT_FAMILY_STACKS: Record<string, string> = {
  sans: 'ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
  serif: 'ui-serif, Georgia, "Times New Roman", serif',
  mono: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
  rounded: '"Poppins", ui-rounded, ui-sans-serif, system-ui, sans-serif',
};

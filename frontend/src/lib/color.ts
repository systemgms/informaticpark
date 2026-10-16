const HEX_PATTERN = /^#?([0-9A-Fa-f]{6})$/;

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
  const match = HEX_PATTERN.exec(hex);
  if (!match) return null;
  const value = match[1];
  const red = toLinear(parseInt(value.slice(0, 2), 16));
  const green = toLinear(parseInt(value.slice(2, 4), 16));
  const blue = toLinear(parseInt(value.slice(4, 6), 16));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two 6-digit hex colors, or null if either is invalid. */
export function contrastRatio(foreground: string, background: string): number | null {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return null;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

const DARK_TEXT = '#171717';
const LIGHT_TEXT = '#ffffff';

/**
 * Picks the text tone with the higher contrast over a background color.
 * Returns null when the hex is invalid so callers can keep their default.
 */
export function pickReadableText(backgroundHex: string): 'light' | 'dark' | null {
  const withLight = contrastRatio(LIGHT_TEXT, backgroundHex);
  const withDark = contrastRatio(DARK_TEXT, backgroundHex);
  if (withLight === null || withDark === null) return null;
  return withLight >= withDark ? 'light' : 'dark';
}

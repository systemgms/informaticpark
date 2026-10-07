const LOWERCASE_PARTICLES = new Set(['de', 'del', 'la', 'las', 'los', 'y']);

/** Uppercase, strip accents, collapse whitespace. Used for dedupe keys. */
export function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleCase(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) =>
      index > 0 && LOWERCASE_PARTICLES.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

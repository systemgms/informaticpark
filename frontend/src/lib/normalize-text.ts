/** Lowercases, strips accents and collapses whitespace, for tolerant name comparison. */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

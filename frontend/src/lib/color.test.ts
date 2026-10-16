import { contrastRatio, pickReadableText } from './color';

describe('contrastRatio', () => {
  it('is 21 between black and white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is 1 for the same color', () => {
    expect(contrastRatio('#6069d2', '#6069d2')).toBeCloseTo(1, 5);
  });
});

describe('pickReadableText', () => {
  it('picks white on the default indigo primary', () => {
    expect(pickReadableText('#6069D2')).toBe('light');
  });

  it('picks dark text on a pale yellow primary', () => {
    expect(pickReadableText('#fde68a')).toBe('dark');
  });

  it('picks dark text on white and light text on black', () => {
    expect(pickReadableText('#ffffff')).toBe('dark');
    expect(pickReadableText('#000000')).toBe('light');
  });

  it('returns null for an invalid hex so callers keep their default', () => {
    expect(pickReadableText('not-a-color')).toBeNull();
  });
});

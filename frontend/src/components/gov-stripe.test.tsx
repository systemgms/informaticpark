// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { GovStripe } from './gov-stripe';

describe('GovStripe', () => {
  it('is decorative and hidden from assistive technology', () => {
    const { container } = render(<GovStripe />);
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-hidden')).toBe('true');
  });

  it('renders three segments in flag proportions 2:1:1 and colors', () => {
    const { container } = render(<GovStripe />);
    const segments = Array.from((container.firstElementChild as HTMLElement).children) as HTMLElement[];
    expect(segments).toHaveLength(3);
    expect(segments.map((segment) => segment.style.flexGrow)).toEqual(['2', '1', '1']);
    expect(segments.map((segment) => segment.style.backgroundColor)).toEqual([
      'rgb(255, 206, 0)',
      'rgb(0, 85, 184)',
      'rgb(227, 31, 26)',
    ]);
  });
});

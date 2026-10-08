// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { EMPTY_FIELD } from '@/lib/display';
import { TechnicalValue } from './technical-value';

describe('TechnicalValue', () => {
  it('renders a value in monospace with the given className', () => {
    render(<TechnicalValue value="EQ-001" className="text-xs" />);

    const el = screen.getByText('EQ-001');
    expect(el.className).toContain('font-mono');
    expect(el.className).toContain('text-xs');
  });

  it.each([null, undefined, ''])('renders the placeholder in sans, muted, for %j', (value) => {
    render(<TechnicalValue value={value} className="text-xs" />);

    const el = screen.getByText(EMPTY_FIELD);
    expect(el.className).not.toContain('font-mono');
    expect(el.className).toContain('text-muted-foreground');
  });

  it('renders 0 as a real value in monospace', () => {
    render(<TechnicalValue value={0} />);

    expect(screen.getByText('0').className).toContain('font-mono');
  });
});

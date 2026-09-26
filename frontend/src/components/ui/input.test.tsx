// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Input } from './input';

describe('Input', () => {
  it('uses a touch-target-sized height (at least 44px)', () => {
    render(<Input placeholder="Buscar..." />);
    const input = screen.getByPlaceholderText('Buscar...');
    expect(input.className).toContain('h-11');
  });
});

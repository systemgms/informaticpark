// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Card, CardTitle } from './card';

describe('Card', () => {
  it('uses the stacked card shadow and a 12px radius', () => {
    render(<Card data-testid="card">contenido</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('shadow-card');
    expect(card.className).toContain('rounded-xl');
    expect(card.className).not.toContain('shadow-sm');
  });
});

describe('CardTitle', () => {
  it('is semibold with tight tracking', () => {
    render(<CardTitle>Titulo</CardTitle>);
    const title = screen.getByText('Titulo');
    expect(title.className).toContain('font-semibold');
    expect(title.className).toContain('tracking-tight');
    expect(title.className).not.toContain('font-bold');
  });
});

// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('uses a touch-target-sized height for the default size (at least 44px)', () => {
    render(<Button>Guardar</Button>);
    const button = screen.getByRole('button', { name: 'Guardar' });
    expect(button.className).toContain('h-11');
  });

  it('uses a touch-target-sized height for the sm size (at least 44px)', () => {
    render(<Button size="sm">Cancelar</Button>);
    const button = screen.getByRole('button', { name: 'Cancelar' });
    expect(button.className).toContain('h-11');
  });

  it('uses a touch-target-sized square for the icon size (at least 44px)', () => {
    render(<Button size="icon" aria-label="Editar" />);
    const button = screen.getByRole('button', { name: 'Editar' });
    expect(button.className).toContain('size-11');
  });
});

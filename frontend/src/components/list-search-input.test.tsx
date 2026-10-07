// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { ListSearchInput } from './list-search-input';

describe('ListSearchInput', () => {
  it('uses the placeholder as its accessible name by default', () => {
    render(<ListSearchInput value="" onChange={() => {}} placeholder="Buscar por nombre" />);
    expect(screen.getByRole('textbox', { name: 'Buscar por nombre' })).toBeDefined();
  });

  it('prefers an explicit aria-label', () => {
    render(<ListSearchInput value="" onChange={() => {}} placeholder="Nombre..." ariaLabel="Buscar activos" />);
    expect(screen.getByRole('textbox', { name: 'Buscar activos' })).toBeDefined();
  });

  it('falls back to "Buscar" when neither is meaningful', () => {
    render(<ListSearchInput value="" onChange={() => {}} placeholder="" />);
    expect(screen.getByRole('textbox', { name: 'Buscar' })).toBeDefined();
  });
});

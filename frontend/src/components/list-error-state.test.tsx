// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { ListErrorState } from './list-error-state';

describe('ListErrorState', () => {
  it('renders as an alert containing the message', () => {
    render(<ListErrorState message="Fallo de red" />);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain('Fallo de red');
  });
});

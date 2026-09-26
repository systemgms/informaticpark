// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows the current page and total pages', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('Página 2 de 5')).toBeDefined();
  });

  it('disables the previous button on the first page', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole('button', { name: /página anterior/i }) as HTMLButtonElement;
    const nextButton = screen.getByRole('button', { name: /página siguiente/i }) as HTMLButtonElement;
    expect(prevButton.disabled).toBe(true);
    expect(nextButton.disabled).toBe(false);
  });

  it('disables the next button on the last page', () => {
    render(<Pagination page={3} totalPages={3} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole('button', { name: /página anterior/i }) as HTMLButtonElement;
    const nextButton = screen.getByRole('button', { name: /página siguiente/i }) as HTMLButtonElement;
    expect(nextButton.disabled).toBe(true);
    expect(prevButton.disabled).toBe(false);
  });

  it('calls onPageChange with the next and previous page numbers', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={3} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /página siguiente/i }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: /página anterior/i }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('uses touch-target-sized buttons (at least 44px)', () => {
    render(<Pagination page={2} totalPages={3} onPageChange={vi.fn()} />);
    const prevButton = screen.getByRole('button', { name: /página anterior/i });
    expect(prevButton.className).toContain('h-11');
    expect(prevButton.className).toContain('w-11');
  });
});

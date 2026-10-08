import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { MainContainer } from './main-container';

let currentPathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => currentPathname }));

describe('MainContainer', () => {
  it('lets public pages run edge to edge so the government header is full-bleed', () => {
    for (const path of ['/', '/login', '/public/assets']) {
      currentPathname = path;
      const { unmount } = render(<MainContainer>content</MainContainer>);
      const main = screen.getByRole('main');
      expect(main.className).not.toContain('container');
      expect(main.className).not.toContain('px-4');
      unmount();
    }
  });

  it('keeps the padded container on private pages', () => {
    currentPathname = '/admin/assets';
    render(<MainContainer>content</MainContainer>);
    const main = screen.getByRole('main');
    expect(main.className).toContain('container');
    expect(main.className).toContain('px-4');
    expect(main.className).toContain('py-8');
  });
});

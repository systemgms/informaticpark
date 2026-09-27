// @vitest-environment jsdom
import { render } from '@testing-library/react';

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

describe('PublicHomePage', () => {
  it('redirects to the landing page at /', async () => {
    const { default: PublicHomePage } = await import('./page');
    render(<PublicHomePage />);
    expect(redirectMock).toHaveBeenCalledWith('/');
  });
});

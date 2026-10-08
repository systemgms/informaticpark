// @vitest-environment jsdom
import React from 'react';
import config from '../../tailwind.config';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'inter-var' }),
  JetBrains_Mono: (options: { variable: string; weight: string }) => ({
    variable: `mono-var-${options.variable}-${options.weight}`,
  }),
}));

import RootLayout from './layout';

function findBody(node: React.ReactElement): React.ReactElement | null {
  if (node.type === 'body') return node;
  const children = React.Children.toArray((node.props as { children?: React.ReactNode }).children);
  for (const child of children) {
    if (React.isValidElement(child)) {
      const found = findBody(child as React.ReactElement);
      if (found) return found;
    }
  }
  return null;
}

describe('RootLayout fonts', () => {
  it('wires the sans and mono font variables into the body className', () => {
    const tree = RootLayout({ children: null }) as React.ReactElement;
    const body = findBody(tree);
    const className = (body?.props as { className: string }).className;
    expect(className).toContain('inter-var');
    expect(className).toContain('mono-var---font-mono-400');
  });
});

describe('tailwind theme tokens', () => {
  const extend = config.theme.extend as {
    fontFamily: Record<string, string[]>;
    boxShadow: Record<string, string>;
  };

  it('exposes the mono font family backed by --font-mono', () => {
    expect(extend.fontFamily.mono[0]).toBe('var(--font-mono)');
  });

  it('defines the stacked elevation shadows', () => {
    expect(Object.keys(extend.boxShadow).sort()).toEqual(['card', 'float', 'hairline', 'modal']);
    expect(extend.boxShadow.hairline).toBe('0 0 0 1px rgba(0,0,0,0.08)');
  });
});

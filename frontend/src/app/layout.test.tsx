// @vitest-environment jsdom
import React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../../tailwind.config';

vi.mock('next/font/google', () => ({
  Inter: vi.fn(() => ({ variable: 'inter-var' })),
  Open_Sans: vi.fn((options: { variable: string }) => ({ variable: `gov-var-${options.variable}` })),
  JetBrains_Mono: vi.fn((options: { variable: string; weight: string }) => ({
    variable: `mono-var-${options.variable}-${options.weight}`,
  })),
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

  it('wires the Open Sans government font variable into the body className', () => {
    const tree = RootLayout({ children: null }) as React.ReactElement;
    const body = findBody(tree);
    const className = (body?.props as { className: string }).className;
    expect(className).toContain('gov-var---font-gov');
  });
});

describe('gov-theme scoping', () => {
  const css = readFileSync(join(__dirname, 'globals.css'), 'utf8');

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = css.replace(/@tailwind[^;]*;/g, '').replace(/@layer base/g, '@media all');
    document.head.appendChild(style);
    return style;
  }

  it('overrides the inherited root --primary only for .gov-theme descendants', () => {
    const style = injectStyles();
    document.documentElement.style.setProperty('--primary', '1 2% 3%');
    const theme = document.createElement('div');
    theme.className = 'gov-theme';
    const inner = document.createElement('span');
    theme.appendChild(inner);
    const outside = document.createElement('div');
    document.body.append(theme, outside);

    try {
      expect(getComputedStyle(outside).getPropertyValue('--primary').trim()).toBe('1 2% 3%');
      expect(getComputedStyle(theme).getPropertyValue('--primary').trim()).toBe('238 44% 27%');
      expect(getComputedStyle(inner).getPropertyValue('--primary').trim()).toBe('238 44% 27%');
    } finally {
      document.documentElement.style.removeProperty('--primary');
      style.remove();
      theme.remove();
      outside.remove();
    }
  });

  it('applies the Open Sans variable as the font family inside .gov-theme', () => {
    expect(css).toMatch(/\.gov-theme\s*{[^}]*font-family:\s*var\(--font-gov\)/);
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

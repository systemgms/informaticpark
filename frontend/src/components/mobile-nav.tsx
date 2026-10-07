'use client';

import Link from 'next/link';
import { Menu, X, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface MobileNavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface MobileNavProps {
  links: MobileNavLink[];
  pathname: string;
}

function getActiveHref(links: MobileNavLink[], pathname: string): string | null {
  const matches = links.filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`));
  if (matches.length === 0) return null;
  return matches.reduce((best, link) => (link.href.length > best.href.length ? link : best)).href;
}

export function MobileNav({ links, pathname }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const activeHref = getActiveHref(links, pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <Button
        ref={toggleRef}
        variant="ghost"
        size="icon"
        type="button"
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((prev) => !prev)}
        className="shrink-0 text-muted-foreground"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {isOpen && (
        <nav
          id={panelId}
          ref={panelRef}
          aria-label="Menú principal"
          className="absolute inset-x-0 top-full border-b bg-card shadow-md"
        >
          <ul className="container mx-auto flex flex-col px-4 py-2">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = href === activeHref;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground active:bg-muted',
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

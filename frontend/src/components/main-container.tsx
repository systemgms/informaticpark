'use client';

import { usePathname } from 'next/navigation';
import { isPublicPath } from '@/lib/public-path';
import { cn } from '@/lib/utils';

/**
 * Root <main> landmark. Private pages get the padded container; public pages
 * manage their own spacing so the government header can run edge to edge.
 */
export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <main className={cn(!isPublicPath(pathname) && 'container mx-auto py-8 px-4')}>{children}</main>;
}

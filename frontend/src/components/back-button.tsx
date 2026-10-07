'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href: string;
  'aria-label'?: string;
  className?: string;
  variant?: ButtonProps['variant'];
}

export function BackButton({
  href,
  'aria-label': ariaLabel = 'Volver',
  className,
  variant = 'outline',
}: BackButtonProps) {
  return (
    <Button asChild variant={variant} size="icon" className={cn('shrink-0', className)}>
      <Link href={href} aria-label={ariaLabel}>
        <ArrowLeft className="h-4 w-4" />
      </Link>
    </Button>
  );
}

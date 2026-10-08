import { EMPTY_FIELD } from '@/lib/display';
import { cn } from '@/lib/utils';

interface TechnicalValueProps {
  value?: string | number | null;
  className?: string;
}

/** Renders a technical identifier in mono, or the placeholder in muted sans when missing. */
export function TechnicalValue({ value, className }: TechnicalValueProps) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">{EMPTY_FIELD}</span>;
  }
  return <span className={cn('font-mono', className)}>{value}</span>;
}

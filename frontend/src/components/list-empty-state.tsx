import Link from 'next/link';
import { Plus, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ListEmptyStateAction {
  label: string;
  href: string;
}

interface ListEmptyStateProps {
  icon: LucideIcon;
  message: string;
  action?: ListEmptyStateAction;
}

export function ListEmptyState({ icon: Icon, message, action }: ListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
      <Icon className="h-8 w-8" />
      <p className="text-sm font-medium">{message}</p>
      {action && (
        <Button asChild size="sm" variant="outline" className="mt-1 h-11 cursor-pointer">
          <Link href={action.href}>
            <Plus className="mr-1 h-3 w-3" /> {action.label}
          </Link>
        </Button>
      )}
    </div>
  );
}

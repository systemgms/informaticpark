import { AlertCircle } from 'lucide-react';

interface ListErrorStateProps {
  message: string;
}

export function ListErrorState({ message }: ListErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-12 text-destructive">
      <AlertCircle className="h-8 w-8" />
      <p className="text-sm font-medium">Error al cargar datos</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

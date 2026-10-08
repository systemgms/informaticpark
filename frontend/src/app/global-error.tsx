'use client';

// global-error replaces the root layout when active, so it does not inherit
// globals.css, the providers or the <html>/<body> from app/layout.tsx.
import './globals.css';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="es">
      <body className="bg-background font-sans text-foreground antialiased">
        <title>Error | Parque Informático</title>
        <main className="flex min-h-screen items-center justify-center p-4">
          <div role="alert" className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-xl">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="tracking-tight mb-2 text-2xl font-semibold">Ocurrió un error inesperado</h1>
            <p className="mb-6 text-muted-foreground">
              No pudimos cargar la aplicación. Intenta de nuevo en unos segundos.
            </p>
            <Button type="button" onClick={reset} className="mb-6">
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
            <p className="text-xs text-muted-foreground">
              Si el problema persiste, contacta al administrador
              {error.digest ? (
                <>
                  {' '}
                  e indica el código <span className="font-mono">{error.digest}</span>.
                </>
              ) : (
                '.'
              )}
            </p>
          </div>
        </main>
      </body>
    </html>
  );
}

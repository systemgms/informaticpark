"use client";

import Error from "next/error";

/**
 * Página de error personalizada para la aplicación Infopark.
 * Se muestra cuando ocurre un error no capturado en el cliente.
 * 
 * Este componente actúa como un error boundary a nivel de aplicación,
 * mostrando una interfaz amigable en lugar de la pantalla blanca o error predeterminado.
 */
export default function CustomError({
  error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased flex items-center justify-center">
      <div className="bg-card rounded-lg p-8 shadow-xl max-w-md w-full text-center">
        <div className="text-4xl font-bold text-destructive mb-4">
          <span role="presentation">⚠️</span>
          Error
        </div>
        
        <p className="text-muted-foreground mb-6">
          Ocurrió un error inesperado. Estamos trabajando en solucionarlo.
        </p>

        <div className="mb-6">
          <button
            onClick={reset}
            className="btn btn-ghost text-sm hover:text-foreground transition-colors"
          >
            <span role="presentation">↻</span>
            Reintentar
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Si el problema persiste, <a href="https://example.com/soporte" target="_blank" rel="noopener noreferrer">contacta soporte</a>.</p>
          <p>Código de error: Ver consola del desarrollador.</p>
        </div>
      </div>
    </div>
  )
}
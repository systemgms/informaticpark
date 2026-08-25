"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <AlertCircle className="w-12 h-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || "Ocurrió un error inesperado. Por favor, intenta de nuevo."}
      </p>
      <Button onClick={reset} variant="outline">
        Intentar de nuevo
      </Button>
    </div>
  );
}

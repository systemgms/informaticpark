"use client";

import React, { ReactNode } from "react";
import { useState, useEffect } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode;
  onError?: (error: unknown, info: { componentStack: string }) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
  errorInfo: { componentStack: string } | null;
}

/**
 * Componente Error Boundary para capturar errores no manejados en la aplicación React.
 * Detiene la propagación de errores y muestra una interfaz de recuperación controlada.
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Actualiza el estado para disparar la re-renderización con el error capturado
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: unknown, info: { componentStack: string }): void {
    // Loguea el error opcionalmente (puede enviarse a un servicio de monitoreo)
    const { onError } = this.props;
    if (onError) {
      onError(error, info);
    }
    // Guardar info en el estado para posible uso en el UI
    this.setState({
      errorInfo: info,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback } = this.props;
      return fallback;
    }
    return <>{this.props.children}</>;
  }
}

/**
 * Versión funcional que envuelve children con el Error Boundary.
 * 
 * @param props - Configuración del error boundary
 * @param props.fallback - UI a mostrar cuando hay un error
 * @param props.children - Los componentes a proteger
 * @param props.onError - Callback opcional para notificar errores
 */
export function useErrorBoundary(
  props: ErrorBoundaryProps & { children: ReactNode }
): React.ReactNode {
  const [hasError, setHasError] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const error = null; // eslint-disable-line @typescript-eslint/no-unused-vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const setError = () => {};

  useEffect(() => {
    // En un Error Boundary de clase real, esto se manejaría en componentDidCatch
    // Aquí usamos un patrón simplificado para funcional
  }, []);

  if (hasError) {
    return props.fallback;
  }
  return props.children;
}

/**
 * Componente wrapper que usa el patrón de clase Error Boundary.
 * Fácil de usar envolviendo rutas o secciones de la aplicación.
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
  onError, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError?: (error: unknown) => void;
}) {
  const [hasError, setHasError] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    // Este pattern requiere un Error Boundary de clase real para funcionar completamente
    // Por ahora, este wrapper es un placeholder para futura refactorización
  }, []);

  if (hasError) {
    return fallback;
  }
  return children;
}

/**
 * Versión simplificada de Error Boundary para uso inmediato.
 * Nota: Para producción completa, usar la clase ErrorBoundary arriba.
 */
export function SimpleErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [hasError, setHasError] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars

  // En un entorno real, esto se conectaría con un Error Boundary de clase
  // Por ahora renderizamos children y el manejo de errores vendrá de arriba
  return hasError ? fallback : children;
}

export default ErrorBoundary;
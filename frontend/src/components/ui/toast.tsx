'use client';

import { useState, useEffect, createContext, useContext, useCallback, useMemo, useRef } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-600" />,
  error: <AlertCircle className="w-4 h-4 text-red-600" />,
  info: <Info className="w-4 h-4 text-blue-600" />,
};

const TOAST_BG_COLORS: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const nextIdRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    nextIdRef.current += 1;
    const id = nextIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div role="status" aria-live="polite" className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 p-3 rounded-lg border shadow-lg animate-in slide-in-from-right ${TOAST_BG_COLORS[t.type]}`}
          >
            {TOAST_ICONS[t.type]}
            <span className="text-sm flex-1">{t.message}</span>
            {/* 44px hit area; the negative margin keeps the visual 16px icon in place */}
            <button
              type="button"
              aria-label="Cerrar notificación"
              onClick={() => removeToast(t.id)}
              className="-m-3 flex size-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

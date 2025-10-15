import React, { createContext, useCallback, useContext, useState } from "react";

import { ToastType } from "./BaseToast";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  showInfo: (message: string, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
}

const DEFAULT_TOAST_DURATION_MS = 5000;

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: React.ReactNode;
}

let toastCounter = 0;

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, durationMs: number = DEFAULT_TOAST_DURATION_MS) => {
      if (durationMs <= 0) {
        throw new Error("Toast duration must be greater than 0");
      }

      toastCounter += 1;
      const newToastID = `toast-${Date.now()}-${toastCounter}`;
      const newToast: Toast = { id: newToastID, type, message, durationMs };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(newToastID);
      }, durationMs);
    },
    [removeToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => {
      addToast("info", message, duration);
    },
    [addToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => {
      addToast("success", message, duration);
    },
    [addToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => {
      addToast("warning", message, duration);
    },
    [addToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => {
      addToast("error", message, duration);
    },
    [addToast]
  );

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
    showInfo,
    showSuccess,
    showWarning,
    showError,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

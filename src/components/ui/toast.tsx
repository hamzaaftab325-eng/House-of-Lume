"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { IconButton } from "./controls";
import styles from "./toast.module.css";

type ToastTone = "success" | "warning" | "error" | "info";

type ToastInput = {
  title: string;
  message?: string;
  tone?: ToastTone;
};

type ToastRecord = ToastInput & { id: string };

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current.slice(-2), { ...toast, id }]);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ol className={styles.viewport} aria-label="Notifications" aria-live="polite" aria-relevant="additions">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.li
              key={toast.id}
              className={styles.toast}
              data-tone={toast.tone ?? "info"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              <div className={styles.copy}>
                <strong>{toast.title}</strong>
                {toast.message ? <p>{toast.message}</p> : null}
              </div>
              <IconButton label="Dismiss notification" icon={<X />} onClick={() => dismiss(toast.id)} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ToastContainer from "../components/ui/Toast/ToastContainer";

const ToastContext = createContext(undefined);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      idCounter += 1;
      const id = idCounter;
      setToasts((current) => [...current, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      notify,
      dismiss,
      success: (message, options) => notify(message, { ...options, type: "success" }),
      error: (message, options) => notify(message, { ...options, type: "error" }),
      warning: (message, options) => notify(message, { ...options, type: "warning" }),
      info: (message, options) => notify(message, { ...options, type: "info" }),
    }),
    [notify, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider");
  }
  return context;
}

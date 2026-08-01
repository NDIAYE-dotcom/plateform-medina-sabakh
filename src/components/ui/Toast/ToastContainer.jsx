import { createPortal } from "react-dom";
import Toast from "./Toast";
import "./Toast.css";

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

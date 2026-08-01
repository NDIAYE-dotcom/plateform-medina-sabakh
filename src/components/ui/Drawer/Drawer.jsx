import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "../icons";
import "./Drawer.css";

export default function Drawer({ open, onClose, title, side = "right", children, footer }) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="drawer-overlay" onMouseDown={onClose}>
      <div
        className={`drawer drawer--${side}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer__header">
          <h2 className="drawer__title">{title}</h2>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>
        <div className="drawer__body">{children}</div>
        {footer && <div className="drawer__footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

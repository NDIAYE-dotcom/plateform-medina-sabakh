import { AlertTriangleIcon, CheckCircleIcon, CloseIcon, InfoIcon, XCircleIcon } from "../icons";

const ICONS = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
};

export default function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] ?? ICONS.info;

  return (
    <div className={`toast toast--${toast.type}`} role="status">
      <span className="toast__icon">
        <Icon />
      </span>
      <p className="toast__message">{toast.message}</p>
      <button
        type="button"
        className="toast__close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

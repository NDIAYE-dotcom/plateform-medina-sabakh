import "./Badge.css";

const TONES = ["neutral", "primary", "success", "warning", "danger", "info"];

export default function Badge({ children, tone = "neutral", dot = false, className = "", ...rest }) {
  const safeTone = TONES.includes(tone) ? tone : "neutral";

  return (
    <span className={`badge badge--${safeTone} ${className}`} {...rest}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

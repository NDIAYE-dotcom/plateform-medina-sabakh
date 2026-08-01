import "./Loader.css";

const SIZES = { sm: 16, md: 24, lg: 36 };

export default function Loader({ size = "md", label, fullScreen = false }) {
  const dimension = SIZES[size] ?? SIZES.md;

  const spinner = (
    <div className="loader" role="status" aria-live="polite">
      <span
        className="loader__spinner"
        style={{ width: dimension, height: dimension }}
        aria-hidden="true"
      />
      {label && <span className="loader__label">{label}</span>}
      <span className="visually-hidden">Chargement en cours</span>
    </div>
  );

  if (!fullScreen) return spinner;

  return <div className="loader__fullscreen">{spinner}</div>;
}

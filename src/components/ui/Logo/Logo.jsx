import "./Logo.css";

export default function Logo({ withWordmark = true, wordmarkSuffix = "", size = 36 }) {
  return (
    <span className="logo">
      {withWordmark ? (
        <img
          src="/logo-full.png"
          alt="UCDS — Union des Comités de Développement Sanitaire"
          className="logo__mark logo__mark--full"
          style={{ height: size }}
        />
      ) : (
        <img
          src="/logo-icon.png"
          alt="UCDS"
          className="logo__mark"
          style={{ height: size, width: size }}
        />
      )}
      {wordmarkSuffix && <span className="logo__wordmark-suffix">{wordmarkSuffix}</span>}
    </span>
  );
}

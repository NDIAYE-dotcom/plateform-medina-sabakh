export default function HeroIllustration() {
  return (
    <svg
      className="hero-illustration"
      viewBox="0 0 480 420"
      role="img"
      aria-label="Illustration représentant la coordination des postes de santé de l'UCDS"
    >
      <defs>
        <linearGradient id="hero-card-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2AAE8A" />
          <stop offset="1" stopColor="#124D41" />
        </linearGradient>
      </defs>

      {/* Blobs décoratifs flottants */}
      <circle className="hero-illustration__float hero-illustration__float--a" cx="70" cy="80" r="46" fill="#CFF7EA" />
      <circle className="hero-illustration__float hero-illustration__float--b" cx="430" cy="330" r="60" fill="#7FE3C6" opacity="0.5" />
      <circle className="hero-illustration__float hero-illustration__float--c" cx="420" cy="60" r="26" fill="#2AAE8A" opacity="0.25" />

      {/* Carte centrale */}
      <rect x="90" y="70" width="300" height="280" rx="28" fill="var(--color-white)" stroke="var(--color-border)" />
      <rect x="90" y="70" width="300" height="64" rx="28" fill="url(#hero-card-grad)" />
      <rect x="90" y="110" width="300" height="24" fill="url(#hero-card-grad)" />
      <circle cx="118" cy="102" r="6" fill="#F2FFFB" opacity="0.9" />
      <rect x="140" y="96" width="90" height="12" rx="6" fill="#F2FFFB" opacity="0.85" />

      {/* Pouls central */}
      <path
        d="M118 190h30l14-30 20 55 16-38 12 13h60"
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Barres de statistiques */}
      <rect x="118" y="240" width="34" height="60" rx="6" fill="var(--color-bg-light)" />
      <rect x="118" y="270" width="34" height="30" rx="6" fill="var(--color-primary)" />
      <rect x="166" y="220" width="34" height="80" rx="6" fill="var(--color-bg-light)" />
      <rect x="166" y="255" width="34" height="45" rx="6" fill="var(--color-primary)" />
      <rect x="214" y="255" width="34" height="45" rx="6" fill="var(--color-bg-light)" />
      <rect x="214" y="278" width="34" height="22" rx="6" fill="var(--color-primary)" />

      {/* Badge "réseau de postes" */}
      <g className="hero-illustration__float hero-illustration__float--b">
        <circle cx="330" cy="255" r="34" fill="var(--color-secondary)" />
        <path d="M330 240v10M321 250h18" stroke="#F2FFFB" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Noeuds connectés (postes de santé en réseau) */}
      <g stroke="var(--color-light)" strokeWidth="2" opacity="0.8">
        <line x1="40" y1="360" x2="90" y2="330" />
        <line x1="40" y1="360" x2="20" y2="300" />
        <line x1="440" y1="150" x2="390" y2="180" />
      </g>
      <circle className="hero-illustration__float hero-illustration__float--a" cx="40" cy="360" r="10" fill="var(--color-primary)" />
      <circle className="hero-illustration__float hero-illustration__float--c" cx="20" cy="300" r="7" fill="var(--color-secondary)" />
      <circle className="hero-illustration__float hero-illustration__float--b" cx="440" cy="150" r="9" fill="var(--color-secondary)" />
    </svg>
  );
}

import "./Logo.css";

export default function Logo({ withWordmark = true, wordmarkSuffix = "", size = 36 }) {
  return (
    <span className="logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        role="img"
        aria-label="UCDS"
        className="logo__mark"
      >
        <defs>
          <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#2AAE8A" />
            <stop offset="1" stopColor="#124D41" />
          </linearGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#logo-grad)" />
        <path d="M24 12v10M19 17h10" stroke="#F2FFFB" strokeWidth="3.4" strokeLinecap="round" />
        <path
          d="M11 30h5.2l2.4-5 3.4 9 2.6-6.4 2 2.4H37"
          fill="none"
          stroke="#F2FFFB"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {withWordmark && (
        <span className="logo__wordmark">
          UCDS
          {wordmarkSuffix && <span className="logo__wordmark-suffix">{wordmarkSuffix}</span>}
        </span>
      )}
    </span>
  );
}

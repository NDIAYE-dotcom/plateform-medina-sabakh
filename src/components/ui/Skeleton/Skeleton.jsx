import "./Skeleton.css";

export default function Skeleton({
  variant = "text",
  width,
  height,
  circle = false,
  className = "",
  style = {},
}) {
  const classes = ["skeleton", `skeleton--${variant}`, circle ? "skeleton--circle" : "", className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes} style={{ width, height, ...style }} aria-hidden="true" />;
}

Skeleton.Text = function SkeletonText({ lines = 3, lastLineWidth = "60%" }) {
  return (
    <div className="skeleton-text-group">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
};

Skeleton.Card = function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton variant="block" height={120} />
      <div className="skeleton-card__body">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="45%" />
      </div>
    </div>
  );
};

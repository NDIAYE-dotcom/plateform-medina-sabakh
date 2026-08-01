import "./Button.css";

const VARIANTS = ["primary", "secondary", "outline", "ghost", "danger"];
const SIZES = ["sm", "md", "lg"];

export default function Button({
  children,
  as: Tag = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  fullWidth = false,
  type = "button",
  className = "",
  ...rest
}) {
  const safeVariant = VARIANTS.includes(variant) ? variant : "primary";
  const safeSize = SIZES.includes(size) ? size : "md";
  const isNativeButton = Tag === "button";

  const classes = [
    "btn",
    `btn--${safeVariant}`,
    `btn--${safeSize}`,
    fullWidth ? "btn--full" : "",
    loading ? "btn--loading" : "",
    disabled || loading ? "btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const nativeProps = isNativeButton
    ? { type, disabled: disabled || loading }
    : { "aria-disabled": disabled || loading || undefined };

  return (
    <Tag className={classes} {...nativeProps} {...rest}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {!loading && iconLeft && <span className="btn__icon">{iconLeft}</span>}
      <span className="btn__label">{children}</span>
      {!loading && iconRight && <span className="btn__icon">{iconRight}</span>}
    </Tag>
  );
}

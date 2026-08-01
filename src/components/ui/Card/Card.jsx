import "./Card.css";

export default function Card({
  children,
  hoverable = false,
  padded = true,
  className = "",
  ...rest
}) {
  const classes = [
    "card",
    hoverable ? "card--hoverable" : "",
    padded ? "card--padded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = "", ...rest }) {
  return (
    <div className={`card__header ${className}`} {...rest}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children, className = "", ...rest }) {
  return (
    <h3 className={`card__title ${className}`} {...rest}>
      {children}
    </h3>
  );
};

Card.Description = function CardDescription({ children, className = "", ...rest }) {
  return (
    <p className={`card__description ${className}`} {...rest}>
      {children}
    </p>
  );
};

Card.Body = function CardBody({ children, className = "", ...rest }) {
  return (
    <div className={`card__body ${className}`} {...rest}>
      {children}
    </div>
  );
};

Card.Footer = function CardFooter({ children, className = "", ...rest }) {
  return (
    <div className={`card__footer ${className}`} {...rest}>
      {children}
    </div>
  );
};

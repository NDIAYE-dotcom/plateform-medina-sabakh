import { useId } from "react";
import "./Input.css";

export default function Input({
  label,
  hint,
  error,
  required = false,
  icon = null,
  id,
  className = "",
  ...rest
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`field ${error ? "field--error" : ""} ${className}`}>
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
          {required && <span className="field__required">*</span>}
        </label>
      )}
      <div className="field__control-wrap">
        {icon && <span className="field__icon">{icon}</span>}
        <input
          id={inputId}
          className={`field__control ${icon ? "field__control--with-icon" : ""}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        />
      </div>
      {error ? (
        <span className="field__error" id={`${inputId}-error`}>
          {error}
        </span>
      ) : (
        hint && (
          <span className="field__hint" id={`${inputId}-hint`}>
            {hint}
          </span>
        )
      )}
    </div>
  );
}

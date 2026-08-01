import { useId } from "react";
import "../Input/Input.css";

export default function Textarea({
  label,
  hint,
  error,
  required = false,
  id,
  className = "",
  rows = 4,
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
      <textarea
        id={inputId}
        rows={rows}
        className="field__control"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
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

import { useId } from "react";
import { ChevronDownIcon } from "../icons";
import "../Input/Input.css";

export default function Select({
  label,
  hint,
  error,
  required = false,
  options = [],
  placeholder = "Sélectionner...",
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
        <select
          id={inputId}
          className="field__control"
          defaultValue={rest.value === undefined ? "" : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...rest}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="field__chevron">
          <ChevronDownIcon />
        </span>
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

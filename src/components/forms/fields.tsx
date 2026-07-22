import { ReactNode } from "react";

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">
        {label}
        {children}
      </label>
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}

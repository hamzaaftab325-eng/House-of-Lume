import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cx } from "@/lib/cx";

import styles from "./forms.module.css";

type FieldChromeProps = {
  id: string;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

function FieldChrome({ id, label, optional, hint, error, children }: FieldChromeProps) {
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        {optional ? <span className={styles.optional}>Optional</span> : null}
      </div>
      {children}
      {error ? (
        <p className={styles.error} id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className={styles.hint} id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  id?: string;
};

export function TextField({ label, hint, error, optional, id, className, required, ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <FieldChrome id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <input
        className={cx(styles.input, className)}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldChrome>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & TextFieldProps;

export function TextAreaField({
  label,
  hint,
  error,
  optional,
  id,
  className,
  required,
  ...props
}: TextAreaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <FieldChrome id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        className={cx(styles.textarea, className)}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
    </FieldChrome>
  );
}

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  id?: string;
  options: Array<{ label: string; value: string }>;
};

export function SelectField({
  label,
  hint,
  error,
  optional,
  id,
  options,
  className,
  required,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <FieldChrome id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <select
        className={cx(styles.select, className)}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
};

export function CheckboxField({ label, description, ...props }: ChoiceProps) {
  return (
    <label className={styles.choice}>
      <input type="checkbox" {...props} />
      <span className={styles.choiceText}>
        <strong>{label}</strong>
        {description ? <span>{description}</span> : null}
      </span>
    </label>
  );
}

type RadioGroupProps = {
  legend: string;
  name: string;
  options: Array<{ label: string; value: string; description?: string }>;
  defaultValue?: string;
};

export function RadioGroup({ legend, name, options, defaultValue }: RadioGroupProps) {
  return (
    <fieldset className={styles.radioGroup}>
      <legend className={styles.legend}>{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className={styles.choice}>
          <input type="radio" name={name} value={option.value} defaultChecked={defaultValue === option.value} />
          <span className={styles.choiceText}>
            <strong>{option.label}</strong>
            {option.description ? <span>{option.description}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export { styles as formStyles };

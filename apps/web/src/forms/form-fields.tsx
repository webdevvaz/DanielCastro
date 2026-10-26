import type { ReactNode } from "react";

import { useId } from "react";

import { isFieldIssue } from "./field-issues";
import { useFieldContext } from "./form-context";

/** The messages of the field's current errors. */
function useFieldErrors() {
  const field = useFieldContext<unknown>();

  const errors: ReadonlyArray<unknown> = field.state.meta.errors;

  return errors.filter(isFieldIssue).map((issue) => issue.message);
}

/** The ID of the text that describes a control: its error when it has one, else its hint. */
function describedByOf(id: string, hint: string | undefined, errors: ReadonlyArray<string>) {
  if (errors.length > 0) return `${id}-error`;

  if (hint) return `${id}-hint`;

  return undefined;
}

/** Label, control, hint, and error messages of one form field. */
function FieldFrame({ id, label, hint, errors, children }: FieldFrameProps) {
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {errors.map((message) => (
        <p className="field-error" id={`${id}-error`} key={message} role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}

/**
 * A one-line text input: text, email, password, or date. `suggestions` are offered while the
 * user types; any other text stays allowed.
 */
export function TextField({
  label,
  hint,
  type = "text",
  autoComplete,
  placeholder,
  suggestions,
}: TextFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const errors = useFieldErrors();

  const suggestionsId = suggestions === undefined ? undefined : `${id}-suggestions`;

  return (
    <FieldFrame id={id} label={label} hint={hint} errors={errors}>
      <input
        className="input"
        id={id}
        name={field.name}
        type={type}
        value={field.state.value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        list={suggestionsId}
        aria-invalid={errors.length > 0}
        aria-describedby={describedByOf(id, hint, errors)}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
      {suggestions === undefined ? null : (
        <datalist id={suggestionsId}>
          {suggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion}>
              {suggestion}
            </option>
          ))}
        </datalist>
      )}
    </FieldFrame>
  );
}

/** A whole number. An empty input holds `NaN`, which the form's schema reports as an error. */
export function NumberField({ label, hint, min, max }: NumberFieldProps) {
  const field = useFieldContext<number>();
  const id = useId();

  const errors = useFieldErrors();

  return (
    <FieldFrame id={id} label={label} hint={hint} errors={errors}>
      <input
        className="input"
        id={id}
        name={field.name}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        value={Number.isNaN(field.state.value) ? "" : field.state.value}
        aria-invalid={errors.length > 0}
        aria-describedby={describedByOf(id, hint, errors)}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.valueAsNumber)}
      />
    </FieldFrame>
  );
}

/** A multi-line text input. */
export function TextareaField({ label, hint, rows = 3 }: TextareaFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const errors = useFieldErrors();

  return (
    <FieldFrame id={id} label={label} hint={hint} errors={errors}>
      <textarea
        className="input"
        id={id}
        name={field.name}
        rows={rows}
        value={field.state.value}
        aria-invalid={errors.length > 0}
        aria-describedby={describedByOf(id, hint, errors)}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </FieldFrame>
  );
}

/** A choice from a short list of options. */
export function SelectField({ label, hint, options }: SelectFieldProps) {
  const field = useFieldContext<string>();
  const id = useId();

  const errors = useFieldErrors();

  return (
    <FieldFrame id={id} label={label} hint={hint} errors={errors}>
      <select
        className="input"
        id={id}
        name={field.name}
        value={field.state.value}
        aria-invalid={errors.length > 0}
        aria-describedby={describedByOf(id, hint, errors)}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

type FieldFrameProps = {
  readonly id: string;
  readonly label: string;
  readonly hint: string | undefined;
  readonly errors: ReadonlyArray<string>;
  readonly children: ReactNode;
};

type TextFieldProps = {
  readonly label: string;
  readonly hint?: string;
  readonly type?: "text" | "email" | "password" | "date";
  readonly autoComplete?: string;
  readonly placeholder?: string;
  readonly suggestions?: ReadonlyArray<string>;
};

type NumberFieldProps = {
  readonly label: string;
  readonly hint?: string;
  readonly min?: number;
  readonly max?: number;
};

type TextareaFieldProps = {
  readonly label: string;
  readonly hint?: string;
  readonly rows?: number;
};

type SelectFieldProps = {
  readonly label: string;
  readonly hint?: string;
  readonly options: ReadonlyArray<{ readonly value: string; readonly label: string }>;
};

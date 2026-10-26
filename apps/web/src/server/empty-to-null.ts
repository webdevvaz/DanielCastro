/** Stores an optional text field that the form sent as an empty string as `null`. */
export const emptyToNull = (value: string) => (value === "" ? null : value);

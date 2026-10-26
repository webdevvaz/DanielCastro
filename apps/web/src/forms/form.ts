import { createFormHook } from "@tanstack/react-form";

import { fieldContext, formContext } from "./form-context";
import { NumberField, SelectField, TextField, TextareaField } from "./form-fields";

/**
 * The app's TanStack Form hook. Fields rendered through `form.AppField` get the shared field
 * components, such as `field.TextField`.
 */
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { NumberField, SelectField, TextField, TextareaField },
  formComponents: {},
});

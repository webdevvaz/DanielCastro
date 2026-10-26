import { createFormHookContexts } from "@tanstack/react-form";

/**
 * These shared contexts pair custom fields with `useAppForm` in `form.ts`.
 * Keep the instances stable so generated field components read their parent
 * form instead of a separate context.
 */
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();

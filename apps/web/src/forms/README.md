# forms

TanStack Form setup:

| File               | Purpose                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `form-context.ts`  | `createFormHookContexts`                                                   |
| `form-fields.tsx`  | Field components that read `useFieldContext`                               |
| `form.ts`          | `useAppForm`, which registers the field components                         |
| `server-errors.ts` | `showFormError` and `applyServerIssues`: put server issues on their fields |

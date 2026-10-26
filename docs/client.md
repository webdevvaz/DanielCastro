# Client patterns

How the browser side reads data, writes data, builds forms, and shows errors. `docs/architecture.md` covers the server side of the same flow.

## Reading data

Server data goes through TanStack Query. Never put server data in React state.

1. **Query options.** Put one file per domain in `apps/web/src/integrations/tanstack-query/<domain>-query-options.ts`:

   ```ts
   /** Query keys for reports. */
   export const reportQueryKeys = {
     all: ["reports"] as const,
     list: () => ["reports", "list"] as const,
   };

   /** The signed-in user's reports. */
   export const reportsQueryOptions = () =>
     queryOptions({
       queryKey: reportQueryKeys.list(),
       queryFn: () => listMyReports(),
     });
   ```

   If the app has tenants, put the tenant in the key of every tenant-scoped query, so two tenants never share a cache entry.

2. **Put the options in the route context, and prefetch in the loader**, so the request starts before the component renders:

   ```ts
   import { noop } from "@tanstack/react-query";

   export const Route = createFileRoute("/_auth/reports")({
     context: () => ({ reportsQueryOptions: reportsQueryOptions() }),
     loader: ({ context }) => {
       void context.queryClient.query(context.reportsQueryOptions).catch(noop);
     },
     pendingComponent: ReportsPending,
     component: ReportsPage,
   });
   ```

   Components never import query options. They read them, and `queryClient`, from the route context, so the loader and the component always use the same options.

   `queryClient.query` returns cached data while it is fresh and fetches otherwise. `.catch(noop)` keeps a failed prefetch from becoming an unhandled rejection; the component's query reports the error. When a loader or `beforeLoad` needs the result, `await` it instead, with `staleTime: "static"` to use cached data of any age. Do not use `prefetchQuery`, `ensureQueryData`, or `fetchQuery`.

3. **Read in the component** with `useSuspenseQuery` when the page needs the data to render, or `useQuery` for data that can arrive later:

   ```tsx
   const context = useRouteContext({ from: "/_auth/reports" });

   const { data: reports } = useSuspenseQuery(context.reportsQueryOptions);
   ```

4. **Show a page skeleton with the route's `pendingComponent`.** Do not await the query in the loader, and do not put `Suspense` boundaries around parts of the page. Give the skeleton the shape of the whole page, put it in its own small module, and keep its imports light: it is in the route's main chunk (see `codeSplittingOptions` in `apps/web/vite.config.ts`), so everything it imports loads with every page.

Query defaults live in `apps/web/src/integrations/tanstack-query/context.ts`. A sensible start: data stays fresh for one minute, a failed query retries once, and `throwOnError: true` sends query failures to the route's error page.

### Path params

Validate path params with an Effect schema in `params.parse`, and throw `notFound()` for a value the schema rejects:

```ts
const decodeReportParams = Schema.decodeOption(ReportRouteParams);

export const Route = createFileRoute("/_auth/reports/$reportId")({
  params: {
    parse: (params) => Option.getOrThrowWith(decodeReportParams(params), () => notFound()),
  },
});
```

Search params use `validateSearch` with `Schema.toStandardSchemaV1(schema)`.

### Caches and identity

Remove every cached query when the user signs in or out, and load the login page as a new document on sign-out, so a mutation still in flight cannot restore the previous account's data.

## Writing data

Wrap the server function with `useServerFn`, call it from `useMutation`, and refresh the affected queries on success:

```tsx
const { queryClient } = useRouteContext({ from: "/_auth/reports" });

const createReportFn = useServerFn(createReport);

const mutation = useMutation({
  mutationFn: (data: CreateReportInput) => createReportFn({ data }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: reportQueryKeys.all });

    onOpenChange(false);
  },
  onError: (error) => reportError(error.message || "The report could not be created"),
});
```

Success is silent: the refreshed data and the closed dialog show that it worked. Keep dialogs open while the mutation runs, and close them in `onSuccess`, so a failure can be retried without re-entering data.

`useServerFn` handles redirects and not-found responses from the server, such as the redirect to the sign-in page when the session has expired.

## Forms

Build forms with `useAppForm` from `apps/web/src/forms/form.ts` (TanStack Form with the app's field components). Validate with the same Effect schema the server function uses, and report failures with `showFormError`. Type the default values as the schema's type, so `onSubmit` receives a value of that type and does not decode it again.

```tsx
const defaultValues: CreateReportInput = { title: "" };

const form = useAppForm({
  defaultValues,
  validationLogic: revalidateLogic(),
  validators: { onDynamic: Schema.toStandardSchemaV1(CreateReportInput) },
  onSubmit: async ({ value }) => {
    await mutation
      .mutateAsync(value)
      .catch((error: unknown) => showFormError(form, error, "The report could not be saved"));
  },
});
```

`revalidateLogic()` (from `@tanstack/react-form`) validates on the first submit, then after every change. Do not use `validators.onSubmit` for the schema: TanStack Form re-runs a form-level `onSubmit` validator only when no field shows an error, so after a cross-field failure ("the last day must be after the first") the error stays on its field until the user edits that field, and fixing the other field cannot submit the form.

To add a field type, write it in `apps/web/src/forms/form-fields.tsx` with `useFieldContext` and register it in `form.ts`.

## Showing server errors

Server functions fail with the `AppError` classes from `packages/shared/src/errors.ts`, and the browser receives real instances (`error instanceof NotFoundError` works). Each has a `status`, a `_tag`, and a readable `message`.

| Situation                      | What to do                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| A form submission failed       | `showFormError(form, error, fallback)`                         |
| Another mutation failed        | Report `error.message` (or a fallback) in `onError`            |
| A query failed                 | Nothing: the route error page shows it                         |
| The UI must react to one error | Check the class: `if (error instanceof ConflictError) { ... }` |

Unexpected server failures reach the browser as a generic message. The details are in the server logs, never in the response.

## Tables

Build tables with TanStack Table v9 (`useTable`). The rules for stable columns and state reads are in the React section of `.agents/skills/daniel-impl/SKILL.md`.

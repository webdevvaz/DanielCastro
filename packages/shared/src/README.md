# packages/shared/src

Code that both the server and the browser use. It never imports database tables.

| Path          | Holds                                                                    |
| ------------- | ------------------------------------------------------------------------ |
| `errors.ts`   | The `AppError` union: `Schema.TaggedError` classes with an HTTP `status` |
| `<domain>.ts` | Effect Schema contracts (inputs and outputs) for one domain              |
| `components/` | React components that any app could reuse                                |

Modules are exported by path: `@daniel/shared/<module>` and `@daniel/shared/components/<name>`.

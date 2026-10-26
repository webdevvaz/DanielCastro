# routes

File-based routes for TanStack Router. Keep route files thin: they declare `params`, `context`, `loader`, `pendingComponent`, and `component`, and import the page from its feature directory.

| File or directory | Purpose                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| `__root.tsx`      | The HTML document, `<head>`, and providers                                                       |
| `index.tsx`       | The public entry page (or the login page)                                                        |
| `_auth.tsx`       | Pathless layout. `beforeLoad` requires a session; its context holds the queries every page needs |
| `_auth/`          | Signed-in pages                                                                                  |
| `api/`            | Server routes (HTTP handlers) that are not pages                                                 |

Validate path params with an Effect schema in `params.parse`, and throw `notFound()` when they do not decode. Validate search params with `validateSearch` and `Schema.toStandardSchemaV1(schema)`.

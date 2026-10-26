# apps/web/src

The TanStack Start app. Group code by feature: a feature gets its own directory (for example `reports/`) with its page components, and its server code goes in `server/<feature>/`.

| Path                           | Holds                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `router.tsx`                   | Creates the router and the query client, and puts the query client in route context  |
| `start.ts`                     | Request middleware (CSRF, security headers) and the `AppError` serialization adapter |
| `app-config.ts`                | Product identity: name, tagline, and other text shown in the shell                   |
| `routes/`                      | File-based routes. `routeTree.gen.ts` is generated from it                           |
| `server/`                      | Server functions and the Effect programs behind them                                 |
| `integrations/tanstack-query/` | `queryOptions` per domain                                                            |
| `shell/`                       | The frame around every page: layout, navigation, header, login                       |
| `components/`                  | Components that more than one feature of this app uses                               |
| `forms/`                       | The form hook and its field components                                               |
| `defaults/`                    | Default error, forbidden, and not-found pages                                        |
| `<feature>/`                   | Components, hooks, and helpers for one feature                                       |

See `docs/architecture.md` for the request flow and `docs/client.md` for the client patterns.

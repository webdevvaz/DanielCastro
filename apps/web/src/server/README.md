# server

All backend work runs as Effect programs. File names say what a file holds:

| Suffix            | Holds                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `*.server.ts`     | `Effect.fn("name")(function* () { ... })` programs. They read services with `yield*`                     |
| `*.functions.ts`  | `createServerFn` definitions: middleware, `validator(validateInput(schema))`, `runServerEffect(program)` |
| `*.middleware.ts` | Server-function middleware for one authorization boundary                                                |

Shared files at this level:

| File                        | Purpose                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `runtime.server.ts`         | `AppLive` (every service layer, merged once) and the `ManagedRuntime`                                                           |
| `run.server.ts`             | `runServerEffect`: copies request headers, runs the program, maps `AppError` to HTTP status; `runServerRoute` for server routes |
| `request-headers.server.ts` | The `RequestHeaders` service                                                                                                    |
| `validate-input.ts`         | `validateInput(schema)`: invalid input becomes `InvalidInputError` (422) with issue paths                                       |

Put each domain in its own directory: `auth/`, `observability/`, `<feature>/`.

Never call `getRequestHeaders()` or the other request helpers from `@tanstack/react-start/server` inside a program. Read `yield* RequestHeaders`. Lint enforces this in this directory; `run.server.ts` is the only exception.

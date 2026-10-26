# routes/api

Server routes. Typical entries:

| File                    | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `auth/$.ts`             | Passes `/api/auth/*` to Better Auth             |
| `health.ts`             | Liveness probe: the process answers             |
| `ready.ts`              | Readiness probe: the database answers           |
| `photos/$.ts`           | Serves stored gallery photos                    |
| `instagram/connect.ts`  | Sends an admin to Instagram Login               |
| `instagram/callback.ts` | Connects the account Instagram Login sends back |

The `Containerfile` health check calls `/api/health`.

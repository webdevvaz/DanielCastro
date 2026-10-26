/**
 * The process event that tells the Effect runtime the server has stopped. The Nitro plugin in
 * `nitro/runtime-shutdown.ts` emits it, and `runtime.server.ts` disposes the runtime when it
 * arrives. They talk through the process because Nitro bundles its plugins apart from the
 * TanStack Start server code, so the plugin cannot import the runtime itself.
 */
export const RUNTIME_SHUTDOWN_EVENT = "web:runtime-shutdown";

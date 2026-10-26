import { definePlugin } from "nitro";

import { RUNTIME_SHUTDOWN_EVENT } from "../shutdown";

/**
 * Releases the Effect runtime when the production server stops. On SIGTERM or SIGINT the server
 * stops accepting connections and waits for requests in progress; Nitro then runs its `close`
 * hook. Disposing the runtime closes the database pools and flushes
 * telemetry, so Node can exit instead of waiting to be killed.
 */
export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("close", () => {
    process.emit(RUNTIME_SHUTDOWN_EVENT);
  });
});

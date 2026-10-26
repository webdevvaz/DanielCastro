import "@tanstack/react-start/server-only";
import { layer as AuthLive } from "@daniel/auth";
import { layerFromConfig as DatabaseLive } from "@daniel/db";
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";

import { PhotoStorageLive } from "./gallery/photo-storage.server";
import { InstagramApiLive } from "./instagram/instagram-api.server";
import { ObservabilityLive } from "./observability/observability.server";
import { RUNTIME_SHUTDOWN_EVENT } from "./shutdown";
import { TravelDataLive } from "./travel/travel-data.server";

/**
 * Every service the server functions can use. Add a layer here when you add a service, and
 * its tag to `AppServices` follows automatically. Observability is provided last, so layer
 * construction and every server program log and trace through it.
 */
const AppLive = Layer.mergeAll(
  AuthLive,
  PhotoStorageLive,
  Layer.mergeAll(TravelDataLive, InstagramApiLive).pipe(Layer.provide(FetchHttpClient.layer)),
).pipe(Layer.provideMerge(DatabaseLive), Layer.provideMerge(ObservabilityLive));

/** Releases every layer: closes pools and flushes telemetry. */
const disposeRuntime = () => {
  void runtime.dispose();
};

/** One runtime per server process. Layers build on first use and are released on shutdown. */
export const runtime = ManagedRuntime.make(AppLive);

process.once(RUNTIME_SHUTDOWN_EVENT, disposeRuntime);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    process.off(RUNTIME_SHUTDOWN_EVENT, disposeRuntime);
    disposeRuntime();
  });
}

/** The services available to every server program. */
export type AppServices = Layer.Success<typeof AppLive>;

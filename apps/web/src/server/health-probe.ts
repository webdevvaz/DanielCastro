import { Effect, type Duration, type ManagedRuntime } from "effect";

/**
 * Runs a health probe with the runtime's services and reports whether it succeeded within
 * `timeout`. The timeout includes the runtime's startup: `runtime.runPromise` builds the layers
 * before the probe starts, so a timeout inside the probe would not bound a slow startup (in
 * single-workspace mode, startup writes to the database and can wait on a lock).
 *
 * A probe that times out only stops waiting. The runtime builds in its own fiber, so the build
 * continues and later requests use its result.
 */
export const runHealthProbe = <A, E, R, ER>(
  runtime: ManagedRuntime.ManagedRuntime<R, ER>,
  probe: Effect.Effect<A, E, R>,
  timeout: Duration.Input,
): Promise<boolean> =>
  Effect.runPromise(
    runtime.contextEffect.pipe(
      Effect.flatMap((context) => Effect.provideContext(probe, context)),
      Effect.timeout(timeout),
    ),
  ).then(
    () => true,
    () => false,
  );

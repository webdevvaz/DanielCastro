import { makeAdapterDatabase } from "@daniel/db/adapter";
import { Option, Predicate, Redacted } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { makeBetterAuth } from "../../src/better-auth";

describe("blocked browser endpoints", () => {
  const baseUrl = "http://localhost:3000";

  // The pool connects lazily; blocked paths are rejected before any query runs.
  const auth = makeBetterAuth(
    {
      secret: Redacted.make("test-secret-with-at-least-32-characters"),
      baseUrl,
      databaseUrl: Redacted.make("postgresql://127.0.0.1:1/unused"),
      ipAddressHeader: Option.none(),
      nodeEnv: "test",
    },
    makeAdapterDatabase("postgresql://127.0.0.1:1/unused"),
  );

  // The browser may call these endpoints and no other. The list is the contract; an endpoint
  // that a plugin or an upgrade adds is blocked until it is added here and in `browserPaths`.
  const allowedPaths = new Set(["/sign-in/email", "/sign-out", "/get-session", "/ok", "/error"]);

  // Server-only endpoints have no path at runtime, although the type says `string`. A parameter
  // gets a sample value.
  const endpoints = Object.values(auth.api).flatMap((endpoint) =>
    Predicate.isString(endpoint.path)
      ? [
          {
            path: endpoint.path,
            method: [endpoint.options.method].flat()[0] ?? "POST",
            url: endpoint.path
              .split("/")
              .map((segment) => (segment.startsWith(":") ? "x" : segment))
              .join("/"),
          },
        ]
      : [],
  );

  const request = (method: string, url: string) =>
    auth.handler(
      new Request(`${baseUrl}/api/auth${url}`, { method, headers: { origin: baseUrl } }),
    );

  it("finds the endpoints, including the admin plugin and sign-up", () => {
    expect(endpoints.map(({ path }) => path)).toEqual(
      expect.arrayContaining(["/sign-up/email", "/change-password", "/admin/create-user"]),
    );
  });

  it.each(endpoints.filter(({ path }) => !allowedPaths.has(path)))(
    "rejects $method $path from the browser",
    async ({ method, url }) => {
      expect((await request(method, url)).status).toBe(404);
    },
  );

  it("still answers the endpoints the browser needs", async () => {
    expect((await request("GET", "/ok")).status).toBe(200);
    // Sign-in with an empty body reaches Better Auth's validation, not the allow list.
    expect((await request("POST", "/sign-in/email")).status).not.toBe(404);
  });
});

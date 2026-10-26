/** A plain-text response that caches and proxies must not store, for health and readiness checks. */
export const plainTextResponse = (body: string, status: number) =>
  new Response(body, {
    status,
    headers: [
      ["content-type", "text/plain; charset=utf-8"],
      ["cache-control", "no-store"],
    ],
  });

import "@tanstack/react-start/server-only";
import { Predicate } from "effect";

/**
 * What went wrong in an outgoing HTTP request, without the request itself: some services take
 * their secret in the address, and an error's message can repeat the address into logs and
 * traces. Gives the error tag, the reason tag, and the response status when there is one.
 */
export const describeHttpFailure = (error: unknown) => {
  const parts = [Predicate.hasProperty(error, "_tag") ? String(error._tag) : "Error"];

  if (Predicate.hasProperty(error, "reason") && Predicate.hasProperty(error.reason, "_tag")) {
    parts.push(String(error.reason._tag));
  }

  if (Predicate.hasProperty(error, "response") && Predicate.hasProperty(error.response, "status")) {
    parts.push(`status ${String(error.response.status)}`);
  }

  return parts.join(" ");
};

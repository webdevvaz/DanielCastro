import { InvalidInputError } from "@daniel/shared/errors";
import { Predicate, Schema } from "effect";

const INVALID_INPUT_REASON = "The request contains invalid data";

/** Turns a Standard Schema path segment (a key or `{ key }`) into a string. */
const pathSegment = (segment: PropertyKey | { readonly key: PropertyKey }) =>
  String(Predicate.hasProperty(segment, "key") ? segment.key : segment);

/**
 * A server-function validator that decodes the input with an Effect schema:
 *
 * ```ts
 * createServerFn({ method: "POST" }).validator(validateInput(CreateReportInput))
 * ```
 *
 * Invalid input fails with `InvalidInputError` (HTTP 422), which lists each problem with the
 * path of the invalid field. `Schema.toStandardSchemaV1` alone would fail with a plain `Error`
 * whose message is JSON, and a 200 status.
 */
export const validateInput = <S extends Schema.Codec<unknown, unknown>>(schema: S) => {
  const standard = Schema.toStandardSchemaV1(schema);

  return async (input: S["Encoded"]): Promise<S["Type"]> => {
    const result = await standard["~standard"].validate(input);

    if (!result.issues) return result.value;

    const issues = result.issues.map((issue) => ({
      path: (issue.path ?? []).map(pathSegment),
      message: issue.message,
    }));

    throw new InvalidInputError({ reason: INVALID_INPUT_REASON, issues });
  };
};

import { Effect, Schema } from "effect";

/** Longer paths are not kept: they are not links that a person opens. */
const RETURN_PATH_MAX_LENGTH = 2048;

/**
 * A path inside this app: it starts with one `/`. `//host` and `/\host` are other origins to a
 * browser, and a control character can change how a browser or a proxy reads the path, so they
 * are refused. A full URL never starts with `/`, so it is refused too.
 */
const isAppPath = (path: string) =>
  path.startsWith("/") &&
  !path.startsWith("//") &&
  !path.includes("\\") &&
  !path.split("").some((character) => character < " " || character === "\u007f");

/**
 * The page a person asked for before signing in, which they return to after sign-in. Only a
 * path inside this app is accepted, so the value cannot send anyone to another site.
 */
export const ReturnPath = Schema.String.check(
  Schema.isMaxLength(RETURN_PATH_MAX_LENGTH),
  Schema.makeFilter(isAppPath, { message: "Use a path inside this app" }),
);

const ReturnPathOrUndefined = Schema.UndefinedOr(ReturnPath);

/**
 * The `?redirect=` search value of the sign-in page and the workspace selector. A value that is
 * not a path inside this app is dropped instead of failing the page.
 */
export const ReturnPathSearchValue = Schema.optional(
  Schema.catchDecoding<typeof ReturnPathOrUndefined>(() => Effect.succeedSome(undefined))(
    ReturnPathOrUndefined,
  ),
);

/** A path inside this app. */
export type ReturnPath = typeof ReturnPath.Type;

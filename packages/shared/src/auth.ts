import { Schema } from "effect";

import { ReturnPathSearchValue } from "./return-path";

/** Email and password submitted by the sign-in form. */
export const SignInInput = Schema.Struct({
  email: Schema.Trim.check(
    Schema.isPattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "Enter a valid email address" }),
  ),
  password: Schema.String.check(Schema.isMinLength(1, { message: "Password is required" })),
});

/** The sign-in page's search: `redirect`, the admin page to open after sign-in. */
export const SignInSearch = Schema.Struct({
  redirect: ReturnPathSearchValue,
});

/** Decoded sign-in form values. */
export type SignInInput = typeof SignInInput.Type;

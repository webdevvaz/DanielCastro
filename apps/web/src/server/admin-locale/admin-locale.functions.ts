import { createServerFn } from "@tanstack/react-start";

import { runServerEffect } from "../run.server";
import { readAdminLocale } from "./admin-locale.server";

/**
 * The admin language from the visitor's cookie. Public: it reveals only the visitor's own choice,
 * and the sign-in page needs it before anyone signs in.
 */
export const getAdminLocale = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(readAdminLocale),
);

import { createServerFn } from "@tanstack/react-start";

import { runServerEffect } from "../run.server";
import { getRequestSession } from "./session.server";

/** The current session, or null. Public, so the sign-in page can redirect signed-in users. */
export const getSession = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(getRequestSession),
);

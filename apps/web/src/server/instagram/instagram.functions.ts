import { ImportInstagramPostInput } from "@daniel/shared/instagram";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  disconnectInstagram as disconnectInstagramEffect,
  getInstagramAdminView,
  getNewsFeed as getNewsFeedEffect,
  importInstagramPost as importInstagramPostEffect,
} from "./instagram.server";

/** Daniel's latest Instagram posts for the News page. Public. */
export const getNewsFeed = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(getNewsFeedEffect),
);

/** The connected account and its recent posts, for the Instagram admin page. */
export const getAdminInstagram = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(getInstagramAdminView));

/** Adds the photo of an Instagram post to the gallery. */
export const importInstagramPost = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(ImportInstagramPostInput))
  .handler(({ context, data }) =>
    runServerEffect(importInstagramPostEffect(context.user.id, data.mediaId)),
  );

/** Forgets the connected Instagram account. */
export const disconnectInstagram = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(({ context }) => runServerEffect(disconnectInstagramEffect(context.user.id)));

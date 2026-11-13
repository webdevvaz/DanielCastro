import {
  CreateInstagramConnectLinkInput,
  ImportInstagramPostInput,
  InstagramConnectLinkInput,
} from "@daniel/shared/instagram";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  checkInstagramConnectLink,
  createInstagramConnectLink as createInstagramConnectLinkEffect,
  disconnectInstagram as disconnectInstagramEffect,
  getInstagramAdminView,
  getNewsFeed as getNewsFeedEffect,
  getNewsStatus as getNewsStatusEffect,
  importInstagramPost as importInstagramPostEffect,
} from "./instagram.server";

/** Whether the News page is live, so the menu shows it only then. Public. */
export const getNewsStatus = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(getNewsStatusEffect),
);

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

/** Makes a link that connects one Instagram account without an admin sign-in. */
export const createInstagramConnectLink = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(CreateInstagramConnectLinkInput))
  .handler(({ context, data }) =>
    runServerEffect(createInstagramConnectLinkEffect(context.user.id, data.username)),
  );

/** Whether a connect link still works, and the account it connects. Public. */
export const getInstagramConnectLink = createServerFn({ method: "GET" })
  .validator(validateInput(InstagramConnectLinkInput))
  .handler(({ data }) => runServerEffect(checkInstagramConnectLink(data.token)));

import { listAllGuestSpots } from "@daniel/db";
import {
  CreateGuestSpotInput,
  DeleteGuestSpotInput,
  UpdateGuestSpotInput,
} from "@daniel/shared/guest-spots";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  createGuestSpot as createGuestSpotEffect,
  editGuestSpot,
  listCurrentGuestSpots,
  removeGuestSpot,
} from "./guest-spots.server";

/** Guest spots that have not ended yet. Public. */
export const getUpcomingGuestSpots = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(listCurrentGuestSpots()),
);

/** Every guest spot, past ones included, for the admin area. */
export const getAdminGuestSpots = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(listAllGuestSpots()));

/** Adds a guest spot. */
export const createGuestSpot = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(CreateGuestSpotInput))
  .handler(({ context, data }) => runServerEffect(createGuestSpotEffect(context.user.id, data)));

/** Saves the changes to a guest spot. */
export const updateGuestSpot = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateGuestSpotInput))
  .handler(({ context, data }) => runServerEffect(editGuestSpot(context.user.id, data)));

/** Deletes a guest spot. */
export const deleteGuestSpot = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(DeleteGuestSpotInput))
  .handler(({ context, data }) => runServerEffect(removeGuestSpot(context.user.id, data.id)));

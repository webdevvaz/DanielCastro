import "@tanstack/react-start/server-only";
import type { CreateGuestSpotInput, UpdateGuestSpotInput } from "@daniel/shared/guest-spots";

import {
  deleteGuestSpot,
  insertGuestSpot,
  listUpcomingGuestSpots,
  updateGuestSpot,
  type GuestSpotValues,
} from "@daniel/db";
import { studioToday } from "@daniel/shared/studio";
import { Effect } from "effect";

import { emptyToNull } from "../empty-to-null";
import { withAuditEvent } from "../observability/audit.server";

const toValues = (input: CreateGuestSpotInput): GuestSpotValues => ({
  city: input.city,
  country: input.country,
  studioName: input.studioName,
  address: emptyToNull(input.address),
  startsOn: input.startsOn,
  endsOn: input.endsOn,
  status: input.status,
  note: emptyToNull(input.note),
});

/** Guest spots that have not ended yet, the soonest first. */
export const listCurrentGuestSpots = Effect.fn("listCurrentGuestSpots")(function* () {
  return yield* listUpcomingGuestSpots(studioToday());
});

/** Adds a guest spot. */
export const createGuestSpot = Effect.fn("createGuestSpot")(
  function* (_userId: string, input: CreateGuestSpotInput) {
    return yield* insertGuestSpot(toValues(input));
  },
  (effect, userId) =>
    effect.pipe(
      withAuditEvent({
        action: "guest_spot.created",
        actorUserId: userId,
        targetType: "guest_spot",
      }),
    ),
);

/** Saves the changes to a guest spot. */
export const editGuestSpot = Effect.fn("editGuestSpot")(
  function* (_userId: string, input: UpdateGuestSpotInput) {
    yield* updateGuestSpot(input.id, toValues(input));
  },
  (effect, userId, input) =>
    effect.pipe(
      withAuditEvent({
        action: "guest_spot.updated",
        actorUserId: userId,
        targetType: "guest_spot",
        targetId: input.id,
      }),
    ),
);

/** Deletes a guest spot. */
export const removeGuestSpot = Effect.fn("removeGuestSpot")(
  function* (_userId: string, id: string) {
    yield* deleteGuestSpot(id);
  },
  (effect, userId, id) =>
    effect.pipe(
      withAuditEvent({
        action: "guest_spot.deleted",
        actorUserId: userId,
        targetType: "guest_spot",
        targetId: id,
      }),
    ),
);

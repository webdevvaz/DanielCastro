import { getBookingSettings } from "@daniel/db";
import { UpdateBookingSettingsInput } from "@daniel/shared/booking";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import { updateBookingSettings as updateBookingSettingsEffect } from "./booking.server";

/** Whether Daniel takes new enquiries, and the day the books open again. Public. */
export const getBookingStatus = createServerFn({ method: "GET" }).handler(() =>
  runServerEffect(getBookingSettings()),
);

/** Opens or closes the books. */
export const updateBookingSettings = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateBookingSettingsInput))
  .handler(({ context, data }) =>
    runServerEffect(updateBookingSettingsEffect(context.user.id, data)),
  );

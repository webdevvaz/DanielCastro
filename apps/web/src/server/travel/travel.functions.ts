import { getTravelSettings } from "@daniel/db";
import {
  CitySuggestionsInput,
  TravelEstimateInput,
  UpdateTravelSettingsInput,
} from "@daniel/shared/travel";
import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "../auth/auth.middleware";
import { runServerEffect } from "../run.server";
import { validateInput } from "../validate-input";
import {
  estimateTrip,
  suggestCities,
  updateTravelSettings as updateTravelSettingsEffect,
} from "./travel.server";

/** A trip estimate from the visitor's city to the studio. Public. */
export const getTripEstimate = createServerFn({ method: "GET" })
  .validator(validateInput(TravelEstimateInput))
  .handler(({ data }) => runServerEffect(estimateTrip(data)));

/** City names that match what the visitor types, such as "London, United Kingdom". Public. */
export const getCitySuggestions = createServerFn({ method: "GET" })
  .validator(validateInput(CitySuggestionsInput))
  .handler(({ data }) => runServerEffect(suggestCities(data.term)));

/** The travel estimator's figures, or null when they are not set yet. */
export const getAdminTravelSettings = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(() => runServerEffect(getTravelSettings()));

/** Saves the travel estimator's figures. */
export const updateTravelSettings = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(validateInput(UpdateTravelSettingsInput))
  .handler(({ context, data }) =>
    runServerEffect(updateTravelSettingsEffect(context.user.id, data)),
  );

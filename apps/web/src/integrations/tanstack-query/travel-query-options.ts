import type { TravelEstimateInput } from "@daniel/shared/travel";

import { queryOptions } from "@tanstack/react-query";

import {
  getAdminTravelSettings,
  getCitySuggestions,
  getTripEstimate,
} from "@/server/travel/travel.functions";

/** Suggestions start after this many letters; fewer match too many cities to help. */
const MIN_SUGGESTION_LENGTH = 2;

/** Fares and city names change slowly, so a repeated search reuses the answer. */
const ESTIMATE_STALE_MS = 10 * 60_000;
const SUGGESTIONS_STALE_MS = 60 * 60_000;

/** Query keys for the travel estimator. Invalidate `all` after the settings change. */
export const travelQueryKeys = {
  all: ["travel"] as const,
  estimate: (input: TravelEstimateInput) => ["travel", "estimate", input] as const,
  cities: (term: string) => ["travel", "cities", term] as const,
  settings: ["travel", "settings"] as const,
};

/** A trip estimate from the visitor's city to the studio. */
export const tripEstimateQueryOptions = (input: TravelEstimateInput) =>
  queryOptions({
    queryKey: travelQueryKeys.estimate(input),
    queryFn: () => getTripEstimate({ data: input }),
    staleTime: ESTIMATE_STALE_MS,
  });

/** City names that match `term`. Disabled until the term is long enough to be useful. */
export const citySuggestionsQueryOptions = (term: string) =>
  queryOptions({
    queryKey: travelQueryKeys.cities(term),
    queryFn: () => getCitySuggestions({ data: { term } }),
    enabled: term.length >= MIN_SUGGESTION_LENGTH,
    staleTime: SUGGESTIONS_STALE_MS,
  });

/** The travel estimator's figures, for the admin area. */
export const adminTravelSettingsQueryOptions = queryOptions({
  queryKey: travelQueryKeys.settings,
  queryFn: () => getAdminTravelSettings(),
});

import { TravelSearch } from "@daniel/shared/travel";
import { noop } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Schema } from "effect";

import { pageTitleFor } from "@/i18n/site-messages";
import {
  citySuggestionsQueryOptions,
  tripEstimateQueryOptions,
} from "@/integrations/tanstack-query/travel-query-options";
import { TravelPage } from "@/travel/travel-page";

/** The travel estimator. The search lives in the address, so an estimate can be shared. */
export const Route = createFileRoute("/{-$locale}/_site/travel")({
  validateSearch: Schema.toStandardSchemaV1(TravelSearch),
  loaderDeps: ({ search }) => search,
  context: () => ({ tripEstimateQueryOptions, citySuggestionsQueryOptions }),
  loader: ({ context, deps }) => {
    if (deps.from === undefined) return;

    void context.queryClient
      .query(
        context.tripEstimateQueryOptions({
          from: deps.from,
          arrive: deps.arrive,
          leave: deps.leave,
        }),
      )
      .catch(noop);
  },
  head: ({ params }) => ({ meta: [{ title: pageTitleFor(params.locale, "travel") }] }),
  component: TravelPage,
});

import { TravelSearchForm, type TravelSearch } from "@daniel/shared/travel";
import { revalidateLogic, useSelector } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouteContext } from "@tanstack/react-router";
import { Schema } from "effect";

import { useAppForm } from "@/forms/form";
import { localeParam } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";

import { TRAVEL_TEXT } from "./travel-text";
import { useDebouncedValue } from "./use-debounced-value";

const SUGGESTION_DELAY_MS = 250;

const NO_SUGGESTIONS: ReadonlyArray<string> = [];

/**
 * The search for a trip estimate. Submitting puts the search in the page's address, in the page's
 * language. Errors show in that language too.
 */
export function TripSearchForm({ search }: { search: TravelSearch }) {
  const context = useRouteContext({ from: "/{-$locale}/_site/travel" });
  const navigate = useNavigate();
  const locale = useLocale();
  const t = TRAVEL_TEXT[locale].form;

  const defaultValues: TravelSearchForm = {
    from: search.from ?? "",
    arrive: search.arrive ?? "",
    leave: search.leave ?? "",
  };

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(TravelSearchForm) },
    onSubmit: async ({ value }) => {
      await navigate({
        to: "/{-$locale}/travel",
        params: { locale: localeParam(locale) },
        search: {
          from: value.from.trim(),
          arrive: value.arrive === "" ? undefined : value.arrive,
          leave: value.leave === "" ? undefined : value.leave,
        },
      });
    },
  });

  const typed = useSelector(form.store, (state) => state.values.from);
  const term = useDebouncedValue(typed.trim(), SUGGESTION_DELAY_MS);

  const { data: suggestions = NO_SUGGESTIONS } = useQuery(
    context.citySuggestionsQueryOptions(term),
  );

  return (
    <form
      className="form panel trip-search"
      onSubmit={(event) => {
        event.preventDefault();

        void form.handleSubmit();
      }}
    >
      <form.AppField name="from">
        {(field) => (
          <field.TextField
            label={t.from}
            placeholder={t.fromPlaceholder}
            autoComplete="address-level2"
            suggestions={suggestions}
            errorText={t.fromError}
          />
        )}
      </form.AppField>
      <form.AppField name="arrive">
        {(field) => (
          <field.TextField
            label={t.arrive}
            type="date"
            hint={t.optional}
            errorText={t.arriveError}
          />
        )}
      </form.AppField>
      <form.AppField name="leave">
        {(field) => (
          <field.TextField label={t.leave} type="date" hint={t.optional} errorText={t.leaveError} />
        )}
      </form.AppField>
      <button className="btn btn-red" type="submit">
        {t.submit}
      </button>
    </form>
  );
}

import type { EnquiryPhotoKind } from "@daniel/shared/enquiry";

import { ENQUIRY_PHOTO_KINDS, ENQUIRY_PHOTO_LIMITS, EnquiryDetails } from "@daniel/shared/enquiry";
import { ConflictError, InvalidInputError, TooManyRequestsError } from "@daniel/shared/errors";
import { revalidateLogic, useSelector } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { differenceInSeconds } from "date-fns";
import { Schema } from "effect";
import { useState } from "react";

import { formatDateRange } from "@/components/format-date-range";
import { useAppForm } from "@/forms/form";
import { localeParam } from "@/i18n/locales";
import { useLocale } from "@/i18n/use-locale";
import { submitEnquiry } from "@/server/enquiries/enquiry.functions";

import { ENQUIRY_TEXT } from "./enquiry-text";
import { PhotoPicker, releasePhoto, type PickedPhoto } from "./photo-picker";

const NO_PHOTOS: PhotoGroups = { reference: [], favourite: [], placement: [] };

/** Moves the focus to the first answer with a problem, once the errors have rendered. */
const focusFirstProblem = () => {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('.enquiry-form [aria-invalid="true"]')?.focus();
  });
};

/** The message for a failed send, in the page's language. */
const failureMessage = (error: unknown, text: FailureText) => {
  if (error instanceof ConflictError) return text.spotGone;

  if (error instanceof InvalidInputError) return text.invalid;

  if (error instanceof TooManyRequestsError) return text.tooMany;

  return text.failed;
};

/** The count problem of one photo group: too few or too many photos, or null. */
const photoProblem = (kind: EnquiryPhotoKind, total: number, text: PhotoCountText) => {
  const { min, max } = ENQUIRY_PHOTO_LIMITS[kind];

  if (total < min) return text.tooFew;

  if (total > max) return text.tooMany(max);

  return null;
};

/**
 * The enquiry form: the client's details, where they want the tattoo, the idea and its photos,
 * and the privacy consent. Every message is in the page's language. On success, `onSent` runs and
 * the photos' previews are released.
 */
export function EnquiryForm({ onSent }: { onSent: () => void }) {
  const context = useRouteContext({ from: "/{-$locale}/_site/enquiry" });
  const locale = useLocale();
  const t = ENQUIRY_TEXT[locale];

  const { data: spots } = useSuspenseQuery(context.upcomingGuestSpotsQueryOptions);

  const [photos, setPhotos] = useState<PhotoGroups>(NO_PHOTOS);
  const [checkedPhotos, setCheckedPhotos] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [openedAt] = useState(() => new Date());

  const send = useServerFn(submitEnquiry);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => send({ data: formData }),
  });

  const photosReady = ENQUIRY_PHOTO_KINDS.every(
    (kind) => photoProblem(kind, photos[kind].length, t.photos) === null,
  );

  const defaultValues: typeof EnquiryDetails.Encoded = {
    locale,
    name: "",
    age: null,
    instagram: "",
    email: "",
    phone: "",
    city: "",
    country: "",
    location: "braga",
    locationOther: "",
    theme: "",
    description: "",
    questions: "",
    consent: false,
    website: "",
    secondsToFill: 0,
  };

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(EnquiryDetails) },
    onSubmitInvalid: focusFirstProblem,
    onSubmit: async ({ value }) => {
      if (!photosReady) {
        focusFirstProblem();

        return;
      }

      const formData = new FormData();

      const details: typeof EnquiryDetails.Encoded = {
        ...value,
        secondsToFill: differenceInSeconds(new Date(), openedAt),
      };

      formData.append("details", JSON.stringify(details));

      for (const kind of ENQUIRY_PHOTO_KINDS) {
        for (const photo of photos[kind]) formData.append(kind, photo.file);
      }

      setFailure(null);

      try {
        await mutation.mutateAsync(formData);
      } catch (error) {
        setFailure(failureMessage(error, t.errors));

        // The books may have closed since the page loaded; the page then shows the notice.
        if (error instanceof ConflictError) {
          await context.queryClient.invalidateQueries({
            queryKey: context.bookingStatusQueryOptions.queryKey,
          });
        }

        return;
      }

      for (const kind of ENQUIRY_PHOTO_KINDS) photos[kind].forEach(releasePhoto);

      onSent();
    },
  });

  const location = useSelector(form.store, (state) => state.values.location);

  const locationOptions = [
    { value: "braga", label: t.where.braga },
    ...spots
      .filter((spot) => spot.status === "open")
      .map((spot) => ({
        value: spot.id,
        label: t.where.guestSpot(
          `${spot.city}, ${spot.country}`,
          formatDateRange(spot.startsOn, spot.endsOn, locale),
        ),
      })),
    { value: "other", label: t.where.other },
  ];

  const photoPicker = (kind: EnquiryPhotoKind) => (
    <PhotoPicker
      label={t.photos[kind].label}
      hint={t.photos[kind].hint}
      max={ENQUIRY_PHOTO_LIMITS[kind].max}
      photos={photos[kind]}
      error={checkedPhotos ? photoProblem(kind, photos[kind].length, t.photos) : null}
      text={t.photos}
      onChange={(update) => {
        setPhotos((current) => ({ ...current, [kind]: update(current[kind]) }));
      }}
    />
  );

  return (
    <form
      className="form enquiry-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        setCheckedPhotos(true);

        void form.handleSubmit();
      }}
    >
      <section className="panel enquiry-section">
        <h2 className="form-section-title">{t.you.title}</h2>
        <div className="form-grid">
          <form.AppField name="name">
            {(field) => (
              <field.TextField label={t.you.name} autoComplete="name" errorText={t.errors.name} />
            )}
          </form.AppField>
          <form.AppField name="age">
            {(field) => <field.NumberField label={t.you.age} min={18} errorText={t.errors.age} />}
          </form.AppField>
          <form.AppField name="instagram">
            {(field) => (
              <field.TextField
                label={t.you.instagram}
                placeholder="@"
                autoComplete="off"
                errorText={t.errors.instagram}
              />
            )}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField
                label={t.you.email}
                type="email"
                autoComplete="email"
                errorText={t.errors.email}
              />
            )}
          </form.AppField>
          <form.AppField name="phone">
            {(field) => (
              <field.TextField
                label={t.you.phone}
                type="tel"
                hint={t.you.phoneHint}
                autoComplete="tel"
                errorText={t.errors.phone}
              />
            )}
          </form.AppField>
          <span aria-hidden="true" />
          <form.AppField name="city">
            {(field) => (
              <field.TextField
                label={t.you.city}
                autoComplete="address-level2"
                errorText={t.errors.city}
              />
            )}
          </form.AppField>
          <form.AppField name="country">
            {(field) => (
              <field.TextField
                label={t.you.country}
                autoComplete="country-name"
                errorText={t.errors.country}
              />
            )}
          </form.AppField>
        </div>
      </section>

      <section className="panel enquiry-section">
        <h2 className="form-section-title">{t.where.title}</h2>
        <form.AppField name="location">
          {(field) => <field.SelectField label={t.where.label} options={locationOptions} />}
        </form.AppField>
        {location === "other" ? (
          <form.AppField name="locationOther">
            {(field) => (
              <field.TextField label={t.where.otherPlace} errorText={t.errors.otherPlace} />
            )}
          </form.AppField>
        ) : null}
      </section>

      <section className="panel enquiry-section">
        <h2 className="form-section-title">{t.idea.title}</h2>
        <ul className="checklist">
          {t.idea.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <form.AppField name="theme">
          {(field) => (
            <field.TextField
              label={t.idea.theme}
              hint={t.idea.themeHint}
              errorText={t.errors.theme}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label={t.idea.description}
              rows={5}
              errorText={t.errors.description}
            />
          )}
        </form.AppField>
        {photoPicker("reference")}
        {photoPicker("favourite")}
        {photoPicker("placement")}
      </section>

      <section className="panel enquiry-section">
        <h2 className="form-section-title">{t.before.title}</h2>
        <ul className="checklist">
          {t.before.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <form.AppField name="questions">
          {(field) => (
            <field.TextareaField
              label={t.before.questions}
              hint={t.optional}
              rows={4}
              errorText={t.errors.questions}
            />
          )}
        </form.AppField>
        <form.AppField name="consent">
          {(field) => (
            <field.CheckboxField errorText={t.errors.consent}>
              {t.before.consentBefore}{" "}
              <Link
                to="/{-$locale}/privacy"
                params={{ locale: localeParam(locale) }}
                target="_blank"
              >
                {t.before.consentLink}
              </Link>{" "}
              {t.before.consentAfter}
            </field.CheckboxField>
          )}
        </form.AppField>
        <form.Field name="website">
          {(field) => (
            <div className="enquiry-trap" aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            </div>
          )}
        </form.Field>
        <div className="enquiry-submit">
          <button className="btn btn-red" type="submit" disabled={mutation.isPending}>
            {t.submit}
          </button>
          {mutation.isPending ? <p className="muted">{t.sending}</p> : null}
          {failure === null ? null : (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
        </div>
      </section>
    </form>
  );
}

type PhotoGroups = Record<EnquiryPhotoKind, ReadonlyArray<PickedPhoto>>;

type PhotoCountText = {
  readonly tooFew: string;
  readonly tooMany: (max: number) => string;
};

type FailureText = (typeof ENQUIRY_TEXT)[keyof typeof ENQUIRY_TEXT]["errors"];

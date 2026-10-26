import { Predicate, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { ReorderGalleryInput } from "../../src/gallery";
import { CreateGuestSpotInput } from "../../src/guest-spots";
import { ImportInstagramPostInput } from "../../src/instagram";
import { TravelSearch, TravelSearchForm, UpdateTravelSettingsInput } from "../../src/travel";

const decodeGuestSpot = Schema.decodeUnknownResult(CreateGuestSpotInput);

const validSpot = {
  city: "Düsseldorf",
  country: "Germany",
  studioName: "Host Studio",
  address: "",
  startsOn: "2026-11-19",
  endsOn: "2026-11-23",
  status: "open",
  note: "",
};

const validSettings = {
  coachFareEuros: 10,
  coachMinutes: 50,
  carDayMinEuros: 20,
  carDayMaxEuros: 35,
  rideMinEuros: 35,
  rideMaxEuros: 55,
  driveMinutes: 40,
  hotelFromEuros: 45,
  hotelTypicalMinEuros: 60,
  hotelTypicalMaxEuros: 110,
};

/** The paths of the problems a form would show, such as `endsOn`. */
const issuePaths =
  (schema: Parameters<typeof Schema.toStandardSchemaV1>[0]) => async (input: unknown) => {
    const result = await Schema.toStandardSchemaV1(schema)["~standard"].validate(input);

    return (result.issues ?? []).map((issue) =>
      (issue.path ?? [])
        .map((segment) => String(Predicate.hasProperty(segment, "key") ? segment.key : segment))
        .join("."),
    );
  };

describe("CreateGuestSpotInput", () => {
  it.each([
    { name: "a valid spot", input: validSpot, ok: true },
    { name: "a one-day spot", input: { ...validSpot, endsOn: "2026-11-19" }, ok: true },
    {
      name: "a spot that ends before it starts",
      input: { ...validSpot, endsOn: "2026-11-18" },
      ok: false,
    },
    { name: "an impossible date", input: { ...validSpot, startsOn: "2026-02-30" }, ok: false },
    {
      name: "a date with a time",
      input: { ...validSpot, startsOn: "2026-11-19T10:00" },
      ok: false,
    },
    { name: "a blank city", input: { ...validSpot, city: "   " }, ok: false },
    { name: "an unknown status", input: { ...validSpot, status: "maybe" }, ok: false },
  ])("$name: valid $ok", ({ input, ok }) => {
    expect(decodeGuestSpot(input)._tag).toBe(ok ? "Success" : "Failure");
  });

  it("puts the date-order problem on the last day", async () => {
    expect(await issuePaths(CreateGuestSpotInput)({ ...validSpot, endsOn: "2026-11-01" })).toEqual([
      "endsOn",
    ]);
  });
});

describe("ReorderGalleryInput", () => {
  const first = "3f2a1c9e-8b4d-4e6f-9a0b-1c2d3e4f5a6b";
  const second = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";

  it.each([
    { name: "distinct photos", ids: [first, second], ok: true },
    { name: "an empty gallery", ids: [], ok: true },
    { name: "a photo listed twice", ids: [first, second, first], ok: false },
    { name: "an ID that is not a UUID", ids: [first, "photo-2"], ok: false },
  ])("$name: valid $ok", ({ ids, ok }) => {
    expect(Schema.decodeResult(ReorderGalleryInput)({ ids })._tag).toBe(ok ? "Success" : "Failure");
  });
});

// The media ID becomes part of a Graph API address, so only digits may reach it.
describe("ImportInstagramPostInput", () => {
  it.each([
    { name: "an Instagram media ID", mediaId: "17895695668004550", ok: true },
    { name: "another path", mediaId: "me/accounts", ok: false },
    { name: "a relative path", mediaId: "../17841400000000000/media", ok: false },
    { name: "extra parameters", mediaId: "17895695668004550?fields=id", ok: false },
    { name: "an empty ID", mediaId: "", ok: false },
  ])("$name: valid $ok", async ({ mediaId, ok }) => {
    expect(await issuePaths(ImportInstagramPostInput)({ mediaId })).toEqual(ok ? [] : ["mediaId"]);
  });
});

describe("TravelSearchForm", () => {
  const trip = { from: "London", arrive: "2026-12-03", leave: "2026-12-06" };

  it.each([
    { name: "a city and both dates", input: trip, paths: [] },
    { name: "a city without dates", input: { ...trip, arrive: "", leave: "" }, paths: [] },
    { name: "a blank city", input: { ...trip, from: "  " }, paths: ["from"] },
    { name: "only the day they arrive", input: { ...trip, leave: "" }, paths: ["leave"] },
    { name: "only the day they leave", input: { ...trip, arrive: "" }, paths: ["arrive"] },
    {
      name: "leaving the day they arrive",
      input: { ...trip, leave: trip.arrive },
      paths: ["leave"],
    },
    { name: "the dates swapped", input: { ...trip, leave: "2026-12-01" }, paths: ["leave"] },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(TravelSearchForm)(input)).toEqual(paths);
  });
});

describe("TravelSearch", () => {
  // The search comes from the address bar. A bad one must show the empty form, not an error page.
  it.each([
    {
      name: "the dates swapped",
      search: { from: "London", arrive: "2026-12-06", leave: "2026-12-03" },
    },
    {
      name: "a date that is not a date",
      search: { from: "London", arrive: "soon", leave: "later" },
    },
    { name: "a blank city", search: { from: " " } },
  ])("turns $name into no search", ({ search }) => {
    expect(Schema.decodeUnknownSync(TravelSearch)(search)).toEqual({});
  });

  it("keeps a valid search", () => {
    const search = { from: "London", arrive: "2026-12-03", leave: "2026-12-06" };

    expect(Schema.decodeUnknownSync(TravelSearch)(search)).toEqual(search);
  });
});

describe("UpdateTravelSettingsInput", () => {
  it.each([
    { name: "valid figures", input: validSettings, paths: [] },
    { name: "a free coach", input: { ...validSettings, coachFareEuros: 0 }, paths: [] },
    // An empty number input holds NaN.
    {
      name: "an empty fare",
      input: { ...validSettings, coachFareEuros: Number.NaN },
      paths: ["coachFareEuros"],
    },
    {
      name: "a price with cents",
      input: { ...validSettings, coachFareEuros: 9.5 },
      paths: ["coachFareEuros"],
    },
    {
      name: "a negative price",
      input: { ...validSettings, hotelFromEuros: -1 },
      paths: ["hotelFromEuros"],
    },
    {
      name: "a zero-minute journey",
      input: { ...validSettings, coachMinutes: 0 },
      paths: ["coachMinutes"],
    },
    {
      name: "a typical range that runs high to low",
      input: { ...validSettings, hotelTypicalMinEuros: 120 },
      paths: ["hotelTypicalMaxEuros"],
    },
    {
      name: "a rental car range that runs high to low",
      input: { ...validSettings, carDayMinEuros: 40 },
      paths: ["carDayMaxEuros"],
    },
    {
      name: "an Uber range that runs high to low",
      input: { ...validSettings, rideMinEuros: 60 },
      paths: ["rideMaxEuros"],
    },
    {
      name: "an empty drive time",
      input: { ...validSettings, driveMinutes: Number.NaN },
      paths: ["driveMinutes"],
    },
    {
      name: "a cheapest price above the typical range",
      input: { ...validSettings, hotelFromEuros: 70 },
      paths: ["hotelFromEuros"],
    },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(UpdateTravelSettingsInput)(input)).toEqual(paths);
  });
});

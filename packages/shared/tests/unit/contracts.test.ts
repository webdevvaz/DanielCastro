import { Predicate, Schema } from "effect";
import { describe, expect, it } from "vite-plus/test";

import { SaveEmailSettingsInput } from "../../src/email-settings";
import { EnquiryDetails, EnquiryFormData } from "../../src/enquiry";
import {
  CreateGalleryTagInput,
  GalleryUploadFormData,
  ReorderGalleryInput,
  UpdateGalleryPhotoInput,
} from "../../src/gallery";
import { CreateGuestSpotInput } from "../../src/guest-spots";
import { ImportInstagramPostInput } from "../../src/instagram";
import {
  AddToShopCartInput,
  ShopCartId,
  ShopCheckoutInput,
  ShopProductInput,
  UpdateShopCartLineInput,
} from "../../src/shop";
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

/** The multipart body of a gallery upload; `null` leaves the section out. */
const uploadWith = (section: string | null, file: File) => {
  const formData = new FormData();

  formData.append("photo", file);

  if (section !== null) formData.append("section", section);

  return formData;
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
    { name: "distinct work photos", section: "work", ids: [first, second], ok: true },
    { name: "distinct studio photos", section: "studio", ids: [first, second], ok: true },
    { name: "an empty section", section: "studio", ids: [], ok: true },
    { name: "a photo listed twice", section: "work", ids: [first, second, first], ok: false },
    { name: "an ID that is not a UUID", section: "work", ids: [first, "photo-2"], ok: false },
    { name: "an unknown section", section: "shop", ids: [first], ok: false },
    { name: "no section", section: undefined, ids: [first], ok: false },
  ])("$name: valid $ok", ({ section, ids, ok }) => {
    expect(Schema.decodeUnknownResult(ReorderGalleryInput)({ section, ids })._tag).toBe(
      ok ? "Success" : "Failure",
    );
  });
});

describe("CreateGalleryTagInput", () => {
  const translations = { en: "", pt: "Fantasia sombria", fr: "", de: "", es: "" };

  it.each([
    {
      name: "a theme with a translation",
      input: { kind: "theme", name: "Dark fantasy", translations },
      paths: [],
    },
    { name: "a series", input: { kind: "series", name: "Berserk", translations }, paths: [] },
    { name: "a blank name", input: { kind: "theme", name: "   ", translations }, paths: ["name"] },
    {
      name: "a translation that is too long",
      input: {
        kind: "theme",
        name: "Gothic",
        translations: { ...translations, fr: "x".repeat(61) },
      },
      paths: ["translations.fr"],
    },
    {
      name: "a missing language",
      input: { kind: "theme", name: "Gothic", translations: { en: "", pt: "", fr: "", de: "" } },
      paths: ["translations.es"],
    },
    {
      name: "an unknown kind",
      input: { kind: "style", name: "Gothic", translations },
      paths: ["kind"],
    },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(CreateGalleryTagInput)(input)).toEqual(paths);
  });
});

describe("UpdateGalleryPhotoInput", () => {
  const photo = "3f2a1c9e-8b4d-4e6f-9a0b-1c2d3e4f5a6b";
  const theme = "7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f";
  const details = {
    id: photo,
    title: "Asta",
    placement: "Forearm",
    seriesId: null,
    themeIds: [theme],
  };

  it.each([
    { name: "themes and no series", input: details, paths: [] },
    { name: "a series", input: { ...details, seriesId: theme }, paths: [] },
    {
      name: "a theme listed twice",
      input: { ...details, themeIds: [theme, theme] },
      paths: ["themeIds"],
    },
    {
      name: "a series that is not a UUID",
      input: { ...details, seriesId: "berserk" },
      paths: ["seriesId"],
    },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(UpdateGalleryPhotoInput)(input)).toEqual(paths);
  });
});

// An upload names its gallery section; the server stores the photo there and nowhere else.
describe("GalleryUploadFormData", () => {
  const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" });
  const text = new File(["hello"], "notes.txt", { type: "text/plain" });

  it.each([
    { name: "a work photo", section: "work", file: jpeg, ok: true },
    { name: "a studio photo", section: "studio", file: jpeg, ok: true },
    { name: "an unknown section", section: "shop", file: jpeg, ok: false },
    { name: "no section", section: null, file: jpeg, ok: false },
    { name: "a file that is not an image", section: "work", file: text, ok: false },
  ])("$name: valid $ok", ({ section, file, ok }) => {
    expect(Schema.is(GalleryUploadFormData)(uploadWith(section, file))).toBe(ok);
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
    // An empty number input holds null.
    {
      name: "an empty fare",
      input: { ...validSettings, coachFareEuros: null },
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
      input: { ...validSettings, driveMinutes: null },
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

// "Buy now" sends a variant ID and a quantity from the browser; only real variant IDs and small
// quantities may reach Shopify.
describe("ShopCheckoutInput", () => {
  const variantId = "gid://shopify/ProductVariant/41463235641541";

  it.each([
    { name: "one item", input: { variantId, quantity: 1 }, paths: [] },
    { name: "the most items", input: { variantId, quantity: 5 }, paths: [] },
    { name: "no items", input: { variantId, quantity: 0 }, paths: ["quantity"] },
    { name: "too many items", input: { variantId, quantity: 6 }, paths: ["quantity"] },
    { name: "part of an item", input: { variantId, quantity: 1.5 }, paths: ["quantity"] },
    {
      name: "a product ID instead of a variant",
      input: { variantId: "gid://shopify/Product/7380000000000", quantity: 1 },
      paths: ["variantId"],
    },
    {
      name: "an ID with extra text",
      input: { variantId: `${variantId}?quantity=99`, quantity: 1 },
      paths: ["variantId"],
    },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(ShopCheckoutInput)(input)).toEqual(paths);
  });
});

// A product page's address names the product and the language; both come from the address bar.
describe("ShopProductInput", () => {
  it.each([
    { name: "a product in Portuguese", input: { locale: "pt", handle: "dark-virgo" }, paths: [] },
    {
      name: "an unknown language",
      input: { locale: "it", handle: "dark-virgo" },
      paths: ["locale"],
    },
    { name: "capital letters", input: { locale: "en", handle: "Dark-Virgo" }, paths: ["handle"] },
    { name: "a path", input: { locale: "en", handle: "../admin" }, paths: ["handle"] },
    { name: "an empty handle", input: { locale: "en", handle: "" }, paths: ["handle"] },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(ShopProductInput)(input)).toEqual(paths);
  });
});

// The enquiry form's answers come from the browser; the server must refuse what the studio cannot
// accept, and put each problem on its field so the form shows it there.
describe("EnquiryDetails", () => {
  const answers = {
    locale: "de",
    name: "Lena Vogel",
    age: 24,
    instagram: "@lena.vogel",
    email: "lena@example.test",
    phone: "",
    city: "Köln",
    country: "Germany",
    location: "braga",
    locationOther: "",
    theme: "Bloodborne",
    description: "The Hunter on the upper arm",
    questions: "",
    consent: true,
    website: "",
    secondsToFill: 120,
  };

  it.each([
    { name: "complete answers", input: answers, paths: [] },
    {
      name: "a guest spot",
      input: { ...answers, location: "3f2a1c9e-8b4d-4e6f-9a0b-1c2d3e4f5a6b" },
      paths: [],
    },
    {
      name: "another place, named",
      input: { ...answers, location: "other", locationOther: "Lisbon" },
      paths: [],
    },
    {
      name: "another place, unnamed",
      input: { ...answers, location: "other" },
      paths: ["locationOther"],
    },
    { name: "a made-up place", input: { ...answers, location: "paris" }, paths: ["location"] },
    { name: "a client under 18", input: { ...answers, age: 17 }, paths: ["age"] },
    { name: "an empty age", input: { ...answers, age: null }, paths: ["age"] },
    {
      name: "a negative fill time",
      input: { ...answers, secondsToFill: -1 },
      paths: ["secondsToFill"],
    },
    { name: "no consent", input: { ...answers, consent: false }, paths: ["consent"] },
    {
      name: "a filled-in bot field",
      input: { ...answers, website: "spam.example" },
      paths: ["website"],
    },
    {
      name: "an Instagram link",
      input: { ...answers, instagram: "instagram.com/lena" },
      paths: ["instagram"],
    },
    { name: "an unknown language", input: { ...answers, locale: "it" }, paths: ["locale"] },
    { name: "a blank theme", input: { ...answers, theme: "   " }, paths: ["theme"] },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    // A field can report more than one problem; the form shows one message per field.
    expect([...new Set(await issuePaths(EnquiryDetails)(input))]).toEqual(paths);
  });
});

// The photos arrive as files beside the JSON answers. Counts follow the studio's Google Form, and
// anything but a JPG, PNG, or WebP image is refused before the server reads it.
/** A small JPEG file; each photo of a form needs its own. */
const jpegFile = () =>
  new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" });

describe("EnquiryFormData", () => {
  const text = new File(["hello"], "notes.txt", { type: "text/plain" });

  const answers = JSON.stringify({
    locale: "en",
    name: "Sam Lee",
    age: 30,
    instagram: "sam",
    email: "sam@example.test",
    phone: "",
    city: "Leeds",
    country: "United Kingdom",
    location: "braga",
    locationOther: "",
    theme: "Evangelion",
    description: "Unit-01 on the back",
    questions: "",
    consent: true,
    website: "",
    secondsToFill: 120,
  });

  const formWith = (
    counts: Record<"reference" | "favourite" | "placement", number>,
    extra?: File,
  ) => {
    const formData = new FormData();

    formData.append("details", answers);

    for (const [kind, count] of Object.entries(counts)) {
      for (let index = 0; index < count; index += 1) formData.append(kind, jpegFile());
    }

    if (extra !== undefined) formData.append("placement", extra);

    return formData;
  };

  it.each([
    {
      name: "one photo of each kind",
      form: formWith({ reference: 1, favourite: 1, placement: 1 }),
      ok: true,
    },
    {
      name: "the most photos",
      form: formWith({ reference: 10, favourite: 10, placement: 5 }),
      ok: true,
    },
    {
      name: "no placement photo",
      form: formWith({ reference: 1, favourite: 1, placement: 0 }),
      ok: false,
    },
    {
      name: "11 references",
      form: formWith({ reference: 11, favourite: 1, placement: 1 }),
      ok: false,
    },
    {
      name: "6 placement photos",
      form: formWith({ reference: 1, favourite: 1, placement: 6 }),
      ok: false,
    },
    {
      name: "a text file among the photos",
      form: formWith({ reference: 1, favourite: 1, placement: 1 }, text),
      ok: false,
    },
  ])("$name: valid $ok", ({ form, ok }) => {
    expect(Schema.is(EnquiryFormData)(form)).toBe(ok);
  });
});

// The admin sets who sends and receives enquiry emails; a malformed address would make every
// email fail.
describe("SaveEmailSettingsInput", () => {
  const settings = {
    sender: "Daniel Castro <enquiries@studio.test>",
    recipients: "joana@studio.test, daniel@studio.test",
  };

  it.each([
    { name: "a named sender and two recipients", input: settings, paths: [] },
    {
      name: "a bare sender address",
      input: { ...settings, sender: "enquiries@studio.test" },
      paths: [],
    },
    {
      name: "a sender without an address",
      input: { ...settings, sender: "Daniel Castro" },
      paths: ["sender"],
    },
    { name: "no recipients", input: { ...settings, recipients: " , " }, paths: ["recipients"] },
    {
      name: "one malformed recipient",
      input: { ...settings, recipients: "joana@studio.test, daniel" },
      paths: ["recipients"],
    },
    {
      name: "six recipients",
      input: {
        ...settings,
        recipients: Array.from({ length: 6 }, (_, index) => `r${String(index)}@studio.test`).join(
          ",",
        ),
      },
      paths: ["recipients"],
    },
  ])("$name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(SaveEmailSettingsInput)(input)).toEqual(paths);
  });
});

// The cart's inputs come from the browser. Only real Shopify IDs and small quantities may reach
// Shopify; the cart ID also comes from a cookie the visitor can edit.
describe("shop cart inputs", () => {
  const lineId =
    "gid://shopify/CartLine/2aa000d8-be6f-4a57-89d9-78ae9541ea3a?cart=hWNJ6UbB2tAWL3PnHnedr5l5";
  const variantId = "gid://shopify/ProductVariant/41463235641541";

  it.each([
    { name: "a new quantity", input: { locale: "pt", lineId, quantity: 3 }, paths: [] },
    { name: "removing the line", input: { locale: "pt", lineId, quantity: 0 }, paths: [] },
    { name: "too many items", input: { locale: "pt", lineId, quantity: 21 }, paths: ["quantity"] },
    {
      name: "a negative quantity",
      input: { locale: "pt", lineId, quantity: -1 },
      paths: ["quantity"],
    },
    {
      name: "a variant ID instead of a line",
      input: { locale: "pt", lineId: variantId, quantity: 1 },
      paths: ["lineId"],
    },
    {
      name: "a line ID with extra text",
      input: { locale: "pt", lineId: `${lineId}&quantity=99`, quantity: 1 },
      paths: ["lineId"],
    },
  ])("UpdateShopCartLineInput, $name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(UpdateShopCartLineInput)(input)).toEqual(paths);
  });

  it.each([
    { name: "one item", input: { locale: "de", variantId, quantity: 1 }, paths: [] },
    {
      name: "too many at once",
      input: { locale: "de", variantId, quantity: 6 },
      paths: ["quantity"],
    },
    {
      name: "an unknown language",
      input: { locale: "it", variantId, quantity: 1 },
      paths: ["locale"],
    },
  ])("AddToShopCartInput, $name: problems at $paths", async ({ input, paths }) => {
    expect(await issuePaths(AddToShopCartInput)(input)).toEqual(paths);
  });

  it.each([
    {
      name: "a cart ID",
      value: "gid://shopify/Cart/hWNJ6UbB2tAWL3PnHnedr5l5?key=9175571464cdcb84b7a642814769468d",
      ok: true,
    },
    { name: "another kind of ID", value: "gid://shopify/Customer/123", ok: false },
    { name: "extra parameters", value: "gid://shopify/Cart/abc?key=1&other=2", ok: false },
    { name: "a GraphQL fragment", value: 'gid://shopify/Cart/abc") { id }', ok: false },
  ])("ShopCartId, $name: valid $ok", ({ value, ok }) => {
    expect(Schema.is(ShopCartId)(value)).toBe(ok);
  });
});

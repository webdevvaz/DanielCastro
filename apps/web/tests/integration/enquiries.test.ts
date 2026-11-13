import { Auth, layer as AuthLayer } from "@daniel/auth";
import {
  Database,
  getBookingSettings,
  getEmailSettings,
  getEnquiry,
  listEnquiries,
  saveBookingSettings,
  saveResendKey,
} from "@daniel/db";
import { guestSpot, user } from "@daniel/db/schema";
import { TestDatabaseLive, TestDatabaseUrl } from "@daniel/db/testing";
import { layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Redacted } from "effect";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, expect } from "vite-plus/test";

import { enquiryPhotoUrl } from "../../src/enquiries/enquiry-files";
import {
  getEmailSettingsView,
  removeResendKey,
  replaceResendKey,
  sendTestEmail,
  updateEmailAddresses,
} from "../../src/server/email/email-settings.server";
import { ResendLive } from "../../src/server/email/resend.server";
import { SecretBox, SecretBoxLive } from "../../src/server/email/secret-box.server";
import { getEnquiryPhotoResponse } from "../../src/server/enquiries/enquiry-photo-route.server";
import { EnquiryRateLimitLive } from "../../src/server/enquiries/enquiry-rate-limit.server";
import {
  removeEnquiry,
  sendEnquiryEmailAgain,
  submitEnquiry,
} from "../../src/server/enquiries/enquiry.server";
import { PhotoStorageLive } from "../../src/server/gallery/photo-storage.server";
import { RequestHeaders } from "../../src/server/request-headers.server";

const BASE_URL = "http://localhost:3000";

const PASSWORD = "DanielTest1!";

const API_KEY = "re_test_key_1234567890abcdWXYZ";

const photoDirectory = mkdtempSync(join(tmpdir(), "daniel-enquiries-"));

afterAll(() => rmSync(photoDirectory, { recursive: true, force: true }));

type Answer = { readonly status: number; readonly body: unknown };

/** What the fake Resend answers next, and every request it received. */
const resend = {
  answer: { status: 200, body: { id: "email-1" } } as Answer,
  requests: [] as Array<{
    authorization: string | undefined;
    body: {
      from: string;
      to: ReadonlyArray<string>;
      reply_to?: string;
      attachments: ReadonlyArray<{ filename: string; content: string }>;
    };
    traced: boolean;
  }>,
};

const fakeResendClient = HttpClient.make((request, _url, _signal, fiber) => {
  const body =
    request.body._tag === "Uint8Array" ? new TextDecoder().decode(request.body.body) : "{}";

  resend.requests.push({
    authorization: request.headers.authorization,
    body: JSON.parse(body) as (typeof resend.requests)[number]["body"],
    traced: !fiber.getRef(HttpClient.TracerDisabledWhen)(request),
  });

  return Effect.succeed(
    HttpClientResponse.fromWeb(
      request,
      new Response(JSON.stringify(resend.answer.body), {
        status: resend.answer.status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
});

/** The app's settings for the test cluster and the temporary photo folder. */
const TestConfigLive = Layer.unwrap(
  Effect.gen(function* () {
    const databaseUrl = yield* TestDatabaseUrl;

    return ConfigProvider.layer(
      ConfigProvider.fromUnknown({
        BETTER_AUTH_SECRET: "integration-test-secret-with-32-characters",
        BETTER_AUTH_URL: BASE_URL,
        DATABASE_URL: databaseUrl,
        NODE_ENV: "test",
        PHOTO_STORAGE_DIR: photoDirectory,
        AUTH_IP_ADDRESS_HEADER: "x-real-ip",
      }),
    );
  }),
);

const TestAppLive = Layer.mergeAll(
  AuthLayer,
  PhotoStorageLive,
  SecretBoxLive,
  EnquiryRateLimitLive,
  // A request without a client address; tests that need one provide their own headers.
  Layer.succeed(RequestHeaders, new Headers()),
  ResendLive.pipe(Layer.provide(Layer.succeed(HttpClient.HttpClient, fakeResendClient))),
).pipe(Layer.provideMerge(TestConfigLive), Layer.provideMerge(TestDatabaseLive));

/** A box sealed with another `BETTER_AUTH_SECRET`, as after the secret changed. */
// `fresh`: the test layer already built `SecretBoxLive`, and a provided layer reuses that build.
const OtherSecretBoxLive = Layer.fresh(SecretBoxLive).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ BETTER_AUTH_SECRET: "another-secret-with-at-least-32-chars" }),
    ),
  ),
);

const imageBytes = (format: "png" | "jpeg", color: string) =>
  Effect.promise(() => {
    const image = sharp({ create: { width: 900, height: 1200, channels: 3, background: color } });

    return (format === "png" ? image.png() : image.jpeg()).toBuffer();
  }).pipe(Effect.map((buffer) => new Uint8Array(buffer)));

const details = (overrides: Record<string, unknown> = {}) => ({
  locale: "fr",
  name: "Camille Martin",
  age: 29,
  instagram: "@camille.ink",
  email: "camille@example.test",
  phone: "",
  city: "Lyon",
  country: "France",
  location: "braga",
  locationOther: "",
  theme: "Berserk",
  description: "Guts and the Brand on the calf",
  questions: "",
  consent: true,
  website: "",
  secondsToFill: 90,
  ...overrides,
});

/** A complete form: the answers, and one image of each kind. */
const enquiryForm = (overrides: Record<string, unknown> = {}) =>
  Effect.gen(function* () {
    const png = yield* imageBytes("png", "#c1121f");
    const jpeg = yield* imageBytes("jpeg", "#222222");

    const formData = new FormData();

    formData.append("details", JSON.stringify(details(overrides)));
    formData.append("reference", new File([png], "ref.png", { type: "image/png" }));
    formData.append("favourite", new File([jpeg], "fav.jpg", { type: "image/jpeg" }));
    formData.append("placement", new File([jpeg], "calf.jpg", { type: "image/jpeg" }));

    return formData;
  });

/**
 * A bot's submission from a client address: complete, but filled at once. It counts toward the
 * rate limit and saves nothing.
 */
const botSubmit = (address: string) =>
  Effect.gen(function* () {
    const formData = yield* enquiryForm({ secondsToFill: 1 });

    return yield* submitEnquiry(formData).pipe(
      Effect.provideService(RequestHeaders, new Headers({ "x-real-ip": address })),
    );
  });

/** The stored photo files of every enquiry, as `<enquiry ID>/<photo ID>.jpg`. */
const storedEnquiryFiles = () => {
  const root = join(photoDirectory, "enquiries");

  if (!existsSync(root)) return [];

  return readdirSync(root).flatMap((folder) =>
    readdirSync(join(root, folder)).map((name) => `${folder}/${name}`),
  );
};

/** The newest enquiry, which the last submission created. */
const newestEnquiry = Effect.gen(function* () {
  const [newest] = yield* listEnquiries();

  if (newest === undefined) return yield* Effect.die("Expected an enquiry");

  return yield* getEnquiry(newest.id);
});

/** An admin row for `updatedBy`. */
const insertAdminRow = Effect.gen(function* () {
  const db = yield* Database;

  const id = crypto.randomUUID();

  yield* db.insert(user).values({ id, name: "Admin", email: `${id}@example.test`, role: "admin" });

  return id;
});

/** Saves complete email settings, as an admin does on the Email page. */
const configureEmail = Effect.gen(function* () {
  const adminId = yield* insertAdminRow;

  yield* updateEmailAddresses(adminId, {
    sender: "Daniel Castro <enquiries@studio.test>",
    recipients: "joana@studio.test,  daniel@studio.test",
  });

  yield* replaceResendKey(adminId, Redacted.make(API_KEY));

  return adminId;
});

/** Creates a user through Better Auth and returns headers carrying their session cookie. */
const signedInHeaders = Effect.fn("test.signedInHeaders")(function* (role: "user" | "admin") {
  const auth = yield* Auth;

  const email = `${role}-${crypto.randomUUID()}@example.test`;

  yield* Effect.promise(() =>
    auth.instance.api.createUser({ body: { email, password: PASSWORD, name: role, role } }),
  );

  const response = yield* Effect.promise(() =>
    auth.instance.api.signInEmail({ body: { email, password: PASSWORD }, asResponse: true }),
  );

  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");

  return new Headers({ cookie, origin: BASE_URL });
});

/** Asks the photo route for a path with these headers. */
const photoResponse = (path: string, headers: Headers) =>
  getEnquiryPhotoResponse(new Request(`${BASE_URL}${path}`, { headers })).pipe(
    Effect.provideService(RequestHeaders, headers),
  );

/**
 * The enquiry form end to end: photo checks and processing, file storage, the rows on a private
 * PostgreSQL cluster, and the studio's email through a fake Resend. A client's enquiry must never
 * be lost because email failed, and nothing may be half saved.
 */
layer(TestAppLive, { excludeTestServices: true, timeout: "180 seconds" })("enquiries", (it) => {
  it.effect(
    "saves the enquiry and its photos without sending when email is not set up, and deletes both",
    () =>
      Effect.gen(function* () {
        yield* removeResendKey(yield* insertAdminRow);

        const requestsBefore = resend.requests.length;

        yield* submitEnquiry(yield* enquiryForm());

        const enquiry = yield* newestEnquiry;

        expect(enquiry).toMatchObject({
          instagram: "camille.ink",
          phone: null,
          locationKind: "braga",
          emailStatus: "not_configured",
        });
        expect(enquiry.photos.map(({ kind }) => kind).sort()).toEqual([
          "favourite",
          "placement",
          "reference",
        ]);
        expect(storedEnquiryFiles()).toEqual(
          expect.arrayContaining(enquiry.photos.map((photo) => `${enquiry.id}/${photo.id}.jpg`)),
        );
        expect(resend.requests.length).toBe(requestsBefore);

        yield* removeEnquiry("admin", enquiry.id);

        expect((yield* getEnquiry(enquiry.id).pipe(Effect.flip))._tag).toBe("NotFoundError");
        expect(storedEnquiryFiles().filter((file) => file.startsWith(enquiry.id))).toEqual([]);
      }),
  );

  it.effect("saves nothing when a photo only claims to be an image", () =>
    Effect.gen(function* () {
      const enquiriesBefore = (yield* listEnquiries()).length;
      const filesBefore = storedEnquiryFiles();

      const formData = yield* enquiryForm();

      formData.append(
        "placement",
        new File([new TextEncoder().encode("not an image")], "renamed.jpg", { type: "image/jpeg" }),
      );

      const error = yield* submitEnquiry(formData).pipe(Effect.flip);

      expect(error._tag).toBe("InvalidInputError");
      expect((yield* listEnquiries()).length).toBe(enquiriesBefore);
      expect(storedEnquiryFiles()).toEqual(filesBefore);
    }),
  );

  it.effect("refuses a guest spot that has ended, and saves nothing", () =>
    Effect.gen(function* () {
      const db = yield* Database;

      const [ended] = yield* db
        .insert(guestSpot)
        .values({
          city: "Düsseldorf",
          country: "Germany",
          studioName: "Host Studio",
          startsOn: "2020-01-10",
          endsOn: "2020-01-12",
        })
        .returning({ id: guestSpot.id });

      const enquiriesBefore = (yield* listEnquiries()).length;

      const error = yield* submitEnquiry(yield* enquiryForm({ location: ended?.id })).pipe(
        Effect.flip,
      );

      expect(error._tag).toBe("ConflictError");
      expect((yield* listEnquiries()).length).toBe(enquiriesBefore);
    }),
  );

  it.effect(
    "emails the studio with the photos once the settings are complete, and keeps the key secret",
    () =>
      Effect.gen(function* () {
        yield* configureEmail;

        resend.answer = { status: 200, body: { id: "email-1" } };

        yield* submitEnquiry(yield* enquiryForm());

        const enquiry = yield* newestEnquiry;
        const request = resend.requests.at(-1);

        expect(enquiry.emailStatus).toBe("sent");
        expect(request?.authorization).toBe(`Bearer ${API_KEY}`);
        expect(request?.traced).toBe(false);
        expect(request?.body).toMatchObject({
          from: "Daniel Castro <enquiries@studio.test>",
          to: ["joana@studio.test", "daniel@studio.test"],
          reply_to: "camille@example.test",
        });
        expect(request?.body.attachments).toHaveLength(3);

        // The key leaves the server only towards Resend: the admin page sees its last four
        // characters, and the database holds it encrypted.
        const view = yield* getEmailSettingsView();
        const stored = yield* getEmailSettings();

        expect(view).toMatchObject({ key: "saved", keyHint: "WXYZ", ready: true });
        expect(JSON.stringify(view)).not.toContain(API_KEY);
        expect(stored?.resendKeyCiphertext).not.toContain(API_KEY);
      }),
  );

  it.effect("keeps the enquiry when Resend refuses, and sends it later", () =>
    Effect.gen(function* () {
      const adminId = yield* configureEmail;

      resend.answer = {
        status: 403,
        body: { statusCode: 403, message: "The studio.test domain is not verified" },
      };

      yield* submitEnquiry(yield* enquiryForm());

      const enquiry = yield* newestEnquiry;
      const testError = yield* sendTestEmail(adminId).pipe(Effect.flip);

      expect(enquiry.emailStatus).toBe("failed");
      expect(testError._tag).toBe("ConflictError");
      expect(testError.message).toContain("domain is not verified");

      resend.answer = { status: 200, body: { id: "email-2" } };

      yield* sendEnquiryEmailAgain(adminId, enquiry.id);

      expect((yield* getEnquiry(enquiry.id)).emailStatus).toBe("sent");
      expect(resend.requests.at(-1)?.body.attachments).toHaveLength(3);
    }),
  );

  it.effect("treats a key sealed with another secret as unreadable, and sends nothing", () =>
    Effect.gen(function* () {
      const adminId = yield* configureEmail;

      const foreign = yield* Effect.gen(function* () {
        const box = yield* SecretBox;

        return yield* box.seal(Redacted.make(API_KEY));
      }).pipe(Effect.provide(OtherSecretBoxLive));

      yield* saveResendKey({
        resendKeyCiphertext: foreign,
        resendKeyHint: "WXYZ",
        updatedBy: adminId,
      });

      const requestsBefore = resend.requests.length;

      yield* submitEnquiry(yield* enquiryForm());

      expect((yield* getEmailSettingsView()).key).toBe("unreadable");
      expect((yield* newestEnquiry).emailStatus).toBe("not_configured");
      expect(resend.requests.length).toBe(requestsBefore);
    }),
  );

  it.effect("shows a client's photo to a signed-in admin only", () =>
    Effect.gen(function* () {
      yield* submitEnquiry(yield* enquiryForm());

      const enquiry = yield* newestEnquiry;
      const photoId = enquiry.photos.at(0)?.id ?? "";
      const path = enquiryPhotoUrl(enquiry.id, photoId);

      const anonymous = yield* photoResponse(path, new Headers({ origin: BASE_URL }));
      const client = yield* photoResponse(path, yield* signedInHeaders("user"));
      const adminHeaders = yield* signedInHeaders("admin");
      const admin = yield* photoResponse(path, adminHeaders);
      const traversal = yield* photoResponse(
        `/api/enquiry-photos/${enquiry.id}/..%2F..%2Fgallery%2Fphoto.jpg`,
        adminHeaders,
      );

      expect(anonymous.status).toBe(404);
      expect(client.status).toBe(404);
      expect(admin.status).toBe(200);
      expect(admin.headers.get("content-type")).toBe("image/jpeg");
      expect(admin.headers.get("cache-control")).toContain("private");
      expect(traversal.status).toBe(404);
    }),
  );

  it.effect("refuses every enquiry while the books are closed, and saves nothing", () =>
    Effect.gen(function* () {
      const enquiriesBefore = (yield* listEnquiries()).length;
      const filesBefore = storedEnquiryFiles();

      yield* saveBookingSettings({ booksOpen: false, reopensOn: "2027-01-04" });

      const error = yield* submitEnquiry(yield* enquiryForm()).pipe(Effect.flip);

      expect(error._tag).toBe("ConflictError");
      expect((yield* listEnquiries()).length).toBe(enquiriesBefore);
      expect(storedEnquiryFiles()).toEqual(filesBefore);

      yield* saveBookingSettings({ booksOpen: true, reopensOn: "2027-01-04" });

      // Opening the books clears the reopening day, so visitors never see a stale one.
      expect(yield* getBookingSettings()).toEqual({ booksOpen: true, reopensOn: null });
    }),
  );

  it.effect(
    "ignores enquiries sent too fast, and limits each client address without blocking others",
    () =>
      Effect.gen(function* () {
        const enquiriesBefore = (yield* listEnquiries()).length;
        const filesBefore = storedEnquiryFiles();

        yield* Effect.gen(function* () {
          yield* Effect.forEach(Array.from({ length: 5 }), () => botSubmit("203.0.113.5"), {
            discard: true,
          });

          const limited = yield* botSubmit("203.0.113.5").pipe(Effect.flip);

          expect(limited._tag).toBe("TooManyRequestsError");

          // Another address still gets through.
          yield* botSubmit("198.51.100.7");
        }).pipe(Effect.provide(Layer.fresh(EnquiryRateLimitLive)));

        expect((yield* listEnquiries()).length).toBe(enquiriesBefore);
        expect(storedEnquiryFiles()).toEqual(filesBefore);
      }),
  );
});

import { layer } from "@effect/vitest";
import { Effect } from "effect";
import { expect } from "vite-plus/test";

import {
  deleteEnquiry,
  getEnquiry,
  insertEnquiry,
  listEnquiries,
  type NewEnquiry,
  type NewEnquiryPhoto,
} from "../../src";
import { TestDatabaseLive } from "../support/private-postgres";

const enquiryValues = (id: string): NewEnquiry => ({
  id,
  locale: "pt",
  name: "Rita Sousa",
  age: 27,
  instagram: "rita.ink",
  email: "rita@example.test",
  phone: null,
  city: "Porto",
  country: "Portugal",
  locationKind: "braga",
  guestSpotId: null,
  locationDetail: null,
  theme: "Zoro",
  description: "Zoro on the forearm",
  questions: null,
  emailStatus: "not_configured",
  consentedAt: new Date(),
});

const photo = (kind: NewEnquiryPhoto["kind"], position: number): NewEnquiryPhoto => ({
  id: crypto.randomUUID(),
  kind,
  position,
  width: 1200,
  height: 1600,
});

/**
 * An enquiry is saved with its photos as one unit: the web app stores the photo files first and
 * deletes them again when the rows fail, so a half-saved enquiry would point to missing files or
 * leave a client's photos without a record to delete them by.
 */
layer(TestDatabaseLive, { excludeTestServices: true, timeout: "60 seconds" })("enquiries", (it) => {
  it.effect("saves nothing when one photo row is refused", () =>
    Effect.gen(function* () {
      const before = (yield* listEnquiries()).length;
      const id = crypto.randomUUID();

      const error = yield* insertEnquiry(enquiryValues(id), [
        photo("reference", 0),
        photo("selfie" as NewEnquiryPhoto["kind"], 0),
      ]).pipe(Effect.flip);

      expect(error._tag).toBe("DatabaseError");
      expect((yield* listEnquiries()).length).toBe(before);
      expect((yield* getEnquiry(id).pipe(Effect.flip))._tag).toBe("NotFoundError");
    }),
  );

  it.effect("refuses a client under 18", () =>
    Effect.gen(function* () {
      const error = yield* insertEnquiry({ ...enquiryValues(crypto.randomUUID()), age: 17 }, [
        photo("reference", 0),
      ]).pipe(Effect.flip);

      expect(error._tag).toBe("DatabaseError");
    }),
  );

  it.effect("returns the photo IDs on delete and removes the photo rows with the enquiry", () =>
    Effect.gen(function* () {
      const id = crypto.randomUUID();
      const photos = [photo("reference", 0), photo("favourite", 0), photo("placement", 0)];

      yield* insertEnquiry(enquiryValues(id), photos);

      const saved = yield* getEnquiry(id);

      expect(saved.photos).toHaveLength(3);

      const removed = yield* deleteEnquiry(id);

      expect([...removed].sort()).toEqual(photos.map(({ id: photoId }) => photoId).sort());
      expect((yield* getEnquiry(id).pipe(Effect.flip))._tag).toBe("NotFoundError");
      expect((yield* deleteEnquiry(id).pipe(Effect.flip))._tag).toBe("NotFoundError");
    }),
  );
});

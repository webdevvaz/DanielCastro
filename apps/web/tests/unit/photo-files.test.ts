import { describe, expect, it } from "vite-plus/test";

import { photoFileNameFromPath, photoUrl } from "../../src/gallery/photo-files";

const KEY = "gallery/3f2a1c9e-8b4d-4e6f-9a0b-1c2d3e4f5a6b";

describe("photo URLs", () => {
  it("serves the file of every URL the app builds", () => {
    expect(photoFileNameFromPath(photoUrl(KEY, "large"))).toBe(`${KEY}-large.webp`);
    expect(photoFileNameFromPath(photoUrl(KEY, "thumb"))).toBe(`${KEY}-thumb.webp`);
  });

  it.each([
    { name: "parent folder", path: "/api/photos/../../.env.local" },
    { name: "encoded parent folder", path: "/api/photos/gallery%2F..%2F..%2F.env.local" },
    { name: "encoded backslash", path: "/api/photos/gallery%5C..%5Cpostgres%5Cpg_hba.conf" },
    { name: "another folder", path: `/api/photos/private/${KEY.slice(8)}-large.webp` },
    { name: "unknown size", path: `/api/photos/${KEY}-original.webp` },
    { name: "another file type", path: `/api/photos/${KEY}-large.png` },
    { name: "malformed encoding", path: "/api/photos/gallery%E0%A4%A" },
    { name: "outside the photo route", path: `/api/files/${KEY}-large.webp` },
  ])("refuses $name", ({ path }) => {
    expect(photoFileNameFromPath(path)).toBeNull();
  });
});

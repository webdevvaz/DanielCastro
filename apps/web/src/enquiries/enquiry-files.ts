/** Where the admin area loads enquiry photos from (`routes/api/enquiry-photos/$.ts`). */
const ENQUIRY_PHOTO_ROUTE = "/api/enquiry-photos";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * A stored enquiry photo: `enquiries/<enquiry ID>/<photo ID>.jpg`. Only names of this shape are
 * served, so a request cannot reach any other file.
 */
const ENQUIRY_FILE_PATTERN = new RegExp(`^enquiries/${UUID}/${UUID}\\.jpg$`);

/** The stored file name of an enquiry photo. */
export const enquiryPhotoFileName = (enquiryId: string, photoId: string) =>
  `enquiries/${enquiryId}/${photoId}.jpg`;

/** The URL of an enquiry photo. Only signed-in admins can open it. */
export const enquiryPhotoUrl = (enquiryId: string, photoId: string) =>
  `${ENQUIRY_PHOTO_ROUTE}/${enquiryId}/${photoId}.jpg`;

/**
 * The stored file name an enquiry photo URL path asks for, or null when the path is not one.
 * `%2F` and `..` cannot pass: the decoded name must match the stored-name pattern exactly.
 */
export function enquiryPhotoFileNameFromPath(pathname: string) {
  if (!pathname.startsWith(`${ENQUIRY_PHOTO_ROUTE}/`)) return null;

  let rest: string;

  try {
    rest = decodeURIComponent(pathname.slice(ENQUIRY_PHOTO_ROUTE.length + 1));
  } catch {
    return null;
  }

  const name = `enquiries/${rest}`;

  return ENQUIRY_FILE_PATTERN.test(name) ? name : null;
}

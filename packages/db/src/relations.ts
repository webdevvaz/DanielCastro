import { authRelations } from "./schema/auth";
import { emailSettingsRelations, enquiryRelations } from "./schema/enquiries";
import { galleryRelations } from "./schema/gallery";
import { guestSpotRelations } from "./schema/guest-spots";
import { instagramRelations } from "./schema/instagram";
import { travelRelations } from "./schema/travel";

/** Every relation part, merged for the relational query API. Add new parts here. */
export const relations = {
  ...authRelations,
  ...emailSettingsRelations,
  ...enquiryRelations,
  ...galleryRelations,
  ...guestSpotRelations,
  ...instagramRelations,
  ...travelRelations,
};

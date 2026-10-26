import { authRelations } from "./schema/auth";
import { galleryRelations } from "./schema/gallery";
import { guestSpotRelations } from "./schema/guest-spots";
import { instagramRelations } from "./schema/instagram";
import { travelRelations } from "./schema/travel";

/** Every relation part, merged for the relational query API. Add new parts here. */
export const relations = {
  ...authRelations,
  ...galleryRelations,
  ...guestSpotRelations,
  ...instagramRelations,
  ...travelRelations,
};

/** Product identity shown in the browser title, the side menu, and the admin area. */
export const appConfig: AppConfig = {
  name: "Daniel Castro",
  role: "Tattoo Artist",
  tagline: "A fan first. An artist through and through.",
  description:
    "Custom manga, anime, fantasy and gaming tattoos in black linework with strong contrast and a touch of red. Every design drawn by hand, for the person who wears it.",
  studio: {
    name: "Daniel Castro Tattoo Studio",
    addressLines: ["Rua da Ramoa, loja 80", "4700-855 Merelim S. Pedro", "Braga, Portugal"],
    email: "danielcastrotattooshop@gmail.com",
    coordinates: "41.5704216,-8.4521988",
  },
  links: {
    // The site's own enquiry form replaces this Google Form later (PRODUCT.md, journey 3).
    enquiry:
      "https://docs.google.com/forms/d/e/1FAIpQLScIKMz-n1q6GchMpAc_Kb5gCie4_CfcEPv4tdrCgdhVPE_YmQ/viewform",
    instagram: "https://www.instagram.com/danielcastro_tattooartist/",
    youtube: "https://www.youtube.com/@DanielCastroTattooArtist",
    shop: "https://necroticwear.com/",
    map: "https://www.google.com/maps/place/Daniel+Castro+Tattoo+Studio/@41.5704216,-8.4521988,17z",
  },
};

type AppConfig = {
  readonly name: string;
  readonly role: string;
  readonly tagline: string;
  readonly description: string;
  readonly studio: {
    readonly name: string;
    readonly addressLines: ReadonlyArray<string>;
    readonly email: string;
    /** Latitude and longitude, the destination of driving directions. */
    readonly coordinates: string;
  };
  readonly links: {
    /** Where "Book a session" goes: the project enquiry form. */
    readonly enquiry: string;
    readonly instagram: string;
    readonly youtube: string;
    readonly shop: string;
    readonly map: string;
  };
};

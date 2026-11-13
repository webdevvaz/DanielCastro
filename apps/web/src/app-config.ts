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
    instagram: "https://www.instagram.com/danielcastro_tattooartist/",
    tiktok: "https://www.tiktok.com/@danielcastrotattooartist",
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
    readonly instagram: string;
    readonly tiktok: string;
    readonly youtube: string;
    readonly shop: string;
    readonly map: string;
  };
};

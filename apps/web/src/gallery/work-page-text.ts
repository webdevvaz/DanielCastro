import type { Locale } from "@/i18n/locales";

/** The Work page's text, in English. The other languages give every entry. */
const en = {
  eyebrow: "Work",
  eyebrowDetail: "Braga · Custom tattoos",
  headingFirst: "Characters you love,",
  headingSecond: "drawn for skin.",
  themes: [
    "Anime",
    "Films",
    "Comic books",
    "Video games",
    "Mythologies",
    "Dark fantasy",
    "Gothic",
    "Spooky",
  ],
  empty: "The gallery is being prepared. Come back soon.",
};

/** The Work page's text, per language. */
export const WORK_PAGE_TEXT: Record<Locale, typeof en> = {
  en,
  pt: {
    eyebrow: "Trabalhos",
    eyebrowDetail: "Braga · Tatuagens personalizadas",
    headingFirst: "As personagens favoritas,",
    headingSecond: "desenhadas para a pele.",
    themes: [
      "Anime",
      "Cinema",
      "Banda desenhada",
      "Videojogos",
      "Mitologias",
      "Fantasia sombria",
      "Gótico",
      "Macabro",
    ],
    empty: "A galeria está a ser preparada. Volte em breve.",
  },
  fr: {
    eyebrow: "Réalisations",
    eyebrowDetail: "Braga · Tatouages sur mesure",
    headingFirst: "Les personnages que vous aimez,",
    headingSecond: "dessinés pour la peau.",
    themes: [
      "Anime",
      "Cinéma",
      "Comics",
      "Jeux vidéo",
      "Mythologies",
      "Dark fantasy",
      "Gothique",
      "Macabre",
    ],
    empty: "La galerie est en préparation. Revenez bientôt.",
  },
  de: {
    eyebrow: "Arbeiten",
    eyebrowDetail: "Braga · Individuelle Tattoos",
    headingFirst: "Charaktere, die du liebst,",
    headingSecond: "gezeichnet für die Haut.",
    themes: [
      "Anime",
      "Filme",
      "Comics",
      "Videospiele",
      "Mythologien",
      "Dark Fantasy",
      "Gothic",
      "Gruselig",
    ],
    empty: "Die Galerie wird gerade vorbereitet. Schau bald wieder vorbei.",
  },
  es: {
    eyebrow: "Trabajos",
    eyebrowDetail: "Braga · Tatuajes personalizados",
    headingFirst: "Los personajes que amas,",
    headingSecond: "dibujados para la piel.",
    themes: [
      "Anime",
      "Cine",
      "Cómics",
      "Videojuegos",
      "Mitologías",
      "Fantasía oscura",
      "Gótico",
      "Siniestro",
    ],
    empty: "La galería se está preparando. Vuelve pronto.",
  },
};

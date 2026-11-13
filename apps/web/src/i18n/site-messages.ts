import { localeFromParam, type Locale } from "./locales";
import { useLocale } from "./use-locale";

/**
 * Text that every public page shares: the menu, booking buttons, contact, the photo viewer, and
 * the error pages. Page text lives next to each page. English is the source; the other languages
 * must give every entry, which the `SiteMessages` type checks.
 */
const en = {
  nav: {
    work: "Work",
    news: "News",
    guestSpots: "Guest spots",
    travel: "Travel",
    howToBook: "How to book",
    aftercare: "Aftercare",
    about: "About",
    shop: "Shop",
    mainLabel: "Main",
    tabsLabel: "Pages",
  },
  tagline: { first: "A fan first.", second: "An artist through and through." },
  logoLabel: "Daniel Castro, work",
  nextGuestSpot: "Next guest spot",
  bookSession: "Book a session",
  bookShort: "Book",
  contact: {
    heading: "Studio",
    byAppointment: "By appointment only",
    admin: "Studio admin",
  },
  language: "Language",
  loading: "Loading",
  description:
    "Custom manga, anime, fantasy and gaming tattoos in black linework with strong contrast and a touch of red. Every design drawn by hand, for the person who wears it.",
  pageTitle: (page: string) => `${page} — Daniel Castro`,
  tattooAlt: "Tattoo by Daniel Castro",
  studioAlt: "Daniel Castro Tattoo Studio in Braga",
  viewer: {
    close: "Close",
    previous: "Previous photo",
    next: "Next photo",
    open: (title: string | null) => (title === null ? "View photo" : `View ${title}`),
  },
  errors: {
    eyebrow: "Error",
    signInTitle: "Please sign in",
    signInText: "Your session has ended. Sign in again to continue.",
    forbiddenTitle: "No access",
    forbiddenText: "Your account is not allowed to open this page.",
    genericTitle: "Something went wrong",
    genericText: "The page could not be loaded, and the error was logged. Try again in a moment.",
    signIn: "Sign in",
    tryAgain: "Try again",
    home: "Home page",
    notFoundTitle: "Page not found",
    notFoundText: "This page does not exist. Check the address, or go back home.",
  },
};

const pt: SiteMessages = {
  nav: {
    work: "Trabalhos",
    news: "Novidades",
    guestSpots: "Guest spots",
    travel: "Viagem",
    howToBook: "Como marcar",
    aftercare: "Cuidados",
    about: "Sobre",
    shop: "Loja",
    mainLabel: "Principal",
    tabsLabel: "Páginas",
  },
  tagline: { first: "Fã antes de tudo.", second: "Artista de corpo e alma." },
  logoLabel: "Daniel Castro, trabalhos",
  nextGuestSpot: "Próximo guest spot",
  bookSession: "Marcar sessão",
  bookShort: "Marcar",
  contact: {
    heading: "Estúdio",
    byAppointment: "Apenas por marcação",
    admin: "Admin do estúdio",
  },
  language: "Idioma",
  loading: "A carregar",
  description:
    "Tatuagens personalizadas de manga, anime, fantasia e videojogos, em linhas pretas com forte contraste e um toque de vermelho. Cada desenho é feito à mão, para quem o vai usar.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatuagem de Daniel Castro",
  studioAlt: "Estúdio Daniel Castro Tattoo em Braga",
  viewer: {
    close: "Fechar",
    previous: "Foto anterior",
    next: "Foto seguinte",
    open: (title) => (title === null ? "Ver foto" : `Ver ${title}`),
  },
  errors: {
    eyebrow: "Erro",
    signInTitle: "Inicie sessão",
    signInText: "A sua sessão terminou. Inicie sessão de novo para continuar.",
    forbiddenTitle: "Sem acesso",
    forbiddenText: "A sua conta não pode abrir esta página.",
    genericTitle: "Algo correu mal",
    genericText:
      "Não foi possível carregar a página, e o erro ficou registado. Tente de novo daqui a pouco.",
    signIn: "Iniciar sessão",
    tryAgain: "Tentar de novo",
    home: "Página inicial",
    notFoundTitle: "Página não encontrada",
    notFoundText: "Esta página não existe. Confirme o endereço, ou volte à página inicial.",
  },
};

const fr: SiteMessages = {
  nav: {
    work: "Réalisations",
    news: "Actualités",
    guestSpots: "Guest spots",
    travel: "Voyage",
    howToBook: "Réserver",
    aftercare: "Soins",
    about: "À propos",
    shop: "Boutique",
    mainLabel: "Principal",
    tabsLabel: "Pages",
  },
  tagline: { first: "Fan avant tout.", second: "Artiste jusqu’au bout des ongles." },
  logoLabel: "Daniel Castro, réalisations",
  nextGuestSpot: "Prochain guest spot",
  bookSession: "Réserver une séance",
  bookShort: "Réserver",
  contact: {
    heading: "Studio",
    byAppointment: "Uniquement sur rendez-vous",
    admin: "Admin du studio",
  },
  language: "Langue",
  loading: "Chargement",
  description:
    "Tatouages sur mesure manga, anime, fantasy et jeux vidéo, en linework noir au contraste marqué, avec une touche de rouge. Chaque dessin est fait à la main, pour la personne qui le porte.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatouage de Daniel Castro",
  studioAlt: "Le studio Daniel Castro Tattoo à Braga",
  viewer: {
    close: "Fermer",
    previous: "Photo précédente",
    next: "Photo suivante",
    open: (title) => (title === null ? "Voir la photo" : `Voir ${title}`),
  },
  errors: {
    eyebrow: "Erreur",
    signInTitle: "Veuillez vous connecter",
    signInText: "Votre session a expiré. Connectez-vous à nouveau pour continuer.",
    forbiddenTitle: "Accès refusé",
    forbiddenText: "Votre compte ne peut pas ouvrir cette page.",
    genericTitle: "Un problème est survenu",
    genericText:
      "La page n’a pas pu être chargée, et l’erreur a été enregistrée. Réessayez dans un instant.",
    signIn: "Se connecter",
    tryAgain: "Réessayer",
    home: "Page d’accueil",
    notFoundTitle: "Page introuvable",
    notFoundText: "Cette page n’existe pas. Vérifiez l’adresse, ou revenez à l’accueil.",
  },
};

const de: SiteMessages = {
  nav: {
    work: "Arbeiten",
    news: "Neuigkeiten",
    guestSpots: "Guest Spots",
    travel: "Anreise",
    howToBook: "Buchung",
    aftercare: "Pflege",
    about: "Über Daniel",
    shop: "Shop",
    mainLabel: "Hauptmenü",
    tabsLabel: "Seiten",
  },
  tagline: { first: "Zuerst Fan.", second: "Künstler durch und durch." },
  logoLabel: "Daniel Castro, Arbeiten",
  nextGuestSpot: "Nächster Guest Spot",
  bookSession: "Termin anfragen",
  bookShort: "Anfragen",
  contact: {
    heading: "Studio",
    byAppointment: "Nur mit Termin",
    admin: "Studio-Admin",
  },
  language: "Sprache",
  loading: "Wird geladen",
  description:
    "Individuelle Manga-, Anime-, Fantasy- und Gaming-Tattoos in schwarzem Linework mit starkem Kontrast und einem Hauch Rot. Jedes Motiv von Hand gezeichnet, für die Person, die es trägt.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tattoo von Daniel Castro",
  studioAlt: "Das Studio Daniel Castro Tattoo in Braga",
  viewer: {
    close: "Schließen",
    previous: "Vorheriges Foto",
    next: "Nächstes Foto",
    open: (title) => (title === null ? "Foto ansehen" : `${title} ansehen`),
  },
  errors: {
    eyebrow: "Fehler",
    signInTitle: "Bitte melde dich an",
    signInText: "Deine Sitzung ist abgelaufen. Melde dich erneut an, um weiterzumachen.",
    forbiddenTitle: "Kein Zugriff",
    forbiddenText: "Dein Konto darf diese Seite nicht öffnen.",
    genericTitle: "Etwas ist schiefgelaufen",
    genericText:
      "Die Seite konnte nicht geladen werden, und der Fehler wurde gespeichert. Versuch es gleich noch einmal.",
    signIn: "Anmelden",
    tryAgain: "Erneut versuchen",
    home: "Startseite",
    notFoundTitle: "Seite nicht gefunden",
    notFoundText: "Diese Seite gibt es nicht. Prüf die Adresse, oder geh zurück zur Startseite.",
  },
};

const es: SiteMessages = {
  nav: {
    work: "Trabajos",
    news: "Novedades",
    guestSpots: "Guest spots",
    travel: "Viaje",
    howToBook: "Cómo reservar",
    aftercare: "Cuidados",
    about: "Sobre Daniel",
    shop: "Tienda",
    mainLabel: "Principal",
    tabsLabel: "Páginas",
  },
  tagline: { first: "Fan ante todo.", second: "Artista hasta la médula." },
  logoLabel: "Daniel Castro, trabajos",
  nextGuestSpot: "Próximo guest spot",
  bookSession: "Reservar sesión",
  bookShort: "Reservar",
  contact: {
    heading: "Estudio",
    byAppointment: "Solo con cita previa",
    admin: "Admin del estudio",
  },
  language: "Idioma",
  loading: "Cargando",
  description:
    "Tatuajes personalizados de manga, anime, fantasía y videojuegos, en linework negro con fuerte contraste y un toque de rojo. Cada diseño dibujado a mano, para quien lo lleva.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatuaje de Daniel Castro",
  studioAlt: "Estudio Daniel Castro Tattoo en Braga",
  viewer: {
    close: "Cerrar",
    previous: "Foto anterior",
    next: "Foto siguiente",
    open: (title) => (title === null ? "Ver foto" : `Ver ${title}`),
  },
  errors: {
    eyebrow: "Error",
    signInTitle: "Inicia sesión",
    signInText: "Tu sesión ha terminado. Vuelve a iniciar sesión para continuar.",
    forbiddenTitle: "Sin acceso",
    forbiddenText: "Tu cuenta no puede abrir esta página.",
    genericTitle: "Algo ha salido mal",
    genericText:
      "No se ha podido cargar la página, y el error ha quedado registrado. Inténtalo de nuevo en un momento.",
    signIn: "Iniciar sesión",
    tryAgain: "Reintentar",
    home: "Página de inicio",
    notFoundTitle: "Página no encontrada",
    notFoundText: "Esta página no existe. Revisa la dirección, o vuelve a la página de inicio.",
  },
};

/** The shared site text, per language. */
export const SITE_MESSAGES: Record<Locale, SiteMessages> = { en, pt, fr, de, es };

/** The shared site text in the language of the current page. */
export function useSiteMessages() {
  return SITE_MESSAGES[useLocale()];
}

/**
 * A page's browser title in the language of its address, such as "Sobre — Daniel Castro" for
 * `/pt/about`. Route `head` functions use it, because they run outside components.
 */
export const pageTitleFor = (param: string | undefined, page: SitePage) => {
  const t = SITE_MESSAGES[localeFromParam(param)];

  return t.pageTitle(t.nav[page]);
};

/** The meta description of the public site in the language of an address. */
export const descriptionFor = (param: string | undefined) =>
  SITE_MESSAGES[localeFromParam(param)].description;

/** The shape every language's shared text must have: the English text's. */
export type SiteMessages = typeof en;

/** A public page with a menu label. */
export type SitePage = Exclude<keyof SiteMessages["nav"], "mainLabel" | "tabsLabel" | "shop">;

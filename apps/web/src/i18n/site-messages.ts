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
    enquiry: "Enquiry",
    privacy: "Privacy",
    cart: "Cart",
    mainLabel: "Main",
    tabsLabel: "Pages",
  },
  tagline: { first: "A fan first.", second: "An artist through and through." },
  logoLabel: "Daniel Castro, work",
  nextGuestSpot: "Next guest spot",
  bookSession: "Book a session",
  bookShort: "Book",
  cartCount: (count: number) => `${String(count)} in your cart`,
  contact: {
    heading: "Studio",
    byAppointment: "By appointment only",
    admin: "Studio admin",
    privacy: "Privacy",
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
    signInText: "Your session has ended. Sign in again to carry on.",
    forbiddenTitle: "No access",
    forbiddenText: "Your account doesn't have access to this page.",
    genericTitle: "Something went wrong",
    genericText:
      "This page couldn't load. The error has been logged; please try again in a moment.",
    signIn: "Sign in",
    tryAgain: "Try again",
    home: "Home page",
    notFoundTitle: "Page not found",
    notFoundText: "This page doesn't exist. Check the address, or head back to the home page.",
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
    enquiry: "Pedido de orçamento",
    privacy: "Privacidade",
    cart: "Carrinho",
    mainLabel: "Principal",
    tabsLabel: "Páginas",
  },
  tagline: { first: "Fã antes de tudo.", second: "Artista de corpo e alma." },
  logoLabel: "Daniel Castro, trabalhos",
  nextGuestSpot: "Próximo guest spot",
  bookSession: "Marcar sessão",
  bookShort: "Marcar",
  cartCount: (count) => `${String(count)} no carrinho`,
  contact: {
    heading: "Estúdio",
    byAppointment: "Só por marcação",
    admin: "Admin do estúdio",
    privacy: "Privacidade",
  },
  language: "Idioma",
  loading: "A carregar",
  description:
    "Tatuagens personalizadas de manga, anime, fantasia e videojogos, em traço preto de forte contraste com um toque de vermelho. Cada desenho é feito à mão, a pensar em quem o vai levar na pele.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatuagem de Daniel Castro",
  studioAlt: "O estúdio Daniel Castro Tattoo, em Braga",
  viewer: {
    close: "Fechar",
    previous: "Foto anterior",
    next: "Foto seguinte",
    open: (title) => (title === null ? "Ver foto" : `Ver ${title}`),
  },
  errors: {
    eyebrow: "Erro",
    signInTitle: "Inicie sessão",
    signInText: "A sua sessão terminou. Inicie sessão novamente para continuar.",
    forbiddenTitle: "Sem acesso",
    forbiddenText: "A sua conta não tem acesso a esta página.",
    genericTitle: "Algo correu mal",
    genericText:
      "Não foi possível carregar a página. O erro ficou registado; tente novamente daqui a pouco.",
    signIn: "Iniciar sessão",
    tryAgain: "Tentar novamente",
    home: "Página inicial",
    notFoundTitle: "Página não encontrada",
    notFoundText: "Esta página não existe. Confirme o endereço ou volte à página inicial.",
  },
};

const fr: SiteMessages = {
  nav: {
    work: "Réalisations",
    news: "Actualités",
    guestSpots: "Guest spots",
    travel: "Voyage",
    howToBook: "Réservation",
    aftercare: "Soins",
    about: "À propos",
    shop: "Boutique",
    enquiry: "Demande de devis",
    privacy: "Confidentialité",
    cart: "Panier",
    mainLabel: "Principal",
    tabsLabel: "Pages",
  },
  tagline: { first: "Fan avant tout.", second: "Artiste jusqu’au bout des ongles." },
  logoLabel: "Daniel Castro, réalisations",
  nextGuestSpot: "Prochain guest spot",
  bookSession: "Réserver une séance",
  bookShort: "Réserver",
  cartCount: (count) => `${String(count)} dans votre panier`,
  contact: {
    heading: "Studio",
    byAppointment: "Uniquement sur rendez-vous",
    admin: "Admin du studio",
    privacy: "Confidentialité",
  },
  language: "Langue",
  loading: "Chargement",
  description:
    "Tatouages sur mesure inspirés du manga, de l’anime, de la fantasy et du jeu vidéo : un trait noir très contrasté, relevé d’une touche de rouge. Chaque dessin est fait à la main, pour la personne qui le portera.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatouage de Daniel Castro",
  studioAlt: "Le studio Daniel Castro Tattoo, à Braga",
  viewer: {
    close: "Fermer",
    previous: "Photo précédente",
    next: "Photo suivante",
    open: (title) => (title === null ? "Voir la photo" : `Voir ${title}`),
  },
  errors: {
    eyebrow: "Erreur",
    signInTitle: "Veuillez vous connecter",
    signInText: "Votre session a expiré. Reconnectez-vous pour continuer.",
    forbiddenTitle: "Accès refusé",
    forbiddenText: "Votre compte n’a pas accès à cette page.",
    genericTitle: "Un problème est survenu",
    genericText:
      "La page n’a pas pu se charger. L’erreur a été enregistrée ; réessayez dans un instant.",
    signIn: "Se connecter",
    tryAgain: "Réessayer",
    home: "Page d’accueil",
    notFoundTitle: "Page introuvable",
    notFoundText: "Cette page n’existe pas. Vérifiez l’adresse ou revenez à l’accueil.",
  },
};

const de: SiteMessages = {
  nav: {
    work: "Arbeiten",
    news: "Neuigkeiten",
    guestSpots: "Guest Spots",
    travel: "Anreise",
    howToBook: "Termine",
    aftercare: "Pflege",
    about: "Über Daniel",
    shop: "Shop",
    enquiry: "Anfrage",
    privacy: "Datenschutz",
    cart: "Warenkorb",
    mainLabel: "Hauptmenü",
    tabsLabel: "Seiten",
  },
  tagline: { first: "Vor allem Fan.", second: "Künstler durch und durch." },
  logoLabel: "Daniel Castro, Arbeiten",
  nextGuestSpot: "Nächster Guest Spot",
  bookSession: "Termin anfragen",
  bookShort: "Anfragen",
  cartCount: (count) => `${String(count)} im Warenkorb`,
  contact: {
    heading: "Studio",
    byAppointment: "Nur nach Terminvereinbarung",
    admin: "Studio-Admin",
    privacy: "Datenschutz",
  },
  language: "Sprache",
  loading: "Wird geladen",
  description:
    "Individuelle Manga-, Anime-, Fantasy- und Gaming-Tattoos: schwarze Linien mit starkem Kontrast und einem Hauch Rot. Jedes Motiv wird von Hand gezeichnet – für die Person, die es tragen wird.",
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
    signInText: "Deine Sitzung ist abgelaufen. Melde dich neu an, um weiterzumachen.",
    forbiddenTitle: "Kein Zugriff",
    forbiddenText: "Dein Konto hat keinen Zugriff auf diese Seite.",
    genericTitle: "Etwas ist schiefgelaufen",
    genericText:
      "Die Seite konnte nicht geladen werden. Der Fehler wurde protokolliert – versuch es gleich noch einmal.",
    signIn: "Anmelden",
    tryAgain: "Noch einmal versuchen",
    home: "Startseite",
    notFoundTitle: "Seite nicht gefunden",
    notFoundText: "Diese Seite gibt es nicht. Prüf die Adresse oder geh zurück zur Startseite.",
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
    enquiry: "Solicitud de presupuesto",
    privacy: "Privacidad",
    cart: "Carrito",
    mainLabel: "Principal",
    tabsLabel: "Páginas",
  },
  tagline: { first: "Fan ante todo.", second: "Artista hasta la médula." },
  logoLabel: "Daniel Castro, trabajos",
  nextGuestSpot: "Próximo guest spot",
  bookSession: "Reservar sesión",
  bookShort: "Reservar",
  cartCount: (count) => `${String(count)} en tu carrito`,
  contact: {
    heading: "Estudio",
    byAppointment: "Solo con cita previa",
    admin: "Admin del estudio",
    privacy: "Privacidad",
  },
  language: "Idioma",
  loading: "Cargando",
  description:
    "Tatuajes personalizados de manga, anime, fantasía y videojuegos: línea negra de alto contraste con un toque de rojo. Cada diseño se dibuja a mano, pensado para quien lo va a llevar.",
  pageTitle: (page) => `${page} — Daniel Castro`,
  tattooAlt: "Tatuaje de Daniel Castro",
  studioAlt: "El estudio Daniel Castro Tattoo, en Braga",
  viewer: {
    close: "Cerrar",
    previous: "Foto anterior",
    next: "Foto siguiente",
    open: (title) => (title === null ? "Ver foto" : `Ver ${title}`),
  },
  errors: {
    eyebrow: "Error",
    signInTitle: "Inicia sesión",
    signInText: "Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.",
    forbiddenTitle: "Sin acceso",
    forbiddenText: "Tu cuenta no tiene acceso a esta página.",
    genericTitle: "Algo ha salido mal",
    genericText:
      "No se ha podido cargar la página. Hemos registrado el error; inténtalo de nuevo en un momento.",
    signIn: "Iniciar sesión",
    tryAgain: "Volver a intentarlo",
    home: "Página de inicio",
    notFoundTitle: "Página no encontrada",
    notFoundText: "Esta página no existe. Revisa la dirección o vuelve a la página de inicio.",
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
export type SitePage = Exclude<keyof SiteMessages["nav"], "mainLabel" | "tabsLabel">;

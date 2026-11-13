import type { Locale } from "@/i18n/locales";

/** The Guest spots page's text, in English. The other languages give every entry. */
const en = {
  eyebrowDetail: "On the road",
  headingFirst: "Daniel",
  headingSecond: "on the road.",
  lead: "Sessions in Braga and in other studios across Europe. Choose the city in your enquiry.",
  homeStudio: "Home studio",
  homeCity: "Braga, Portugal",
  openMap: "Open in Google Maps",
  upcoming: "Upcoming guest spots",
  emptyBefore: "No guest spots are announced right now. New dates appear here and on",
  cta: "Choose Braga or a guest spot city in your enquiry.",
  status: { open: "Books open", full: "Fully booked" },
};

/** The Guest spots page's text, per language. */
export const GUEST_SPOTS_PAGE_TEXT: Record<Locale, typeof en> = {
  en,
  pt: {
    eyebrowDetail: "Na estrada",
    headingFirst: "O Daniel",
    headingSecond: "na estrada.",
    lead: "Sessões em Braga e noutros estúdios pela Europa. Escolha a cidade no seu pedido.",
    homeStudio: "Estúdio principal",
    homeCity: "Braga, Portugal",
    openMap: "Abrir no Google Maps",
    upcoming: "Próximos guest spots",
    emptyBefore: "Não há guest spots anunciados de momento. As novas datas aparecem aqui e no",
    cta: "Escolha Braga ou a cidade de um guest spot no seu pedido.",
    status: { open: "Agenda aberta", full: "Esgotado" },
  },
  fr: {
    eyebrowDetail: "En tournée",
    headingFirst: "Daniel",
    headingSecond: "en tournée.",
    lead: "Des séances à Braga et dans d’autres studios en Europe. Choisissez la ville dans votre demande.",
    homeStudio: "Studio principal",
    homeCity: "Braga, Portugal",
    openMap: "Ouvrir dans Google Maps",
    upcoming: "Prochains guest spots",
    emptyBefore:
      "Aucun guest spot n’est annoncé pour le moment. Les nouvelles dates apparaissent ici et sur",
    cta: "Choisissez Braga ou la ville d’un guest spot dans votre demande.",
    status: { open: "Réservations ouvertes", full: "Complet" },
  },
  de: {
    eyebrowDetail: "Unterwegs",
    headingFirst: "Daniel",
    headingSecond: "unterwegs.",
    lead: "Sessions in Braga und in anderen Studios in ganz Europa. Wähl die Stadt in deiner Anfrage.",
    homeStudio: "Heimatstudio",
    homeCity: "Braga, Portugal",
    openMap: "In Google Maps öffnen",
    upcoming: "Kommende Guest Spots",
    emptyBefore: "Gerade sind keine Guest Spots angekündigt. Neue Termine erscheinen hier und auf",
    cta: "Wähl in deiner Anfrage Braga oder eine Guest-Spot-Stadt.",
    status: { open: "Termine frei", full: "Ausgebucht" },
  },
  es: {
    eyebrowDetail: "De gira",
    headingFirst: "Daniel",
    headingSecond: "de gira.",
    lead: "Sesiones en Braga y en otros estudios por Europa. Elige la ciudad en tu solicitud.",
    homeStudio: "Estudio principal",
    homeCity: "Braga, Portugal",
    openMap: "Abrir en Google Maps",
    upcoming: "Próximos guest spots",
    emptyBefore: "No hay guest spots anunciados ahora mismo. Las nuevas fechas aparecen aquí y en",
    cta: "Elige Braga o la ciudad de un guest spot en tu solicitud.",
    status: { open: "Agenda abierta", full: "Completo" },
  },
};

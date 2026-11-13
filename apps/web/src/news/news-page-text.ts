import type { Locale } from "@/i18n/locales";

/** The News page's text, in English. The other languages give every entry. */
const en = {
  eyebrowDetail: "From Instagram",
  headingFirst: "Fresh from",
  headingSecond: "the studio.",
  lead: "New work, flash, and guest spot dates, as Daniel posts them on Instagram.",
  empty: {
    ready: "No posts yet.",
    not_connected: "The latest posts are on Instagram.",
    unavailable: "The posts cannot load at this time. See them on Instagram.",
  },
  cta: "Follow Daniel for new work and flash days.",
  follow: "Follow on Instagram",
  kinds: { image: null, video: "Video", carousel: "Album" } as {
    readonly image: null;
    readonly video: string;
    readonly carousel: string;
  },
  postAlt: "Instagram post by Daniel Castro",
};

/** The News page's text, per language. */
export const NEWS_PAGE_TEXT: Record<Locale, typeof en> = {
  en,
  pt: {
    eyebrowDetail: "Do Instagram",
    headingFirst: "Acabado de sair",
    headingSecond: "do estúdio.",
    lead: "Trabalhos novos, flash e datas de guest spots, à medida que o Daniel os publica no Instagram.",
    empty: {
      ready: "Ainda não há publicações.",
      not_connected: "As publicações mais recentes estão no Instagram.",
      unavailable: "Não é possível carregar as publicações neste momento. Veja-as no Instagram.",
    },
    cta: "Siga o Daniel para ver trabalhos novos e dias de flash.",
    follow: "Seguir no Instagram",
    kinds: { image: null, video: "Vídeo", carousel: "Álbum" },
    postAlt: "Publicação de Daniel Castro no Instagram",
  },
  fr: {
    eyebrowDetail: "Depuis Instagram",
    headingFirst: "Tout juste sorti",
    headingSecond: "du studio.",
    lead: "Nouvelles réalisations, flashs et dates de guest spots, au fil des publications de Daniel sur Instagram.",
    empty: {
      ready: "Aucune publication pour l’instant.",
      not_connected: "Les dernières publications sont sur Instagram.",
      unavailable:
        "Les publications ne peuvent pas être chargées pour le moment. Retrouvez-les sur Instagram.",
    },
    cta: "Suivez Daniel pour ses nouvelles réalisations et ses journées flash.",
    follow: "Suivre sur Instagram",
    kinds: { image: null, video: "Vidéo", carousel: "Album" },
    postAlt: "Publication Instagram de Daniel Castro",
  },
  de: {
    eyebrowDetail: "Von Instagram",
    headingFirst: "Frisch",
    headingSecond: "aus dem Studio.",
    lead: "Neue Arbeiten, Flash und Guest-Spot-Termine, so wie Daniel sie auf Instagram postet.",
    empty: {
      ready: "Noch keine Beiträge.",
      not_connected: "Die neuesten Beiträge findest du auf Instagram.",
      unavailable:
        "Die Beiträge können gerade nicht geladen werden. Schau sie dir auf Instagram an.",
    },
    cta: "Folge Daniel für neue Arbeiten und Flash Days.",
    follow: "Auf Instagram folgen",
    kinds: { image: null, video: "Video", carousel: "Album" },
    postAlt: "Instagram-Beitrag von Daniel Castro",
  },
  es: {
    eyebrowDetail: "Desde Instagram",
    headingFirst: "Recién salido",
    headingSecond: "del estudio.",
    lead: "Trabajos nuevos, flash y fechas de guest spots, a medida que Daniel los publica en Instagram.",
    empty: {
      ready: "Todavía no hay publicaciones.",
      not_connected: "Las últimas publicaciones están en Instagram.",
      unavailable: "Las publicaciones no se pueden cargar en este momento. Míralas en Instagram.",
    },
    cta: "Sigue a Daniel para ver trabajos nuevos y días de flash.",
    follow: "Seguir en Instagram",
    kinds: { image: null, video: "Vídeo", carousel: "Álbum" },
    postAlt: "Publicación de Instagram de Daniel Castro",
  },
};

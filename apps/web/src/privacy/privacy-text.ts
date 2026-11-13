import type { Locale } from "@/i18n/locales";

/**
 * The privacy notice. It describes what the site really does: update it when the site collects
 * other data, uses another service, or keeps data for another time. The studio reviews it before
 * the site goes live (PRODUCT.md, "Privacy"). The studio answers in Portuguese and English, so
 * the notice exists in those two; the other languages show the English notice with a note.
 */
const en: PrivacyText = {
  eyebrowDetail: "Your data",
  headingFirst: "Privacy",
  headingSecond: "notice.",
  updated: "Last updated: 13 November 2026",
  translationNote: null,
  sections: [
    {
      title: "Who we are",
      paragraphs: [
        "Daniel Castro Tattoo Studio, Rua da Ramoa, loja 80, 4700-855 Merelim S. Pedro, Braga, Portugal, is responsible for the personal data this website collects. You can reach us at danielcastrotattooshop@gmail.com.",
      ],
    },
    {
      title: "What we collect, and why",
      paragraphs: [
        "When you send the enquiry form, we receive your name, age, Instagram username, email address, phone number (if you give it), city and country, where you would like to be tattooed, the description of your idea, your answers to the other questions, and the photos you add. Placement photos show the part of your body you want tattooed.",
        "We use this data only to answer your enquiry, prepare a quote, and book and plan your session, which you ask us to do by sending the form. We ask your age because we only tattoo people aged 18 or over.",
        "We do not use your data for advertising, and we never sell it.",
      ],
    },
    {
      title: "Who sees it",
      paragraphs: [
        "Daniel and Joana, the studio manager. To do this, the website uses a few service providers, who process the data only on our behalf:",
      ],
      items: [
        "the company that hosts the website and its database, where enquiries are stored;",
        "Resend, which delivers the email that tells the studio about your enquiry;",
        "Google (Gmail), where the studio receives and answers email.",
      ],
      after:
        "Some of these providers may process data outside the European Union. When they do, they use the safeguards the GDPR requires, such as the European Commission's standard contractual clauses.",
    },
    {
      title: "How long we keep it",
      paragraphs: [
        "We keep an enquiry while we talk about your tattoo and plan your sessions. When an enquiry does not lead to a booking, we delete it, with its photos, within 12 months of our last contact. You can ask us to delete it sooner at any time.",
      ],
    },
    {
      title: "Your rights",
      paragraphs: [
        "You can ask to see the data we hold about you, to correct it, to delete it, to limit how we use it, to object to its use, or to receive a copy to take elsewhere. Write to danielcastrotattooshop@gmail.com; we answer within one month.",
        "If you think we use your data wrongly, you can complain to the Portuguese data protection authority, the Comissão Nacional de Proteção de Dados (www.cnpd.pt).",
      ],
    },
    {
      title: "Cookies and other services",
      paragraphs: [
        "The website sets only the cookies it needs to work: one remembers the language you choose, and the studio team's sign-in uses others. There are no advertising or analytics cookies.",
        "The website loads its fonts from Google Fonts, which receives your IP address to send them. The shop's checkout takes place on the Necrotic Wear shop, under its own privacy policy. The links to Instagram, TikTok, YouTube, Google Maps, Google Flights, and Booking.com lead to those services, under their own policies.",
        "The travel estimator sends the city you type, and your dates, to flight and hotel price services, to find prices. It does not send anything that identifies you.",
      ],
    },
  ],
};

/** The privacy notice, per language. */
export const PRIVACY_TEXT: Record<Locale, PrivacyText> = {
  en,
  pt: {
    eyebrowDetail: "Os seus dados",
    headingFirst: "Aviso de",
    headingSecond: "privacidade.",
    updated: "Última atualização: 13 de novembro de 2026",
    translationNote: null,
    sections: [
      {
        title: "Quem somos",
        paragraphs: [
          "O Daniel Castro Tattoo Studio, Rua da Ramoa, loja 80, 4700-855 Merelim S. Pedro, Braga, Portugal, é responsável pelos dados pessoais que este site recolhe. Pode contactar-nos através de danielcastrotattooshop@gmail.com.",
        ],
      },
      {
        title: "O que recolhemos e porquê",
        paragraphs: [
          "Quando envia o formulário de pedido, recebemos o seu nome, idade, @ do Instagram, email, telemóvel (se o indicar), cidade e país, o local onde quer fazer a tatuagem, a descrição da sua ideia, as respostas às outras perguntas e as fotos que adiciona. As fotos da zona mostram a parte do corpo que quer tatuar.",
          "Usamos estes dados apenas para responder ao seu pedido, preparar um orçamento e marcar e planear a sua sessão, o que nos pede ao enviar o formulário. Pedimos a sua idade porque só tatuamos pessoas com 18 anos ou mais.",
          "Não usamos os seus dados para publicidade e nunca os vendemos.",
        ],
      },
      {
        title: "Quem os vê",
        paragraphs: [
          "O Daniel e a Joana, gestora do estúdio. Para isso, o site usa alguns prestadores de serviços, que tratam os dados apenas por nossa conta:",
        ],
        items: [
          "a empresa que aloja o site e a base de dados, onde os pedidos ficam guardados;",
          "a Resend, que entrega o email que avisa o estúdio do seu pedido;",
          "a Google (Gmail), onde o estúdio recebe e responde aos emails.",
        ],
        after:
          "Alguns destes prestadores podem tratar dados fora da União Europeia. Quando o fazem, usam as garantias que o RGPD exige, como as cláusulas contratuais-tipo da Comissão Europeia.",
      },
      {
        title: "Durante quanto tempo os guardamos",
        paragraphs: [
          "Guardamos um pedido enquanto falamos sobre a sua tatuagem e planeamos as sessões. Quando um pedido não dá origem a uma marcação, apagamo-lo, com as fotos, no prazo de 12 meses após o último contacto. Pode pedir-nos que o apaguemos antes, a qualquer momento.",
        ],
      },
      {
        title: "Os seus direitos",
        paragraphs: [
          "Pode pedir para ver os dados que temos sobre si, corrigi-los, apagá-los, limitar o seu uso, opor-se ao seu uso ou receber uma cópia para levar para outro lado. Escreva para danielcastrotattooshop@gmail.com; respondemos no prazo de um mês.",
          "Se achar que usamos os seus dados de forma indevida, pode apresentar queixa à Comissão Nacional de Proteção de Dados (www.cnpd.pt).",
        ],
      },
      {
        title: "Cookies e outros serviços",
        paragraphs: [
          "O site usa apenas os cookies de que precisa para funcionar: um guarda o idioma que escolhe, e o acesso da equipa do estúdio usa outros. Não há cookies de publicidade nem de estatísticas.",
          "O site carrega os tipos de letra do Google Fonts, que recebe o seu endereço IP para os enviar. O pagamento da loja é feito na loja Necrotic Wear, segundo a política de privacidade dela. Os links para o Instagram, TikTok, YouTube, Google Maps, Google Flights e Booking.com levam a esses serviços, segundo as políticas deles.",
          "O simulador de viagem envia a cidade que escreve, e as datas, a serviços de preços de voos e hotéis, para encontrar preços. Não envia nenhum dado pessoal.",
        ],
      },
    ],
  },
  fr: {
    ...en,
    translationNote:
      "Cette politique existe en anglais et en portugais, les langues dans lesquelles le studio répond.",
  },
  de: {
    ...en,
    translationNote:
      "Diese Datenschutzerklärung gibt es auf Englisch und Portugiesisch, den Sprachen, in denen das Studio antwortet.",
  },
  es: {
    ...en,
    translationNote:
      "Esta política está en inglés y en portugués, los idiomas en los que responde el estudio.",
  },
};

/** One part of the notice: paragraphs, then an optional list and a paragraph after it. */
type PrivacySection = {
  readonly title: string;
  readonly paragraphs: ReadonlyArray<string>;
  readonly items?: ReadonlyArray<string>;
  readonly after?: string;
};

/** The notice in one language. */
type PrivacyText = {
  readonly eyebrowDetail: string;
  readonly headingFirst: string;
  readonly headingSecond: string;
  readonly updated: string;
  /** Says why the notice is in English, in languages without a translation. */
  readonly translationNote: string | null;
  readonly sections: ReadonlyArray<PrivacySection>;
};

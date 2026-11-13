import type { Locale } from "@/i18n/locales";

/**
 * The How to book page's text. The steps and "What to send" follow the enquiry form; "Before
 * your session" follows the studio's email to every client after the deposit; the answers follow
 * the studio's policies (PRODUCT.md, "Policies"). Never show the deposit amount or the minimum
 * price. The studio answers in Portuguese and English only, so the other languages say so.
 */
const en = {
  eyebrowDetail: "From idea to ink",
  headingFirst: "From idea",
  headingSecond: "to ink.",
  start: "Start your enquiry",
  languageNote: null as string | null,
  steps: [
    {
      number: "I",
      title: "Send your idea",
      text: "Fill in the enquiry form: the theme, a short description, references, and a photo of the placement.",
    },
    {
      number: "II",
      title: "Quote & date",
      text: "Joana answers every enquiry by email with a private quote and the dates.",
    },
    {
      number: "III",
      title: "Deposit",
      text: "A non-refundable deposit secures your date. It is deducted from the price on the day.",
    },
    {
      number: "IV",
      title: "Design & session",
      text: "Every design is drawn close to the session. You get the final drawing the night before; small changes happen on the day.",
    },
  ],
  whatToSendTitle: "What to send",
  whatToSend: [
    "The theme or the character",
    "A short description of your idea",
    "Reference images",
    "A photo of the placement",
    "Braga, or a guest spot city",
  ],
  travel: {
    before: "Travelling to Braga?",
    link: "Estimate the trip",
    after: "before you send your enquiry.",
  },
  beforeTitle: "Before your session",
  before: [
    "Sleep well, and avoid alcohol and too much coffee the day before and on the day.",
    "Eat something in the hour before, and bring a snack for the session.",
    "Wear comfortable clothes: you stay in one position for a long time.",
    "Keep the area out of the sun, sunbeds, and any tanning for 2 weeks before.",
    "Keep your skin moisturised, and drink plenty of water.",
    "No need to shave: Daniel shaves the area on the day. If you prefer wax, do it at least 5 days before.",
    "Come without plans for later that day: sessions usually take 5 to 6 hours.",
    "Bring the rest of the payment in cash, or pay by MB WAY or Revolut. There is no card terminal.",
    "One companion aged 16 or over may come with you.",
  ],
  questionsTitle: "Questions",
  questions: [
    {
      question: "How much does a tattoo cost?",
      answer:
        "Every piece is quoted privately, by email, after you send your idea. A single piece is priced by its complexity, size, and placement. Large projects, such as full sleeves, full backs, and other work of more than 3 sessions, have a fixed price per session. There are no hourly rates, and the quote changes only if the idea or the size changes; you always hear the new price before the session starts.",
    },
    {
      question: "Is there a deposit?",
      answer:
        "Yes. A non-refundable deposit confirms your date and is deducted from the price on the day. Until it is paid, the date is only pencilled in: if someone else asks for it, or the date is less than a month away, the studio contacts you to check that you want to go ahead.",
    },
    {
      question: "How do I pay?",
      answer:
        "The deposit by MB WAY, PayPal, Revolut, or bank transfer. The rest on the day in cash, or by MB WAY or Revolut. The studio has no card terminal.",
    },
    {
      question: "Can I change my date?",
      answer:
        "Yes, once, with at least 2 weeks' notice: your deposit moves to the new date. A second change needs a new deposit.",
    },
    {
      question: "What if I am late, or cannot come?",
      answer:
        "The studio waits up to 15 minutes; if you know you will be late, let the studio know. If you miss your session or cancel at short notice, you lose the deposit, and a new date needs 50% of the price paid in advance.",
    },
    {
      question: "Is there a minimum age?",
      answer: "Yes, 18. Daniel does not tattoo minors, even with their parents' permission.",
    },
    {
      question: "When can I not get tattooed?",
      answer:
        "When you are pregnant or breastfeeding, taking antibiotics or anticoagulants, having chemotherapy or a similar treatment, or under the influence of alcohol or drugs. The skin to be tattooed must be healthy: no sunburn, wounds, cuts, burns, or conditions such as psoriasis. If you have a skin condition elsewhere on your body, ask your doctor before you pay the deposit.",
    },
    {
      question: "How long is a session?",
      answer:
        "Almost every session takes the whole day, reserved for you alone. It starts at 11:00 and goes on until the piece is done: about 4 to 5 hours for a 20 cm piece, such as one side of a forearm, and 7 to 8 hours or more for 30 cm, such as the outer upper arm. On average, about 6 hours.",
    },
    {
      question: "Can a large project be done in one trip?",
      answer:
        "Usually, yes. Daniel works in “printer mode”: he finishes each area of skin in one session and does not go back to it, so the next session does not wait for healing. We recommend a rest day or two between sessions, and no more than 2 days in a row. For clients who travel, up to 4 sessions a week, every other day: a full arm sleeve usually takes 4 sessions, so it can be done in about a week.",
    },
    {
      question: "When do I see the design?",
      answer:
        "Daniel draws it close to the session and sends it the night before, usually around 23:00. Reply if you want to change a detail: he adjusts it and sends it again, or changes it on the day before the stencil is printed. Changing the whole design or its structure means a new date and the loss of the deposit, because a design takes 3 to 4 hours to draw. Send any specific wishes before, so Daniel can draw them in.",
    },
    {
      question: "Are touch-ups free?",
      answer:
        "Small gaps in the lines or the shading are touched up for free within 6 months. Daniel looks at the healed tattoo first, because how it heals depends a lot on aftercare: your tattoo is a piece of art you carry for life, and it needs your care too. When a touch-up is needed because the tattoo was not looked after, for example after the beach, the sea, a pool, or sunburn, it is not free.",
    },
    {
      question: "Will my tattoo be posted online?",
      answer:
        "It may be. On the consent form you choose whether your face can be shown; if you say no, only photos and videos without your face are used.",
    },
    {
      question: "Which languages does the studio speak?",
      answer: "Portuguese and English.",
    },
    {
      question: "Do guest spots work the same way?",
      answer:
        "Mostly. Each host studio has its own rules, for example for companions and payment, and you get the guidelines for that studio when you book.",
    },
    {
      question: "Do you sell gift vouchers?",
      answer:
        "Yes, as printed vouchers to collect at the studio or to receive by post. Ask the studio by email.",
    },
    {
      question: "What does Daniel tattoo?",
      answer:
        "Custom designs only, in his own style: black and white linework with strong contrast and small red accents. No copies of other artists' work, no AI work, no cover-ups, and no full-colour projects.",
    },
  ],
  aftercare: {
    before: "After your session, follow the",
    link: "aftercare guide",
    after: ".",
  },
};

/** The How to book page's text, per language. */
export const HOW_TO_BOOK_PAGE_TEXT: Record<Locale, typeof en> = {
  en,
  pt: {
    eyebrowDetail: "Da ideia à tinta",
    headingFirst: "Da ideia",
    headingSecond: "à tinta.",
    start: "Fazer o pedido",
    languageNote: null,
    steps: [
      {
        number: "I",
        title: "Envie a sua ideia",
        text: "Preencha o formulário de pedido: o tema, uma breve descrição, referências e uma foto da zona do corpo.",
      },
      {
        number: "II",
        title: "Orçamento e data",
        text: "A Joana responde a cada pedido por email, com um orçamento personalizado e as datas.",
      },
      {
        number: "III",
        title: "Sinal",
        text: "Um sinal não reembolsável garante a sua data. É descontado no valor final, no dia da sessão.",
      },
      {
        number: "IV",
        title: "Desenho e sessão",
        text: "Cada desenho é feito perto da data da sessão. Recebe o desenho final na noite anterior; pequenos ajustes fazem-se no próprio dia.",
      },
    ],
    whatToSendTitle: "O que enviar",
    whatToSend: [
      "O tema ou a personagem",
      "Uma breve descrição da ideia",
      "Imagens de referência",
      "Uma foto da zona do corpo",
      "Braga, ou a cidade de um guest spot",
    ],
    travel: {
      before: "Vem de longe?",
      link: "Estime a viagem",
      after: "antes de enviar o pedido.",
    },
    beforeTitle: "Antes da sessão",
    before: [
      "Durma bem, e evite álcool e café em excesso no dia anterior e no próprio dia.",
      "Coma algo na hora anterior à marcação e traga um snack para a sessão.",
      "Use roupa confortável: vai estar muito tempo na mesma posição.",
      "Não exponha a zona ao sol, ao solário nem a qualquer bronzeamento nas 2 semanas anteriores.",
      "Mantenha a pele hidratada e beba bastante água.",
      "Não precisa de depilar: o Daniel remove os pelos na hora, com lâmina. Se preferir cera, faça-a com pelo menos 5 dias de antecedência.",
      "Venha sem pressas e sem compromissos para o resto do dia: as sessões costumam durar 5 a 6 horas.",
      "Traga o valor restante em numerário, ou pague por MB WAY ou Revolut. O estúdio não tem multibanco.",
      "Pode trazer um acompanhante com 16 anos ou mais.",
    ],
    questionsTitle: "Perguntas",
    questions: [
      {
        question: "Quanto custa uma tatuagem?",
        answer:
          "Cada peça é orçamentada em privado, por email, depois de enviar a sua ideia. Os trabalhos isolados são calculados pela complexidade, pelo tamanho e pela zona do corpo. Os projetos de grande escala, como sleeves completas, costas completas e outros trabalhos com mais de 3 sessões, têm um valor fixo por sessão. Não fazemos orçamentos à hora, e o valor só muda se a ideia ou o tamanho mudarem; é sempre informado do novo valor antes de a sessão começar.",
      },
      {
        question: "É preciso pagar sinal?",
        answer:
          "Sim. Um sinal não reembolsável confirma a sua data e é descontado no valor final, no dia da sessão. Até ser pago, a data fica apenas pendente: se alguém pedir a mesma data, ou se faltar menos de um mês, o estúdio contacta-o para confirmar se quer avançar.",
      },
      {
        question: "Como se paga?",
        answer:
          "O sinal por MB WAY, PayPal, Revolut ou transferência bancária. O restante no dia, em numerário, ou por MB WAY ou Revolut. O estúdio não tem multibanco.",
      },
      {
        question: "Posso mudar a data?",
        answer:
          "Sim, uma vez, com pelo menos 2 semanas de aviso prévio: o sinal passa para a nova data. Uma segunda alteração obriga a um novo sinal.",
      },
      {
        question: "E se chegar atrasado ou não puder vir?",
        answer:
          "Há uma tolerância de 15 minutos; se souber que vai chegar atrasado, avise o estúdio. Se faltar ou cancelar em cima da hora, perde o sinal, e uma nova data obriga ao pagamento antecipado de 50% do valor.",
      },
      {
        question: "Há idade mínima?",
        answer: "Sim, 18 anos. O Daniel não tatua menores, mesmo com autorização dos pais.",
      },
      {
        question: "Quando não posso ser tatuado?",
        answer:
          "Durante a gravidez ou a amamentação, sob o efeito de antibióticos ou anticoagulantes, durante quimioterapia ou tratamentos equivalentes, ou sob o efeito de álcool ou de outras substâncias. A pele a tatuar tem de estar saudável: sem escaldão, feridas, cortes, queimaduras ou doenças como a psoríase. Se tiver uma doença de pele noutra zona do corpo, peça aprovação médica antes de pagar o sinal.",
      },
      {
        question: "Quanto tempo dura uma sessão?",
        answer:
          "Quase todas as sessões ocupam o dia inteiro, reservado só para si. Começam às 11h e prolongam-se até a peça estar concluída: cerca de 4 a 5 horas para uma peça de 20 cm, como um lado do antebraço, e 7 a 8 horas ou mais para 30 cm, como a parte exterior do braço. Em média, cerca de 6 horas.",
      },
      {
        question: "Um projeto grande pode ser feito numa só viagem?",
        answer:
          "Normalmente, sim. O Daniel trabalha em “modo impressora”: a área de pele que trabalha numa sessão fica concluída, e ele não volta a ela, por isso a sessão seguinte não precisa de esperar pela cicatrização. Recomendamos um ou dois dias de descanso entre sessões, e não mais de 2 dias seguidos. Para quem vem de longe, até 4 sessões por semana, praticamente dia sim, dia não: uma sleeve de braço completa costuma levar 4 sessões, por isso pode ficar pronta em cerca de uma semana.",
      },
      {
        question: "Quando vejo o desenho?",
        answer:
          "O Daniel desenha perto da data da sessão e envia o desenho na noite anterior, normalmente por volta das 23h. Responda se quiser alterar algum detalhe: ele ajusta e volta a enviar, ou altera no próprio dia, antes de imprimir o stencil. Alterar o desenho completo ou a sua estrutura obriga a uma nova data e à perda do sinal, porque um desenho leva 3 a 4 horas a fazer. Envie antes qualquer pedido específico, para que o Daniel o tenha em conta.",
      },
      {
        question: "Os retoques são gratuitos?",
        answer:
          "Pequenas falhas nas linhas ou no preenchimento são retocadas gratuitamente até 6 meses. O Daniel avalia primeiro a tatuagem cicatrizada, porque a cicatrização depende muito dos cuidados: a sua tatuagem é uma obra de arte que vai levar para a vida, e também precisa dos seus cuidados. Quando o retoque é necessário porque a tatuagem não foi bem cuidada, por exemplo depois da praia, do mar, da piscina ou de um escaldão, não é gratuito.",
      },
      {
        question: "A minha tatuagem pode ser publicada?",
        answer:
          "Pode. No formulário de consentimento escolhe se o seu rosto pode aparecer; se disser que não, só são usadas fotos e vídeos onde o seu rosto não esteja visível.",
      },
      {
        question: "Que línguas fala o estúdio?",
        answer: "Português e inglês.",
      },
      {
        question: "Os guest spots funcionam da mesma forma?",
        answer:
          "Na maioria dos casos, sim. Cada estúdio anfitrião tem as suas regras, por exemplo quanto a acompanhantes e pagamentos, e recebe as recomendações desse estúdio quando faz a marcação.",
      },
      {
        question: "Vendem vales de oferta?",
        answer:
          "Sim, em formato físico, para levantar no estúdio ou receber por correio. Peça ao estúdio por email.",
      },
      {
        question: "O que tatua o Daniel?",
        answer:
          "Apenas desenhos personalizados, no seu estilo: preto e branco, linhas detalhadas, forte contraste e pequenos apontamentos de vermelho. Não faz cópias de trabalhos de outros artistas, trabalhos feitos com IA, cover-ups nem projetos a cores.",
      },
    ],
    aftercare: {
      before: "Depois da sessão, siga o",
      link: "guia de cuidados",
      after: ".",
    },
  },
  fr: {
    eyebrowDetail: "De l’idée à l’encre",
    headingFirst: "De l’idée",
    headingSecond: "à l’encre.",
    start: "Faire une demande",
    languageNote: "Le studio répond en anglais et en portugais.",
    steps: [
      {
        number: "I",
        title: "Envoyez votre idée",
        text: "Remplissez le formulaire de demande : le thème, une courte description, des références et une photo de l’emplacement.",
      },
      {
        number: "II",
        title: "Devis et date",
        text: "Joana répond à chaque demande par e-mail avec un devis personnalisé et les dates.",
      },
      {
        number: "III",
        title: "Acompte",
        text: "Un acompte non remboursable réserve votre date. Il est déduit du prix le jour de la séance.",
      },
      {
        number: "IV",
        title: "Dessin et séance",
        text: "Chaque dessin est réalisé peu avant la séance. Vous recevez le dessin final la veille ; les petites retouches se font le jour même.",
      },
    ],
    whatToSendTitle: "Ce qu’il faut envoyer",
    whatToSend: [
      "Le thème ou le personnage",
      "Une courte description de votre idée",
      "Des images de référence",
      "Une photo de l’emplacement",
      "Braga, ou la ville d’un guest spot",
    ],
    travel: {
      before: "Vous venez à Braga ?",
      link: "Estimez le voyage",
      after: "avant d’envoyer votre demande.",
    },
    beforeTitle: "Avant votre séance",
    before: [
      "Dormez bien, et évitez l’alcool et l’excès de café la veille et le jour même.",
      "Mangez quelque chose dans l’heure qui précède, et apportez un en-cas pour la séance.",
      "Portez des vêtements confortables : vous restez longtemps dans la même position.",
      "N’exposez pas la zone au soleil, aux UV ni à aucun bronzage pendant les 2 semaines précédentes.",
      "Hydratez bien votre peau, et buvez beaucoup d’eau.",
      "Inutile de vous raser : Daniel rase la zone le jour même. Si vous préférez la cire, faites-la au moins 5 jours avant.",
      "Ne prévoyez rien pour le reste de la journée : les séances durent en général 5 à 6 heures.",
      "Apportez le reste du paiement en espèces, ou payez par MB WAY ou Revolut. Le studio n’a pas de terminal de carte.",
      "Une personne de 16 ans ou plus peut vous accompagner.",
    ],
    questionsTitle: "Questions",
    questions: [
      {
        question: "Combien coûte un tatouage ?",
        answer:
          "Chaque pièce fait l’objet d’un devis privé, par e-mail, après l’envoi de votre idée. Une pièce isolée est chiffrée selon sa complexité, sa taille et son emplacement. Les grands projets, comme les manchettes complètes, les dos complets et les autres travaux de plus de 3 séances, ont un prix fixe par séance. Il n’y a pas de tarif horaire, et le devis ne change que si l’idée ou la taille change ; vous connaissez toujours le nouveau prix avant le début de la séance.",
      },
      {
        question: "Faut-il verser un acompte ?",
        answer:
          "Oui. Un acompte non remboursable confirme votre date et est déduit du prix le jour de la séance. Tant qu’il n’est pas payé, la date n’est réservée qu’à titre provisoire : si quelqu’un d’autre la demande, ou si elle est à moins d’un mois, le studio vous contacte pour savoir si vous souhaitez continuer.",
      },
      {
        question: "Comment payer ?",
        answer:
          "L’acompte par MB WAY, PayPal, Revolut ou virement bancaire. Le reste le jour même, en espèces, ou par MB WAY ou Revolut. Le studio n’a pas de terminal de carte.",
      },
      {
        question: "Puis-je changer de date ?",
        answer:
          "Oui, une fois, en prévenant au moins 2 semaines à l’avance : votre acompte est reporté sur la nouvelle date. Un deuxième changement demande un nouvel acompte.",
      },
      {
        question: "Et si je suis en retard, ou si je ne peux pas venir ?",
        answer:
          "Le studio attend jusqu’à 15 minutes ; si vous savez que vous serez en retard, prévenez le studio. Si vous ne venez pas ou annulez au dernier moment, vous perdez l’acompte, et une nouvelle date demande le paiement anticipé de 50 % du prix.",
      },
      {
        question: "Y a-t-il un âge minimum ?",
        answer:
          "Oui, 18 ans. Daniel ne tatoue pas les mineurs, même avec l’accord de leurs parents.",
      },
      {
        question: "Quand ne puis-je pas me faire tatouer ?",
        answer:
          "Pendant la grossesse ou l’allaitement, sous antibiotiques ou anticoagulants, pendant une chimiothérapie ou un traitement similaire, ou sous l’effet de l’alcool ou de drogues. La peau à tatouer doit être saine : pas de coup de soleil, de plaies, de coupures, de brûlures ni de maladies comme le psoriasis. Si vous avez une maladie de peau ailleurs sur le corps, demandez l’avis de votre médecin avant de verser l’acompte.",
      },
      {
        question: "Combien de temps dure une séance ?",
        answer:
          "Presque chaque séance occupe toute la journée, réservée pour vous seul. Elle commence à 11 h et se poursuit jusqu’à ce que la pièce soit terminée : environ 4 à 5 heures pour une pièce de 20 cm, comme une face de l’avant-bras, et 7 à 8 heures ou plus pour 30 cm, comme l’extérieur du haut du bras. En moyenne, environ 6 heures.",
      },
      {
        question: "Un grand projet peut-il se faire en un seul voyage ?",
        answer:
          "En général, oui. Daniel travaille en « mode imprimante » : il termine chaque zone de peau en une séance et n’y revient pas, donc la séance suivante n’attend pas la cicatrisation. Nous conseillons un ou deux jours de repos entre les séances, et pas plus de 2 jours d’affilée. Pour les clients qui voyagent, jusqu’à 4 séances par semaine, un jour sur deux : une manchette complète demande en général 4 séances, et peut donc être faite en une semaine environ.",
      },
      {
        question: "Quand vais-je voir le dessin ?",
        answer:
          "Daniel le dessine peu avant la séance et l’envoie la veille, en général vers 23 h. Répondez si vous voulez changer un détail : il l’ajuste et le renvoie, ou le modifie le jour même avant l’impression du stencil. Changer tout le dessin ou sa structure implique une nouvelle date et la perte de l’acompte, car un dessin demande 3 à 4 heures de travail. Envoyez vos souhaits précis à l’avance, pour que Daniel puisse les intégrer.",
      },
      {
        question: "Les retouches sont-elles gratuites ?",
        answer:
          "Les petits manques dans les lignes ou les ombrages sont retouchés gratuitement pendant 6 mois. Daniel examine d’abord le tatouage cicatrisé, car la cicatrisation dépend beaucoup des soins : votre tatouage est une œuvre d’art que vous porterez toute votre vie, et il a besoin de vos soins aussi. Quand une retouche est nécessaire parce que le tatouage n’a pas été bien soigné, par exemple après la plage, la mer, la piscine ou un coup de soleil, elle n’est pas gratuite.",
      },
      {
        question: "Mon tatouage sera-t-il publié en ligne ?",
        answer:
          "C’est possible. Sur le formulaire de consentement, vous choisissez si votre visage peut apparaître ; si vous refusez, seules les photos et vidéos sans votre visage sont utilisées.",
      },
      {
        question: "Quelles langues parle le studio ?",
        answer: "Le portugais et l’anglais. Vous pouvez écrire votre demande en anglais.",
      },
      {
        question: "Les guest spots fonctionnent-ils de la même façon ?",
        answer:
          "En grande partie. Chaque studio hôte a ses propres règles, par exemple pour les accompagnants et le paiement, et vous recevez les consignes de ce studio lors de la réservation.",
      },
      {
        question: "Vendez-vous des bons cadeaux ?",
        answer:
          "Oui, en version imprimée, à retirer au studio ou à recevoir par la poste. Demandez au studio par e-mail.",
      },
      {
        question: "Que tatoue Daniel ?",
        answer:
          "Uniquement des créations sur mesure, dans son propre style : du noir et blanc, un linework détaillé, un fort contraste et de petites touches de rouge. Pas de copies du travail d’autres artistes, pas de travail fait par IA, pas de cover-ups et pas de projets en couleur.",
      },
    ],
    aftercare: {
      before: "Après votre séance, suivez le",
      link: "guide des soins",
      after: ".",
    },
  },
  de: {
    eyebrowDetail: "Von der Idee zur Tinte",
    headingFirst: "Von der Idee",
    headingSecond: "zur Tinte.",
    start: "Anfrage starten",
    languageNote: "Das Studio antwortet auf Englisch und Portugiesisch.",
    steps: [
      {
        number: "I",
        title: "Schick deine Idee",
        text: "Füll das Anfrageformular aus: das Thema, eine kurze Beschreibung, Referenzen und ein Foto der Körperstelle.",
      },
      {
        number: "II",
        title: "Angebot & Termin",
        text: "Joana beantwortet jede Anfrage per E-Mail mit einem persönlichen Angebot und den Terminen.",
      },
      {
        number: "III",
        title: "Anzahlung",
        text: "Eine nicht erstattbare Anzahlung sichert deinen Termin. Sie wird am Tag vom Preis abgezogen.",
      },
      {
        number: "IV",
        title: "Motiv & Session",
        text: "Jedes Motiv entsteht kurz vor der Session. Du bekommst die finale Zeichnung am Abend vorher; kleine Änderungen passieren am Tag selbst.",
      },
    ],
    whatToSendTitle: "Was du schicken solltest",
    whatToSend: [
      "Das Thema oder den Charakter",
      "Eine kurze Beschreibung deiner Idee",
      "Referenzbilder",
      "Ein Foto der Körperstelle",
      "Braga, oder eine Guest-Spot-Stadt",
    ],
    travel: {
      before: "Du reist nach Braga?",
      link: "Schätz die Reisekosten",
      after: "bevor du deine Anfrage schickst.",
    },
    beforeTitle: "Vor deiner Session",
    before: [
      "Schlaf gut, und vermeide Alkohol und zu viel Kaffee am Vortag und am Tag selbst.",
      "Iss etwas in der Stunde davor, und bring einen Snack für die Session mit.",
      "Trag bequeme Kleidung: Du bleibst lange in derselben Position.",
      "Halte die Stelle in den 2 Wochen davor von Sonne, Solarium und jeder Art von Bräunung fern.",
      "Pfleg deine Haut mit Feuchtigkeit, und trink viel Wasser.",
      "Du musst dich nicht rasieren: Daniel rasiert die Stelle am Tag selbst. Wenn du lieber Wachs nimmst, dann mindestens 5 Tage vorher.",
      "Plan für den Rest des Tages nichts ein: Sessions dauern meist 5 bis 6 Stunden.",
      "Bring den Restbetrag in bar mit, oder zahl per MB WAY oder Revolut. Es gibt kein Kartenterminal.",
      "Eine Begleitperson ab 16 Jahren darf mitkommen.",
    ],
    questionsTitle: "Fragen",
    questions: [
      {
        question: "Was kostet ein Tattoo?",
        answer:
          "Jedes Motiv bekommt ein persönliches Angebot per E-Mail, nachdem du deine Idee geschickt hast. Ein einzelnes Motiv wird nach Komplexität, Größe und Körperstelle berechnet. Große Projekte wie komplette Sleeves, ganze Rücken und andere Arbeiten mit mehr als 3 Sessions haben einen festen Preis pro Session. Es gibt keine Stundensätze, und das Angebot ändert sich nur, wenn sich die Idee oder die Größe ändert; den neuen Preis erfährst du immer vor Beginn der Session.",
      },
      {
        question: "Gibt es eine Anzahlung?",
        answer:
          "Ja. Eine nicht erstattbare Anzahlung bestätigt deinen Termin und wird am Tag vom Preis abgezogen. Bis sie bezahlt ist, ist der Termin nur vorgemerkt: Wenn jemand anderes ihn anfragt oder er weniger als einen Monat entfernt ist, meldet sich das Studio bei dir, um zu fragen, ob du dabei bleibst.",
      },
      {
        question: "Wie bezahle ich?",
        answer:
          "Die Anzahlung per MB WAY, PayPal, Revolut oder Banküberweisung. Den Rest am Tag in bar, oder per MB WAY oder Revolut. Das Studio hat kein Kartenterminal.",
      },
      {
        question: "Kann ich meinen Termin verschieben?",
        answer:
          "Ja, einmal, mit mindestens 2 Wochen Vorlauf: Deine Anzahlung wandert auf den neuen Termin. Eine zweite Verschiebung braucht eine neue Anzahlung.",
      },
      {
        question: "Was, wenn ich zu spät komme oder nicht kommen kann?",
        answer:
          "Das Studio wartet bis zu 15 Minuten; wenn du weißt, dass du später kommst, sag Bescheid. Wenn du nicht erscheinst oder kurzfristig absagst, verfällt die Anzahlung, und für einen neuen Termin zahlst du 50 % des Preises im Voraus.",
      },
      {
        question: "Gibt es ein Mindestalter?",
        answer:
          "Ja, 18. Daniel tätowiert keine Minderjährigen, auch nicht mit Erlaubnis der Eltern.",
      },
      {
        question: "Wann kann ich mich nicht tätowieren lassen?",
        answer:
          "In der Schwangerschaft oder Stillzeit, wenn du Antibiotika oder Blutverdünner nimmst, während einer Chemotherapie oder ähnlichen Behandlung, oder unter Einfluss von Alkohol oder Drogen. Die Haut an der Stelle muss gesund sein: kein Sonnenbrand, keine Wunden, Schnitte, Verbrennungen oder Erkrankungen wie Schuppenflechte. Wenn du an einer anderen Körperstelle eine Hauterkrankung hast, frag deinen Arzt, bevor du die Anzahlung leistest.",
      },
      {
        question: "Wie lange dauert eine Session?",
        answer:
          "Fast jede Session dauert den ganzen Tag, nur für dich reserviert. Sie beginnt um 11 Uhr und geht, bis das Motiv fertig ist: etwa 4 bis 5 Stunden für ein Motiv von 20 cm, zum Beispiel eine Seite des Unterarms, und 7 bis 8 Stunden oder mehr für 30 cm, zum Beispiel die Außenseite des Oberarms. Im Schnitt etwa 6 Stunden.",
      },
      {
        question: "Lässt sich ein großes Projekt auf einer Reise machen?",
        answer:
          "Meistens ja. Daniel arbeitet im „Druckermodus“: Er macht jede Hautstelle in einer Session fertig und geht nicht mehr darauf zurück, deshalb muss die nächste Session nicht auf die Heilung warten. Wir empfehlen einen oder zwei Ruhetage zwischen den Sessions und nicht mehr als 2 Tage am Stück. Für Kunden, die anreisen: bis zu 4 Sessions pro Woche, jeden zweiten Tag. Ein kompletter Arm-Sleeve braucht meist 4 Sessions und ist damit in etwa einer Woche fertig.",
      },
      {
        question: "Wann sehe ich das Motiv?",
        answer:
          "Daniel zeichnet es kurz vor der Session und schickt es dir am Abend vorher, meist gegen 23 Uhr. Antworte, wenn du ein Detail ändern möchtest: Er passt es an und schickt es noch einmal, oder ändert es am Tag selbst, bevor die Schablone gedruckt wird. Das ganze Motiv oder seinen Aufbau zu ändern bedeutet einen neuen Termin und den Verlust der Anzahlung, weil eine Zeichnung 3 bis 4 Stunden Arbeit ist. Schick besondere Wünsche vorher, damit Daniel sie einplanen kann.",
      },
      {
        question: "Sind Nachstiche kostenlos?",
        answer:
          "Kleine Lücken in den Linien oder Schattierungen werden innerhalb von 6 Monaten kostenlos nachgestochen. Daniel schaut sich zuerst das verheilte Tattoo an, denn wie es heilt, hängt stark von der Pflege ab: Dein Tattoo ist ein Kunstwerk, das du ein Leben lang trägst, und es braucht auch deine Pflege. Wenn ein Nachstich nötig ist, weil das Tattoo nicht gepflegt wurde, zum Beispiel nach Strand, Meer, Schwimmbad oder Sonnenbrand, ist er nicht kostenlos.",
      },
      {
        question: "Wird mein Tattoo online gezeigt?",
        answer:
          "Möglicherweise. Auf dem Einverständnisformular entscheidest du, ob dein Gesicht zu sehen sein darf; wenn nicht, werden nur Fotos und Videos ohne dein Gesicht verwendet.",
      },
      {
        question: "Welche Sprachen spricht das Studio?",
        answer: "Portugiesisch und Englisch. Du kannst deine Anfrage auf Englisch schreiben.",
      },
      {
        question: "Laufen Guest Spots genauso ab?",
        answer:
          "Größtenteils. Jedes Gaststudio hat eigene Regeln, zum Beispiel für Begleitpersonen und Zahlung, und du bekommst bei der Buchung die Hinweise für dieses Studio.",
      },
      {
        question: "Gibt es Gutscheine?",
        answer:
          "Ja, als gedruckte Gutscheine zum Abholen im Studio oder per Post. Frag einfach per E-Mail beim Studio.",
      },
      {
        question: "Was tätowiert Daniel?",
        answer:
          "Nur individuelle Motive in seinem eigenen Stil: Schwarz-Weiß, detailliertes Linework, starker Kontrast und kleine rote Akzente. Keine Kopien von Arbeiten anderer Künstler, keine KI-Motive, keine Cover-ups und keine vollfarbigen Projekte.",
      },
    ],
    aftercare: {
      before: "Nach deiner Session hilft dir die",
      link: "Pflegeanleitung",
      after: ".",
    },
  },
  es: {
    eyebrowDetail: "De la idea a la tinta",
    headingFirst: "De la idea",
    headingSecond: "a la tinta.",
    start: "Enviar solicitud",
    languageNote: "El estudio responde en inglés y en portugués.",
    steps: [
      {
        number: "I",
        title: "Envía tu idea",
        text: "Rellena el formulario de solicitud: el tema, una breve descripción, referencias y una foto de la zona.",
      },
      {
        number: "II",
        title: "Presupuesto y fecha",
        text: "Joana responde a cada solicitud por email con un presupuesto personalizado y las fechas.",
      },
      {
        number: "III",
        title: "Señal",
        text: "Una señal no reembolsable reserva tu fecha. Se descuenta del precio el día de la sesión.",
      },
      {
        number: "IV",
        title: "Diseño y sesión",
        text: "Cada diseño se dibuja poco antes de la sesión. Recibes el dibujo final la noche anterior; los pequeños cambios se hacen el mismo día.",
      },
    ],
    whatToSendTitle: "Qué enviar",
    whatToSend: [
      "El tema o el personaje",
      "Una breve descripción de tu idea",
      "Imágenes de referencia",
      "Una foto de la zona",
      "Braga, o la ciudad de un guest spot",
    ],
    travel: {
      before: "¿Viajas a Braga?",
      link: "Calcula el viaje",
      after: "antes de enviar tu solicitud.",
    },
    beforeTitle: "Antes de tu sesión",
    before: [
      "Duerme bien, y evita el alcohol y el exceso de café el día anterior y el mismo día.",
      "Come algo en la hora anterior, y trae algo de picar para la sesión.",
      "Lleva ropa cómoda: vas a estar mucho tiempo en la misma postura.",
      "No expongas la zona al sol, a los rayos UVA ni a ningún bronceado en las 2 semanas anteriores.",
      "Mantén la piel hidratada, y bebe mucha agua.",
      "No hace falta que te depiles: Daniel rasura la zona el mismo día. Si prefieres cera, hazlo al menos 5 días antes.",
      "No hagas planes para el resto del día: las sesiones suelen durar de 5 a 6 horas.",
      "Trae el resto del pago en efectivo, o paga por MB WAY o Revolut. No hay datáfono.",
      "Puede acompañarte una persona de 16 años o más.",
    ],
    questionsTitle: "Preguntas",
    questions: [
      {
        question: "¿Cuánto cuesta un tatuaje?",
        answer:
          "Cada pieza se presupuesta en privado, por email, después de que envíes tu idea. Una pieza suelta se calcula según su complejidad, su tamaño y la zona del cuerpo. Los proyectos grandes, como mangas completas, espaldas completas y otros trabajos de más de 3 sesiones, tienen un precio fijo por sesión. No hay tarifas por hora, y el presupuesto solo cambia si cambian la idea o el tamaño; siempre conoces el nuevo precio antes de empezar la sesión.",
      },
      {
        question: "¿Hay que pagar una señal?",
        answer:
          "Sí. Una señal no reembolsable confirma tu fecha y se descuenta del precio el día de la sesión. Hasta que la pagas, la fecha queda solo apartada: si otra persona la pide, o si falta menos de un mes, el estudio te contacta para confirmar que quieres seguir adelante.",
      },
      {
        question: "¿Cómo se paga?",
        answer:
          "La señal por MB WAY, PayPal, Revolut o transferencia bancaria. El resto el mismo día, en efectivo, o por MB WAY o Revolut. El estudio no tiene datáfono.",
      },
      {
        question: "¿Puedo cambiar la fecha?",
        answer:
          "Sí, una vez, con al menos 2 semanas de antelación: tu señal pasa a la nueva fecha. Un segundo cambio necesita una nueva señal.",
      },
      {
        question: "¿Y si llego tarde o no puedo ir?",
        answer:
          "El estudio espera hasta 15 minutos; si sabes que vas a llegar tarde, avisa al estudio. Si no vienes o cancelas a última hora, pierdes la señal, y una nueva fecha requiere pagar por adelantado el 50 % del precio.",
      },
      {
        question: "¿Hay una edad mínima?",
        answer: "Sí, 18 años. Daniel no tatúa a menores, ni siquiera con permiso de sus padres.",
      },
      {
        question: "¿Cuándo no puedo tatuarme?",
        answer:
          "Durante el embarazo o la lactancia, si tomas antibióticos o anticoagulantes, durante una quimioterapia o un tratamiento similar, o bajo los efectos del alcohol o de drogas. La piel que se va a tatuar debe estar sana: sin quemaduras solares, heridas, cortes, quemaduras ni enfermedades como la psoriasis. Si tienes una enfermedad de la piel en otra zona del cuerpo, pide la aprobación de tu médico antes de pagar la señal.",
      },
      {
        question: "¿Cuánto dura una sesión?",
        answer:
          "Casi todas las sesiones ocupan el día entero, reservado solo para ti. Empiezan a las 11:00 y siguen hasta terminar la pieza: unas 4 a 5 horas para una pieza de 20 cm, como un lado del antebrazo, y 7 a 8 horas o más para 30 cm, como la parte exterior del brazo. De media, unas 6 horas.",
      },
      {
        question: "¿Se puede hacer un proyecto grande en un solo viaje?",
        answer:
          "Normalmente, sí. Daniel trabaja en «modo impresora»: termina cada zona de piel en una sesión y no vuelve a ella, así que la siguiente sesión no tiene que esperar a la cicatrización. Recomendamos uno o dos días de descanso entre sesiones, y no más de 2 días seguidos. Para quien viaja, hasta 4 sesiones por semana, en días alternos: una manga completa de brazo suele llevar 4 sesiones, así que puede estar lista en una semana, más o menos.",
      },
      {
        question: "¿Cuándo veo el diseño?",
        answer:
          "Daniel lo dibuja poco antes de la sesión y te lo envía la noche anterior, normalmente hacia las 23:00. Responde si quieres cambiar algún detalle: lo ajusta y te lo vuelve a enviar, o lo cambia el mismo día antes de imprimir el stencil. Cambiar todo el diseño o su estructura supone una nueva fecha y la pérdida de la señal, porque un diseño lleva de 3 a 4 horas de trabajo. Envía antes cualquier deseo concreto, para que Daniel lo tenga en cuenta.",
      },
      {
        question: "¿Los retoques son gratis?",
        answer:
          "Los pequeños fallos en las líneas o el sombreado se retocan gratis durante 6 meses. Daniel revisa primero el tatuaje ya cicatrizado, porque cómo cicatriza depende mucho de los cuidados: tu tatuaje es una obra de arte que llevarás toda la vida, y también necesita que lo cuides. Cuando hace falta un retoque porque el tatuaje no se ha cuidado, por ejemplo tras la playa, el mar, la piscina o una quemadura solar, no es gratis.",
      },
      {
        question: "¿Se publicará mi tatuaje?",
        answer:
          "Puede. En el formulario de consentimiento eliges si tu cara puede aparecer; si dices que no, solo se usan fotos y vídeos en los que no se vea tu cara.",
      },
      {
        question: "¿Qué idiomas habla el estudio?",
        answer: "Portugués e inglés. Puedes escribir tu solicitud en inglés.",
      },
      {
        question: "¿Los guest spots funcionan igual?",
        answer:
          "En general, sí. Cada estudio anfitrión tiene sus propias normas, por ejemplo sobre acompañantes y pagos, y al reservar recibes las indicaciones de ese estudio.",
      },
      {
        question: "¿Vendéis vales regalo?",
        answer:
          "Sí, en formato impreso, para recoger en el estudio o recibir por correo. Pídelo al estudio por email.",
      },
      {
        question: "¿Qué tatúa Daniel?",
        answer:
          "Solo diseños personalizados, en su propio estilo: blanco y negro, linework detallado, fuerte contraste y pequeños toques de rojo. Nada de copias del trabajo de otros artistas, nada de trabajos hechos con IA, ni cover-ups ni proyectos a color.",
      },
    ],
    aftercare: {
      before: "Después de tu sesión, sigue la",
      link: "guía de cuidados",
      after: ".",
    },
  },
};

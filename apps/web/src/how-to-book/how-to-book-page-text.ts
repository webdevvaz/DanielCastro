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
      text: "Joana replies to every enquiry by email, with your quote and the available dates.",
    },
    {
      number: "III",
      title: "Deposit",
      text: "A non-refundable deposit secures your date. It comes off the price on the day.",
    },
    {
      number: "IV",
      title: "Design & session",
      text: "Daniel draws every design close to the session. You get the final drawing the night before, and small tweaks happen on the day.",
    },
  ],
  whatToSendTitle: "What to send",
  whatToSend: [
    "The theme or the character",
    "A short description of your idea",
    "Reference images",
    "A photo of the placement",
    "Where: Braga or a guest spot city",
  ],
  travel: {
    before: "Travelling to Braga?",
    link: "Estimate the trip",
    after: "before you send your enquiry.",
  },
  beforeTitle: "Before your session",
  before: [
    "Get a good night's sleep, and skip alcohol and too much coffee the day before and on the day itself.",
    "Eat something in the hour before you come, and bring a snack for the session.",
    "Wear comfortable clothes: you'll be in the same position for a long time.",
    "For 2 weeks before, keep the area out of the sun and away from sunbeds or any other tanning.",
    "Keep your skin moisturised, and drink plenty of water.",
    "No need to shave: Daniel shaves the area on the day. If you'd rather wax, do it at least 5 days before.",
    "Keep the rest of the day free: sessions usually take 5 to 6 hours.",
    "Bring the rest of the payment in cash, or pay by MB WAY or Revolut. The studio doesn't take cards.",
    "You can bring one companion, aged 16 or over.",
  ],
  questionsTitle: "Questions",
  questions: [
    {
      question: "How much does a tattoo cost?",
      answer:
        "Every piece gets its own quote, sent privately by email once you've shared your idea. A single piece is priced on its complexity, size and placement. Large projects, such as full sleeves, full backs and anything over 3 sessions, have a fixed price per session. There are no hourly rates, and the quote only changes if the idea or the size does; if it changes, you'll know the new price before the session starts.",
    },
    {
      question: "Is there a deposit?",
      answer:
        "Yes. A non-refundable deposit confirms your date and comes off the price on the day. Until it's paid, the date is only pencilled in: if someone else asks for it, or it's less than a month away, the studio will get in touch to check you still want to go ahead.",
    },
    {
      question: "How do I pay?",
      answer:
        "The deposit by MB WAY, PayPal, Revolut or bank transfer; the rest on the day, in cash or by MB WAY or Revolut. The studio doesn't take cards.",
    },
    {
      question: "Can I change my date?",
      answer:
        "Yes, once, with at least 2 weeks' notice: your deposit moves to the new date. A second change means a new deposit.",
    },
    {
      question: "What if I'm late, or can't make it?",
      answer:
        "The studio waits up to 15 minutes, and if you know you'll be late, just let them know. If you miss your session or cancel at short notice, you lose the deposit, and booking a new date means paying 50% of the price in advance.",
    },
    {
      question: "Is there a minimum age?",
      answer: "Yes, 18. Daniel doesn't tattoo minors, even with their parents' permission.",
    },
    {
      question: "When can't I get tattooed?",
      answer:
        "If you're pregnant or breastfeeding, taking antibiotics or anticoagulants, having chemotherapy or a similar treatment, or under the influence of alcohol or drugs. The skin being tattooed must be healthy: no sunburn, wounds, cuts, burns or conditions such as psoriasis. If you have a skin condition elsewhere on your body, check with your doctor before you pay the deposit.",
    },
    {
      question: "How long is a session?",
      answer:
        "Almost every session takes up the whole day, which is reserved for you alone. It starts at 11:00 and carries on until the piece is finished: about 4 to 5 hours for a 20 cm piece, such as one side of the forearm, and 7 to 8 hours or more for 30 cm, such as the outer upper arm. On average, around 6 hours.",
    },
    {
      question: "Can a large project be done in one trip?",
      answer:
        "Usually, yes. Daniel works in “printer mode”: he finishes each area of skin in a single session and never goes back to it, so the next session doesn't have to wait for healing. We recommend a rest day or two between sessions, and no more than 2 days in a row. If you're travelling in, that means up to 4 sessions a week, every other day: a full arm sleeve usually takes 4 sessions, so it can be done in about a week.",
    },
    {
      question: "When do I see the design?",
      answer:
        "Daniel draws it close to the session and sends it the night before, usually around 23:00. If you'd like to change a detail, just reply: he'll adjust it and send it again, or change it on the day before the stencil is printed. Changing the whole design or its structure means a new date and losing the deposit, because a design takes 3 to 4 hours to draw. So send any specific wishes beforehand, and Daniel will work them in.",
    },
    {
      question: "Are touch-ups free?",
      answer:
        "Small gaps in the lines or shading are touched up for free within 6 months. Daniel looks at the healed tattoo first, because how it heals depends a lot on aftercare: your tattoo is a piece of art you'll carry for life, and it needs your care too. If a touch-up is needed because the tattoo wasn't looked after, for example after the beach, the sea, a pool or sunburn, it isn't free.",
    },
    {
      question: "Will my tattoo be posted online?",
      answer:
        "It might be. On the consent form you choose whether your face can be shown; if you say no, only photos and videos without your face are used.",
    },
    {
      question: "Which languages does the studio speak?",
      answer: "Portuguese and English.",
    },
    {
      question: "Do guest spots work the same way?",
      answer:
        "Mostly. Each host studio has its own rules, for example about companions and payment, and you'll get that studio's guidelines when you book.",
    },
    {
      question: "Do you sell gift vouchers?",
      answer:
        "Yes, printed vouchers you can collect at the studio or receive by post. Just ask the studio by email.",
    },
    {
      question: "What does Daniel tattoo?",
      answer:
        "Custom designs only, in his own style: black and white linework with strong contrast and small red accents. No copies of other artists' work, no AI, no cover-ups and no full-colour projects.",
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
    eyebrowDetail: "Da ideia à pele",
    headingFirst: "Da ideia",
    headingSecond: "à pele.",
    start: "Pedir orçamento",
    languageNote: null,
    steps: [
      {
        number: "I",
        title: "Envie a sua ideia",
        text: "Preencha o formulário: o tema, uma breve descrição, referências e uma foto da zona a tatuar.",
      },
      {
        number: "II",
        title: "Orçamento e data",
        text: "A Joana responde a todos os pedidos por email, com o orçamento e as datas disponíveis.",
      },
      {
        number: "III",
        title: "Sinal",
        text: "O sinal, não reembolsável, garante a sua data e é descontado no valor final, no dia da sessão.",
      },
      {
        number: "IV",
        title: "Desenho e sessão",
        text: "O Daniel faz cada desenho perto da data da sessão. Recebe o desenho final na véspera, à noite, e os pequenos ajustes fazem-se no próprio dia.",
      },
    ],
    whatToSendTitle: "O que enviar",
    whatToSend: [
      "O tema ou a personagem",
      "Uma breve descrição da ideia",
      "Imagens de referência",
      "Uma foto da zona a tatuar",
      "Onde: Braga ou a cidade de um guest spot",
    ],
    travel: {
      before: "Vem de fora?",
      link: "Calcule os custos da viagem",
      after: "antes de enviar o pedido.",
    },
    beforeTitle: "Antes da sessão",
    before: [
      "Durma bem e evite álcool e café em excesso na véspera e no próprio dia.",
      "Coma alguma coisa na hora antes da sessão e traga um lanche.",
      "Use roupa confortável: vai passar muito tempo na mesma posição.",
      "Nas 2 semanas anteriores, proteja a zona do sol e não faça solário nem qualquer outro tipo de bronzeamento.",
      "Mantenha a pele hidratada e beba bastante água.",
      "Não precisa de se depilar: o Daniel trata disso no próprio dia, com lâmina. Se preferir cera, faça-a pelo menos 5 dias antes.",
      "Venha sem pressas e sem compromissos para o resto do dia: as sessões costumam durar 5 a 6 horas.",
      "Traga o restante em dinheiro ou pague por MB WAY ou Revolut: o estúdio não tem multibanco.",
      "Pode trazer um acompanhante, com 16 anos ou mais.",
    ],
    questionsTitle: "Perguntas",
    questions: [
      {
        question: "Quanto custa uma tatuagem?",
        answer:
          "Cada peça tem um orçamento próprio, enviado por email depois de nos mandar a sua ideia. Uma peça avulsa é orçamentada pela complexidade, pelo tamanho e pela zona do corpo. Os projetos grandes, como sleeves ou costas completas e outros trabalhos com mais de 3 sessões, têm um valor fixo por sessão. Não cobramos à hora, e o valor só muda se a ideia ou o tamanho mudarem; se isso acontecer, fica a saber o novo valor antes de a sessão começar.",
      },
      {
        question: "É preciso pagar sinal?",
        answer:
          "Sim. O sinal, não reembolsável, confirma a sua data e é descontado no valor final, no dia da sessão. Enquanto não for pago, a data fica apenas reservada provisoriamente: se alguém pedir a mesma data, ou se faltar menos de um mês, o estúdio entra em contacto consigo para confirmar se quer avançar.",
      },
      {
        question: "Como se paga?",
        answer:
          "O sinal paga-se por MB WAY, PayPal, Revolut ou transferência bancária; o restante, no dia, em dinheiro, por MB WAY ou Revolut. O estúdio não tem multibanco.",
      },
      {
        question: "Posso mudar a data?",
        answer:
          "Sim, uma vez, com pelo menos 2 semanas de antecedência: o sinal passa para a nova data. Uma segunda alteração implica um novo sinal.",
      },
      {
        question: "E se me atrasar ou não puder vir?",
        answer:
          "Há uma tolerância de 15 minutos; se souber que se vai atrasar, avise o estúdio. Se faltar ou cancelar em cima da hora, perde o sinal, e para marcar nova data tem de pagar 50% do valor antecipadamente.",
      },
      {
        question: "Há idade mínima?",
        answer: "Sim, 18 anos. O Daniel não tatua menores, mesmo com autorização dos pais.",
      },
      {
        question: "Quando é que não me posso tatuar?",
        answer:
          "Durante a gravidez ou a amamentação, se estiver a tomar antibióticos ou anticoagulantes, durante uma quimioterapia ou tratamento semelhante, ou sob o efeito de álcool ou drogas. A pele a tatuar tem de estar saudável: sem escaldões, feridas, cortes, queimaduras ou doenças como a psoríase. Se tiver uma doença de pele noutra zona do corpo, peça a aprovação do seu médico antes de pagar o sinal.",
      },
      {
        question: "Quanto tempo dura uma sessão?",
        answer:
          "Quase todas as sessões ocupam o dia inteiro, reservado só para si. Começam às 11h e duram até a peça ficar terminada: cerca de 4 a 5 horas para uma peça de 20 cm, como um lado do antebraço, e 7 a 8 horas ou mais para 30 cm, como a parte de fora do braço. Em média, umas 6 horas.",
      },
      {
        question: "Um projeto grande pode ser feito numa só viagem?",
        answer:
          "Normalmente, sim. O Daniel trabalha em “modo impressora”: cada zona de pele fica terminada numa só sessão e ele não volta a ela, por isso a sessão seguinte não tem de esperar pela cicatrização. Recomendamos um ou dois dias de descanso entre sessões e nunca mais de 2 dias seguidos. Para quem vem de fora, são possíveis até 4 sessões por semana, dia sim, dia não: uma sleeve completa costuma levar 4 sessões, por isso pode ficar pronta em cerca de uma semana.",
      },
      {
        question: "Quando vejo o desenho?",
        answer:
          "O Daniel faz o desenho perto da data da sessão e envia-o na véspera, normalmente por volta das 23h. Se quiser mudar algum pormenor, basta responder: ele ajusta e volta a enviar, ou faz a alteração no próprio dia, antes de imprimir o stencil. Mudar o desenho todo ou a sua estrutura implica marcar nova data e perder o sinal, porque cada desenho leva 3 a 4 horas a fazer. Por isso, envie com antecedência qualquer pedido específico, para o Daniel o ter em conta.",
      },
      {
        question: "Os retoques são gratuitos?",
        answer:
          "Pequenas falhas nas linhas ou no preenchimento são retocadas gratuitamente durante 6 meses. Primeiro, o Daniel avalia a tatuagem já cicatrizada, porque a cicatrização depende muito dos cuidados: a sua tatuagem é uma obra de arte que vai levar consigo para a vida e também precisa que cuide dela. Se o retoque for necessário porque a tatuagem não foi bem cuidada, por exemplo depois de praia, mar, piscina ou de um escaldão, já não é gratuito.",
      },
      {
        question: "A minha tatuagem pode ser publicada?",
        answer:
          "Pode ser. No formulário de consentimento escolhe se o seu rosto pode aparecer; se não quiser, só usamos fotos e vídeos em que o rosto não se veja.",
      },
      {
        question: "Que línguas se falam no estúdio?",
        answer: "Português e inglês.",
      },
      {
        question: "Os guest spots funcionam da mesma maneira?",
        answer:
          "No essencial, sim. Cada estúdio anfitrião tem as suas próprias regras, por exemplo quanto a acompanhantes e pagamentos, e recebe as indicações desse estúdio quando fizer a marcação.",
      },
      {
        question: "Têm vales de oferta?",
        answer:
          "Sim, em papel, para levantar no estúdio ou receber por correio. Basta pedir ao estúdio por email.",
      },
      {
        question: "Que tipo de trabalho faz o Daniel?",
        answer:
          "Só desenhos personalizados, no seu próprio estilo: preto e branco, traço detalhado, forte contraste e pequenos apontamentos de vermelho. Não faz cópias do trabalho de outros artistas, desenhos feitos com IA, cover-ups nem projetos a cores.",
      },
    ],
    aftercare: {
      before: "Depois da sessão, siga o",
      link: "guia de cuidados",
      after: ".",
    },
  },
  fr: {
    eyebrowDetail: "De l’idée à la peau",
    headingFirst: "De l’idée",
    headingSecond: "à la peau.",
    start: "Demander un devis",
    languageNote: "Le studio répond en anglais et en portugais.",
    steps: [
      {
        number: "I",
        title: "Envoyez votre idée",
        text: "Remplissez le formulaire : le thème, une courte description, des références et une photo de la zone à tatouer.",
      },
      {
        number: "II",
        title: "Devis et date",
        text: "Joana répond à chaque demande par e-mail, avec votre devis et les dates disponibles.",
      },
      {
        number: "III",
        title: "Acompte",
        text: "Un acompte non remboursable bloque votre date ; il est déduit du prix le jour de la séance.",
      },
      {
        number: "IV",
        title: "Dessin et séance",
        text: "Daniel réalise chaque dessin peu avant la séance. Vous recevez la version finale la veille au soir, et les petits ajustements se font le jour même.",
      },
    ],
    whatToSendTitle: "Ce qu’il faut nous envoyer",
    whatToSend: [
      "Le thème ou le personnage",
      "Une courte description de votre idée",
      "Des images de référence",
      "Une photo de la zone à tatouer",
      "Le lieu : Braga ou la ville d’un guest spot",
    ],
    travel: {
      before: "Vous venez à Braga ?",
      link: "Estimez le coût du voyage",
      after: "avant d’envoyer votre demande.",
    },
    beforeTitle: "Avant votre séance",
    before: [
      "Dormez bien et évitez l’alcool et les excès de café la veille et le jour même.",
      "Mangez quelque chose dans l’heure qui précède la séance et prévoyez un en-cas.",
      "Portez des vêtements confortables : vous resterez longtemps dans la même position.",
      "Pendant les 2 semaines qui précèdent, protégez la zone du soleil et évitez les UV et toute autre forme de bronzage.",
      "Hydratez bien votre peau et buvez beaucoup d’eau.",
      "Inutile de vous raser : Daniel s’en charge le jour même. Si vous préférez la cire, faites-la au moins 5 jours avant.",
      "Ne prévoyez rien pour le reste de la journée : une séance dure en général 5 à 6 heures.",
      "Réglez le solde en espèces, par MB WAY ou par Revolut : le studio n’accepte pas la carte bancaire.",
      "Une personne de 16 ans ou plus peut vous accompagner.",
    ],
    questionsTitle: "Questions",
    questions: [
      {
        question: "Combien coûte un tatouage ?",
        answer:
          "Chaque pièce fait l’objet d’un devis personnalisé, envoyé par e-mail une fois votre idée reçue. Une pièce seule est chiffrée selon sa complexité, sa taille et son emplacement. Les grands projets, comme un bras ou un dos complet et tout travail de plus de 3 séances, ont un prix fixe par séance. Il n’y a pas de tarif horaire, et le devis ne change que si l’idée ou la taille changent ; dans ce cas, vous connaissez le nouveau prix avant le début de la séance.",
      },
      {
        question: "Faut-il verser un acompte ?",
        answer:
          "Oui. Un acompte non remboursable confirme votre date et il est déduit du prix le jour de la séance. Tant qu’il n’est pas versé, la date n’est réservée qu’à titre provisoire : si quelqu’un d’autre la demande, ou si elle approche à moins d’un mois, le studio vous contacte pour savoir si vous confirmez.",
      },
      {
        question: "Comment se passe le paiement ?",
        answer:
          "L’acompte par MB WAY, PayPal, Revolut ou virement bancaire ; le solde le jour même, en espèces, par MB WAY ou par Revolut. Le studio n’accepte pas la carte bancaire.",
      },
      {
        question: "Puis-je changer de date ?",
        answer:
          "Oui, une fois, en prévenant au moins 2 semaines à l’avance : votre acompte est reporté sur la nouvelle date. Un second report nécessite un nouvel acompte.",
      },
      {
        question: "Et si je suis en retard ou si je ne peux pas venir ?",
        answer:
          "Le studio vous attend jusqu’à 15 minutes ; si vous savez que vous serez en retard, prévenez-le. Si vous ne venez pas ou annulez au dernier moment, vous perdez l’acompte, et pour une nouvelle date, 50 % du prix sont à régler à l’avance.",
      },
      {
        question: "Y a-t-il un âge minimum ?",
        answer:
          "Oui, 18 ans. Daniel ne tatoue pas les mineurs, même avec l’accord de leurs parents.",
      },
      {
        question: "Dans quels cas ne puis-je pas me faire tatouer ?",
        answer:
          "Pendant la grossesse ou l’allaitement, sous antibiotiques ou anticoagulants, pendant une chimiothérapie ou un traitement similaire, ou sous l’effet de l’alcool ou de drogues. La peau à tatouer doit être saine : pas de coup de soleil, de plaies, de coupures, de brûlures ni de maladie comme le psoriasis. Si vous avez un problème de peau ailleurs sur le corps, demandez l’avis de votre médecin avant de verser l’acompte.",
      },
      {
        question: "Combien de temps dure une séance ?",
        answer:
          "Presque toutes les séances durent la journée entière, réservée rien que pour vous. Elles commencent à 11 h et se poursuivent jusqu’à ce que la pièce soit terminée : environ 4 à 5 heures pour une pièce de 20 cm, comme une face de l’avant-bras, et 7 à 8 heures ou plus pour 30 cm, comme l’extérieur du bras. Comptez en moyenne 6 heures.",
      },
      {
        question: "Un grand projet peut-il se faire en un seul voyage ?",
        answer:
          "En général, oui. Daniel travaille en « mode imprimante » : il termine chaque zone de peau en une seule séance et n’y revient plus, donc la séance suivante n’a pas besoin d’attendre la cicatrisation. Nous conseillons un ou deux jours de repos entre les séances, et jamais plus de 2 jours d’affilée. Si vous venez de loin, c’est jusqu’à 4 séances par semaine, un jour sur deux : un bras complet demande en général 4 séances et peut donc être réalisé en une semaine environ.",
      },
      {
        question: "Quand vais-je voir le dessin ?",
        answer:
          "Daniel le dessine peu avant la séance et vous l’envoie la veille, en général vers 23 h. Si vous voulez changer un détail, répondez simplement : il l’ajuste et vous le renvoie, ou le modifie le jour même, avant d’imprimer le stencil. Changer tout le dessin ou sa structure implique une nouvelle date et la perte de l’acompte, car un dessin représente 3 à 4 heures de travail. Envoyez donc vos souhaits précis à l’avance, pour que Daniel puisse les intégrer.",
      },
      {
        question: "Les retouches sont-elles gratuites ?",
        answer:
          "Les petits manques dans les lignes ou les ombrages sont retouchés gratuitement pendant 6 mois. Daniel examine d’abord le tatouage cicatrisé, car la cicatrisation dépend beaucoup des soins : votre tatouage est une œuvre d’art que vous porterez toute votre vie, et il a besoin que vous en preniez soin. Si une retouche est nécessaire parce que le tatouage n’a pas été bien entretenu, par exemple après la plage, la mer, la piscine ou un coup de soleil, elle est payante.",
      },
      {
        question: "Mon tatouage sera-t-il publié en ligne ?",
        answer:
          "C’est possible. Sur le formulaire de consentement, vous choisissez si votre visage peut apparaître ; si vous refusez, seules les photos et vidéos où l’on ne voit pas votre visage sont utilisées.",
      },
      {
        question: "Quelles langues parle-t-on au studio ?",
        answer: "Le portugais et l’anglais. Vous pouvez écrire votre demande en anglais.",
      },
      {
        question: "Les guest spots fonctionnent-ils de la même façon ?",
        answer:
          "Dans l’ensemble, oui. Chaque studio d’accueil a ses propres règles, par exemple pour les accompagnants et le paiement, et vous recevez ses consignes au moment de réserver.",
      },
      {
        question: "Proposez-vous des cartes cadeaux ?",
        answer:
          "Oui, en version imprimée, à retirer au studio ou à recevoir par la poste. Il suffit de les demander au studio par e-mail.",
      },
      {
        question: "Quel type de tatouage fait Daniel ?",
        answer:
          "Uniquement des créations sur mesure, dans son propre style : noir et blanc, trait détaillé, fort contraste et petites touches de rouge. Pas de copie du travail d’autres artistes, pas de dessins générés par IA, pas de recouvrements (cover-ups) et pas de projets en couleur.",
      },
    ],
    aftercare: {
      before: "Après votre séance, suivez le",
      link: "guide des soins",
      after: ".",
    },
  },
  de: {
    eyebrowDetail: "Von der Idee unter die Haut",
    headingFirst: "Von der Idee",
    headingSecond: "unter die Haut.",
    start: "Anfrage starten",
    languageNote: "Das Studio antwortet auf Englisch und Portugiesisch.",
    steps: [
      {
        number: "I",
        title: "Schick uns deine Idee",
        text: "Füll das Anfrageformular aus: das Thema, eine kurze Beschreibung, Referenzen und ein Foto der Körperstelle.",
      },
      {
        number: "II",
        title: "Angebot & Termin",
        text: "Joana beantwortet jede Anfrage per E-Mail – mit deinem persönlichen Angebot und freien Terminen.",
      },
      {
        number: "III",
        title: "Anzahlung",
        text: "Eine Anzahlung sichert deinen Termin. Sie wird nicht erstattet, aber am Tag der Session vom Preis abgezogen.",
      },
      {
        number: "IV",
        title: "Motiv & Session",
        text: "Daniel zeichnet jedes Motiv kurz vor der Session. Die fertige Zeichnung bekommst du am Abend vorher; kleine Anpassungen macht er am Tag selbst.",
      },
    ],
    whatToSendTitle: "Was wir von dir brauchen",
    whatToSend: [
      "Das Thema oder die Figur",
      "Eine kurze Beschreibung deiner Idee",
      "Referenzbilder",
      "Ein Foto der Körperstelle",
      "Wo: Braga oder eine Guest-Spot-Stadt",
    ],
    travel: {
      before: "Du kommst von weiter weg?",
      link: "Rechne die Reise durch",
      after: "– am besten, bevor du deine Anfrage schickst.",
    },
    beforeTitle: "Vor deiner Session",
    before: [
      "Schlaf gut und verzichte am Vortag und am Tag selbst auf Alkohol und zu viel Kaffee.",
      "Iss in der Stunde vorher etwas und bring einen Snack für die Session mit.",
      "Trag bequeme Kleidung – du bleibst lange in derselben Position.",
      "Schütze die Stelle in den 2 Wochen davor vor Sonne, Solarium und jeder anderen Art von Bräunung.",
      "Creme deine Haut regelmäßig ein und trink viel Wasser.",
      "Rasieren musst du dich nicht: Das macht Daniel am Tag selbst. Falls du lieber mit Wachs enthaarst, dann mindestens 5 Tage vorher.",
      "Plan für den Rest des Tages nichts mehr ein: Eine Session dauert meist 5 bis 6 Stunden.",
      "Den Restbetrag zahlst du bar, per MB WAY oder per Revolut – Kartenzahlung ist nicht möglich.",
      "Eine Begleitperson ab 16 Jahren darf mitkommen.",
    ],
    questionsTitle: "Fragen",
    questions: [
      {
        question: "Was kostet ein Tattoo?",
        answer:
          "Für jedes Motiv bekommst du ein persönliches Angebot per E-Mail, sobald du uns deine Idee geschickt hast. Einzelne Motive werden nach Aufwand, Größe und Körperstelle berechnet. Große Projekte wie komplette Sleeves, ganze Rücken und alles mit mehr als 3 Sessions haben einen festen Preis pro Session. Stundensätze gibt es nicht, und das Angebot ändert sich nur, wenn sich die Idee oder die Größe ändert – den neuen Preis kennst du dann immer vor Beginn der Session.",
      },
      {
        question: "Gibt es eine Anzahlung?",
        answer:
          "Ja. Die Anzahlung bestätigt deinen Termin; sie wird nicht erstattet, aber am Tag der Session vom Preis abgezogen. Solange sie nicht bezahlt ist, ist der Termin nur vorgemerkt: Fragt jemand anderes nach dem Termin oder ist er weniger als einen Monat entfernt, meldet sich das Studio bei dir und fragt, ob du dabei bleibst.",
      },
      {
        question: "Wie bezahle ich?",
        answer:
          "Die Anzahlung per MB WAY, PayPal, Revolut oder Überweisung, den Rest am Tag der Session bar, per MB WAY oder per Revolut. Kartenzahlung ist im Studio nicht möglich.",
      },
      {
        question: "Kann ich meinen Termin verschieben?",
        answer:
          "Ja, einmal, wenn du mindestens 2 Wochen vorher Bescheid gibst: Deine Anzahlung gilt dann für den neuen Termin. Für eine zweite Verschiebung ist eine neue Anzahlung fällig.",
      },
      {
        question: "Was, wenn ich zu spät komme oder nicht kommen kann?",
        answer:
          "Das Studio wartet bis zu 15 Minuten; wenn du weißt, dass du später kommst, sag bitte Bescheid. Erscheinst du nicht oder sagst du kurzfristig ab, verfällt die Anzahlung, und für einen neuen Termin zahlst du 50 % des Preises im Voraus.",
      },
      {
        question: "Gibt es ein Mindestalter?",
        answer:
          "Ja, 18 Jahre. Daniel tätowiert keine Minderjährigen, auch nicht mit Einverständnis der Eltern.",
      },
      {
        question: "Wann kann ich mich nicht tätowieren lassen?",
        answer:
          "In der Schwangerschaft und Stillzeit, wenn du Antibiotika oder Blutverdünner nimmst, während einer Chemotherapie oder ähnlichen Behandlung und unter Einfluss von Alkohol oder Drogen. Die Haut an der Stelle muss gesund sein: kein Sonnenbrand, keine Wunden, Schnitte, Verbrennungen oder Hauterkrankungen wie Schuppenflechte. Hast du an einer anderen Körperstelle eine Hauterkrankung, sprich vor der Anzahlung mit deiner Ärztin oder deinem Arzt.",
      },
      {
        question: "Wie lange dauert eine Session?",
        answer:
          "Fast jede Session geht über den ganzen Tag, der nur für dich reserviert ist. Sie beginnt um 11 Uhr und dauert, bis das Motiv fertig ist: etwa 4 bis 5 Stunden für ein Motiv von 20 cm, zum Beispiel eine Seite des Unterarms, und 7 bis 8 Stunden oder mehr für 30 cm, etwa die Außenseite des Oberarms. Im Schnitt sind es rund 6 Stunden.",
      },
      {
        question: "Lässt sich ein großes Projekt in einer Reise umsetzen?",
        answer:
          "Meistens ja. Daniel arbeitet im „Druckermodus“: Er macht jede Hautpartie in einer einzigen Session fertig und geht danach nicht mehr ran, deshalb muss die nächste Session nicht auf die Heilung warten. Wir empfehlen einen oder zwei Ruhetage zwischen den Sessions und höchstens 2 Tage am Stück. Wer anreist, kann bis zu 4 Sessions pro Woche machen, jeden zweiten Tag: Ein kompletter Arm-Sleeve braucht meist 4 Sessions und ist damit in etwa einer Woche fertig.",
      },
      {
        question: "Wann sehe ich das Motiv?",
        answer:
          "Daniel zeichnet es kurz vor der Session und schickt es dir am Abend vorher, meist gegen 23 Uhr. Möchtest du ein Detail ändern, antworte einfach: Er passt es an und schickt es dir noch einmal, oder er ändert es am Tag selbst, bevor die Schablone gedruckt wird. Willst du das ganze Motiv oder seinen Aufbau ändern, brauchst du einen neuen Termin und die Anzahlung verfällt, denn eine Zeichnung kostet 3 bis 4 Stunden Arbeit. Schick besondere Wünsche deshalb vorher, damit Daniel sie einplanen kann.",
      },
      {
        question: "Ist Nachstechen kostenlos?",
        answer:
          "Kleine Lücken in den Linien oder Schattierungen werden innerhalb von 6 Monaten kostenlos nachgestochen. Daniel schaut sich zuerst das verheilte Tattoo an, denn wie es heilt, hängt stark von der Pflege ab: Dein Tattoo ist ein Kunstwerk, das du ein Leben lang trägst – und es braucht deine Pflege. Ist ein Nachstechen nötig, weil das Tattoo nicht gut gepflegt wurde, etwa nach Strand, Meer, Schwimmbad oder Sonnenbrand, ist es nicht kostenlos.",
      },
      {
        question: "Wird mein Tattoo online gezeigt?",
        answer:
          "Vielleicht. In der Einverständniserklärung entscheidest du, ob dein Gesicht zu sehen sein darf; wenn nicht, verwenden wir nur Fotos und Videos, auf denen es nicht zu sehen ist.",
      },
      {
        question: "Welche Sprachen spricht man im Studio?",
        answer: "Portugiesisch und Englisch. Du kannst deine Anfrage auf Englisch schreiben.",
      },
      {
        question: "Laufen Guest Spots genauso ab?",
        answer:
          "Im Großen und Ganzen ja. Jedes Gaststudio hat eigene Regeln, etwa zu Begleitpersonen und Bezahlung, und bei der Buchung bekommst du die Hinweise des jeweiligen Studios.",
      },
      {
        question: "Gibt es Gutscheine?",
        answer:
          "Ja, gedruckte Gutscheine zum Abholen im Studio oder per Post. Frag einfach per E-Mail im Studio nach.",
      },
      {
        question: "Was tätowiert Daniel?",
        answer:
          "Nur individuelle Motive in seinem eigenen Stil: Schwarz-Weiß, detaillierte Linien, starker Kontrast und kleine rote Akzente. Keine Kopien fremder Arbeiten, keine KI-Motive, keine Cover-ups und keine farbigen Projekte.",
      },
    ],
    aftercare: {
      before: "Nach deiner Session hilft dir die",
      link: "Pflegeanleitung",
      after: ".",
    },
  },
  es: {
    eyebrowDetail: "De la idea a la piel",
    headingFirst: "De la idea",
    headingSecond: "a la piel.",
    start: "Pedir presupuesto",
    languageNote: "El estudio responde en inglés y en portugués.",
    steps: [
      {
        number: "I",
        title: "Envía tu idea",
        text: "Rellena el formulario: el tema, una breve descripción, referencias y una foto de la zona que quieres tatuar.",
      },
      {
        number: "II",
        title: "Presupuesto y fecha",
        text: "Joana responde a todas las solicitudes por email, con tu presupuesto y las fechas disponibles.",
      },
      {
        number: "III",
        title: "Señal",
        text: "Una señal no reembolsable te reserva la fecha. Se descuenta del precio el día de la sesión.",
      },
      {
        number: "IV",
        title: "Diseño y sesión",
        text: "Daniel dibuja cada diseño poco antes de la sesión. Recibes el dibujo final la noche anterior, y los pequeños ajustes se hacen el mismo día.",
      },
    ],
    whatToSendTitle: "Qué tienes que enviar",
    whatToSend: [
      "El tema o el personaje",
      "Una breve descripción de tu idea",
      "Imágenes de referencia",
      "Una foto de la zona",
      "Dónde: Braga o la ciudad de un guest spot",
    ],
    travel: {
      before: "¿Vienes a Braga?",
      link: "Calcula cuánto te costará el viaje",
      after: "antes de enviar tu solicitud.",
    },
    beforeTitle: "Antes de tu sesión",
    before: [
      "Duerme bien y evita el alcohol y el exceso de café el día anterior y el mismo día.",
      "Come algo en la hora previa y trae algo para picar durante la sesión.",
      "Lleva ropa cómoda: vas a pasar mucho tiempo en la misma postura.",
      "Durante las 2 semanas anteriores, no expongas la zona al sol ni a rayos UVA, y evita cualquier otro tipo de bronceado.",
      "Mantén la piel hidratada y bebe mucha agua.",
      "No hace falta que te depiles: Daniel rasura la zona el mismo día. Si prefieres la cera, que sea al menos 5 días antes.",
      "No hagas planes para el resto del día: las sesiones suelen durar de 5 a 6 horas.",
      "El resto se paga en efectivo, por MB WAY o por Revolut: en el estudio no se aceptan tarjetas.",
      "Puede acompañarte una persona de 16 años o más.",
    ],
    questionsTitle: "Preguntas",
    questions: [
      {
        question: "¿Cuánto cuesta un tatuaje?",
        answer:
          "Cada pieza tiene su propio presupuesto, que te enviamos por email cuando nos mandas tu idea. Una pieza suelta se valora según su complejidad, su tamaño y la zona del cuerpo. Los proyectos grandes, como una manga o una espalda completas y cualquier trabajo de más de 3 sesiones, tienen un precio fijo por sesión. No cobramos por horas, y el presupuesto solo cambia si cambian la idea o el tamaño; en ese caso, siempre sabrás el nuevo precio antes de empezar la sesión.",
      },
      {
        question: "¿Hay que pagar una señal?",
        answer:
          "Sí. La señal, que no se devuelve, confirma tu fecha y se descuenta del precio el día de la sesión. Mientras no la pagues, la fecha solo queda apartada: si otra persona la pide, o si falta menos de un mes, el estudio se pondrá en contacto contigo para confirmar que sigues adelante.",
      },
      {
        question: "¿Cómo se paga?",
        answer:
          "La señal, por MB WAY, PayPal, Revolut o transferencia bancaria; el resto, el mismo día, en efectivo, por MB WAY o por Revolut. En el estudio no se aceptan tarjetas.",
      },
      {
        question: "¿Puedo cambiar la fecha?",
        answer:
          "Sí, una vez, avisando con al menos 2 semanas de antelación: la señal se traslada a la nueva fecha. Para un segundo cambio hace falta una nueva señal.",
      },
      {
        question: "¿Y si llego tarde o no puedo ir?",
        answer:
          "El estudio te espera hasta 15 minutos; si sabes que vas a llegar tarde, avisa. Si no te presentas o cancelas a última hora, pierdes la señal, y para una nueva fecha tendrás que pagar por adelantado el 50 % del precio.",
      },
      {
        question: "¿Hay una edad mínima?",
        answer: "Sí, 18 años. Daniel no tatúa a menores, ni siquiera con permiso de sus padres.",
      },
      {
        question: "¿Cuándo no puedo tatuarme?",
        answer:
          "Durante el embarazo o la lactancia, si tomas antibióticos o anticoagulantes, durante una quimioterapia o un tratamiento similar, o bajo los efectos del alcohol o de drogas. La piel que se va a tatuar tiene que estar sana: sin quemaduras del sol, heridas, cortes, quemaduras ni afecciones como la psoriasis. Si tienes algún problema de piel en otra zona del cuerpo, consúltalo con tu médico antes de pagar la señal.",
      },
      {
        question: "¿Cuánto dura una sesión?",
        answer:
          "Casi todas las sesiones ocupan el día entero, reservado solo para ti. Empiezan a las 11:00 y duran hasta que la pieza está terminada: unas 4 o 5 horas para una pieza de 20 cm, como un lado del antebrazo, y 7 u 8 horas o más para 30 cm, como la parte exterior del brazo. De media, unas 6 horas.",
      },
      {
        question: "¿Se puede hacer un proyecto grande en un solo viaje?",
        answer:
          "Normalmente, sí. Daniel trabaja en «modo impresora»: termina cada zona de piel en una sola sesión y no vuelve a tocarla, así que la siguiente sesión no tiene que esperar a que cicatrice. Recomendamos uno o dos días de descanso entre sesiones y nunca más de 2 días seguidos. Si vienes de fuera, puedes hacer hasta 4 sesiones por semana, en días alternos: una manga completa suele llevar 4 sesiones, así que puede estar lista en más o menos una semana.",
      },
      {
        question: "¿Cuándo veo el diseño?",
        answer:
          "Daniel lo dibuja poco antes de la sesión y te lo envía la noche anterior, normalmente hacia las 23:00. Si quieres cambiar algún detalle, basta con responder: lo ajusta y te lo vuelve a enviar, o lo cambia el mismo día, antes de imprimir el stencil. Cambiar el diseño entero o su estructura supone una nueva fecha y perder la señal, porque cada diseño lleva 3 o 4 horas de trabajo. Así que envía con antelación cualquier petición concreta, para que Daniel la tenga en cuenta.",
      },
      {
        question: "¿Los retoques son gratis?",
        answer:
          "Los pequeños fallos en las líneas o el sombreado se retocan gratis durante 6 meses. Daniel revisa primero el tatuaje ya cicatrizado, porque cómo cicatriza depende mucho de los cuidados: tu tatuaje es una obra de arte que llevarás toda la vida, y necesita que lo cuides. Si el retoque hace falta porque el tatuaje no se ha cuidado bien, por ejemplo después de ir a la playa, al mar o a la piscina, o de una quemadura del sol, no es gratis.",
      },
      {
        question: "¿Se publicará mi tatuaje?",
        answer:
          "Puede que sí. En el formulario de consentimiento eliges si tu cara puede aparecer; si dices que no, solo se usan fotos y vídeos en los que no se te vea la cara.",
      },
      {
        question: "¿Qué idiomas se hablan en el estudio?",
        answer: "Portugués e inglés. Puedes escribir tu solicitud en inglés.",
      },
      {
        question: "¿Los guest spots funcionan igual?",
        answer:
          "En general, sí. Cada estudio anfitrión tiene sus propias normas, por ejemplo sobre acompañantes y pagos, y al reservar recibes las indicaciones de ese estudio.",
      },
      {
        question: "¿Tenéis tarjetas regalo?",
        answer:
          "Sí, en papel, para recoger en el estudio o recibir por correo. Solo tienes que pedirlas al estudio por email.",
      },
      {
        question: "¿Qué tipo de tatuajes hace Daniel?",
        answer:
          "Solo diseños personalizados, en su propio estilo: blanco y negro, línea detallada, mucho contraste y pequeños toques de rojo. No hace copias del trabajo de otros artistas, ni diseños hechos con IA, ni cover-ups, ni proyectos a color.",
      },
    ],
    aftercare: {
      before: "Después de tu sesión, sigue la",
      link: "guía de cuidados",
      after: ".",
    },
  },
};

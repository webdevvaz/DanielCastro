import type { Locale } from "@/i18n/locales";

/**
 * The About page's text. The biography is the studio's own (also on the Necrotic Wear site); the
 * awards, conventions, and past guest spots come from Daniel's CV. Event and award category
 * names stay in their original language.
 */
const en = {
  quote:
    "“When I was 6, I was drawing on a sheet of paper and someone asked me: ‘Did you know you can make drawings on skin that never wash off?’ That was the first time I’d heard of tattoos, and I’ve been fascinated ever since.”",
  bio: [
    "Daniel loved drawing from an early age, but life first took him in another direction. He graduated in electrotechnical engineering, and straight after graduating he landed an internship that promised a career. Luckily for him, those promises fell through, and he took it as his chance to follow his dream of becoming a tattoo artist.",
    "He signed up for a tattoo course to get the best possible guidance for this new adventure, and in 2015 he started what is now his career. The road wasn’t always smooth, but hard work pays off: starting out on his own, he built his way up to his own studio in Portugal and to travelling the world with his art.",
    "Over the years he has developed a style all his own, built on linework and inspired by the artists who fascinated him as a kid: comic book artists, manga artists and even Renaissance masters. Today he focuses mainly on anime themes in manga style, because he’ll always be a geek at heart, forever looking for the next challenge to push his skills further.",
    "His studio in Braga opened in June 2023. Since 2022 he has also been a resident artist with Squid Ink aboard Virgin Voyages ships, and since 2023 he has been part of the Pepax Pro Team.",
  ],
  portraitAlt: "Daniel Castro in his studio in Braga",
  awardsTitle: "Awards",
  awards: [
    {
      title: "Third place, Anime Cartoon",
      where: "Urban Land Tattoo Expo Roma, Rome, Italy",
      year: "2024",
    },
    {
      title: "Second place, Anime/Manga/Kawaii Tattoo",
      where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal",
      year: "2024",
    },
    {
      title: "First place, Best Anime/Manga Tattoo",
      where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal",
      year: "2023",
    },
    { title: "Best of Day", where: "Lisbon Tattoo Rock Fest, Lisbon, Portugal", year: "2023" },
  ],
  conventionsTitle: "Conventions",
  conventions: [
    { title: "Oporto Tattoo", where: "Porto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
    { title: "Lisbon Tattoo Rock Fest", where: "Lisbon, Portugal", year: "2023, 2024" },
    { title: "Urban Land Tattoo Expo Roma", where: "Rome, Italy", year: "2024" },
    { title: "The Tattooed Planet", where: "Manchester, United Kingdom", year: "2024" },
    { title: "Pyromaniacs International Tattoo Convention", where: "Luxembourg", year: "2019" },
  ],
  guestSpotsTitle: "Guest spots so far",
  guestSpots: [
    { title: "Düsseldorf", where: "Germany", year: "2024–2026" },
    { title: "Zurich", where: "Switzerland", year: "2024, 2025" },
    { title: "London", where: "United Kingdom", year: "2025, 2026" },
    { title: "Amsterdam", where: "Netherlands", year: "2026" },
    { title: "Paris", where: "France", year: "2024" },
  ],
  nextGuestSpots: "See the upcoming guest spots.",
  studioTitle: "The studio",
  studioCity: "Braga, Portugal",
  cta: "Have an idea for a piece?",
};

/** The About page's text, per language. */
export const ABOUT_PAGE_TEXT: Record<Locale, typeof en> = {
  en,
  pt: {
    quote:
      "“Quando tinha 6 anos, estava a desenhar numa folha e alguém me disse: ‘Sabias que é possível fazer desenhos na pele que nunca saem?’ Foi a primeira vez que ouvi falar de tatuagens e, desde então, nunca mais deixaram de me fascinar.”",
    bio: [
      "O Daniel sempre gostou de desenhar, mas a vida acabou por levá-lo para outra área. Licenciou-se em Engenharia Eletrotécnica e, logo depois de terminar o curso, conseguiu um estágio com promessas de carreira. Felizmente para ele, essas promessas não se cumpriram, e ele aproveitou a oportunidade para ir atrás do sonho de ser tatuador.",
      "Inscreveu-se num curso de tatuagem, para ter a melhor orientação nesta nova aventura, e em 2015 começou aquilo que é hoje a sua carreira. O caminho nem sempre foi fácil, mas o trabalho compensa: começou por conta própria e foi construindo o seu percurso até ter estúdio próprio em Portugal e viajar pelo mundo com a sua arte.",
      "Ao longo dos anos desenvolveu um estilo muito próprio, assente no linework e inspirado nos artistas que o fascinavam em criança: autores de banda desenhada, de manga e até artistas do Renascimento. Hoje dedica-se sobretudo a temas de anime em estilo manga, porque será sempre um geek de coração, sempre à procura do próximo desafio para evoluir.",
      "O seu estúdio em Braga abriu em junho de 2023. Desde 2022 é também artista residente da Squid Ink a bordo dos navios da Virgin Voyages e, desde 2023, faz parte da Pepax Pro Team.",
    ],
    portraitAlt: "Daniel Castro no seu estúdio em Braga",
    awardsTitle: "Prémios",
    awards: [
      {
        title: "3.º lugar, Anime Cartoon",
        where: "Urban Land Tattoo Expo Roma, Roma, Itália",
        year: "2024",
      },
      {
        title: "2.º lugar, Anime/Manga/Kawaii Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal",
        year: "2024",
      },
      {
        title: "1.º lugar, Best Anime/Manga Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal",
        year: "2023",
      },
      { title: "Best of Day", where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal", year: "2023" },
    ],
    conventionsTitle: "Convenções",
    conventions: [
      { title: "Oporto Tattoo", where: "Porto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
      { title: "Lisbon Tattoo Rock Fest", where: "Lisboa, Portugal", year: "2023, 2024" },
      { title: "Urban Land Tattoo Expo Roma", where: "Roma, Itália", year: "2024" },
      { title: "The Tattooed Planet", where: "Manchester, Reino Unido", year: "2024" },
      { title: "Pyromaniacs International Tattoo Convention", where: "Luxemburgo", year: "2019" },
    ],
    guestSpotsTitle: "Guest spots até agora",
    guestSpots: [
      { title: "Düsseldorf", where: "Alemanha", year: "2024–2026" },
      { title: "Zurique", where: "Suíça", year: "2024, 2025" },
      { title: "Londres", where: "Reino Unido", year: "2025, 2026" },
      { title: "Amesterdão", where: "Países Baixos", year: "2026" },
      { title: "Paris", where: "França", year: "2024" },
    ],
    nextGuestSpots: "Ver os próximos guest spots.",
    studioTitle: "O estúdio",
    studioCity: "Braga, Portugal",
    cta: "Tem uma ideia para uma tatuagem?",
  },
  fr: {
    quote:
      "« Quand j’avais 6 ans, je dessinais sur une feuille et quelqu’un m’a dit : “Tu savais qu’on peut faire sur la peau des dessins qui ne s’effacent jamais ?” C’était la première fois que j’entendais parler de tatouage, et depuis, ça me fascine. »",
    bio: [
      "Daniel a toujours aimé dessiner, mais la vie l’a d’abord mené vers un autre domaine. Diplômé en génie électrotechnique, il a décroché juste après ses études un stage qui lui promettait une carrière. Heureusement pour lui, ces promesses n’ont pas été tenues, et il y a vu l’occasion de réaliser son rêve : devenir tatoueur.",
      "Il s’est inscrit à une formation de tatouage pour être bien guidé dans cette nouvelle aventure, et c’est en 2015 qu’il a commencé ce qui est aujourd’hui sa carrière. Le chemin n’a pas toujours été simple, mais le travail finit par payer : parti seul, il s’est construit un parcours qui l’a mené jusqu’à son propre studio au Portugal et à voyager dans le monde entier avec son art.",
      "Au fil des années, il a développé un style très personnel, fondé sur le travail du trait et inspiré par les artistes qui le fascinaient enfant : auteurs de comics, mangakas et même maîtres de la Renaissance. Aujourd’hui, il se consacre surtout aux thèmes d’anime dans un style manga, parce qu’il restera toujours un geek dans l’âme, toujours en quête du prochain défi pour progresser.",
      "Son studio à Braga a ouvert en juin 2023. Depuis 2022, il est aussi artiste résident chez Squid Ink, à bord des navires de Virgin Voyages, et depuis 2023, il fait partie de la Pepax Pro Team.",
    ],
    portraitAlt: "Daniel Castro dans son studio à Braga",
    awardsTitle: "Récompenses",
    awards: [
      {
        title: "3e place, Anime Cartoon",
        where: "Urban Land Tattoo Expo Roma, Rome, Italie",
        year: "2024",
      },
      {
        title: "2e place, Anime/Manga/Kawaii Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisbonne, Portugal",
        year: "2024",
      },
      {
        title: "1re place, Best Anime/Manga Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisbonne, Portugal",
        year: "2023",
      },
      {
        title: "Best of Day",
        where: "Lisbon Tattoo Rock Fest, Lisbonne, Portugal",
        year: "2023",
      },
    ],
    conventionsTitle: "Conventions",
    conventions: [
      { title: "Oporto Tattoo", where: "Porto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
      { title: "Lisbon Tattoo Rock Fest", where: "Lisbonne, Portugal", year: "2023, 2024" },
      { title: "Urban Land Tattoo Expo Roma", where: "Rome, Italie", year: "2024" },
      { title: "The Tattooed Planet", where: "Manchester, Royaume-Uni", year: "2024" },
      { title: "Pyromaniacs International Tattoo Convention", where: "Luxembourg", year: "2019" },
    ],
    guestSpotsTitle: "Ses guest spots jusqu’ici",
    guestSpots: [
      { title: "Düsseldorf", where: "Allemagne", year: "2024–2026" },
      { title: "Zurich", where: "Suisse", year: "2024, 2025" },
      { title: "Londres", where: "Royaume-Uni", year: "2025, 2026" },
      { title: "Amsterdam", where: "Pays-Bas", year: "2026" },
      { title: "Paris", where: "France", year: "2024" },
    ],
    nextGuestSpots: "Voir les prochains guest spots.",
    studioTitle: "Le studio",
    studioCity: "Braga, Portugal",
    cta: "Vous avez une idée de tatouage ?",
  },
  de: {
    quote:
      "„Als ich 6 war, saß ich beim Zeichnen, und jemand fragte mich: ‚Wusstest du, dass man Bilder auf die Haut zeichnen kann, die nie wieder abgehen?‘ Da hörte ich zum ersten Mal von Tattoos – und seitdem lassen sie mich nicht mehr los.“",
    bio: [
      "Daniel hat schon immer gern gezeichnet, aber das Leben führte ihn zunächst in eine andere Richtung. Er schloss ein Studium der Elektrotechnik ab und bekam direkt danach ein Praktikum mit Aussicht auf eine Karriere. Zu seinem Glück wurde daraus nichts, und er nutzte die Chance, seinem Traum zu folgen: Tätowierer zu werden.",
      "Für sein neues Abenteuer belegte er einen Tattoo-Kurs, um von Anfang an gut angeleitet zu werden, und 2015 begann das, was heute seine Karriere ist. Der Weg war nicht immer leicht, aber harte Arbeit zahlt sich aus: Er fing allein an und hat es bis zum eigenen Studio in Portugal geschafft – und bis dahin, mit seiner Kunst um die Welt zu reisen.",
      "Über die Jahre entwickelte er einen ganz eigenen Stil: Die Linie ist sein Fundament, und seine Inspiration kommt von den Künstlern, die ihn schon als Kind fasziniert haben – Comiczeichnern, Mangaka und sogar Meistern der Renaissance. Heute konzentriert er sich vor allem auf Anime-Themen im Manga-Stil, denn im Herzen wird er immer ein Geek bleiben, stets auf der Suche nach der nächsten Herausforderung.",
      "Sein Studio in Braga eröffnete im Juni 2023. Seit 2022 ist er außerdem Resident Artist bei Squid Ink an Bord der Schiffe von Virgin Voyages, und seit 2023 gehört er zum Pepax Pro Team.",
    ],
    portraitAlt: "Daniel Castro in seinem Studio in Braga",
    awardsTitle: "Auszeichnungen",
    awards: [
      {
        title: "3. Platz, Anime Cartoon",
        where: "Urban Land Tattoo Expo Roma, Rom, Italien",
        year: "2024",
      },
      {
        title: "2. Platz, Anime/Manga/Kawaii Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lissabon, Portugal",
        year: "2024",
      },
      {
        title: "1. Platz, Best Anime/Manga Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lissabon, Portugal",
        year: "2023",
      },
      {
        title: "Best of Day",
        where: "Lisbon Tattoo Rock Fest, Lissabon, Portugal",
        year: "2023",
      },
    ],
    conventionsTitle: "Conventions",
    conventions: [
      { title: "Oporto Tattoo", where: "Porto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
      { title: "Lisbon Tattoo Rock Fest", where: "Lissabon, Portugal", year: "2023, 2024" },
      { title: "Urban Land Tattoo Expo Roma", where: "Rom, Italien", year: "2024" },
      { title: "The Tattooed Planet", where: "Manchester, Vereinigtes Königreich", year: "2024" },
      { title: "Pyromaniacs International Tattoo Convention", where: "Luxemburg", year: "2019" },
    ],
    guestSpotsTitle: "Bisherige Guest Spots",
    guestSpots: [
      { title: "Düsseldorf", where: "Deutschland", year: "2024–2026" },
      { title: "Zürich", where: "Schweiz", year: "2024, 2025" },
      { title: "London", where: "Vereinigtes Königreich", year: "2025, 2026" },
      { title: "Amsterdam", where: "Niederlande", year: "2026" },
      { title: "Paris", where: "Frankreich", year: "2024" },
    ],
    nextGuestSpots: "Zu den nächsten Guest Spots.",
    studioTitle: "Das Studio",
    studioCity: "Braga, Portugal",
    cta: "Du hast eine Idee für ein Tattoo?",
  },
  es: {
    quote:
      "«Cuando tenía 6 años, estaba dibujando en un papel y alguien me dijo: “¿Sabías que se pueden hacer dibujos en la piel que nunca se borran?”. Fue la primera vez que oí hablar de los tatuajes, y desde entonces me fascinan.»",
    bio: [
      "A Daniel siempre le gustó dibujar, pero la vida lo llevó primero por otro camino. Se graduó en Ingeniería Electrotécnica y, justo después de terminar la carrera, consiguió unas prácticas con promesas de futuro. Por suerte para él, esas promesas no se cumplieron, y lo vio como la oportunidad de perseguir su sueño: ser tatuador.",
      "Se apuntó a un curso de tatuaje para aprender con la mejor orientación en esta nueva aventura, y en 2015 empezó lo que hoy es su carrera. El camino no siempre fue fácil, pero el trabajo duro da sus frutos: empezó por su cuenta y se abrió paso hasta tener su propio estudio en Portugal y viajar por el mundo con su arte.",
      "Con los años ha desarrollado un estilo muy propio, con la línea como base e inspirado en los artistas que lo fascinaban de niño: dibujantes de cómic, mangakas e incluso maestros del Renacimiento. Hoy se centra sobre todo en temas de anime con estilo manga, porque siempre será un friki de corazón, siempre en busca del próximo reto para seguir mejorando.",
      "Su estudio en Braga abrió en junio de 2023. Desde 2022 es también artista residente de Squid Ink a bordo de los barcos de Virgin Voyages y, desde 2023, forma parte del Pepax Pro Team.",
    ],
    portraitAlt: "Daniel Castro en su estudio de Braga",
    awardsTitle: "Premios",
    awards: [
      {
        title: "Tercer puesto, Anime Cartoon",
        where: "Urban Land Tattoo Expo Roma, Roma, Italia",
        year: "2024",
      },
      {
        title: "Segundo puesto, Anime/Manga/Kawaii Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal",
        year: "2024",
      },
      {
        title: "Primer puesto, Best Anime/Manga Tattoo",
        where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal",
        year: "2023",
      },
      { title: "Best of Day", where: "Lisbon Tattoo Rock Fest, Lisboa, Portugal", year: "2023" },
    ],
    conventionsTitle: "Convenciones",
    conventions: [
      { title: "Oporto Tattoo", where: "Oporto, Portugal", year: "2017, 2019, 2022, 2023, 2025" },
      { title: "Lisbon Tattoo Rock Fest", where: "Lisboa, Portugal", year: "2023, 2024" },
      { title: "Urban Land Tattoo Expo Roma", where: "Roma, Italia", year: "2024" },
      { title: "The Tattooed Planet", where: "Mánchester, Reino Unido", year: "2024" },
      { title: "Pyromaniacs International Tattoo Convention", where: "Luxemburgo", year: "2019" },
    ],
    guestSpotsTitle: "Guest spots hasta ahora",
    guestSpots: [
      { title: "Düsseldorf", where: "Alemania", year: "2024–2026" },
      { title: "Zúrich", where: "Suiza", year: "2024, 2025" },
      { title: "Londres", where: "Reino Unido", year: "2025, 2026" },
      { title: "Ámsterdam", where: "Países Bajos", year: "2026" },
      { title: "París", where: "Francia", year: "2024" },
    ],
    nextGuestSpots: "Ver los próximos guest spots.",
    studioTitle: "El estudio",
    studioCity: "Braga, Portugal",
    cta: "¿Tienes una idea para un tatuaje?",
  },
};

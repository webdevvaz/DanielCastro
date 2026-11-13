# Product

This file describes Daniel. Coding agents read it before they work on features.

## Users

- **Clients in Portugal** who want a custom tattoo at the Braga studio.
- **International clients** who travel to Portugal for a tattoo and need to plan and budget the trip.
- **Clients abroad** who want a session at one of Daniel's announced guest spots (past cities: Düsseldorf, London, Amsterdam, Paris, Zurich).
- **Fans** who buy prints and t-shirts from the Necrotic Wear shop.
- **The studio team** (Daniel and Joana, the shop manager), who manage the gallery, guest spots, and enquiries from an admin area.

The site is in Portuguese and English.

## Product purpose

The website of Daniel Castro, Tattoo Artist®: show the portfolio, turn visitors into project enquiries, help travelling clients estimate what the trip costs, and sell merchandise.

## The artist and the studio

- Daniel Castro, award-winning tattoo artist based in Braga, Portugal. Tagline: "A fan first. An artist through and through."
- Style: custom designs only, in Daniel's own style. Black and white with intricate linework and strong contrast; small red accents when they suit the design.
- Favourite themes: characters from anime, films, comic books, and video games; mythologies; fantasy (medieval, futuristic, post-apocalyptic, dark fantasy, morbid, gothic, and spooky).
- Every design is unique and drawn for one client. No copies of other artists' work, no AI work, no cover-ups, no full-colour projects.
- Creative process: Daniel uses the enquiry as a guide and asks the client to trust the process. The design is drawn close to the session date, the final design is sent the night before the appointment, and minor changes are made on the day.
- Studio: Rua da Ramoa, loja 80, 4700-855 Merelim S. Pedro, Braga, Portugal. By appointment only. Outside the city centre.
- Studio coordinates: 41.5704216, -8.4521988 (Google Maps place "Daniel Castro Tattoo Studio"). The travel estimator uses them as the destination.
- Contact: danielcastrotattooshop@gmail.com. Enquiries arrive at this address.
- Social: Instagram https://www.instagram.com/danielcastro_tattooartist/ · TikTok https://www.tiktok.com/@danielcastrotattooartist · YouTube https://www.youtube.com/@DanielCastroTattooArtist
- Shop manager: Joana. Joana answers every enquiry by email (it can take a few days), discusses the project with Daniel, and sends the private quote, session plan, and dates.
- Career (from Daniel's CV, November 2026; the About page uses it): tattooing since 2015 after a course at EvaBelle, Guimarães; own studio since 2018 (Vila de Prado), the current Braga studio since June 2023; resident artist with Squid Ink aboard Virgin Voyages ships since April 2022; Pepax Pro Team member since October 2023.
- Awards: Lisbon Tattoo Rock Fest 2023 (First place, Best Anime/Manga Tattoo; Best of Day), Lisbon Tattoo Rock Fest 2024 (Second place, Anime/Manga/Kawaii Tattoo), Urban Land Tattoo Expo Roma 2024 (Third place, Anime Cartoon).
- Conventions: Oporto Tattoo (2017, 2019, 2022, 2023, 2025), Lisbon Tattoo Rock Fest (2023, 2024), Urban Land Tattoo Expo Roma (2024), The Tattooed Planet, Manchester (2024), Pyromaniacs, Luxembourg (2019).
- Not on the site: Daniel's personal phone and email, his full legal name, his engineering degree, follower counts, and the studio's other artists.

## Main user journeys

1. **Browse the gallery.** A curated portfolio that the studio team fills by hand (see journey 7). Known pieces: Skull Knight, Asta, Madara Uchiha, a God of War backpiece. A click on a photo shows it at full size on the same page, with its title, series, and placement underneath; the arrows move to the next photo.
2. **Read Daniel News.** A main page that shows Daniel's latest Instagram posts automatically, through Meta's official Instagram API. Daniel's Instagram account is already a professional account; Daniel connects it once from the admin area. The site refreshes the access token itself and caches the posts, so a slow or failed Instagram call never breaks the page.
3. **Send a project enquiry.** The site has its own bilingual enquiry form, which replaces the Google Form ("Marcações / bookings - Daniel Castro"). It asks the same questions (see [Enquiry form](#enquiry-form)) without a Google sign-in. Each enquiry is emailed to danielcastrotattooshop@gmail.com with its photos and is listed in the admin area. Body and reference photos are personal data: store them privately, show them only to the studio team, and publish a privacy policy.
4. **Booking process.** Enquiry → private quote, session plan, and dates → non-refundable deposit confirms the date → Daniel draws the design close to the appointment and sends it the night before. An enquiry does not reserve a date. Prices are never published.
5. **Estimate the trip** (travelling clients). Keep it simple, like a search results card: "from" prices and links out, not a booking engine. The client enters their city and, optionally, dates:
   - **Flights** from the client's city to Porto (OPO): the average price for both ways of up to three airlines, labelled "both ways" (not "return", which reads like the flight back only), from the fares that Aviasales users found in the last few days for upcoming dates (free through Travelpayouts). It is an estimate to plan with, not a price to book, and the same for any dates. An airline shows only with at least two fares. A route with too few fares for that (mostly from outside Europe) shows live Google Flights prices through SerpApi for the client's dates instead: up to three airlines, cheapest first, with stops and journey time. When live prices are not available either, it shows the average of all airlines together, if there is one. A button below opens Google Flights with the client's dates, or with an example trip four weeks ahead.
   - **Airport to Braga:** three options with typical prices that the admin sets, priced for the whole trip like the flights: the Get Bus bus (both ways), a rental car (per day, for the days of the stay, plus tolls), and Uber (both ways). Each has a link: the Get Bus timetable, rental car prices at Porto airport, and Uber with the studio as the destination. The total uses the bus.
   - **Stay in Braga:** live Google Hotels prices (through SerpApi) for the 3 cheapest hotels with 3 stars or more and a review score of 3.5 or more, for the trip dates, each with a Booking.com link, and their average per night and for the whole stay. The total uses the average. Without live prices, the typical prices that the admin sets. A button opens Booking.com with Braga and the dates filled in (an affiliate link once Daniel joins the programme).
   - **By car** (Spain and Portugal): a button that opens Google Maps directions to the studio.
   - A rough total range. When no fare data exists for a route, show only the links. Always label the values as estimates, and remind clients to confirm dates and deposit before they book travel.
6. **Buy merchandise.** Products come from the Shopify store Necrotic Wear (`necrotic-wear.myshopify.com`, https://necroticwear.com, EUR): prints and t-shirts in collections such as 4 Yonkos, Prints, and Zodiac. Checkout happens on Shopify.
7. **Manage the gallery** (admin). Adding photos must be quick:
   - Upload several photos at once by drag and drop, from a phone or a computer. The site resizes them for the web.
   - Add an Instagram post from Daniel News to the gallery with one click. The site copies the image, because Instagram image links expire.
   - Optional details per photo: title or character, series, body placement, and tags. Reorder by drag and drop, mark photos as featured (large tiles on the Work page), and hide or delete them.
   - Two sections, each with its own uploads and order: **Work** (Daniel's tattoos, on the Work page) and **Studio** (photos of the studio, on the About page, where the first one shows large). The studio team changes the studio photos there without help.
8. **Manage guest spots** (admin). A signed-in admin adds, edits, and removes guest spots: city, country, studio name and address, start and end dates, and whether booking is open or full. The public site lists upcoming guest spots, hides past ones automatically, and offers them as locations in the enquiry form.
9. **Handle enquiries** (admin). The studio team sees every enquiry with its photos and trip estimate, and marks its status (new, quoted, booked, declined).

## Enquiry form

The site's own form keeps these questions and texts. They come from the current Google Form, which is bilingual, has six pages, and needs a Google sign-in because it accepts file uploads. `*` marks a required question.

**Page 1. Welcome.** Greeting in Portuguese and English: "Hey, I'm so happy for your contact! This form is for quote requests and appointments :) I ask you to please read carefully and answer every questions. This is very important for me to be able to give you a quote."

| Field       | Type                               |
| ----------- | ---------------------------------- |
| Email \*    | Email                              |
| Language \* | One choice: "Português", "English" |

The language choice sends the client to the Portuguese or the English version of the next pages.

**Page 2. Personal data and contact.** "To be able to give you a quote and to make an appointment for your tattoo it is indispensable that you give me some informations. Let's start with your personal data and contact info :)"

| Field                                              | Type                                                                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| First and last name \*                             | Short text                                                                                                                                      |
| Age \*                                             | Short text                                                                                                                                      |
| Instagram @username \*                             | Short text                                                                                                                                      |
| Email for contact \*                               | Short text                                                                                                                                      |
| Phone number (with country code if not Portuguese) | Short text                                                                                                                                      |
| City \*                                            | Short text                                                                                                                                      |
| Country \*                                         | Short text                                                                                                                                      |
| Where would you like to get tattooed? \*           | One choice: "Braga, Portugal - My own studio", the current guest spots (for example "Düsseldorf, Germany - October 2026"), or "Other" with text |

**Page 3. Quote request.** States the rules in [The artist and the studio](#the-artist-and-the-studio): unique designs, only Daniel's style, no copies or AI, no cover-ups, favourite themes, trust the creative process, design sent the night before.

| Field                          | Type                        |
| ------------------------------ | --------------------------- |
| What do you want to tattoo? \* | One choice: "Custom design" |

**Page 4. Custom work.**

| Field                                                                                               | Type                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------- |
| What's the main theme of the tattoo you want? \*                                                    | Short text                   |
| Give us a brief description of your idea \*                                                         | Short text                   |
| Insert some visual references (max 10) \*                                                           | Files, up to 10, 100 MB each |
| Insert here some of your favorite works done by me so I can understand the aesthetics you prefer \* | Files, up to 10, 100 MB each |

**Page 5. Tattoo placement.** "Add one or more photos from the part of your body you want to tattoo marked with a pen or marker directly on the skin or on the photo and if possible with a ruler or measuring tape next to it." Shows an example photo (a calf outlined in red with a measuring tape).

| Field               | Type                        |
| ------------------- | --------------------------- |
| Placement photos \* | Files, up to 5, 100 MB each |

**Page 6. Before booking.**

- Healing: direct sun exposure, water immersion, dust or sand, physical exercise, and friction are not recommended while the tattoo heals.
- Deposit: requested once the date and quote are agreed. It is non-refundable and is deducted from the final price on the day.
- Replies: the shop manager answers every form by email, which can take a few days.

| Field                            | Type      |
| -------------------------------- | --------- |
| Do you have any other questions? | Long text |

Closing: "Thank you for contacting me :)"

City and country (page 2) are also the starting point for the travel estimator, so an enquiry can carry the client's trip estimate.

## Policies still to confirm

The deposit amount varies per project. Never publish an amount; say that the deposit is set with the quote.

The FAQ needs answers from Daniel on: the deadline to pay the deposit, payment methods, rescheduling and cancellation, minimum age and health limits, pricing approach, session length, preparation before a session, touch-ups, and design changes.

Aftercare is answered: the Aftercare page translates the studio's care sheet ("Informações e cuidados a ter com a tatuagem"). BALM TATTOO cream 2–3 times a day for 7 days (the sheet's chart says 3 times; the owner chose 2–3). The Portuguese sheet is the source for the Portuguese version.

## Accounts and hosting

- Admin login: the project owner for now. Admin emails come from configuration (`.env.local`), not from code.
- Domain: open. Daniel owns necroticwear.com (the Shopify shop). Free names on 2026-10-24: danielcastrotattoo.com, danielcastrotattooartist.com, danielcastro.tattoo.
- Hosting, photo storage, email sending, the Meta developer app, and the travel accounts are decided closer to launch. Create them in Daniel's name so the site belongs to him.

## Travel facts

- Nearest airport: Porto (OPO). Direct coach connections from the airport to Braga (getbus.eu).
- Suggested base: central Braga. Local sights: Bom Jesus do Monte, the old streets and gardens.
- Flights, accommodation, local transport, and meals are booked and paid by the client. The studio does not arrange travel.

## Placeholder content

None on the About page since November 2026: the biography, awards, conventions, and past guest spots come from Daniel's CV, and the portrait and studio photos from the photos he sent.

## Out of scope

- Publishing tattoo prices or instant quotes.
- Online payment of tattoo deposits (handled privately after the quote).
- Arranging travel for clients.

## Related links

- Previous website: https://daniel-castro-tattoo.joanapimentel97.chatgpt.site/
- Google Maps: https://www.google.com/maps/place/Daniel+Castro+Tattoo+Studio/@41.5704216,-8.4521988,17z
- Enquiry form: https://docs.google.com/forms/d/e/1FAIpQLScIKMz-n1q6GchMpAc_Kb5gCie4_CfcEPv4tdrCgdhVPE_YmQ/viewform

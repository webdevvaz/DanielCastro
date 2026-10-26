import { appConfig } from "@/app-config";

/** Porto airport: Google Flights reads the code in its search text. */
const DESTINATION_AIRPORT = "OPO";

const [studioLatitude = "", studioLongitude = ""] = appConfig.studio.coordinates.split(",");

/** Get Bus, the direct bus between Porto airport and Braga: timetable and tickets. */
export const AIRPORT_BUS_URL = "https://www.getbus.eu/en/braga-porto-airport";

/** Rental cars at Porto airport, to compare prices. */
export const AIRPORT_CAR_RENTAL_URL = "https://www.rentalcars.com/en/airport/pt/opo/";

/**
 * Uber with the studio as the destination and the visitor's location as the pickup. It opens the
 * Uber app when it is installed, and Uber's website when it is not.
 */
export const UBER_TO_STUDIO_URL = `https://m.uber.com/ul/?${new URLSearchParams({
  action: "setPickup",
  pickup: "my_location",
  "dropoff[latitude]": studioLatitude,
  "dropoff[longitude]": studioLongitude,
  "dropoff[nickname]": appConfig.studio.name,
  "dropoff[formatted_address]": appConfig.studio.addressLines.join(", "),
}).toString()}`;

/**
 * Google Flights with the route, and the dates when the visitor gave them, already in the search.
 * Google reads `from` as free text, so a city it knows works even when the city search does not.
 */
export const googleFlightsUrl = (trip: TripText) => {
  const url = new URL("https://www.google.com/travel/flights");

  let search = `Flights to ${DESTINATION_AIRPORT} from ${trip.from}`;

  if (trip.arrive !== undefined && trip.leave !== undefined) {
    search = `${search} on ${trip.arrive} through ${trip.leave}`;
  }

  url.searchParams.set("q", search);
  url.searchParams.set("curr", "EUR");
  url.searchParams.set("hl", "en");

  return url.toString();
};

/** Booking.com hotels in Braga, for the visitor's nights when they gave dates. */
export const bookingUrl = (trip: TripText) => {
  const url = new URL("https://www.booking.com/searchresults.html");

  url.searchParams.set("ss", "Braga, Portugal");
  url.searchParams.set("group_adults", "1");
  url.searchParams.set("no_rooms", "1");
  url.searchParams.set("selected_currency", "EUR");

  if (trip.arrive !== undefined && trip.leave !== undefined) {
    url.searchParams.set("checkin", trip.arrive);
    url.searchParams.set("checkout", trip.leave);
  }

  return url.toString();
};

/** One hotel on Booking.com, for the nights of the stay when they are known. */
export const bookingHotelUrl = (hotelName: string, trip: TripText) => {
  const url = new URL(bookingUrl(trip));

  url.searchParams.set("ss", `${hotelName}, Braga`);

  return url.toString();
};

/** Google Maps driving directions from the visitor's city to the studio. */
export const drivingDirectionsUrl = (from: string) => {
  const url = new URL("https://www.google.com/maps/dir/");

  url.searchParams.set("api", "1");
  url.searchParams.set("origin", from);
  url.searchParams.set("destination", appConfig.studio.coordinates);
  url.searchParams.set("travelmode", "driving");

  return url.toString();
};

/** What the visitor typed: their city, and the dates of the trip when they gave them. */
type TripText = {
  readonly from: string;
  readonly arrive?: string | undefined;
  readonly leave?: string | undefined;
};

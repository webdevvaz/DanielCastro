/** A city as visitors see it in suggestions and results, such as "London, United Kingdom". */
export const cityLabel = (city: CityName) => `${city.name}, ${city.countryName}`;

type CityName = {
  readonly name: string;
  readonly countryName: string;
};

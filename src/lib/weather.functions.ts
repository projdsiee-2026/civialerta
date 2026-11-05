import { createServerFn } from "@tanstack/react-start";
import { CAPITALS, MAJOR_CITIES, STATION_CITY, type CityWeather } from "./weather-data";
import { fetchCurrentWeather } from "./weather.server";

export interface BrazilWeather {
  cidades: CityWeather[];
  atualizadoEm: number;
  erro: string | null;
}

/** Current temperature in the 27 state capitals plus the station city. */
export const getBrazilWeather = createServerFn({ method: "GET" }).handler(async (): Promise<BrazilWeather> => {
  try {
    const cidades = await fetchCurrentWeather([
      ...CAPITALS.map((c) => ({ ...c, capital: true })),
      ...MAJOR_CITIES,
      STATION_CITY,
    ]);
    return { cidades, atualizadoEm: Date.now(), erro: null };
  } catch (e) {
    return { cidades: [], atualizadoEm: Date.now(), erro: e instanceof Error ? e.message : "Serviço indisponível" };
  }
});

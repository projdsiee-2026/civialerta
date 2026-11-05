import { createServerFn } from "@tanstack/react-start";
import { CAPITALS, MAJOR_CITIES, STATION_CITY, type CityWeather } from "./weather-data";
import { fetchCurrentWeather } from "./weather.server";
import { isStaticHosting } from "./hosting";

export interface BrazilWeather {
  cidades: CityWeather[];
  atualizadoEm: number;
  erro: string | null;
}

/** Current temperature in the 27 state capitals plus the station city. */
const getBrazilWeatherFromServer = createServerFn({ method: "GET" }).handler(
  async (): Promise<BrazilWeather> => {
    try {
      const cidades = await fetchCurrentWeather([
        ...CAPITALS.map((c) => ({ ...c, capital: true })),
        ...MAJOR_CITIES,
        STATION_CITY,
      ]);
      return { cidades, atualizadoEm: Date.now(), erro: null };
    } catch (e) {
      return {
        cidades: [],
        atualizadoEm: Date.now(),
        erro: e instanceof Error ? e.message : "Serviço indisponível",
      };
    }
  },
);

export async function getBrazilWeather(): Promise<BrazilWeather> {
  if (!isStaticHosting) return getBrazilWeatherFromServer();
  // Open-Meteo is public and keyless; Pages can call it from the browser.
  try {
    const { fetchCurrentWeather: fetchInBrowser } = await import("./weather");
    const cidades = await fetchInBrowser([
      ...CAPITALS.map((c) => ({ ...c, capital: true })),
      ...MAJOR_CITIES,
      STATION_CITY,
    ]);
    return { cidades, atualizadoEm: Date.now(), erro: null };
  } catch (error) {
    return {
      cidades: [],
      atualizadoEm: Date.now(),
      erro: error instanceof Error ? error.message : "Serviço de clima indisponível",
    };
  }
}

/**
 * Server-only weather lookups using Open-Meteo (free, no key).
 * https://open-meteo.com — current conditions are model data, not official forecasts.
 */
import { describeWeather, type City, type CityWeather } from "./weather-data";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const CURRENT_FIELDS = "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation";
const DAILY_FIELDS = "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code";

interface OpenMeteoCurrent {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    precipitation: number;
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: (number | null)[];
    precipitation_probability_max: (number | null)[];
    wind_speed_10m_max: number[];
    weather_code: number[];
  };
}

export async function fetchCurrentWeather(cities: City[]): Promise<CityWeather[]> {
  const params = new URLSearchParams({
    latitude: cities.map((c) => c.lat).join(","),
    longitude: cities.map((c) => c.lon).join(","),
    current: CURRENT_FIELDS,
    daily: DAILY_FIELDS,
    forecast_days: "7",
    timezone: "America/Sao_Paulo",
    wind_speed_unit: "kmh",
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) {
    const body = await res.text();
    console.error(`Open-Meteo forecast failed [${res.status}]: ${body}`);
    throw new Error(`Serviço de clima indisponível (${res.status})`);
  }
  const json = (await res.json()) as OpenMeteoCurrent | OpenMeteoCurrent[];
  const list = Array.isArray(json) ? json : [json];
  return cities.flatMap((city, i) => {
    const c = list[i]?.current;
    const d = list[i]?.daily;
    if (!c) return [];
    const previsao = d
      ? d.time.map((data, j) => ({
          data,
          max: d.temperature_2m_max[j] ?? 0,
          min: d.temperature_2m_min[j] ?? 0,
          chuva: d.precipitation_sum[j] ?? 0,
          probChuva: d.precipitation_probability_max[j] ?? 0,
          ventoMax: d.wind_speed_10m_max[j] ?? 0,
          codigo: d.weather_code[j] ?? 0,
        }))
      : [];
    return [
      {
        ...city,
        temperatura: c.temperature_2m,
        sensacao: c.apparent_temperature,
        umidade: c.relative_humidity_2m,
        vento: c.wind_speed_10m,
        direcaoVento: c.wind_direction_10m,
        chuva: c.precipitation,
        previsao,
        codigo: c.weather_code,
        condicao: describeWeather(c.weather_code),
        horario: c.time,
      },
    ];
  });
}

interface GeocodeResult {
  results?: { name: string; latitude: number; longitude: number; admin1?: string; country_code: string }[];
}

/** Find a Brazilian city by name (optionally filtered by state name or UF). */
export async function geocodeBrazil(cidade: string, estado: string | null): Promise<City | null> {
  const params = new URLSearchParams({ name: cidade, count: "10", language: "pt", countryCode: "BR", format: "json" });
  const res = await fetch(`${GEOCODE_URL}?${params}`);
  if (!res.ok) {
    console.error(`Open-Meteo geocoding failed [${res.status}]: ${await res.text()}`);
    throw new Error(`Busca de cidade indisponível (${res.status})`);
  }
  const json = (await res.json()) as GeocodeResult;
  const results = (json.results ?? []).filter((r) => r.country_code === "BR");
  if (!results.length) return null;
  const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const wanted = estado ? norm(estado) : null;
  const match = wanted ? results.find((r) => r.admin1 && norm(r.admin1).includes(wanted)) : undefined;
  const r = match ?? results[0]!;
  return { uf: r.admin1 ?? "", nome: r.name, lat: r.latitude, lon: r.longitude };
}

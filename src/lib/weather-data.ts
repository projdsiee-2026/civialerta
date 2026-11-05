/**
 * Browser-safe weather data: Brazilian state capitals, the station city,
 * weather-code descriptions and the temperature color scale.
 */

export interface City {
  uf: string;
  nome: string;
  lat: number;
  lon: number;
  estacao?: boolean;
}

export const CAPITALS: City[] = [
  { uf: "AC", nome: "Rio Branco", lat: -9.975, lon: -67.81 },
  { uf: "AL", nome: "Maceió", lat: -9.666, lon: -35.735 },
  { uf: "AP", nome: "Macapá", lat: 0.035, lon: -51.07 },
  { uf: "AM", nome: "Manaus", lat: -3.119, lon: -60.022 },
  { uf: "BA", nome: "Salvador", lat: -12.971, lon: -38.501 },
  { uf: "CE", nome: "Fortaleza", lat: -3.732, lon: -38.527 },
  { uf: "DF", nome: "Brasília", lat: -15.794, lon: -47.882 },
  { uf: "ES", nome: "Vitória", lat: -20.315, lon: -40.312 },
  { uf: "GO", nome: "Goiânia", lat: -16.686, lon: -49.265 },
  { uf: "MA", nome: "São Luís", lat: -2.53, lon: -44.303 },
  { uf: "MT", nome: "Cuiabá", lat: -15.601, lon: -56.097 },
  { uf: "MS", nome: "Campo Grande", lat: -20.469, lon: -54.62 },
  { uf: "MG", nome: "Belo Horizonte", lat: -19.917, lon: -43.934 },
  { uf: "PA", nome: "Belém", lat: -1.456, lon: -48.49 },
  { uf: "PB", nome: "João Pessoa", lat: -7.115, lon: -34.863 },
  { uf: "PR", nome: "Curitiba", lat: -25.429, lon: -49.271 },
  { uf: "PE", nome: "Recife", lat: -8.054, lon: -34.881 },
  { uf: "PI", nome: "Teresina", lat: -5.089, lon: -42.802 },
  { uf: "RJ", nome: "Rio de Janeiro", lat: -22.907, lon: -43.173 },
  { uf: "RN", nome: "Natal", lat: -5.795, lon: -35.209 },
  { uf: "RS", nome: "Porto Alegre", lat: -30.035, lon: -51.218 },
  { uf: "RO", nome: "Porto Velho", lat: -8.761, lon: -63.9 },
  { uf: "RR", nome: "Boa Vista", lat: 2.82, lon: -60.672 },
  { uf: "SC", nome: "Florianópolis", lat: -27.595, lon: -48.548 },
  { uf: "SP", nome: "São Paulo", lat: -23.551, lon: -46.633 },
  { uf: "SE", nome: "Aracaju", lat: -10.947, lon: -37.073 },
  { uf: "TO", nome: "Palmas", lat: -10.184, lon: -48.334 },
];

/** Other large Brazilian cities (not capitals) shown on the map. */
export const MAJOR_CITIES: City[] = [
  { uf: "SP", nome: "Campinas", lat: -22.906, lon: -47.061 },
  { uf: "SP", nome: "Ribeirão Preto", lat: -21.178, lon: -47.81 },
  { uf: "SP", nome: "Presidente Prudente", lat: -22.125, lon: -51.389 },
  { uf: "RJ", nome: "Campos dos Goytacazes", lat: -21.754, lon: -41.324 },
  { uf: "MG", nome: "Uberlândia", lat: -18.918, lon: -48.277 },
  { uf: "MG", nome: "Montes Claros", lat: -16.735, lon: -43.862 },
  { uf: "MG", nome: "Juiz de Fora", lat: -21.764, lon: -43.35 },
  { uf: "PR", nome: "Londrina", lat: -23.31, lon: -51.163 },
  { uf: "PR", nome: "Cascavel", lat: -24.956, lon: -53.455 },
  { uf: "PR", nome: "Foz do Iguaçu", lat: -25.547, lon: -54.588 },
  { uf: "SC", nome: "Chapecó", lat: -27.1, lon: -52.615 },
  { uf: "SC", nome: "Joinville", lat: -26.304, lon: -48.846 },
  { uf: "RS", nome: "Caxias do Sul", lat: -29.168, lon: -51.179 },
  { uf: "RS", nome: "Santa Maria", lat: -29.684, lon: -53.807 },
  { uf: "RS", nome: "Pelotas", lat: -31.772, lon: -52.343 },
  { uf: "BA", nome: "Feira de Santana", lat: -12.267, lon: -38.967 },
  { uf: "BA", nome: "Vitória da Conquista", lat: -14.861, lon: -40.844 },
  { uf: "BA", nome: "Barreiras", lat: -12.152, lon: -44.99 },
  { uf: "PE", nome: "Petrolina", lat: -9.389, lon: -40.503 },
  { uf: "CE", nome: "Juazeiro do Norte", lat: -7.213, lon: -39.315 },
  { uf: "PA", nome: "Santarém", lat: -2.443, lon: -54.708 },
  { uf: "PA", nome: "Marabá", lat: -5.368, lon: -49.118 },
  { uf: "AM", nome: "Tabatinga", lat: -4.253, lon: -69.938 },
  { uf: "AM", nome: "São Gabriel da Cachoeira", lat: -0.13, lon: -67.089 },
  { uf: "MT", nome: "Sinop", lat: -11.864, lon: -55.509 },
  { uf: "MT", nome: "Rondonópolis", lat: -16.47, lon: -54.636 },
  { uf: "MS", nome: "Dourados", lat: -22.221, lon: -54.805 },
  { uf: "MS", nome: "Corumbá", lat: -19.009, lon: -57.651 },
  { uf: "GO", nome: "Rio Verde", lat: -17.792, lon: -50.919 },
  { uf: "TO", nome: "Araguaína", lat: -7.191, lon: -48.207 },
  { uf: "MA", nome: "Imperatriz", lat: -5.526, lon: -47.478 },
  { uf: "PI", nome: "Floriano", lat: -6.767, lon: -43.022 },
];

export const STATION_CITY: City = { uf: "PR", nome: "Paranaguá", lat: -25.516, lon: -48.525, estacao: true };

export const WEATHER_CODES: Record<number, string> = {
  0: "Céu limpo",
  1: "Poucas nuvens",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Neblina",
  48: "Neblina com geada",
  51: "Garoa fraca",
  53: "Garoa",
  55: "Garoa forte",
  56: "Garoa congelante",
  57: "Garoa congelante forte",
  61: "Chuva fraca",
  63: "Chuva",
  65: "Chuva forte",
  66: "Chuva congelante",
  67: "Chuva congelante forte",
  71: "Neve fraca",
  73: "Neve",
  75: "Neve forte",
  77: "Grãos de neve",
  80: "Pancadas de chuva fracas",
  81: "Pancadas de chuva",
  82: "Pancadas de chuva fortes",
  85: "Pancadas de neve",
  86: "Pancadas de neve fortes",
  95: "Trovoada",
  96: "Trovoada com granizo",
  99: "Trovoada com granizo forte",
};

export function describeWeather(code: number | null | undefined): string {
  return code === null || code === undefined ? "—" : (WEATHER_CODES[code] ?? "—");
}

export interface CityWeather extends City {
  temperatura: number;
  sensacao: number;
  umidade: number;
  vento: number;
  direcaoVento: number;
  chuva: number;
  codigo: number;
  condicao: string;
  horario: string;
  capital?: boolean;
  previsao: DayForecast[];
}

export interface DayForecast {
  data: string;
  max: number;
  min: number;
  chuva: number;
  probChuva: number;
  ventoMax: number;
  codigo: number;
}

export type MapLayer = "temperatura" | "chuva" | "vento" | "umidade";

/** Six color bands per map layer (index 0..5 → temp-1..temp-6 colors). */
export const LAYER_BANDS: Record<MapLayer, { maxes: number[]; unit: string; labels: string[] }> = {
  temperatura: { maxes: [15, 20, 25, 30, 35, Infinity], unit: "°", labels: ["até 15°", "15–20°", "20–25°", "25–30°", "30–35°", "35°+"] },
  // Rain uses today's expected total (mm); blue = dry … red = heavy.
  chuva: { maxes: [0.5, 2, 5, 10, 25, Infinity], unit: "mm", labels: ["seco", "até 2 mm", "2–5 mm", "5–10 mm", "10–25 mm", "25 mm+"] },
  vento: { maxes: [10, 20, 30, 40, 60, Infinity], unit: "km/h", labels: ["até 10", "10–20", "20–30", "30–40", "40–60", "60+ km/h"] },
  // Humidity: very dry is the danger, so it is red; humid is blue.
  umidade: { maxes: [20, 30, 45, 60, 80, Infinity], unit: "%", labels: ["até 20%", "20–30%", "30–45%", "45–60%", "60–80%", "80%+"] },
};

export function layerValue(c: CityWeather, layer: MapLayer): number {
  if (layer === "temperatura") return c.temperatura;
  if (layer === "chuva") return c.previsao[0]?.chuva ?? c.chuva;
  if (layer === "vento") return c.vento;
  return c.umidade;
}

/** Color index for a value on a layer. Humidity is reversed (dry = red). */
export function layerBand(value: number, layer: MapLayer): number {
  const i = LAYER_BANDS[layer].maxes.findIndex((m) => value < m);
  return layer === "umidade" ? 5 - i : i;
}

export function windDirection(deg: number): string {
  return ["N", "NE", "L", "SE", "S", "SO", "O", "NO"][Math.round(deg / 45) % 8]!;
}

/** Temperature bands (°C) for the map colors. Index 0..5. */
export const TEMP_BANDS = [
  { max: 15, label: "até 15°" },
  { max: 20, label: "15–20°" },
  { max: 25, label: "20–25°" },
  { max: 30, label: "25–30°" },
  { max: 35, label: "30–35°" },
  { max: Infinity, label: "acima de 35°" },
] as const;

export function tempBand(t: number): number {
  return TEMP_BANDS.findIndex((b) => t < b.max);
}

/** Static class names so Tailwind keeps them. */
export const TEMP_FILL = ["fill-temp-1", "fill-temp-2", "fill-temp-3", "fill-temp-4", "fill-temp-5", "fill-temp-6"];
export const TEMP_BG = ["bg-temp-1", "bg-temp-2", "bg-temp-3", "bg-temp-4", "bg-temp-5", "bg-temp-6"];

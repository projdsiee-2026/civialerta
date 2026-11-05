/**
 * Tiny site-language store (pt / en / es), saved in localStorage.
 * Server render always uses Portuguese; the saved choice is applied after hydration.
 */
import { useSyncExternalStore } from "react";

export type Lang = "pt" | "en" | "es";
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "pt", label: "Português", flag: "PT" },
  { id: "en", label: "English", flag: "EN" },
  { id: "es", label: "Español", flag: "ES" },
];

const KEY = "aci-lang-v1";
let lang: Lang = "pt";
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return lang;
}

export function setLang(next: Lang) {
  lang = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, next);
    document.documentElement.lang = next === "pt" ? "pt-BR" : next;
  }
  listeners.forEach((l) => l());
}

/** Call from useEffect in the root layout. */
export function startI18n() {
  const saved = localStorage.getItem(KEY);
  if (saved === "en" || saved === "es") setLang(saved);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, getLang, () => "pt");
}

export const LANG_INSTRUCTION: Record<Lang, string> = {
  pt: "Idioma do usuário: português do Brasil.",
  en: "User language: English. Reply in English.",
  es: "Idioma del usuario: español. Responde en español.",
};

const DICT = {
  "nav.painel": { pt: "Painel", en: "Dashboard", es: "Panel" },
  "nav.brasil": { pt: "Brasil", en: "Brazil", es: "Brasil" },
  "nav.historico": { pt: "Histórico", en: "History", es: "Historial" },
  "nav.assistente": { pt: "Assistente IA", en: "AI Assistant", es: "Asistente IA" },
  "nav.voz": { pt: "Falar por voz", en: "Voice", es: "Hablar por voz" },
  "nav.admin": { pt: "Administração", en: "Admin", es: "Administración" },
  "header.sub": { pt: "Estação meteorológica · Paranaguá", en: "Weather station · Paranaguá", es: "Estación meteorológica · Paranaguá" },
  "lang.label": { pt: "Idioma", en: "Language", es: "Idioma" },

  "home.sensores": { pt: "Sensores da estação", en: "Station sensors", es: "Sensores de la estación" },
  "home.simulados": {
    pt: "Dados simulados até a estação Arduino ser conectada · atualiza a cada 3 s",
    en: "Simulated data until the Arduino station is connected · updates every 3 s",
    es: "Datos simulados hasta conectar la estación Arduino · se actualiza cada 3 s",
  },
  "home.niveis": { pt: "Níveis de alerta", en: "Alert levels", es: "Niveles de alerta" },
  "home.nivel": { pt: "Nível", en: "Level", es: "Nivel" },
  "level.1": { pt: "Tempo normal", en: "Normal weather", es: "Tiempo normal" },
  "level.2": { pt: "Fique atento", en: "Stay alert", es: "Manténgase atento" },
  "level.3": { pt: "Tome cuidado", en: "Be careful", es: "Tenga cuidado" },
  "level.4": { pt: "Risco elevado", en: "High risk", es: "Riesgo alto" },
  "home.duvida": { pt: "Ficou com dúvida?", en: "Have a question?", es: "¿Tiene dudas?" },
  "home.duvidaTexto": {
    pt: "Pergunte à assistente de IA o que fazer em caso de chuva forte, enchente ou vento.",
    en: "Ask the AI assistant what to do in heavy rain, floods or strong wind.",
    es: "Pregunte a la asistente de IA qué hacer con lluvia fuerte, inundación o viento.",
  },
  "home.falar": { pt: "Falar com a assistente", en: "Talk to the assistant", es: "Hablar con la asistente" },
  "home.emergencia": {
    pt: "Emergência: Defesa Civil 199 · Bombeiros 193 · SAMU 192",
    en: "Emergency: Civil Defense 199 · Firefighters 193 · Ambulance (SAMU) 192",
    es: "Emergencia: Defensa Civil 199 · Bomberos 193 · SAMU 192",
  },

  "br.titulo": { pt: "Tempo no Brasil agora", en: "Weather in Brazil now", es: "El tiempo en Brasil ahora" },
  "br.sub": {
    pt: "capitais e grandes cidades · atualizado às",
    en: "capitals and major cities · updated at",
    es: "capitales y grandes ciudades · actualizado a las",
  },
  "br.fonte": {
    pt: "dados Open-Meteo (não são alertas oficiais)",
    en: "Open-Meteo data (not official alerts)",
    es: "datos de Open-Meteo (no son alertas oficiales)",
  },
  "br.atualizar": { pt: "Atualizar", en: "Refresh", es: "Actualizar" },
  "br.erro": { pt: "Não foi possível carregar o tempo agora.", en: "Could not load the weather right now.", es: "No se pudo cargar el tiempo ahora." },
  "br.erroDica": { pt: "Tente atualizar em alguns minutos.", en: "Try again in a few minutes.", es: "Intente de nuevo en unos minutos." },
  "br.mostrar": { pt: "Mostrar no mapa", en: "Show on map", es: "Mostrar en el mapa" },
  "layer.temperatura": { pt: "Temperatura", en: "Temperature", es: "Temperatura" },
  "layer.chuva": { pt: "Chuva hoje", en: "Rain today", es: "Lluvia hoy" },
  "layer.vento": { pt: "Vento", en: "Wind", es: "Viento" },
  "layer.umidade": { pt: "Umidade", en: "Humidity", es: "Humedad" },
  "br.estacao": { pt: "Estação da escola", en: "School station", es: "Estación de la escuela" },
  "br.capital": { pt: "Capital", en: "Capital", es: "Capital" },
  "br.cidade": { pt: "Cidade", en: "City", es: "Ciudad" },
  "br.sensacao": { pt: "Sensação", en: "Feels like", es: "Sensación" },
  "br.chuvaAgora": { pt: "Chuva agora", en: "Rain now", es: "Lluvia ahora" },
  "br.previsao": { pt: "Previsão dos próximos dias", en: "Forecast for the next days", es: "Pronóstico de los próximos días" },
  "br.toque": { pt: "Toque em uma cidade no mapa para ver os detalhes.", en: "Tap a city on the map to see details.", es: "Toque una ciudad en el mapa para ver los detalles." },
  "br.maisQuentes": { pt: "Mais quentes", en: "Hottest", es: "Más calurosas" },
  "br.maisFrias": { pt: "Mais frias", en: "Coldest", es: "Más frías" },
  "br.maisChuva": { pt: "Mais chuva hoje", en: "Most rain today", es: "Más lluvia hoy" },
  "br.maisVento": { pt: "Mais vento", en: "Windiest", es: "Más viento" },
  "br.maisSecas": { pt: "Ar mais seco", en: "Driest air", es: "Aire más seco" },
  "br.todas": { pt: "Todas as cidades", en: "All cities", es: "Todas las ciudades" },
  "br.hoje": { pt: "Hoje", en: "Today", es: "Hoy" },
} satisfies Record<string, Record<Lang, string>>;

export type TKey = keyof typeof DICT;

export function translate(key: TKey, l: Lang): string {
  return DICT[key][l];
}

/** Hook returning a translator for the current language. */
export function useT() {
  const l = useLang();
  return (key: TKey) => DICT[key][l];
}

export const LOCALE: Record<Lang, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };

/**
 * Alert rules for the Alerta Civil Inteligente.
 *
 * Pure functions only (no browser APIs) so they can be tested and reused.
 * Thresholds are NOT official values: they are example numbers that an
 * administrator must calibrate for the local station.
 */

export type Level = 1 | 2 | 3 | 4;

export type AlertType = "normal" | "chuva" | "vento" | "granizo" | "enchente" | "calor" | "ar";

export type AlertSource = "sensor" | "oficial" | "manual";

export interface Readings {
  temperatura: number; // °C  — DHT22
  umidade: number; // %   — DHT22
  pressao: number; // hPa — BMP280
  uv: number; // índice UV — GUVA-S12SD
  qualidadeAr: number; // ppm aproximado — MQ-135
  ventoVelocidade: number; // km/h — anemômetro
  ventoDirecao: number; // graus — wind vane
  chuva: number; // mm/h — pluviômetro
  nivelAgua: number; // cm — HC-SR04
  timestamp: number;
}

/** Three thresholds per metric: atenção (2), alerta (3), emergência (4). */
export interface MetricThreshold {
  atencao: number;
  alerta: number;
  emergencia: number;
}

export interface Thresholds {
  chuva: MetricThreshold;
  vento: MetricThreshold;
  enchente: MetricThreshold;
  calor: MetricThreshold;
  ar: MetricThreshold;
  /** Number of consecutive readings needed to confirm a level change. */
  persistencia: number;
}

/** Example values only — must be calibrated by the responsible team. */
export const DEFAULT_THRESHOLDS: Thresholds = {
  chuva: { atencao: 10, alerta: 25, emergencia: 50 },
  vento: { atencao: 40, alerta: 60, emergencia: 90 },
  enchente: { atencao: 80, alerta: 120, emergencia: 160 },
  calor: { atencao: 32, alerta: 36, emergencia: 40 },
  ar: { atencao: 400, alerta: 700, emergencia: 1000 },
  persistencia: 3,
};

export type SensorAlertType = Exclude<AlertType, "normal" | "granizo">;

export const SENSOR_METRIC: Record<SensorAlertType, keyof Readings> = {
  chuva: "chuva",
  vento: "ventoVelocidade",
  enchente: "nivelAgua",
  calor: "temperatura",
  ar: "qualidadeAr",
};

export const LEVEL_INFO: Record<Level, { nome: string; cor: string }> = {
  1: { nome: "Informativo", cor: "Azul" },
  2: { nome: "Atenção", cor: "Amarelo" },
  3: { nome: "Alerta", cor: "Laranja" },
  4: { nome: "Emergência", cor: "Vermelho" },
};

export interface AlertTemplate {
  titulo: string;
  descricao: string;
  chamada: string;
  orientacoes: string[];
}

export const TEMPLATES: Record<AlertType, AlertTemplate> = {
  normal: {
    titulo: "Tempo estável",
    descricao: "Condições do tempo normais na região. Nenhum risco identificado.",
    chamada: "TUDO TRANQUILO",
    orientacoes: ["Acompanhe as informações da estação.", "Em caso de emergência, ligue 199 (Defesa Civil)."],
  },
  chuva: {
    titulo: "Chuva forte",
    descricao:
      "Chuva intensa identificada na região. Evite áreas alagadas e acompanhe as orientações da Defesa Civil.",
    chamada: "CUIDADO NAS RUAS!",
    orientacoes: [
      "Não atravesse ruas alagadas.",
      "Evite sair de casa se não for necessário.",
      "Fique longe de encostas e córregos.",
    ],
  },
  vento: {
    titulo: "Ventos fortes",
    descricao: "Ventos fortes identificados. Afaste-se de árvores, postes e estruturas que possam cair.",
    chamada: "PROTEJA-SE!",
    orientacoes: [
      "Fique longe de árvores e postes.",
      "Feche portas e janelas.",
      "Recolha objetos soltos do quintal.",
    ],
  },
  granizo: {
    titulo: "Possibilidade de granizo",
    descricao: "Há alerta oficial de possibilidade de granizo para a região. Procure abrigo e evite áreas abertas.",
    chamada: "PROTEJA-SE!",
    orientacoes: [
      "Procure abrigo em local seguro.",
      "Evite permanecer em áreas abertas.",
      "Proteja veículos, se for seguro.",
      "Afaste-se de árvores e estruturas frágeis.",
    ],
  },
  enchente: {
    titulo: "Risco de enchente",
    descricao:
      "Elevação crítica do nível da água identificada. Evite áreas próximas a rios e locais sujeitos a alagamentos.",
    chamada: "SAIA DE ÁREAS BAIXAS!",
    orientacoes: [
      "Afaste-se de rios e canais.",
      "Desligue a energia se a água entrar em casa.",
      "Vá para um local alto e seguro.",
      "Ligue 199 se precisar de ajuda.",
    ],
  },
  calor: {
    titulo: "Calor intenso",
    descricao:
      "Temperaturas elevadas identificadas. Hidrate-se, evite exposição prolongada ao sol e procure locais frescos.",
    chamada: "BEBA ÁGUA!",
    orientacoes: [
      "Beba água várias vezes ao dia.",
      "Evite o sol entre 10h e 16h.",
      "Cuide de idosos, crianças e animais.",
    ],
  },
  ar: {
    titulo: "Qualidade do ar ruim",
    descricao:
      "Condições de qualidade do ar desfavoráveis. Reduza atividades físicas ao ar livre e acompanhe as orientações oficiais.",
    chamada: "RESPIRE MELHOR!",
    orientacoes: [
      "Evite exercícios ao ar livre.",
      "Mantenha janelas fechadas.",
      "Procure atendimento se sentir falta de ar.",
    ],
  },
};

/** Level of one metric for a given value. Returns 1 when below "atenção". */
export function levelFor(value: number, t: MetricThreshold): Level {
  if (value >= t.emergencia) return 4;
  if (value >= t.alerta) return 3;
  if (value >= t.atencao) return 2;
  return 1;
}

/** Raw level of every sensor-based alert type for one reading. */
export function evaluateReadings(
  r: Readings,
  t: Thresholds,
  enabled: Record<AlertType, boolean>,
): Record<SensorAlertType, Level> {
  const out = {} as Record<SensorAlertType, Level>;
  (Object.keys(SENSOR_METRIC) as SensorAlertType[]).forEach((type) => {
    out[type] = enabled[type] ? levelFor(r[SENSOR_METRIC[type]] as number, t[type]) : 1;
  });
  return out;
}

/**
 * Anti false-alarm rule: a level only changes after `n` consecutive readings
 * agree. It rises to the lowest level seen in the last `n` readings (if that
 * is above the current one) and falls to the highest level seen (if that is
 * below the current one). Isolated spikes or dips are ignored.
 */
export function confirmLevel(current: Level, recent: Level[], n: number): Level {
  const need = Math.max(1, Math.floor(n));
  if (recent.length < need) return current;
  const last = recent.slice(-need);
  const min = Math.min(...last) as Level;
  const max = Math.max(...last) as Level;
  if (min > current) return min;
  if (max < current) return max;
  return current;
}

/** Physical range checks — readings outside them mean a faulty sensor. */
export const VALID_RANGES: Record<Exclude<keyof Readings, "timestamp">, [number, number]> = {
  temperatura: [-40, 80],
  umidade: [0, 100],
  pressao: [300, 1100],
  uv: [0, 15],
  qualidadeAr: [0, 5000],
  ventoVelocidade: [0, 250],
  ventoDirecao: [0, 360],
  chuva: [0, 300],
  nivelAgua: [0, 500],
};

export function invalidSensors(r: Partial<Readings>): string[] {
  return (Object.keys(VALID_RANGES) as (keyof typeof VALID_RANGES)[]).filter((k) => {
    const v = r[k];
    const [min, max] = VALID_RANGES[k];
    return typeof v !== "number" || Number.isNaN(v) || v < min || v > max;
  });
}

/** Station data is stale (offline) after this many ms without a reading. */
export const STALE_AFTER_MS = 15_000;

export function isStale(lastTimestamp: number | null, now: number): boolean {
  return lastTimestamp === null || now - lastTimestamp > STALE_AFTER_MS;
}

/* ---------- Reading time (minimum 4 seconds per screen) ---------- */

export const MIN_SCREEN_MS = 4000;
/** Extra time per word beyond what fits comfortably in 4 seconds. */
const MS_PER_WORD = 400;
const WORDS_IN_MIN = 10;

export function screenDuration(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const extra = Math.max(0, words - WORDS_IN_MIN) * MS_PER_WORD;
  return MIN_SCREEN_MS + extra;
}

export interface Screen {
  kind: "principal" | "orientacao";
  titulo: string;
  texto: string;
  passo?: { atual: number; total: number };
  duracao: number;
}

/** One main screen followed by one screen per instruction. */
export function buildScreens(template: AlertTemplate): Screen[] {
  const total = template.orientacoes.length;
  const main: Screen = {
    kind: "principal",
    titulo: template.titulo,
    texto: template.descricao,
    duracao: screenDuration(`${template.titulo} ${template.descricao}`),
  };
  const steps = template.orientacoes.map<Screen>((o, i) => ({
    kind: "orientacao",
    titulo: template.chamada,
    texto: o,
    passo: { atual: i + 1, total },
    duracao: screenDuration(`${template.chamada} ${o}`),
  }));
  return [main, ...steps];
}

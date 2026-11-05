/**
 * Station store — browser-side state for the weather station.
 *
 * Holds the latest readings, confirmed alert levels, manual/official alerts,
 * the alert history and the admin configuration. Configuration, manual alerts
 * and history are saved in this browser (localStorage) and synced across tabs.
 *
 * DATA SOURCE: while no Arduino is connected, readings come from a built-in
 * simulator (`scenario`). Replace `simulateReading` with real data when the
 * station is connected.
 */
import { useSyncExternalStore } from "react";
import {
  DEFAULT_THRESHOLDS,
  SENSOR_METRIC,
  TEMPLATES,
  confirmLevel,
  evaluateReadings,
  invalidSensors,
  isStale,
  type AlertSource,
  type AlertType,
  type Level,
  type Readings,
  type SensorAlertType,
  type Thresholds,
} from "./alerts";

export type Scenario = "normal" | "chuva" | "vento" | "enchente" | "calor" | "ar" | "falha" | "offline";

export interface ActiveAlert {
  id: string;
  type: AlertType;
  level: Level;
  source: AlertSource;
  startedAt: number;
  justificativa: string;
}

export interface HistoryRecord {
  id: string;
  type: AlertType;
  level: Level;
  source: AlertSource;
  startedAt: number;
  endedAt: number | null;
  readings: Readings | null;
  justificativa: string;
}

export interface StationState {
  hydrated: boolean;
  location: string;
  thresholds: Thresholds;
  enabled: Record<AlertType, boolean>;
  scenario: Scenario;
  readings: Readings | null;
  lastTimestamp: number | null;
  now: number;
  faultySensors: string[];
  recent: Record<SensorAlertType, Level[]>;
  confirmed: Record<SensorAlertType, Level>;
  sensorRecordIds: Partial<Record<SensorAlertType, string>>;
  suppressed: Partial<Record<SensorAlertType, Level>>;
  manualAlerts: ActiveAlert[];
  history: HistoryRecord[];
}

const SENSOR_TYPES = Object.keys(SENSOR_METRIC) as SensorAlertType[];

const ALL_ENABLED: Record<AlertType, boolean> = {
  normal: true,
  chuva: true,
  vento: true,
  granizo: true,
  enchente: true,
  calor: true,
  ar: true,
};

function levels<T>(value: T): Record<SensorAlertType, T> {
  return { chuva: value, vento: value, enchente: value, calor: value, ar: value };
}

function initialState(): StationState {
  return {
    hydrated: false,
    location: "Paranaguá – PR",
    thresholds: DEFAULT_THRESHOLDS,
    enabled: ALL_ENABLED,
    scenario: "normal",
    readings: null,
    lastTimestamp: null,
    now: 0,
    faultySensors: [],
    recent: { chuva: [], vento: [], enchente: [], calor: [], ar: [] },
    confirmed: levels<Level>(1),
    sensorRecordIds: {},
    suppressed: {},
    manualAlerts: [],
    history: [],
  };
}

const STORAGE_KEY = "aci-station-v1";
const PERSISTED: (keyof StationState)[] = [
  "location",
  "thresholds",
  "enabled",
  "scenario",
  "manualAlerts",
  "history",
  "confirmed",
  "sensorRecordIds",
  "suppressed",
];

let state: StationState = initialState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  const out: Partial<StationState> = {};
  PERSISTED.forEach((k) => {
    (out as Record<string, unknown>)[k] = state[k];
  });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* storage full or blocked — keep working in memory */
  }
}

function setState(patch: Partial<StationState>, save = true) {
  state = { ...state, ...patch };
  if (save) persist();
  emit();
}

function readStorage(): Partial<StationState> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<StationState>) : null;
  } catch {
    return null;
  }
}

function newId() {
  return crypto.randomUUID();
}

/* ---------------- Simulator ---------------- */

const PROFILES: Record<Exclude<Scenario, "offline">, Omit<Readings, "timestamp">> = {
  normal: { temperatura: 24, umidade: 68, pressao: 1013, uv: 5, qualidadeAr: 180, ventoVelocidade: 12, ventoDirecao: 120, chuva: 0, nivelAgua: 40 },
  chuva: { temperatura: 21, umidade: 95, pressao: 1002, uv: 1, qualidadeAr: 150, ventoVelocidade: 28, ventoDirecao: 160, chuva: 32, nivelAgua: 70 },
  vento: { temperatura: 22, umidade: 75, pressao: 998, uv: 3, qualidadeAr: 160, ventoVelocidade: 72, ventoDirecao: 200, chuva: 4, nivelAgua: 45 },
  enchente: { temperatura: 20, umidade: 97, pressao: 1000, uv: 0.5, qualidadeAr: 140, ventoVelocidade: 30, ventoDirecao: 180, chuva: 42, nivelAgua: 172 },
  calor: { temperatura: 37.5, umidade: 38, pressao: 1010, uv: 11, qualidadeAr: 260, ventoVelocidade: 8, ventoDirecao: 90, chuva: 0, nivelAgua: 35 },
  ar: { temperatura: 27, umidade: 50, pressao: 1012, uv: 6, qualidadeAr: 780, ventoVelocidade: 4, ventoDirecao: 60, chuva: 0, nivelAgua: 38 },
  falha: { temperatura: 24, umidade: 68, pressao: 1013, uv: 5, qualidadeAr: 180, ventoVelocidade: 12, ventoDirecao: 120, chuva: 0, nivelAgua: 40 },
};

function jitter(v: number, pct = 0.05) {
  return v + v * pct * (Math.random() * 2 - 1);
}

function simulateReading(scenario: Scenario): Readings | null {
  if (scenario === "offline") return null;
  const p = PROFILES[scenario];
  const r: Readings = {
    temperatura: +jitter(p.temperatura, 0.02).toFixed(1),
    umidade: Math.min(100, +jitter(p.umidade, 0.02).toFixed(0)),
    pressao: +jitter(p.pressao, 0.001).toFixed(1),
    uv: +Math.max(0, jitter(p.uv, 0.1)).toFixed(1),
    qualidadeAr: Math.round(jitter(p.qualidadeAr)),
    ventoVelocidade: +Math.max(0, jitter(p.ventoVelocidade, 0.08)).toFixed(1),
    ventoDirecao: Math.round((p.ventoDirecao + (Math.random() * 30 - 15) + 360) % 360),
    chuva: +Math.max(0, jitter(p.chuva, 0.08)).toFixed(1),
    nivelAgua: Math.round(jitter(p.nivelAgua, 0.03)),
    timestamp: Date.now(),
  };
  // "falha" simulates a disconnected humidity sensor and a broken water-level sensor.
  if (scenario === "falha") {
    r.umidade = Number.NaN;
    r.nivelAgua = -1;
  }
  return r;
}

/* ---------------- Engine ---------------- */

const UNITS: Record<SensorAlertType, string> = {
  chuva: "mm/h",
  vento: "km/h",
  enchente: "cm",
  calor: "°C",
  ar: "ppm",
};

const METRIC_SENSOR: Record<SensorAlertType, string> = {
  chuva: "chuva",
  vento: "ventoVelocidade",
  enchente: "nivelAgua",
  calor: "temperatura",
  ar: "qualidadeAr",
};

function justify(type: SensorAlertType, level: Level, r: Readings, t: Thresholds): string {
  const value = r[SENSOR_METRIC[type]] as number;
  const key = level === 4 ? "emergencia" : level === 3 ? "alerta" : "atencao";
  return `${TEMPLATES[type].titulo}: ${value} ${UNITS[type]} ≥ limite configurado de ${t[type][key]} ${UNITS[type]} (${t.persistencia} leituras seguidas)`;
}

function ingest(r: Readings | null) {
  const now = Date.now();
  if (!r) {
    setState({ now }, false);
    return;
  }
  const faulty = invalidSensors(r);
  const raw = evaluateReadings(r, state.thresholds, state.enabled);
  const recent = { ...state.recent };
  const confirmed = { ...state.confirmed };
  const sensorRecordIds = { ...state.sensorRecordIds };
  const suppressed = { ...state.suppressed };
  let history = state.history;

  SENSOR_TYPES.forEach((type) => {
    // Ignore metrics whose sensor reported an invalid value.
    if (faulty.includes(METRIC_SENSOR[type])) return;
    recent[type] = [...recent[type], raw[type]].slice(-10);
    const prev = confirmed[type];
    const next = confirmLevel(prev, recent[type], state.thresholds.persistencia);
    if (next === prev) return;
    confirmed[type] = next;
    if (suppressed[type] !== undefined) delete suppressed[type];

    const openId = sensorRecordIds[type];
    if (openId) {
      history = history.map((h) => (h.id === openId && h.endedAt === null ? { ...h, endedAt: now } : h));
      delete sensorRecordIds[type];
    }
    if (next >= 2) {
      const rec: HistoryRecord = {
        id: newId(),
        type,
        level: next,
        source: "sensor",
        startedAt: now,
        endedAt: null,
        readings: r,
        justificativa: justify(type, next, r, state.thresholds),
      };
      history = [rec, ...history].slice(0, 200);
      sensorRecordIds[type] = rec.id;
    }
  });

  setState({
    readings: r,
    lastTimestamp: r.timestamp,
    now,
    faultySensors: faulty,
    recent,
    confirmed,
    sensorRecordIds,
    suppressed,
    history,
  });
}

let timer: ReturnType<typeof setInterval> | null = null;
let starters = 0;

export const TICK_MS = 3000;

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY || !e.newValue) return;
  try {
    const saved = JSON.parse(e.newValue) as Partial<StationState>;
    setState(saved, false);
  } catch {
    /* ignore malformed */
  }
}

/** Start the engine (idempotent). Call from useEffect in the root layout. */
export function startStation() {
  starters += 1;
  if (starters > 1) return stopStation;
  const saved = readStorage();
  setState({ ...(saved ?? {}), hydrated: true, now: Date.now() }, false);
  ingest(simulateReading(state.scenario));
  timer = setInterval(() => ingest(simulateReading(state.scenario)), TICK_MS);
  window.addEventListener("storage", onStorage);
  return stopStation;
}

function stopStation() {
  starters = Math.max(0, starters - 1);
  if (starters > 0) return;
  if (timer) clearInterval(timer);
  timer = null;
  window.removeEventListener("storage", onStorage);
}

/* ---------------- Admin actions ---------------- */

export const stationActions = {
  setScenario(scenario: Scenario) {
    setState({ scenario });
  },
  setLocation(location: string) {
    setState({ location });
  },
  setThresholds(thresholds: Thresholds) {
    setState({ thresholds });
  },
  resetThresholds() {
    setState({ thresholds: DEFAULT_THRESHOLDS });
  },
  setEnabled(type: AlertType, value: boolean) {
    setState({ enabled: { ...state.enabled, [type]: value } });
  },
  emitManual(type: AlertType, level: Level, source: Exclude<AlertSource, "sensor">, note: string) {
    const now = Date.now();
    const alert: ActiveAlert = {
      id: newId(),
      type,
      level,
      source,
      startedAt: now,
      justificativa: note.trim() || (source === "oficial" ? "Alerta de fonte oficial" : "Acionamento manual autorizado"),
    };
    const rec: HistoryRecord = { ...alert, endedAt: null, readings: state.readings };
    setState({
      manualAlerts: [alert, ...state.manualAlerts],
      history: [rec, ...state.history].slice(0, 200),
    });
  },
  endAlert(id: string) {
    const now = Date.now();
    const sensorType = (Object.keys(state.sensorRecordIds) as SensorAlertType[]).find(
      (t) => state.sensorRecordIds[t] === id,
    );
    const history = state.history.map((h) => (h.id === id && h.endedAt === null ? { ...h, endedAt: now } : h));
    if (sensorType) {
      const sensorRecordIds = { ...state.sensorRecordIds };
      delete sensorRecordIds[sensorType];
      setState({
        history,
        sensorRecordIds,
        suppressed: { ...state.suppressed, [sensorType]: state.confirmed[sensorType] },
      });
      return;
    }
    setState({ history, manualAlerts: state.manualAlerts.filter((a) => a.id !== id) });
  },
  clearHistory() {
    const openIds = new Set([
      ...Object.values(state.sensorRecordIds),
      ...state.manualAlerts.map((a) => a.id),
    ]);
    setState({ history: state.history.filter((h) => openIds.has(h.id)) });
  },
};

/* ---------------- Selectors ---------------- */

export interface StationStatus {
  offline: boolean;
  active: ActiveAlert[];
}

export function selectStatus(s: StationState): StationStatus {
  const offline = s.hydrated && isStale(s.lastTimestamp, s.now);
  const sensorAlerts: ActiveAlert[] = offline
    ? []
    : SENSOR_TYPES.filter((t) => s.confirmed[t] >= 2 && s.suppressed[t] === undefined && s.sensorRecordIds[t]).map(
        (t) => {
          const rec = s.history.find((h) => h.id === s.sensorRecordIds[t]);
          return {
            id: s.sensorRecordIds[t] as string,
            type: t,
            level: s.confirmed[t],
            source: "sensor" as const,
            startedAt: rec?.startedAt ?? s.now,
            justificativa: rec?.justificativa ?? "",
          };
        },
      );
  const active = [...s.manualAlerts.filter((a) => s.enabled[a.type]), ...sensorAlerts].sort(
    (a, b) => b.level - a.level || b.startedAt - a.startedAt,
  );
  return { offline, active };
}

/* ---------------- React hook ---------------- */

const serverSnapshot = initialState();

export function useStation(): StationState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverSnapshot,
  );
}

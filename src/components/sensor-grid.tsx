import {
  ArrowUp,
  CloudRain,
  Droplets,
  Gauge,
  Ruler,
  Sun,
  Thermometer,
  Wind,
  Factory,
  type LucideIcon,
} from "lucide-react";
import type { Readings } from "@/lib/alerts";
import { cn } from "@/lib/utils";

interface SensorDef {
  key: Exclude<keyof Readings, "timestamp">;
  nome: string;
  modelo: string;
  unidade: string;
  icon: LucideIcon;
  format?: (v: number) => string;
}

function compass(deg: number) {
  const dirs = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
  return dirs[Math.round(deg / 45) % 8];
}

export const SENSORS: SensorDef[] = [
  { key: "temperatura", nome: "Temperatura", modelo: "DHT22", unidade: "°C", icon: Thermometer },
  { key: "umidade", nome: "Umidade do ar", modelo: "DHT22", unidade: "%", icon: Droplets },
  { key: "pressao", nome: "Pressão", modelo: "BMP280", unidade: "hPa", icon: Gauge },
  { key: "uv", nome: "Índice UV", modelo: "GUVA-S12SD", unidade: "", icon: Sun },
  { key: "qualidadeAr", nome: "Qualidade do ar", modelo: "MQ-135", unidade: "ppm", icon: Factory },
  { key: "ventoVelocidade", nome: "Vento", modelo: "Anemômetro", unidade: "km/h", icon: Wind },
  { key: "ventoDirecao", nome: "Direção do vento", modelo: "Wind Vane", unidade: "", icon: ArrowUp, format: (v) => `${compass(v)} · ${v}°` },
  { key: "chuva", nome: "Chuva", modelo: "Pluviômetro", unidade: "mm/h", icon: CloudRain },
  { key: "nivelAgua", nome: "Nível da água", modelo: "HC-SR04", unidade: "cm", icon: Ruler },
];

export type SensorHealth = "ok" | "falha" | "sem-dados";

export function sensorHealth(key: string, readings: Readings | null, faulty: string[], offline: boolean): SensorHealth {
  if (offline || !readings) return "sem-dados";
  return faulty.includes(key) ? "falha" : "ok";
}

const HEALTH_LABEL: Record<SensorHealth, string> = { ok: "Funcionando", falha: "Falha na leitura", "sem-dados": "Sem dados" };
const HEALTH_DOT: Record<SensorHealth, string> = { ok: "bg-primary", falha: "bg-level-3", "sem-dados": "bg-offline" };

export function SensorGrid({
  readings,
  faulty,
  offline,
}: {
  readings: Readings | null;
  faulty: string[];
  offline: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
      {SENSORS.map((s) => {
        const health = sensorHealth(s.key, readings, faulty, offline);
        const v = readings?.[s.key];
        const value =
          health !== "ok" || typeof v !== "number" ? "—" : s.format ? s.format(v) : `${v}${s.unidade ? ` ${s.unidade}` : ""}`;
        const Icon = s.icon;
        return (
          <div key={s.key} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <Icon
                className="size-5 text-primary"
                style={s.key === "ventoDirecao" && typeof v === "number" && health === "ok" ? { transform: `rotate(${v}deg)` } : undefined}
              />
              <span className={cn("size-2.5 rounded-full", HEALTH_DOT[health])} title={HEALTH_LABEL[health]} />
            </div>
            <p className="mt-3 font-display text-xl font-bold leading-tight">{value}</p>
            <p className="text-sm font-semibold">{s.nome}</p>
            <p className="text-xs text-muted-foreground">
              {s.modelo} · {HEALTH_LABEL[health]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

import {
  CloudFog,
  CloudHail,
  CloudRainWind,
  SunMedium,
  Thermometer,
  Waves,
  WifiOff,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { LEVEL_INFO, type AlertSource, type AlertType, type Level } from "@/lib/alerts";
import { cn } from "@/lib/utils";

export const ALERT_ICONS: Record<AlertType, LucideIcon> = {
  normal: SunMedium,
  chuva: CloudRainWind,
  vento: Wind,
  granizo: CloudHail,
  enchente: Waves,
  calor: Thermometer,
  ar: CloudFog,
};

export const OfflineIcon = WifiOff;

/** Static class strings so Tailwind keeps them. */
export const LEVEL_SURFACE: Record<Level, string> = {
  1: "bg-level-1 text-level-1-foreground",
  2: "bg-level-2 text-level-2-foreground",
  3: "bg-level-3 text-level-3-foreground",
  4: "bg-level-4 text-level-4-foreground",
};

export const LEVEL_TEXT: Record<Level, string> = {
  1: "text-level-1",
  2: "text-level-2",
  3: "text-level-3",
  4: "text-level-4",
};

export const SOURCE_LABEL: Record<AlertSource, string> = {
  sensor: "Sensores da estação",
  oficial: "Fonte oficial",
  manual: "Acionamento manual",
};

export function LevelBadge({ level, className }: { level: Level; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
        LEVEL_SURFACE[level],
        className,
      )}
    >
      Nível {level} · {LEVEL_INFO[level].nome}
    </span>
  );
}

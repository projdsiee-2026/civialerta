import { useEffect, useMemo, useState } from "react";
import { Clock, MapPin, Radio } from "lucide-react";
import { LEVEL_INFO, TEMPLATES, buildScreens, type Level, type Readings, type Screen } from "@/lib/alerts";
import type { ActiveAlert } from "@/lib/station-store";
import { ALERT_ICONS, LEVEL_SURFACE, OfflineIcon, SOURCE_LABEL } from "@/components/alert-visuals";
import { cn } from "@/lib/utils";

interface Slide {
  key: string;
  alert: ActiveAlert | null; // null = normal conditions
  screen: Screen;
}

function formatTime(ts: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
}

/**
 * The big public alert screen. Every screen stays visible for at least
 * 4 seconds (longer for long text); instructions are split into sequential
 * screens and the sequence restarts while the alert is active.
 * When a level-4 alert is active, only emergency alerts are shown.
 */
export function AlertDisplay({
  alerts,
  offline,
  hydrated,
  location,
  readings,
  compact = false,
}: {
  alerts: ActiveAlert[];
  offline: boolean;
  hydrated: boolean;
  location: string;
  readings: Readings | null;
  compact?: boolean;
}) {
  const shown = useMemo(() => {
    const emergencies = alerts.filter((a) => a.level === 4);
    return emergencies.length ? emergencies : alerts;
  }, [alerts]);

  const slides = useMemo<Slide[]>(() => {
    if (!shown.length) {
      return buildScreens(TEMPLATES.normal).map((screen, i) => ({ key: `normal-${i}`, alert: null, screen }));
    }
    return shown.flatMap((alert) =>
      buildScreens(TEMPLATES[alert.type]).map((screen, i) => ({ key: `${alert.id}-${alert.level}-${i}`, alert, screen })),
    );
  }, [shown]);

  const sequenceKey = slides.map((s) => s.key).join("|");
  const [index, setIndex] = useState(0);

  // New or changed alert → show it immediately from the first screen.
  useEffect(() => {
    setIndex(0);
  }, [sequenceKey]);

  const safeIndex = index < slides.length ? index : 0;
  // slides always has at least one screen (normal template when no alerts).
  const current = (slides[safeIndex] ?? slides[0]) as Slide;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), current.screen.duracao);
    return () => clearTimeout(t);
  }, [safeIndex, slides.length, current.screen.duracao, sequenceKey]);

  const height = compact ? "min-h-[420px]" : "min-h-[62vh]";

  if (!hydrated) {
    return (
      <section className={cn("flex items-center justify-center rounded-3xl border border-border bg-card", height)}>
        <p className="text-2xl font-semibold text-muted-foreground">Conectando à estação…</p>
      </section>
    );
  }

  if (offline) {
    return (
      <section
        aria-live="assertive"
        className={cn(
          "flex flex-col justify-between gap-8 rounded-3xl bg-offline p-6 text-offline-foreground md:p-10",
          height,
        )}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-wide">
          <span className="rounded-full bg-background/25 px-3 py-1">Sem comunicação</span>
          <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {location}</span>
        </div>
        <div className="screen-in flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
          <OfflineIcon className="size-24 shrink-0 md:size-36" strokeWidth={1.6} />
          <div className="space-y-4">
            <h2 className="text-4xl font-black uppercase md:text-6xl">Dados indisponíveis</h2>
            <p className="max-w-3xl text-2xl font-semibold leading-snug md:text-3xl">
              A estação não está enviando dados. Não é possível confirmar que a situação está normal.
            </p>
            <p className="text-xl md:text-2xl">Acompanhe a Defesa Civil: ligue 199.</p>
          </div>
        </div>
        <p className="text-sm opacity-80">Última leitura: {readings ? formatTime(readings.timestamp) : "nenhuma"}</p>
      </section>
    );
  }

  const level: Level = current.alert?.level ?? 1;
  const type = current.alert?.type ?? "normal";
  const Icon = ALERT_ICONS[type];
  const when = current.alert?.startedAt ?? readings?.timestamp ?? Date.now();
  const isMain = current.screen.kind === "principal";

  return (
    <section
      aria-live={level >= 3 ? "assertive" : "polite"}
      className={cn(
        "relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl p-6 md:p-10",
        LEVEL_SURFACE[level],
        level >= 3 && "alert-pulse",
        height,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-wide">
        <span className={cn("rounded-full bg-background/20 px-3 py-1", level === 4 && "alert-pulse-strong")}>
          Nível {level} · {LEVEL_INFO[level].nome}
        </span>
        <span className="flex items-center gap-1.5">
          <Radio className="size-4" /> {current.alert ? SOURCE_LABEL[current.alert.source] : SOURCE_LABEL.sensor}
        </span>
        <span className="flex items-center gap-1.5"><MapPin className="size-4" /> {location}</span>
        <span className="flex items-center gap-1.5"><Clock className="size-4" /> {formatTime(when)}</span>
      </div>

      <div key={current.key} className="screen-in flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-12">
        <Icon className={cn("shrink-0", compact ? "size-24" : "size-28 md:size-44")} strokeWidth={1.5} />
        <div className="min-w-0 space-y-4">
          {isMain ? (
            <>
              <h2 className={cn("font-black uppercase leading-none", compact ? "text-4xl" : "text-5xl md:text-7xl")}>
                {current.screen.titulo}
              </h2>
              <p className={cn("max-w-4xl font-semibold leading-snug", compact ? "text-xl" : "text-2xl md:text-4xl")}>
                {current.screen.texto}
              </p>
              {type === "normal" && readings && (
                <p className="text-xl md:text-2xl">
                  {readings.temperatura} °C · Umidade {Number.isNaN(readings.umidade) ? "—" : `${readings.umidade}%`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className={cn("font-black uppercase", compact ? "text-2xl" : "text-3xl md:text-5xl")}>
                {current.screen.titulo}
              </p>
              <p className={cn("max-w-4xl font-bold leading-tight", compact ? "text-3xl" : "text-4xl md:text-6xl")}>
                {current.screen.texto}
              </p>
              {current.screen.passo && (
                <p className="text-lg font-semibold opacity-80">
                  Orientação {current.screen.passo.atual} de {current.screen.passo.total}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-background/25">
          <div
            key={`${current.key}-${safeIndex}`}
            className="read-progress h-full rounded-full bg-current"
            style={{ animationDuration: `${current.screen.duracao}ms` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>
            Tela {safeIndex + 1} de {slides.length}
            {shown.length > 1 && ` · ${shown.length} alertas ativos`}
          </span>
          <div className="flex gap-1.5" aria-hidden>
            {slides.map((s, i) => (
              <span key={s.key} className={cn("size-2.5 rounded-full bg-current", i === safeIndex ? "opacity-100" : "opacity-30")} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

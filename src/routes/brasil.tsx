import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { CloudRain, Droplets, Navigation, RefreshCw, Thermometer, Umbrella, Wind } from "lucide-react";
import { BrazilTemperatureMap } from "@/components/brazil-temperature-map";
import { Button } from "@/components/ui/button";
import { getBrazilWeather } from "@/lib/weather.functions";
import {
  LAYER_BANDS,
  TEMP_BG,
  describeWeather,
  layerBand,
  layerValue,
  tempBand,
  windDirection,
  type CityWeather,
  type MapLayer,
} from "@/lib/weather-data";
import { LOCALE, useLang, useT, type TKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const brazilWeatherQuery = queryOptions({
  queryKey: ["brazil-weather"],
  queryFn: () => getBrazilWeather(),
  staleTime: 5 * 60_000,
  refetchInterval: 10 * 60_000,
});

export const Route = createFileRoute("/brasil")({
  head: () => ({
    meta: [
      { title: "Tempo no Brasil agora — Alerta Civil Inteligente" },
      {
        name: "description",
        content: "Mapa do Brasil com temperatura, chuva, vento, umidade e previsão de 7 dias das capitais e grandes cidades.",
      },
      { property: "og:title", content: "Tempo no Brasil agora — Alerta Civil Inteligente" },
      { property: "og:description", content: "Temperatura, chuva, vento e previsão em todo o Brasil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(brazilWeatherQuery),
  component: BrasilPage,
});

const LAYERS: { id: MapLayer; icon: typeof Thermometer }[] = [
  { id: "temperatura", icon: Thermometer },
  { id: "chuva", icon: CloudRain },
  { id: "vento", icon: Wind },
  { id: "umidade", icon: Droplets },
];

function BrasilPage() {
  const { data, refetch, isFetching } = useSuspenseQuery(brazilWeatherQuery);
  const [selected, setSelected] = useState<string | null>("PR-Paranaguá");
  const [layer, setLayer] = useState<MapLayer>("temperatura");
  const t = useT();
  const lang = useLang();

  const city = data.cidades.find((c) => `${c.uf}-${c.nome}` === selected) ?? null;
  const by = (f: (c: CityWeather) => number) => [...data.cidades].sort((a, b) => f(b) - f(a));
  const updated = new Intl.DateTimeFormat(LOCALE[lang], { timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(
    data.atualizadoEm,
  );

  const rankings: { title: TKey; list: CityWeather[]; show: (c: CityWeather) => string }[] =
    layer === "temperatura"
      ? [
          { title: "br.maisQuentes", list: by((c) => c.temperatura).slice(0, 3), show: (c) => `${Math.round(c.temperatura)}°` },
          { title: "br.maisFrias", list: by((c) => -c.temperatura).slice(0, 3), show: (c) => `${Math.round(c.temperatura)}°` },
        ]
      : layer === "chuva"
        ? [{ title: "br.maisChuva", list: by((c) => layerValue(c, "chuva")).slice(0, 5), show: (c) => `${layerValue(c, "chuva").toFixed(1)} mm` }]
        : layer === "vento"
          ? [{ title: "br.maisVento", list: by((c) => c.vento).slice(0, 5), show: (c) => `${Math.round(c.vento)} km/h` }]
          : [{ title: "br.maisSecas", list: by((c) => -c.umidade).slice(0, 5), show: (c) => `${c.umidade}%` }];

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{t("br.titulo")}</h1>
          <p className="text-muted-foreground">
            {data.cidades.length} {t("br.sub")} {updated} · {t("br.fonte")}
          </p>
        </div>
        <Button variant="navy" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn(isFetching && "animate-spin")} /> {t("br.atualizar")}
        </Button>
      </div>

      {data.erro ? (
        <div className="rounded-2xl border border-level-3 bg-card p-6">
          <p className="font-semibold">{t("br.erro")}</p>
          <p className="text-sm text-muted-foreground">
            {data.erro}. {t("br.erroDica")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <div className="rounded-2xl border border-border bg-card p-3 md:p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2" role="tablist" aria-label={t("br.mostrar")}>
                <span className="text-sm font-bold text-muted-foreground">{t("br.mostrar")}:</span>
                {LAYERS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={layer === id}
                    onClick={() => setLayer(id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                      layer === id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-navy hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" /> {t(`layer.${id}`)}
                  </button>
                ))}
              </div>
              <BrazilTemperatureMap cidades={data.cidades} selected={selected} onSelect={setSelected} layer={layer} />
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold">
                {LAYER_BANDS[layer].labels.map((label, i) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <span className={cn("size-3 rounded-full", TEMP_BG[layer === "umidade" ? 5 - i : i])} /> {label}
                  </span>
                ))}
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border-2 border-primary" /> {t("br.estacao")}
                </span>
              </div>
            </div>

            <aside className="space-y-4">
              {city ? (
                <CityCard city={city} />
              ) : (
                <p className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">{t("br.toque")}</p>
              )}
              {rankings.map((r) => (
                <Ranking key={r.title} title={t(r.title)} list={r.list} show={r.show} onSelect={setSelected} />
              ))}
            </aside>
          </div>

          {city && <Forecast city={city} />}

          <AllCities cidades={data.cidades} layer={layer} selected={selected} onSelect={setSelected} />
        </>
      )}
    </div>
  );
}

function CityCard({ city }: { city: CityWeather }) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {city.estacao ? t("br.estacao") : `${city.capital ? t("br.capital") : t("br.cidade")} · ${city.uf}`}
      </p>
      <h2 className="text-2xl font-black">{city.nome}</h2>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={cn(
            "rounded-2xl px-4 py-2 font-display text-5xl font-black text-temp-foreground",
            TEMP_BG[tempBand(city.temperatura)],
          )}
        >
          {Math.round(city.temperatura)}°
        </span>
        <p className="text-lg font-semibold">{city.condicao}</p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <li className="flex items-center gap-2"><Thermometer className="size-4 text-primary" /> {t("br.sensacao")} {Math.round(city.sensacao)}°</li>
        <li className="flex items-center gap-2"><Droplets className="size-4 text-primary" /> {t("layer.umidade")} {city.umidade}%</li>
        <li className="flex items-center gap-2">
          <Navigation className="size-4 text-primary" style={{ transform: `rotate(${city.direcaoVento + 180 - 45}deg)` }} />
          {t("layer.vento")} {Math.round(city.vento)} km/h {windDirection(city.direcaoVento)}
        </li>
        <li className="flex items-center gap-2"><CloudRain className="size-4 text-primary" /> {t("br.chuvaAgora")} {city.chuva} mm</li>
      </ul>
    </div>
  );
}

function Forecast({ city }: { city: CityWeather }) {
  const t = useT();
  const lang = useLang();
  const fmt = new Intl.DateTimeFormat(LOCALE[lang], { weekday: "short", day: "2-digit", timeZone: "UTC" });
  return (
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h2 className="mb-3 text-xl font-bold">
        {t("br.previsao")} · <span className="text-primary">{city.nome}</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {city.previsao.map((d, i) => (
          <div key={d.data} className="rounded-xl bg-navy p-3 text-center">
            <p className="text-sm font-bold capitalize">{i === 0 ? t("br.hoje") : fmt.format(new Date(`${d.data}T12:00:00Z`))}</p>
            <p className="min-h-10 text-xs text-muted-foreground">{describeWeather(d.codigo)}</p>
            <p className="font-display text-xl font-black">
              {Math.round(d.max)}° <span className="text-base text-muted-foreground">{Math.round(d.min)}°</span>
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs">
              <Umbrella className="size-3.5 text-primary" /> {d.probChuva}% · {d.chuva.toFixed(1)} mm
            </p>
            <p className="flex items-center justify-center gap-1 text-xs">
              <Wind className="size-3.5 text-primary" /> {Math.round(d.ventoMax)} km/h
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AllCities({
  cidades,
  layer,
  selected,
  onSelect,
}: {
  cidades: CityWeather[];
  layer: MapLayer;
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  const t = useT();
  const list = [...cidades].sort((a, b) => a.uf.localeCompare(b.uf) || a.nome.localeCompare(b.nome));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <h2 className="mb-3 text-xl font-bold">{t("br.todas")}</h2>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const key = `${c.uf}-${c.nome}`;
          const hoje = c.previsao[0];
          return (
            <button
              key={key}
              onClick={() => {
                onSelect(key);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted",
                selected === key && "bg-navy",
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 shrink-0 rounded-full", TEMP_BG[layerBand(layerValue(c, layer), layer)])} />
                {c.nome} <span className="text-muted-foreground">· {c.uf}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                <span className="font-display text-sm font-bold text-foreground">{Math.round(c.temperatura)}°</span> ·{" "}
                {hoje ? `${hoje.chuva.toFixed(1)} mm` : "—"} · {Math.round(c.vento)} km/h · {c.umidade}%
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Ranking({
  title,
  list,
  show,
  onSelect,
}: {
  title: string;
  list: CityWeather[];
  show: (c: CityWeather) => string;
  onSelect: (key: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="mb-2 font-bold">{title}</h3>
      <ul className="space-y-1">
        {list.map((c) => (
          <li key={`${c.uf}-${c.nome}`}>
            <button
              onClick={() => onSelect(`${c.uf}-${c.nome}`)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
            >
              <span>
                {c.nome} <span className="text-muted-foreground">· {c.uf}</span>
              </span>
              <span className="font-display font-bold">{show(c)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

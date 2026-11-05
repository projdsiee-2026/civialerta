import { useState } from "react";
import { MAP_H, MAP_W, STATES, project } from "@/lib/brazil-map";
import { LAYER_BANDS, TEMP_FILL, layerBand, layerValue, type CityWeather, type MapLayer } from "@/lib/weather-data";
import { cn } from "@/lib/utils";

function fmt(v: number, layer: MapLayer) {
  if (layer === "temperatura") return `${Math.round(v)}°`;
  if (layer === "chuva") return v < 10 ? v.toFixed(1).replace(/\.0$/, "") : String(Math.round(v));
  return String(Math.round(v));
}

/** SVG map of Brazil with a colored bubble per city for the chosen layer. */
export function BrazilTemperatureMap({
  cidades,
  selected,
  onSelect,
  layer = "temperatura",
}: {
  cidades: CityWeather[];
  selected: string | null;
  onSelect: (key: string) => void;
  layer?: MapLayer;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const active = hover ?? selected;
  const unit = LAYER_BANDS[layer].unit;

  return (
    <svg
      viewBox={`-10 -10 ${MAP_W + 20} ${MAP_H + 20}`}
      className="h-auto w-full"
      role="img"
      aria-label="Mapa do Brasil com o tempo atual das cidades"
    >
      <g>
        {STATES.map((s) => (
          <path key={s.uf} d={s.d} className="fill-map-land stroke-map-stroke" strokeWidth={1} strokeLinejoin="round">
            <title>{s.nome}</title>
          </path>
        ))}
      </g>
      <g>
        {[...cidades]
          .sort((a, b) => {
            const rank = (c: CityWeather) =>
              active === `${c.uf}-${c.nome}` ? 3 : c.estacao ? 0 : c.capital ? 2 : 1;
            return rank(a) - rank(b);
          })
          .map((c) => {
            const key = `${c.uf}-${c.nome}`;
            const [x, y] = project(c.lon, c.lat);
            const isActive = active === key;
            const value = layerValue(c, layer);
            const band = layerBand(value, layer);
            const base = c.capital || c.estacao ? 19 : 14;
            return (
              <g
                key={key}
                transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`}
                className="cursor-pointer"
                onMouseEnter={() => setHover(key)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onSelect(key)}
                role="button"
                tabIndex={0}
                aria-label={`${c.nome}: ${fmt(value, layer)} ${unit}`}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(key)}
              >
                {c.estacao && <circle r={isActive ? 30 : 26} className="fill-none stroke-primary" strokeWidth={3} />}
                <circle
                  r={isActive ? 24 : base}
                  className={cn(TEMP_FILL[band], "stroke-background transition-all")}
                  strokeWidth={3}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none fill-temp-foreground font-display font-extrabold"
                  fontSize={isActive ? 16 : base === 14 ? 11 : 13}
                >
                  {fmt(value, layer)}
                </text>
                {layer === "vento" && (
                  <line
                    x1={0}
                    y1={-(base + 4)}
                    x2={0}
                    y2={-(base + 14)}
                    transform={`rotate(${c.direcaoVento + 180})`}
                    className="pointer-events-none stroke-foreground"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                )}
                {isActive && (
                  <text
                    y={-38}
                    textAnchor="middle"
                    className="pointer-events-none fill-foreground stroke-background font-display font-bold"
                    strokeWidth={5}
                    paintOrder="stroke"
                    fontSize={20}
                  >
                    {c.nome}
                  </text>
                )}
              </g>
            );
          })}
      </g>
    </svg>
  );
}

import { Link } from "@tanstack/react-router";
import { Languages, ShieldCheck } from "lucide-react";
import { LANGS, setLang, useLang, useT, type TKey } from "@/lib/i18n";

const NAV = [
  { to: "/", label: "nav.painel" },
  { to: "/brasil", label: "nav.brasil" },
  { to: "/historico", label: "nav.historico" },
  { to: "/assistente", label: "nav.assistente" },
  { to: "/voz", label: "nav.voz" },
  { to: "/equipe", label: "nav.equipe" },
  { to: "/admin", label: "nav.admin" },
] as const satisfies readonly { to: string; label: TKey }[];

export function SiteHeader() {
  const t = useT();
  const lang = useLang();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy text-primary">
            <ShieldCheck className="h-9 w-9" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="font-display text-lg font-extrabold uppercase tracking-tight">
              Alerta Civil <span className="text-primary">Inteligente</span>
            </p>
            <p className="text-xs text-muted-foreground">{t("header.sub")}</p>
          </div>
        </Link>
        <nav aria-label="Navegação principal" className="ml-auto flex flex-wrap items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-navy hover:text-foreground data-[status=active]:bg-navy data-[status=active]:text-primary"
            >
              {t(item.label)}
            </Link>
          ))}
          <label className="ml-1 flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-sm">
            <Languages className="size-4 text-primary" aria-hidden />
            <span className="sr-only">{t("lang.label")}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as typeof lang)}
              className="bg-transparent font-semibold text-foreground outline-none"
              aria-label={t("lang.label")}
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id} className="bg-card">
                  {l.flag} · {l.label}
                </option>
              ))}
            </select>
          </label>
        </nav>
      </div>
    </header>
  );
}

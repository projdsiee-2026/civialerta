import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AlertDisplay } from "@/components/alert-display";
import { LevelBadge, SOURCE_LABEL } from "@/components/alert-visuals";
import { SENSORS, sensorHealth } from "@/components/sensor-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LEVEL_INFO, TEMPLATES, type AlertType, type Level, type Thresholds } from "@/lib/alerts";
import { selectStatus, stationActions, useStation, type ActiveAlert, type Scenario } from "@/lib/station-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Alerta Civil Inteligente" },
      { name: "description", content: "Configure limites dos sensores, emita e encerre alertas e teste as mensagens." },
      { property: "og:title", content: "Administração — Alerta Civil Inteligente" },
      { property: "og:description", content: "Painel dos responsáveis pela estação meteorológica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const SCENARIOS: { id: Scenario; label: string }[] = [
  { id: "normal", label: "Tempo normal" },
  { id: "chuva", label: "Chuva forte" },
  { id: "vento", label: "Ventos fortes" },
  { id: "enchente", label: "Enchente" },
  { id: "calor", label: "Calor intenso" },
  { id: "ar", label: "Ar poluído" },
  { id: "falha", label: "Falha de sensor" },
  { id: "offline", label: "Estação sem sinal" },
];

const ALERT_TYPES = (Object.keys(TEMPLATES) as AlertType[]).filter((t) => t !== "normal");

const METRICS: { key: Exclude<keyof Thresholds, "persistencia">; label: string; unit: string }[] = [
  { key: "chuva", label: "Chuva", unit: "mm/h" },
  { key: "vento", label: "Vento", unit: "km/h" },
  { key: "enchente", label: "Nível da água", unit: "cm" },
  { key: "calor", label: "Temperatura", unit: "°C" },
  { key: "ar", label: "Qualidade do ar", unit: "ppm" },
];

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 rounded-2xl border border-border bg-card p-5", className)}>
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Admin() {
  const s = useStation();
  const status = selectStatus(s);
  const [draft, setDraft] = useState<Thresholds>(s.thresholds);
  const [mType, setMType] = useState<AlertType>("granizo");
  const [mLevel, setMLevel] = useState<Level>(3);
  const [mSource, setMSource] = useState<"oficial" | "manual">("oficial");
  const [mNote, setMNote] = useState("");
  const [preview, setPreview] = useState<{ type: AlertType; level: Level } | null>(null);
  const [pType, setPType] = useState<AlertType>("chuva");
  const [pLevel, setPLevel] = useState<Level>(3);

  useEffect(() => {
    setDraft(s.thresholds);
  }, [s.thresholds]);

  function saveThresholds() {
    for (const m of METRICS) {
      const t = draft[m.key];
      if (!(t.atencao < t.alerta && t.alerta < t.emergencia)) {
        toast.error(`${m.label}: os limites precisam crescer (Atenção < Alerta < Emergência).`);
        return;
      }
    }
    if (draft.persistencia < 1) {
      toast.error("A confirmação precisa de pelo menos 1 leitura.");
      return;
    }
    stationActions.setThresholds(draft);
    toast.success("Limites salvos.");
  }

  const previewAlert: ActiveAlert | null = preview
    ? { id: "preview", type: preview.type, level: preview.level, source: "manual", startedAt: Date.now(), justificativa: "Teste" }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-black">Administração</h1>
        <div className="flex items-start gap-3 rounded-2xl border border-level-2 bg-navy-deep p-4">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-level-2" />
          <p className="text-sm">
            Área dos responsáveis. O acesso com senha ainda não está ativado — qualquer pessoa com o endereço pode abrir
            esta página. As configurações ficam salvas neste navegador.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Alertas ativos">
          {status.active.length === 0 ? (
            <p className="text-muted-foreground">Nenhum alerta ativo.</p>
          ) : (
            <ul className="space-y-2">
              {status.active.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-muted p-3">
                  <LevelBadge level={a.level} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{TEMPLATES[a.type].titulo}</p>
                    <p className="text-xs text-muted-foreground">{SOURCE_LABEL[a.source]} · {a.justificativa}</p>
                  </div>
                  <Button size="sm" variant="danger" onClick={() => stationActions.endAlert(a.id)}>
                    Encerrar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Fonte dos dados (simulação)">
          <p className="text-sm text-muted-foreground">
            Enquanto a estação Arduino não está conectada, escolha uma situação para simular as leituras.
          </p>
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((sc) => (
              <Button
                key={sc.id}
                size="sm"
                variant={s.scenario === sc.id ? "default" : "navy"}
                onClick={() => stationActions.setScenario(sc.id)}
              >
                {sc.label}
              </Button>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Localidade monitorada</Label>
            <Input id="loc" value={s.location} onChange={(e) => stationActions.setLocation(e.target.value)} />
          </div>
        </Card>

        <Card title="Emitir alerta manual ou oficial">
          <p className="text-sm text-muted-foreground">
            Granizo não é detectado pelos sensores: use esta opção quando houver alerta oficial (Defesa Civil / INMET).
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={mType} onValueChange={(v) => setMType(v as AlertType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALERT_TYPES.map((t) => <SelectItem key={t} value={t}>{TEMPLATES[t].titulo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nível</Label>
              <Select value={String(mLevel)} onValueChange={(v) => setMLevel(Number(v) as Level)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {([2, 3, 4] as Level[]).map((l) => <SelectItem key={l} value={String(l)}>{l} · {LEVEL_INFO[l].nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={mSource} onValueChange={(v) => setMSource(v as "oficial" | "manual")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficial">Fonte oficial</SelectItem>
                  <SelectItem value="manual">Acionamento manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea placeholder="Justificativa (ex.: Aviso INMET nº ...)" value={mNote} onChange={(e) => setMNote(e.target.value)} />
          <Button
            variant="hero"
            disabled={!s.enabled[mType]}
            onClick={() => {
              stationActions.emitManual(mType, mLevel, mSource, mNote);
              setMNote("");
              toast.success("Alerta emitido no painel.");
            }}
          >
            Emitir alerta
          </Button>
          {!s.enabled[mType] && <p className="text-sm text-level-2">Este tipo de alerta está desativado.</p>}
        </Card>

        <Card title="Tipos de alerta">
          <div className="grid gap-3 sm:grid-cols-2">
            {ALERT_TYPES.map((t) => (
              <label key={t} className="flex items-center justify-between gap-3 rounded-xl bg-muted p-3">
                <span className="font-semibold">{TEMPLATES[t].titulo}</span>
                <Switch checked={s.enabled[t]} onCheckedChange={(v) => stationActions.setEnabled(t, v)} />
              </label>
            ))}
          </div>
        </Card>

        <Card title="Limites de acionamento" className="lg:col-span-2">
          <p className="text-sm text-muted-foreground">
            Valores de exemplo, não oficiais. Ajuste conforme a calibração da estação e as referências da Defesa Civil.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-semibold">Medida</th>
                  {([2, 3, 4] as Level[]).map((l) => (
                    <th key={l} className="py-2 pr-3"><LevelBadge level={l} /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {METRICS.map((m) => (
                  <tr key={m.key} className="border-t border-border">
                    <td className="py-2 pr-3 font-semibold">{m.label} <span className="text-muted-foreground">({m.unit})</span></td>
                    {(["atencao", "alerta", "emergencia"] as const).map((k) => (
                      <td key={k} className="py-2 pr-3">
                        <Input
                          type="number"
                          aria-label={`${m.label} ${k}`}
                          value={draft[m.key][k]}
                          onChange={(e) =>
                            setDraft({ ...draft, [m.key]: { ...draft[m.key], [k]: Number(e.target.value) } })
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="persist">Leituras seguidas para confirmar</Label>
              <Input
                id="persist"
                type="number"
                min={1}
                className="w-32"
                value={draft.persistencia}
                onChange={(e) => setDraft({ ...draft, persistencia: Number(e.target.value) })}
              />
            </div>
            <Button variant="hero" onClick={saveThresholds}>Salvar limites</Button>
            <Button variant="navy" onClick={() => stationActions.resetThresholds()}>Restaurar exemplo</Button>
          </div>
        </Card>

        <Card title="Testar apresentação">
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={pType} onValueChange={(v) => setPType(v as AlertType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map((t) => <SelectItem key={t} value={t}>{TEMPLATES[t].titulo}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={String(pLevel)} onValueChange={(v) => setPLevel(Number(v) as Level)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {([1, 2, 3, 4] as Level[]).map((l) => <SelectItem key={l} value={String(l)}>{l} · {LEVEL_INFO[l].nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="navy" onClick={() => setPreview({ type: pType, level: pLevel })}>Ver prévia</Button>
        </Card>

        <Card title="Sensores e conexão">
          <ul className="grid gap-2 sm:grid-cols-2">
            {SENSORS.map((sen) => {
              const h = sensorHealth(sen.key, s.readings, s.faultySensors, status.offline);
              return (
                <li key={sen.key} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                  <span><b>{sen.modelo}</b> · {sen.nome}</span>
                  <span className={cn("font-semibold", h === "ok" ? "text-primary" : h === "falha" ? "text-level-3" : "text-muted-foreground")}>
                    {h === "ok" ? "OK" : h === "falha" ? "Falha" : "Sem dados"}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-5xl border-border bg-background p-4">
          <DialogHeader>
            <DialogTitle>Prévia do alerta</DialogTitle>
          </DialogHeader>
          {previewAlert && (
            <AlertDisplay
              compact
              alerts={[previewAlert]}
              offline={false}
              hydrated
              location={s.location}
              readings={s.readings}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { LevelBadge, SOURCE_LABEL } from "@/components/alert-visuals";
import { TEMPLATES } from "@/lib/alerts";
import { useStation, type HistoryRecord } from "@/lib/station-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de ocorrências — Alerta Civil Inteligente" },
      { name: "description", content: "Todos os alertas emitidos pela estação, com nível, horário, duração e dados registrados." },
      { property: "og:title", content: "Histórico de ocorrências — Alerta Civil Inteligente" },
      { property: "og:description", content: "Registro dos alertas emitidos pela estação meteorológica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Historico,
});

function fmt(ts: number) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(ts);
}

function duration(h: HistoryRecord, now: number) {
  const ms = (h.endedAt ?? now) - h.startedAt;
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min} min ${sec} s` : `${sec} s`;
}

function readingsSummary(h: HistoryRecord) {
  const r = h.readings;
  if (!r) return "—";
  return `${r.temperatura} °C · chuva ${r.chuva} mm/h · vento ${r.ventoVelocidade} km/h · água ${r.nivelAgua} cm`;
}

function Historico() {
  const s = useStation();

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
      <div>
        <h1 className="text-3xl font-black">Histórico de ocorrências</h1>
        <p className="text-muted-foreground">Registros salvos neste navegador.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {!s.hydrated ? (
          <p className="p-6 text-muted-foreground">Carregando…</p>
        ) : s.history.length === 0 ? (
          <p className="p-6 text-muted-foreground">Nenhum alerta registrado ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ocorrência</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Dados registrados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <p className="font-semibold">{TEMPLATES[h.type].titulo}</p>
                    <p className="max-w-xs text-xs text-muted-foreground">{h.justificativa}</p>
                  </TableCell>
                  <TableCell><LevelBadge level={h.level} /></TableCell>
                  <TableCell>{SOURCE_LABEL[h.source]}</TableCell>
                  <TableCell className="whitespace-nowrap">{fmt(h.startedAt)}</TableCell>
                  <TableCell className="whitespace-nowrap">{duration(h, s.now)}</TableCell>
                  <TableCell>
                    {h.endedAt === null ? (
                      <span className="font-bold text-primary">Ativo</span>
                    ) : (
                      <span className="text-muted-foreground">Encerrado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{readingsSummary(h)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

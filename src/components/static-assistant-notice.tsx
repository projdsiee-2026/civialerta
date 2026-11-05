import { Link } from "@tanstack/react-router";

export function StaticAssistantNotice({ voice = false }: { voice?: boolean }) {
  return (
    <section className="mx-auto max-w-2xl space-y-5 px-4 py-12">
      <h1 className="text-3xl font-black">{voice ? "Assistente por voz" : "Assistente IA"}</h1>
      <p className="rounded-2xl border border-border bg-card p-6 text-lg">
        A assistente ainda não está disponível nesta versão. Você pode consultar os sensores, o mapa
        do Brasil e o histórico pelo menu.
      </p>
      <Link
        to="/"
        className="inline-flex rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground"
      >
        Voltar ao painel
      </Link>
      <p className="text-sm text-muted-foreground">
        Emergência: Defesa Civil 199 · Bombeiros 193 · SAMU 192
      </p>
    </section>
  );
}

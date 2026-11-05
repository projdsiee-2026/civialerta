import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createThread, getThreads } from "@/lib/chat-threads";

export const Route = createFileRoute("/assistente/")({
  head: () => ({
    meta: [
      { title: "Assistente IA — Alerta Civil Inteligente" },
      { name: "description", content: "Tire dúvidas sobre alertas, chuva, enchente e segurança com a assistente de IA." },
      { property: "og:title", content: "Assistente IA — Alerta Civil Inteligente" },
      { property: "og:description", content: "Assistente de IA para dúvidas sobre alertas e segurança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistenteIndex,
});

/** Opens the most recent conversation, or creates the first one. */
function AssistenteIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    const threads = getThreads();
    const target = threads[0] ?? createThread();
    navigate({ to: "/assistente/$threadId", params: { threadId: target.id }, replace: true });
  }, [navigate]);
  return <p className="p-8 text-center text-muted-foreground">Abrindo a assistente…</p>;
}

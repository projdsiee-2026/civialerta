import { getLang, LANG_INSTRUCTION } from "@/lib/i18n";
import { useEffect, useMemo, useRef } from "react";
import { createFileRoute, useHydrated } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ToolUIPart, type UIMessage } from "ai";
import { Droplets, Thermometer, Wind } from "lucide-react";
import { Tool, ToolContent, ToolHeader } from "@/components/ai-elements/tool";
import { TEMP_BG, tempBand } from "@/lib/weather-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import agente from "@/assets/agente-alerta.png";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { ensureThread, saveMessages } from "@/lib/chat-threads";
import { LEVEL_INFO, TEMPLATES } from "@/lib/alerts";
import { selectStatus, useStation, type StationState } from "@/lib/station-store";

export const Route = createFileRoute("/assistente/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversa — Assistente IA · Alerta Civil Inteligente" },
      { name: "description", content: "Converse com a assistente de IA sobre alertas e segurança." },
      { property: "og:title", content: "Assistente IA — Alerta Civil Inteligente" },
      { property: "og:description", content: "Tire dúvidas sobre alertas, chuva e enchentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const hydrated = useHydrated();
  if (!hydrated) return <p className="p-8 text-center text-muted-foreground">Carregando conversa…</p>;
  return <ChatWindow key={threadId} threadId={threadId} />;
}

const SUGGESTIONS = [
  "O que fazer em caso de enchente?",
  "Qual é a temperatura em Manaus agora?",
  "O que significa cada nível de alerta?",
  "Como me proteger de ventos fortes?",
];

function stationContext(s: StationState): string {
  const status = selectStatus(s);
  if (status.offline) return "A estação está SEM COMUNICAÇÃO. Os dados estão indisponíveis.";
  const r = s.readings;
  const alerts = status.active.length
    ? status.active.map((a) => `- ${TEMPLATES[a.type].titulo}: nível ${a.level} (${LEVEL_INFO[a.level].nome})`).join("\n")
    : "- Nenhum alerta ativo (nível 1, informativo).";
  const leituras = r
    ? `Temperatura ${r.temperatura} °C, umidade ${r.umidade}%, pressão ${r.pressao} hPa, UV ${r.uv}, qualidade do ar ${r.qualidadeAr} ppm, vento ${r.ventoVelocidade} km/h, chuva ${r.chuva} mm/h, nível da água ${r.nivelAgua} cm.`
    : "Sem leituras ainda.";
  return `Local: ${s.location}\nAlertas ativos:\n${alerts}\nÚltimas leituras: ${leituras}`;
}

interface WeatherOutput {
  erro?: string;
  cidade?: string;
  estado?: string;
  temperatura?: number;
  sensacao?: number;
  umidade?: number;
  vento_kmh?: number;
  condicao?: string;
}

function WeatherToolPart({ part }: { part: ToolUIPart }) {
  const input = part.input as { cidade?: string } | undefined;
  const out = part.state === "output-available" ? (part.output as WeatherOutput) : null;
  return (
    <Tool defaultOpen={false} className="mb-0 w-full max-w-md border-border bg-navy-deep">
      <ToolHeader
        type={part.type}
        state={part.state}
        title={`Tempo agora${input?.cidade ? ` em ${input.cidade}` : ""}`}
      />
      <ToolContent>
        <div className="p-4">
          {part.state === "output-error" && <p className="text-sm text-destructive">{part.errorText}</p>}
          {out?.erro && <p className="text-sm text-muted-foreground">{out.erro}</p>}
          {out && !out.erro && typeof out.temperatura === "number" && (
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "rounded-xl px-3 py-1.5 font-display text-3xl font-black text-temp-foreground",
                  TEMP_BG[tempBand(out.temperatura)],
                )}
              >
                {Math.round(out.temperatura)}°
              </span>
              <div className="text-sm">
                <p className="font-bold">
                  {out.cidade}
                  {out.estado ? ` · ${out.estado}` : ""}
                </p>
                <p className="text-muted-foreground">{out.condicao}</p>
                <p className="mt-1 flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1"><Thermometer className="size-3.5" /> {Math.round(out.sensacao ?? 0)}°</span>
                  <span className="flex items-center gap-1"><Droplets className="size-3.5" /> {out.umidade}%</span>
                  <span className="flex items-center gap-1"><Wind className="size-3.5" /> {Math.round(out.vento_kmh ?? 0)} km/h</span>
                </p>
              </div>
            </div>
          )}
          {!out && part.state !== "output-error" && <p className="text-sm text-muted-foreground">Consultando…</p>}
        </div>
      </ToolContent>
    </Tool>
  );
}

function ChatWindow({ threadId }: { threadId: string }) {
  const station = useStation();
  const stationRef = useRef(station);
  stationRef.current = station;

  const initial = useMemo<UIMessage[]>(() => ensureThread(threadId).messages, [threadId]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: "/api/chat",
        body: () => ({ threadId, context: `${stationContext(stationRef.current)}\n${LANG_INSTRUCTION[getLang()]}` }),
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (err) => {
      const msg = err.message || "";
      if (/402|crédit/i.test(msg)) toast.error("Os créditos de IA acabaram.");
      else if (/429|Muitas/i.test(msg)) toast.error("Muitas perguntas ao mesmo tempo. Aguarde e tente de novo.");
      else toast.error(msg.length < 160 && msg ? msg : "Não foi possível falar com a assistente. Verifique sua conexão.");
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "streaming") return;
    saveMessages(threadId, messages);
  }, [messages, status, threadId]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
  }

  const lastIsUser = messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src={agente} alt="" width={40} height={40} className="size-10" />
        <div>
          <p className="font-display font-bold">Gota · Assistente do Alerta Civil</p>
          <p className="text-xs text-muted-foreground">Responde dúvidas sobre tempo, alertas e segurança</p>
        </div>
      </div>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <img src={agente} alt="Gota, a assistente" width={112} height={112} className="size-28" />
              <div>
                <h1 className="text-2xl font-black">Olá! Eu sou a Gota.</h1>
                <p className="text-muted-foreground">Pergunte o que fazer em caso de chuva, enchente, vento ou calor.</p>
              </div>
              <div className="grid w-full gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-xl border border-border bg-navy-deep px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <Message key={m.id} from={m.role}>
              <MessageContent>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return m.role === "assistant" ? (
                      <MessageResponse key={i}>{part.text}</MessageResponse>
                    ) : (
                      <p key={i} className="whitespace-pre-wrap">{part.text}</p>
                    );
                  }
                  if (part.type === "tool-consultar_tempo") {
                    return <WeatherToolPart key={i} part={part as ToolUIPart} />;
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {busy && lastIsUser && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Pensando…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl p-3">
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea ref={textareaRef} placeholder="Escreva sua pergunta…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          A assistente pode errar. Em emergência ligue 199 (Defesa Civil) ou 193 (Bombeiros).
        </p>
      </div>
    </div>
  );
}

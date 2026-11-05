import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mic, MicOff, PhoneOff, Volume2 } from "lucide-react";
import { useLiveVoice, type LiveEvent } from "@/hooks/use-live-voice";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/voz")({
  head: () => ({
    meta: [
      { title: "Falar por voz com a Gota — Alerta Civil Inteligente" },
      {
        name: "description",
        content: "Assistente de voz acessível para pessoas cegas: pergunte sobre o tempo e segurança falando.",
      },
      { property: "og:title", content: "Falar por voz com a Gota — Alerta Civil Inteligente" },
      { property: "og:description", content: "Pergunte à assistente de IA usando só a voz." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VozPage,
});

type Line = { role: "user" | "assistant"; text: string; start: number };

const STATUS_TEXT: Record<string, string> = {
  idle: "Pronta. Aperte o botão grande ou a tecla espaço para começar a falar.",
  connecting: "Conectando. Permita o uso do microfone.",
  connected: "Conversa ligada. Pode falar.",
  stopping: "Encerrando a conversa.",
  closed: "Conversa encerrada. Aperte o botão ou a tecla espaço para falar de novo.",
};

function VozPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [lastAnswer, setLastAnswer] = useState("");

  const onEvent = useCallback((event: LiveEvent) => {
    const isIn = event.type === "session.input_transcript.delta";
    const isOut = event.type === "session.output_transcript.delta";
    if (!isIn && !isOut) return;
    const role = isIn ? "user" : "assistant";
    const delta = typeof event["delta"] === "string" ? event["delta"] : "";
    const start = typeof event["start_ms"] === "number" ? event["start_ms"] : 0;
    setLines((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role) {
        return [...prev.slice(0, -1), { ...last, text: last.text + delta }];
      }
      return [...prev, { role, text: delta, start }];
    });
  }, []);

  const voice = useLiveVoice({ onEvent });
  const canStart = voice.status === "idle" || voice.status === "closed";
  const active = voice.status === "connecting" || voice.status === "connected";

  // Keep the latest assistant answer for the screen-reader live region (announced once complete-ish).
  useEffect(() => {
    const last = [...lines].reverse().find((l) => l.role === "assistant");
    if (!last) return;
    const t = setTimeout(() => setLastAnswer(last.text), 1500);
    return () => clearTimeout(t);
  }, [lines]);

  const toggle = useCallback(() => {
    if (canStart) {
      setLines([]);
      voice.start();
    } else if (voice.status !== "stopping") voice.stop();
  }, [canStart, voice]);

  // Space bar starts/stops anywhere on this page (blind users may not find the button).
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.code !== "Space" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      e.preventDefault();
      toggleRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-black md:text-4xl">Falar com a Gota por voz</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Feito para quem não enxerga ou prefere falar. Pergunte sobre o tempo de qualquer cidade do Brasil ou o
          que fazer em chuva forte, enchente e vento.
        </p>
      </div>

      <p role="status" aria-live="polite" className="text-center text-xl font-bold text-primary">
        {STATUS_TEXT[voice.status]}
      </p>
      {voice.error && (
        <p role="alert" className="rounded-xl border border-level-4 bg-card p-4 text-center text-lg font-semibold">
          Não foi possível usar a voz: {voice.error}
        </p>
      )}

      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={voice.status === "stopping"}
          autoFocus
          aria-label={canStart ? "Começar a conversa por voz" : "Encerrar a conversa por voz"}
          className={cn(
            "flex size-56 flex-col items-center justify-center gap-3 rounded-full font-display text-2xl font-black shadow-2xl transition-transform focus-visible:outline-none focus-visible:ring-8 focus-visible:ring-ring active:scale-95 md:size-64",
            canStart ? "bg-primary text-primary-foreground" : "bg-level-4 text-level-4-foreground",
            voice.status === "connected" && "animate-pulse",
          )}
        >
          {canStart ? <Mic className="size-20" aria-hidden /> : <PhoneOff className="size-20" aria-hidden />}
          {canStart ? "Falar" : "Encerrar"}
        </button>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="navy"
            size="lg"
            disabled={voice.status !== "connected"}
            onClick={() => voice.setMuted(!voice.muted)}
            aria-pressed={voice.muted}
          >
            {voice.muted ? <MicOff /> : <Mic />} {voice.muted ? "Ligar microfone" : "Silenciar microfone"}
          </Button>
          {voice.playbackBlocked && (
            <Button variant="hero" size="lg" onClick={voice.resumePlayback}>
              <Volume2 /> Ouvir a resposta
            </Button>
          )}
        </div>
        <audio ref={voice.audioRef} controls className={cn("w-full max-w-sm", !active && "opacity-60")} aria-label="Áudio da assistente" />
      </div>

      {/* Screen readers: announce the latest answer text; the audio already speaks it. */}
      <p className="sr-only" aria-live="polite">
        {lastAnswer}
      </p>

      <section aria-label="Conversa escrita" className="space-y-2">
        <h2 className="text-xl font-bold">O que foi dito</h2>
        {lines.length === 0 ? (
          <p className="text-muted-foreground">A conversa aparecerá aqui por escrito, para quem também quiser ler.</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l, i) => (
              <li
                key={`${l.start}-${i}`}
                className={cn("rounded-xl p-3 text-lg", l.role === "user" ? "bg-navy" : "border border-border bg-card")}
              >
                <span className="font-bold text-primary">{l.role === "user" ? "Você: " : "Gota: "}</span>
                {l.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-sm text-muted-foreground">
        Os dados do tempo vêm do Open-Meteo e não são alertas oficiais. Emergência: Defesa Civil 199 · Bombeiros 193 ·
        SAMU 192.
      </p>
    </div>
  );
}

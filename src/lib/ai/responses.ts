import { createOpenAI } from "@ai-sdk/openai";
import { isStepCount, streamText, type ModelMessage, type ToolSet, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id.ts";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  instructions: string | undefined,
  originalMessages: UIMessage[],
  tools?: ToolSet,
) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const reasoning = config.model !== "openai/chat-latest";
  const result = streamText({
    model: provider.responses(config.model),
    ...(instructions ? { instructions } : {}),
    messages,
    ...(tools ? { tools, stopWhen: isStepCount(8) } : {}),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        ...(reasoning
          ? {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              include: ["reasoning.encrypted_content"],
            }
          : {}),
      },
    },
  });
  return {
    result,
    response: () =>
      withLovableAiGatewayRunIdHeader(
        result.toUIMessageStreamResponse({
          originalMessages,
          sendReasoning: true,
          onError: (error) => {
            console.error("assistant stream error", error);
            const msg = error instanceof Error ? error.message : String(error);
            if (/402|credit/i.test(msg)) return "Os créditos de IA acabaram. Tente novamente mais tarde.";
            if (/429|rate/i.test(msg)) return "Muitas perguntas ao mesmo tempo. Aguarde alguns segundos e tente de novo.";
            return "A assistente não conseguiu responder agora. Tente novamente.";
          },
        }),
        runIdFetch,
      ),
  };
}

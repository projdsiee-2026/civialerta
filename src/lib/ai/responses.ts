import { createOpenAI } from "@ai-sdk/openai";
import { isStepCount, streamText, type ModelMessage, type ToolSet, type UIMessage } from "ai";

export function createResponsesCall(
  request: Request,
  config: { baseURL: string; apiKey: string; model: string },
  messages: ModelMessage[],
  instructions: string | undefined,
  originalMessages: UIMessage[],
  tools?: ToolSet,
) {
  // The SDK sends Authorization: Bearer only to the official OpenAI API.
  const provider = createOpenAI({ baseURL: config.baseURL, apiKey: config.apiKey });
  const result = streamText({
    model: provider.responses(config.model),
    ...(instructions ? { instructions } : {}),
    messages,
    ...(tools ? { tools, stopWhen: isStepCount(8) } : {}),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        store: false,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return {
    result,
    response: () =>
      result.toUIMessageStreamResponse({
        originalMessages,
        sendReasoning: true,
        onError: (error) => {
          const status =
            typeof error === "object" && error !== null && "statusCode" in error
              ? error.statusCode
              : undefined;
          if (status === 401 || status === 403)
            return "A chave da OpenAI precisa ser verificada pelo responsável pelo site.";
          if (status === 429)
            return "A IA atingiu o limite de uso ou de créditos. Tente novamente mais tarde.";
          return "A assistente não conseguiu responder agora. Tente novamente.";
        },
      }),
  };
}

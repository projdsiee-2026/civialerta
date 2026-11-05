import process from "node:process";

export const OPENAI_BASE_URL = "https://api.openai.com/v1";

export function getOpenAIConfig(env: Record<string, string | undefined> = process.env) {
  // INSIRA A CHAVE NO .env DA RAIZ OU NOS SEGREDOS DA HOSPEDAGEM:
  // OPENAI_API_KEY=sua_chave_real
  // Nunca cole o valor neste arquivo, no GitHub ou em variáveis VITE_*.
  const apiKey = env["OPENAI_API_KEY"]?.trim();
  if (!apiKey)
    throw new Error("Configure OPENAI_API_KEY nos segredos do servidor para habilitar a Gota.");
  return {
    apiKey,
    baseURL: OPENAI_BASE_URL,
    chatModel: env["OPENAI_CHAT_MODEL"]?.trim() || "gpt-6-astra",
    liveModel: env["OPENAI_LIVE_MODEL"]?.trim() || "gpt-live-1",
    voice: env["OPENAI_VOICE"]?.trim() || "marin",
  };
}

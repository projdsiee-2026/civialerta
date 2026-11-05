import { convertToModelMessages, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createResponsesCall } from "./responses.ts";
import { fetchCurrentWeather, geocodeBrazil } from "../weather.server";
import { describeWeather } from "../weather-data";

const weatherTools = {
  consultar_tempo: tool({
    description:
      "Consulta o tempo AGORA e a previsão dos próximos 7 dias (temperatura, chuva, vento) em qualquer cidade do Brasil (dados Open-Meteo, não oficiais). Use sempre que perguntarem sobre a temperatura ou o tempo de uma cidade diferente de Paranaguá, ou para comparar cidades.",
    inputSchema: z
      .object({
        cidade: z.string().describe("Nome da cidade brasileira, ex.: Curitiba"),
        estado: z.string().nullable().describe("Estado ou sigla (ex.: Paraná ou PR), ou null se não informado"),
      })
      .strict(),
    execute: async ({ cidade, estado }) => {
      try {
        const city = await geocodeBrazil(cidade, estado);
        if (!city) return { erro: `Não encontrei a cidade "${cidade}" no Brasil.` };
        const [w] = await fetchCurrentWeather([city]);
        if (!w) return { erro: "Sem dados de tempo para essa cidade agora." };
        return {
          cidade: w.nome,
          estado: w.uf,
          temperatura: w.temperatura,
          sensacao: w.sensacao,
          umidade: w.umidade,
          vento_kmh: w.vento,
          condicao: w.condicao,
          horario_local: w.horario,
          chuva_agora_mm: w.chuva,
          previsao_7_dias: w.previsao.map((d) => ({
            data: d.data,
            max: d.max,
            min: d.min,
            chuva_mm: d.chuva,
            chance_chuva: d.probChuva,
            vento_max_kmh: d.ventoMax,
            condicao: describeWeather(d.codigo),
          })),
          fonte: "Open-Meteo (modelo meteorológico, não é alerta oficial)",
        };
      } catch (e) {
        return { erro: e instanceof Error ? e.message : "Serviço de clima indisponível." };
      }
    },
  }),
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const BodySchema = z.object({
  threadId: z.string().min(1).max(100),
  context: z.string().max(4000).optional(),
  messages: z.array(z.any()).min(1).max(200),
});

const INSTRUCTIONS = `Você é a "Gota", assistente virtual do ALERTA CIVIL INTELIGENTE — uma estação meteorológica escolar (Instituto Estadual de Educação Dr. Caetano Munhoz da Rocha, Paranaguá – PR) que monitora temperatura, umidade, pressão, UV, qualidade do ar, vento, chuva e nível de água para emitir alertas preventivos à comunidade.

Como responder:
- Português do Brasil, frases curtas, linguagem simples, sem termos técnicos difíceis.
- Vá direto ao ponto: o que está acontecendo e o que a pessoa deve fazer. Use listas curtas quando ajudar.
- Os níveis de alerta são: 1 Informativo (azul), 2 Atenção (amarelo), 3 Alerta (laranja), 4 Emergência (vermelho).
- Use o "Estado atual da estação" abaixo quando a pergunta for sobre a situação agora. Deixe claro que são dados da estação local (no momento, simulados para testes), não previsões oficiais.
- Nunca invente previsões, limites oficiais ou alertas oficiais. Para informações oficiais, indique a Defesa Civil (199) e o INMET.
- Em risco de vida, oriente a ligar imediatamente: Defesa Civil 199, Bombeiros 193, SAMU 192, Polícia 190.
- Para temperatura ou tempo de outras cidades do Brasil, use a ferramenta consultar_tempo (uma chamada por cidade). Diga que são dados do Open-Meteo, não alertas oficiais. Nunca invente temperaturas.
- Se a pergunta não tiver relação com tempo, clima, segurança ou o sistema, responda brevemente e com educação, e traga a conversa de volta ao tema.`;

export async function handleChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return Response.json({ error: "A assistente não está configurada." }, { status: 500 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const messages = body.messages as UIMessage[];
  const instructions = body.context
    ? `${INSTRUCTIONS}\n\nEstado atual da estação:\n${body.context}`
    : INSTRUCTIONS;

  const modelMessages = await convertToModelMessages(messages);
  return createResponsesCall(
    request,
    { baseURL: GATEWAY_URL, apiKey, model: MODEL },
    modelMessages,
    instructions,
    messages,
    weatherTools,
  ).response();
}

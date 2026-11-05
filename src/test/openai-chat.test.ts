import { afterEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  create: vi.fn(),
  stream: vi.fn(),
  model: vi.fn(),
  response: vi.fn(),
}));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: mock.create }));
vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  streamText: mock.stream,
}));
import { createResponsesCall } from "../lib/ai/responses";
import { handleChat } from "../lib/ai/chat.server";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("OpenAI chat migration", () => {
  it("streams through the official provider without gateway headers", () => {
    mock.create.mockReturnValue({ responses: mock.model });
    mock.model.mockReturnValue("openai-test-model");
    mock.stream.mockReturnValue({ toUIMessageStreamResponse: mock.response });
    mock.response.mockReturnValue(new Response("stream"));
    const messages = [{ role: "user" as const, content: "Olá" }];
    const request = new Request("https://example.test/api/chat");
    const call = createResponsesCall(
      request,
      { baseURL: "https://api.openai.com/v1", apiKey: "test-server-secret", model: "gpt-6-astra" },
      messages,
      "Ajude com o tempo.",
      [],
    );
    call.response();
    expect(mock.create).toHaveBeenCalledWith({
      baseURL: "https://api.openai.com/v1",
      apiKey: "test-server-secret",
    });
    expect(mock.model).toHaveBeenCalledWith("gpt-6-astra");
    expect(mock.stream.mock.calls[0]![0]).toMatchObject({
      model: "openai-test-model",
      messages,
      instructions: "Ajude com o tempo.",
      abortSignal: request.signal,
    });
    const options = mock.response.mock.calls[0]![0];
    expect(options.originalMessages).toEqual([]);
    expect(options.onError({ statusCode: 401, message: "test-server-secret" })).not.toContain(
      "test-server-secret",
    );
  });

  it("reports missing configuration without making a model request", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await handleChat(
      new Request("https://example.test/api/chat", { method: "POST", body: "{}" }),
    );
    expect(response.status).toBe(503);
    expect(mock.create).not.toHaveBeenCalled();
  });
});

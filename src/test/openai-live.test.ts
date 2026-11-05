import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOpenAIConfig } from "../lib/ai/config.server";
import {
  bindLiveConnection,
  createOpenAILiveSession,
  type LiveSocket,
} from "../lib/live-relay.server";

const configuration = {
  baseURL: "https://api.openai.com/v1",
  key: "test-server-only-secret",
  liveModel: "gpt-live-1",
  backendModel: "gpt-6-astra",
};

function socket() {
  let message: (data: unknown) => void = () => {};
  const sent: string[] = [];
  const api: LiveSocket = {
    readyState: 1,
    send: (data) => {
      sent.push(data);
    },
    close: vi.fn(),
    onMessage: (handler) => {
      message = handler;
    },
    onClose: vi.fn(),
    onError: vi.fn(),
  };
  return { api, sent, receive: (event: object) => message(JSON.stringify(event)) };
}

describe("Direct OpenAI server integration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("requires an OpenAI key and never reuses a Lovable key", () => {
    expect(() => getOpenAIConfig({ LOVABLE_API_KEY: "old-key" })).toThrow("OPENAI_API_KEY");
    expect(getOpenAIConfig({ OPENAI_API_KEY: "test-key" })).toMatchObject({
      baseURL: "https://api.openai.com/v1",
      apiKey: "test-key",
      chatModel: "gpt-6-astra",
      liveModel: "gpt-live-1",
    });
  });

  it("creates WebRTC with a server Bearer token and attaches without restarting the session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        Response.json({
          session: { id: "live_123" },
          transport: { type: "webrtc", sdp: "answer-sdp" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const browser = socket();
    const provider = socket();
    const connect = vi.fn().mockResolvedValue(provider.api);
    const tasks: Promise<unknown>[] = [];
    bindLiveConnection(
      browser.api,
      configuration,
      {
        waitUntil: (task) => {
          tasks.push(task);
        },
      },
      connect,
    );
    browser.receive({ type: "app.start", sdp: "offer-sdp" });
    await Promise.all(tasks);
    const [url, request] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.openai.com/v1/live/sessions");
    expect(request.headers).toEqual({
      Authorization: "Bearer test-server-only-secret",
      "Content-Type": "application/json",
    });
    expect(JSON.parse(request.body)).toMatchObject({
      session: {
        model: "gpt-live-1",
        delegation: { type: "client" },
        client: { data_channel: { allowed_client_events: [] } },
      },
      transport: { type: "webrtc", sdp: "offer-sdp" },
    });
    expect(connect).toHaveBeenCalledWith(
      "https://api.openai.com/v1/live/sessions/live_123/attach",
      { Authorization: "Bearer test-server-only-secret" },
      expect.any(AbortSignal),
    );
    expect(provider.sent).toHaveLength(0);
    expect(browser.sent.map((event) => JSON.parse(event))).toContainEqual({
      type: "gateway.session.created",
      session: { id: "live_123" },
      transport: { type: "webrtc", sdp: "answer-sdp" },
    });
    browser.receive({ type: "gateway.heartbeat" });
    expect(provider.sent).toHaveLength(0);
    expect(browser.sent.join(" ")).not.toContain(configuration.key);
    expect(JSON.parse(browser.sent.at(-1)!)).toEqual({ type: "gateway.heartbeat.ack" });
    browser.receive({ type: "session.close" });
    expect(JSON.parse(provider.sent.at(-1)!)).toEqual({ type: "session.close" });
    provider.receive({ type: "session.closed" });
    expect(browser.api.close).toHaveBeenCalled();
  });

  it("does not expose provider error bodies containing credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { message: "Incorrect API key: test-server-only-secret" } },
            { status: 401 },
          ),
        ),
    );
    await expect(
      createOpenAILiveSession(configuration, "offer", new AbortController().signal),
    ).rejects.toThrow("verificar a chave");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ session: { id: "live_123" }, transport: { type: "webrtc" } }),
        ),
    );
    await expect(
      createOpenAILiveSession(configuration, "offer", new AbortController().signal),
    ).rejects.toThrow("sessão de voz válida");
  });
});

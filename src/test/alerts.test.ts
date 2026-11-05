import { describe, expect, it } from "vitest";
import {
  DEFAULT_THRESHOLDS,
  MIN_SCREEN_MS,
  TEMPLATES,
  buildScreens,
  confirmLevel,
  isStale,
  levelFor,
  screenDuration,
} from "@/lib/alerts";

describe("tempo mínimo de leitura", () => {
  it("toda tela fica pelo menos 4 segundos", () => {
    expect(MIN_SCREEN_MS).toBe(4000);
    expect(screenDuration("Fuja")).toBe(4000);
  });

  it("texto maior ganha mais tempo", () => {
    const longo = "palavra ".repeat(30);
    expect(screenDuration(longo)).toBeGreaterThan(4000);
  });

  it("cada orientação vira uma tela separada com no mínimo 4 s", () => {
    const screens = buildScreens(TEMPLATES.granizo);
    expect(screens).toHaveLength(1 + TEMPLATES.granizo.orientacoes.length);
    screens.forEach((s) => expect(s.duracao).toBeGreaterThanOrEqual(4000));
  });
});

describe("classificação por limites", () => {
  it("usa os quatro níveis conforme os limites configurados", () => {
    const t = DEFAULT_THRESHOLDS.chuva;
    expect(levelFor(t.atencao - 0.1, t)).toBe(1);
    expect(levelFor(t.atencao, t)).toBe(2);
    expect(levelFor(t.alerta, t)).toBe(3);
    expect(levelFor(t.emergencia, t)).toBe(4);
  });
});

describe("confirmação contra alarmes falsos", () => {
  it("leitura isolada não dispara alerta", () => {
    expect(confirmLevel(1, [1, 1, 4], 3)).toBe(1);
  });

  it("leituras seguidas confirmam o alerta", () => {
    expect(confirmLevel(1, [3, 3, 3], 3)).toBe(3);
  });

  it("alerta só baixa depois de leituras seguidas mais baixas", () => {
    expect(confirmLevel(3, [3, 1, 1], 3)).toBe(3);
    expect(confirmLevel(3, [1, 1, 1], 3)).toBe(1);
  });
});

describe("falha de comunicação", () => {
  it("sem leitura recente os dados são indisponíveis", () => {
    expect(isStale(null, 1000)).toBe(true);
    expect(isStale(0, 16_000)).toBe(true);
    expect(isStale(10_000, 12_000)).toBe(false);
  });
});

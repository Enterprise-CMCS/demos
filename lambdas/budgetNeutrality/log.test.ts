import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  pinoMock: vi.fn((..._args: unknown[]) => ({})),
}));

vi.mock("pino", () => ({
  default: mocks.pinoMock,
}));

const prevEnv = { ...process.env };

describe("budgetNeutrality log", () => {
  beforeEach(() => {
    process.env = { ...prevEnv };
    mocks.pinoMock.mockClear();
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...prevEnv };
  });

  it("configures pino with pretty transport when RUN_LOCAL=true", async () => {
    process.env.RUN_LOCAL = "true";
    process.env.LOG_LEVEL = "debug";

    await import("./log");

    expect(mocks.pinoMock).toHaveBeenCalledTimes(1);
    const config = mocks.pinoMock.mock.calls[0]?.[0] as {
      level: string;
      transport?: { target: string };
    };
    expect(config.level).toBe("debug");
    expect(config.transport?.target).toBe("pino-pretty");
  });

  it("injects reqId into string log calls via hook", async () => {
    const mod = await import("./log");
    const config = mocks.pinoMock.mock.calls[0]?.[0] as {
      hooks: {
        logMethod: (inputArgs: unknown[], method: (...args: unknown[]) => void) => void;
      };
    };
    const method = vi.fn();

    mod.als.run(new Map<string, string>(), () => {
      mod.reqIdChild("req-123");
      config.hooks.logMethod(["hello"], method);
    });

    expect(method).toHaveBeenCalledWith({ reqId: "req-123" }, "hello");
  });

  it("injects reqId into object log calls via hook", async () => {
    const mod = await import("./log");
    const config = mocks.pinoMock.mock.calls[0]?.[0] as {
      hooks: {
        logMethod: (inputArgs: unknown[], method: (...args: unknown[]) => void) => void;
      };
    };
    const method = vi.fn();

    mod.als.run(new Map<string, string>(), () => {
      mod.reqIdChild("req-456");
      config.hooks.logMethod([{ foo: "bar" }, "msg"], method);
    });

    expect(method).toHaveBeenCalledWith({ foo: "bar", reqId: "req-456" }, "msg");
  });

  it("does not set reqId when empty", async () => {
    const mod = await import("./log");
    const contextStore = new Map<string, string>();

    mod.als.run(contextStore, () => {
      mod.reqIdChild("");
    });

    expect(contextStore.get("reqId")).toBeUndefined();
  });
});

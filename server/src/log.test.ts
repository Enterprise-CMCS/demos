import { describe, it, expect, beforeEach, vi } from "vitest";

import * as log from './log'
import { Writable } from "node:stream";

describe("logger", () => {
  it("should create a logger with correct service name", () => {
    const logger = log.setupLogger("test-service");
    expect(logger).toBeDefined();
    expect(logger.bindings()).toMatchObject({"svc": "test-service"})
  });

  it("should use LOG_LEVEL env variable if set", () => {
    const originalLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = "debug";
    const logger = log.setupLogger("test");
    expect(logger.level).toBe("debug");
    process.env.LOG_LEVEL = originalLevel;
  });

  it("should default to info level", () => {
    delete process.env.LOG_LEVEL;
    const logger = log.setupLogger("test");
    expect(logger.level).toBe("info");
  });

  it("should use pretty printing on a TTY terminal", () => {
    const origTTY = process.stdout.isTTY
    process.stdout.isTTY = true
    const logs: string[] = []
    const s = new Writable({
      write(chunk, _enc, cb) {
        logs.push(chunk.toString())
        cb()
      }
    })
    const logger = log.setupLogger("test", s)
    logger.info("test-log")
    // pino-pretty overrides the destination settings, so no logs exist in the
    // stream
    expect(logs).toHaveLength(0)

    process.stdout.isTTY = origTTY

    const logger2 = log.setupLogger("test", s)
    logger2.info("test-log")
    expect(logs).toHaveLength(1)
  })

  it("should move `type` field to the top level of a log", () => {
    const logs: string[] = []
    const s = new Writable({
      write(chunk, _enc, cb) {
        logs.push(chunk.toString())
        cb()
      }
    })
    
    const ll = log.setupLogger("test", s)  
    ll.info({type: "TEST_LOG", some: "test-value"}, "hi")
    ll.info({type: "TEST_LOG"}, "hi")
    expect(logs).toHaveLength(2)
    const outLog = JSON.parse(logs[0])
    expect(outLog).toHaveProperty("type", "TEST_LOG")
    expect(outLog).toHaveProperty("ctx", {some:"test-value"})
  })
});

describe("reqIdChild", () => {
  it("should create child logger with request id", () => {
    const child = log.reqIdChild("test-id");
    expect(child).toBeDefined();
    expect(child.info).toBeDefined()
    expect(child.bindings()).toMatchObject({requestId: "test-id"})

  });

  it("should create child logger with extra fields", () => {
    const extra = { userId: "123" };
    const child = log.reqIdChild("test-id", extra);
    expect(child).toBeDefined();
    expect(child.bindings()).toMatchObject({userId: "123"})
  });
});

describe("log proxy", () => {
  it("should use parent logger by default", () => {
    expect(log.log.info).toBeDefined();
  });

  it("should use request-scoped logger when available", () => {
    const testLogger = { info: vi.fn() };
    const store = new Map();
    store.set("logger", testLogger);
    log.als.run(store, () => {
      log.log.info("test");
      expect(testLogger.info).toHaveBeenCalledWith("test")
    });
  });
});

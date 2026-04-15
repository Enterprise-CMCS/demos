import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaPgCtorMock,
  prismaClientCtorMock,
  prismaNamespaceMock,
  baseClientMock,
  extendedClientMock,
  logWarnMock,
  logErrorMock,
} = vi.hoisted(() => {
  const extendedClient = { __extended: true } as {
    __extended: boolean;
    $extends?: ReturnType<typeof vi.fn>;
  };
  const baseClient = {
    $on: vi.fn(),
    $extends: vi.fn(() => extendedClient),
  };
  extendedClient.$extends = vi.fn(() => extendedClient);

  return {
    prismaPgCtorMock: vi.fn(function (this: any) {}),
    prismaClientCtorMock: vi.fn(function (this: any) {
      return baseClient;
    }),
    prismaNamespaceMock: {
      getExtensionContext: vi.fn(),
    },
    baseClientMock: baseClient,
    extendedClientMock: extendedClient,
    logWarnMock: vi.fn(),
    logErrorMock: vi.fn(),
  };
});

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: prismaPgCtorMock,
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: prismaClientCtorMock,
  Prisma: prismaNamespaceMock,
}));

vi.mock("./log", () => ({
  log: {
    warn: logWarnMock,
    error: logErrorMock,
  },
}));

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalDotenvConfigPath = process.env.DOTENV_CONFIG_PATH;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }

  if (originalDotenvConfigPath === undefined) {
    delete process.env.DOTENV_CONFIG_PATH;
  } else {
    process.env.DOTENV_CONFIG_PATH = originalDotenvConfigPath;
  }
});

beforeEach(() => {
  vi.resetModules();
  prismaPgCtorMock.mockReset();
  prismaClientCtorMock.mockClear();
  baseClientMock.$on.mockClear();
  baseClientMock.$extends.mockClear();
  baseClientMock.$extends.mockImplementation(() => extendedClientMock);
  extendedClientMock.$extends?.mockClear();
  extendedClientMock.$extends?.mockImplementation(() => extendedClientMock);
  prismaNamespaceMock.getExtensionContext.mockReset();
  logWarnMock.mockClear();
  logErrorMock.mockClear();
});

function getFindAtMostOneExtensionConfig() {
  const extensionCalls = baseClientMock.$extends.mock.calls as unknown as Array<[any]>;
  const extensionConfig = extensionCalls[0]?.[0];

  if (!extensionConfig?.model?.$allModels?.findAtMostOne) {
    throw new Error("Expected findAtMostOne extension to be registered");
  }

  return extensionConfig;
}

function getQueryExtensionConfig() {
  const extensionCalls = (extendedClientMock.$extends?.mock.calls ?? []) as unknown as Array<[any]>;
  const extensionConfig = extensionCalls[0]?.[0];

  if (!extensionConfig?.query?.$allModels) {
    throw new Error("Expected query extension to be registered");
  }

  return extensionConfig;
}

describe("prismaClient", () => {
  it("findAtMostOne returns null when findMany returns no rows", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getFindAtMostOneExtensionConfig();
    const findAtMostOne = extensionConfig.model.$allModels.findAtMostOne;
    const findMany = vi.fn().mockResolvedValue([]);
    prismaNamespaceMock.getExtensionContext.mockReturnValue({ findMany });

    await expect(findAtMostOne.call({}, { where: { id: "missing" } })).resolves.toBeNull();
    expect(findMany).toHaveBeenCalledWith({ where: { id: "missing" } });
  });

  it("findAtMostOne fails when the model is incapable of calling findMany", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getFindAtMostOneExtensionConfig();
    const findAtMostOne = extensionConfig.model.$allModels.findAtMostOne;
    prismaNamespaceMock.getExtensionContext.mockReturnValue({});

    await expect(findAtMostOne.call({}, { where: { id: "row-1" } })).rejects.toThrow(
      "findAtMostOne can only be used on models that support findMany"
    );
  });

  it("findAtMostOne returns the row when findMany returns one row", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getFindAtMostOneExtensionConfig();
    const findAtMostOne = extensionConfig.model.$allModels.findAtMostOne;
    const row = { id: "row-1" };
    const findMany = vi.fn().mockResolvedValue([row]);
    prismaNamespaceMock.getExtensionContext.mockReturnValue({ findMany });

    await expect(findAtMostOne.call({}, { where: { id: "row-1" } })).resolves.toEqual(row);
    expect(findMany).toHaveBeenCalledWith({ where: { id: "row-1" } });
  });

  it("findAtMostOne throws when findMany returns multiple rows", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getFindAtMostOneExtensionConfig();
    const findAtMostOne = extensionConfig.model.$allModels.findAtMostOne;
    const findMany = vi.fn().mockResolvedValue([{ id: "row-1" }, { id: "row-2" }]);
    prismaNamespaceMock.getExtensionContext.mockReturnValue({ findMany });

    await expect(findAtMostOne.call({}, { where: { id: "duplicate" } })).rejects.toThrow(
      "Expected at most one record, but found 2"
    );
    expect(findMany).toHaveBeenCalledWith({ where: { id: "duplicate" } });
  });

  it("throws when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    process.env.DOTENV_CONFIG_PATH = "/tmp/does-not-exist";

    const mod = await import("./prismaClient.ts");
    expect(() => mod.prisma()).toThrow("DATABASE_URL must be set to initialize Prisma client");
  });

  it("passes parsed schema from DATABASE_URL to PrismaPg", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    expect(prismaPgCtorMock).toHaveBeenCalledWith(
      {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      },
      { schema: "demos_app" }
    );
  });

  it("falls back to undefined schema when DATABASE_URL is not parseable", async () => {
    process.env.DATABASE_URL = "not-a-url";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    expect(prismaPgCtorMock).toHaveBeenCalledWith(
      {
        connectionString: "not-a-url",
        ssl: { rejectUnauthorized: false },
      },
      { schema: undefined }
    );
  });

  it("registers query/warn/error handlers and logs expected events", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const handlers = new Map<string, (event: any) => void>();
    for (const [eventName, handler] of baseClientMock.$on.mock.calls) {
      handlers.set(eventName as string, handler as (event: any) => void);
    }

    handlers.get("query")?.({ duration: 600, target: "db" });
    handlers.get("query")?.({ duration: 100, target: "db" });
    handlers.get("warn")?.({ message: "warn-msg" });
    handlers.get("error")?.({
      message:
        "An operation failed because it depends on one or more records that were required but not found.",
    });
    handlers.get("error")?.({ message: "real error" });

    expect(logWarnMock).toHaveBeenCalledWith(
      { durationMs: 600, target: "db" },
      "prisma.slow_query"
    );
    expect(logWarnMock).toHaveBeenCalledWith({ message: "warn-msg" }, "prisma.warn");
    expect(logErrorMock).toHaveBeenCalledWith({ message: "real error" }, "prisma.error");
  });

  it("returns a singleton prisma client instance", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    const first = mod.prisma();
    const second = mod.prisma();

    expect(first).toBe(second);
    expect(prismaClientCtorMock).toHaveBeenCalledTimes(1);
  });

  it("update extension returns existing record for P2025 and logs warning", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";
    const existing = { id: "123" };
    const findUnique = vi.fn().mockResolvedValue(existing);
    (baseClientMock as any).TestModel = { findUnique };

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const update = extensionConfig.query.$allModels.update;

    const error = { code: "P2025", message: "missing" };
    const query = vi.fn().mockRejectedValue(error);
    const args = { where: { id: "123" } };

    const result = await update({ args, query, model: "TestModel" });

    expect(result).toEqual(existing);
    expect(findUnique).toHaveBeenCalledWith({ where: args.where });
    expect(logWarnMock).toHaveBeenCalledWith(
      { model: "TestModel", where: args.where },
      "prisma.redundant_update_suppressed.update"
    );
  });

  it("update extension rethrows on P2025 when no existing record is found", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";
    const findUnique = vi.fn().mockResolvedValue(null);
    (baseClientMock as any).TestModel = { findUnique };

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const update = extensionConfig.query.$allModels.update;

    const error = { code: "P2025", message: "missing" };
    const query = vi.fn().mockRejectedValue(error);
    const args = { where: { id: "123" } };

    await expect(update({ args, query, model: "TestModel" })).rejects.toEqual(error);
    expect(logErrorMock).toHaveBeenCalledWith({ message: "missing" }, "prisma.error");
  });

  it("upsert extension passes through successful query result", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const upsert = extensionConfig.query.$allModels.upsert;
    const args = { where: { id: "abc" } };
    const expected = { id: "abc", status: "ok" };

    const result = await upsert({
      args,
      query: vi.fn().mockResolvedValue(expected),
      model: "AnyModel",
    });
    expect(result).toEqual(expected);
  });

  it("upsert extension handles P2025 and no-existing path", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";
    const findUnique = vi.fn().mockResolvedValue(null);
    (baseClientMock as any).TestModel = { findUnique };

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const upsert = extensionConfig.query.$allModels.upsert;

    const error = { code: "P2025", message: "upsert-missing" };
    const query = vi.fn().mockRejectedValue(error);
    const args = { where: { id: "123" } };

    await expect(upsert({ args, query, model: "TestModel" })).rejects.toEqual(error);
    expect(logErrorMock).toHaveBeenCalledWith({ message: "upsert-missing" }, "prisma.error");
  });

  it("upsert extension returns existing record for P2025 and logs warning", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";
    const existing = { id: "999" };
    const findUnique = vi.fn().mockResolvedValue(existing);
    (baseClientMock as any).TestModel = { findUnique };

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const upsert = extensionConfig.query.$allModels.upsert;
    const args = { where: { id: "999" } };

    const result = await upsert({
      args,
      query: vi.fn().mockRejectedValue({ code: "P2025", message: "missing" }),
      model: "TestModel",
    });

    expect(result).toEqual(existing);
    expect(logWarnMock).toHaveBeenCalledWith(
      { model: "TestModel", where: args.where },
      "prisma.redundant_update_suppressed.upsert"
    );
  });

  it("rethrows non-object errors from extension queries", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    mod.prisma();

    const extensionConfig = getQueryExtensionConfig();
    const update = extensionConfig.query.$allModels.update;

    await expect(
      update({
        args: { where: { id: "1" } },
        query: vi.fn().mockRejectedValue("boom"),
        model: "AnyModel",
      })
    ).rejects.toEqual("boom");
  });
});

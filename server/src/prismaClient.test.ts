import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaPgCtorMock,
  prismaClientCtorMock,
  baseClientMock,
  extendedClientMock,
  logWarnMock,
  logErrorMock,
} = vi.hoisted(() => {
  const extendedClient = { __extended: true };
  const baseClient = {
    $on: vi.fn(),
    $extends: vi.fn(() => extendedClient),
  };

  return {
    prismaPgCtorMock: vi.fn(),
    prismaClientCtorMock: vi.fn(() => baseClient),
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
  logWarnMock.mockClear();
  logErrorMock.mockClear();
});

describe("prismaClient", () => {
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
      { connectionString: process.env.DATABASE_URL },
      { schema: "demos_app" }
    );
  });

  it("returns a singleton prisma client instance", async () => {
    process.env.DATABASE_URL = "postgresql://db:5432/demos?schema=demos_app";

    const mod = await import("./prismaClient.ts");
    const first = mod.prisma();
    const second = mod.prisma();

    expect(first).toBe(second);
    expect(prismaClientCtorMock).toHaveBeenCalledTimes(1);
  });
});

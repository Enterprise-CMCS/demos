import { testMigration } from "./testMigration";

import { getSecret } from "../lib/getSecret";
import { runMigration } from "./runMigration";

import https from "https";
import { Client } from "pg";

vi.mock("https");
vi.mock("../lib/getSecret");
vi.mock("./runMigration");

const mockConnect = vi.fn();
const mockQuery = vi.fn(() => ({
  command: "test",
}));

vi.mock("pg", () => {
  const mockClient = {
    connect: () => mockConnect(),
    // @ts-expect-error ignore invalid mock
    query: (...a) => mockQuery(...a),
    end: vi.fn(),
  };

  return { Client: vi.fn().mockImplementation(function () {return mockClient}) };
});

const mockDBData = {
  username: "test",
  password: "fake", // pragma: allowlist secret
  host: "host",
  port: 1234,
  dbname: "hostDB",
};

describe("testMigration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error");
    // @ts-expect-error ignore invalid mock
    vi.spyOn(process, "exit").mockImplementation(() => "exit");
  });

  afterEach(() => {
    // @ts-expect-error ignore invalid mock
    (process.exit as vi.Mock).mockRestore();
    (console.error as vi.Mock).mockRestore();
  });

  test("should properly run a test migration with cleanup", async () => {
    const mockStageName = "unit-test";
    const targetDB = "unit_test";

    (https.get as vi.Mock).mockImplementation((url, callback) => {
      callback({
        statusCode: 200,
        on: vi.fn((e, h) => {
          if (e === "data") h("CERTDATA");
          if (e === "end") h();
          return {};
        }),
      });
      return { on: vi.fn() };
    });

    (getSecret as vi.Mock).mockResolvedValue(JSON.stringify(mockDBData));
    (runMigration as vi.Mock).mockResolvedValue(0);

    await testMigration(mockStageName, targetDB);

    expect(runMigration).toHaveBeenCalledWith(mockStageName, targetDB, mockDBData);

    expect(Client).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionString: `postgresql://${mockDBData.username}:${mockDBData.password}@${mockDBData.host}:${mockDBData.port}/demos`,
        ssl: { ca: "CERTDATA", rejectUnauthorized: true },
      })
    );

    expect(mockConnect).toHaveBeenCalled();
    expect(mockQuery).toHaveBeenCalledWith(`DROP DATABASE ${targetDB};`);
  });

  test("should exit if no db name is specified", async () => {
    const mockStageName = "unit-test";

    const exitCode = await testMigration(mockStageName);
    expect(console.error).toHaveBeenCalledWith("you must specify a database name");
    expect(exitCode).toBe(1);
  });

  test("should exit if db is set to 'demos' or 'postgres'", async () => {
    const mockStageName = "unit-test";

    const exitCode = await testMigration(mockStageName, "demos");
    expect(exitCode).toBe(1);
    expect(console.error).toHaveBeenCalledWith("testMigration cannot be run against specified db");
    const exitCode2 = await testMigration(mockStageName, "postgres");
    expect(exitCode2).toBe(1);
    expect(console.error).toHaveBeenCalledWith("testMigration cannot be run against specified db");
  });
  
  test("should exit if db is invalid", async () => {
    const mockStageName = "unit-test";
    const targetDB = "invalid-db-name";

    const exitCode = await testMigration(mockStageName, targetDB);
    expect(console.error).toHaveBeenCalledWith("invalid database name");
    expect(exitCode).toBe(1);
  });

  test("should fail when secret data can't be retrieved", async () => {
    const mockStageName = "unit-test";
    const targetDB = "unit_test";

    (https.get as vi.Mock).mockImplementation((url, callback) => {
      callback({
        statusCode: 200,
        on: vi.fn((e, h) => {
          if (e === "data") h("CERTDATA");
          if (e === "end") h();
          return {};
        }),
      });
      return { on: vi.fn() };
    });

    (getSecret as vi.Mock).mockResolvedValue(null);

    const exitCode = await testMigration(mockStageName, targetDB);

    expect(console.error).toHaveBeenCalledWith(`unable to retrieve secret data for demos-${mockStageName}-rds-admin`);
    expect(exitCode).toBe(1);
  });

  test("should print error if migration fails", async () => {
    const mockStageName = "unit-test";
    const targetDB = "unit_test";

    (https.get as vi.Mock).mockImplementation((url, callback) => {
      callback({
        statusCode: 200,
        on: vi.fn((e, h) => {
          if (e === "data") h("CERTDATA");
          if (e === "end") h();
          return {};
        }),
      });
      return { on: vi.fn() };
    });

    (getSecret as vi.Mock).mockResolvedValue(JSON.stringify(mockDBData));
    (runMigration as vi.Mock).mockRejectedValue("something went wrong");

    const exitCode = await testMigration(mockStageName, targetDB);

    expect(console.error).toHaveBeenCalledWith("migrationStatus error", "something went wrong");
    expect(exitCode).toBe(1);
  });

  test("should handle error when failing to drop database", async () => {
    const mockStageName = "unit-test";
    const targetDB = "unit_test";

    (https.get as vi.Mock).mockImplementation((url, callback) => {
      callback({
        statusCode: 200,
        on: vi.fn((e, h) => {
          if (e === "data") h("CERTDATA");
          if (e === "end") h();
          return {};
        }),
      });
      return { on: vi.fn() };
    });

    (getSecret as vi.Mock).mockResolvedValue(JSON.stringify(mockDBData));
    (runMigration as vi.Mock).mockResolvedValue(1);

    // @ts-expect-error ignore invalid mock
    mockQuery.mockRejectedValueOnce(1);

    const exitCode = await testMigration(mockStageName, targetDB);

    expect(console.error).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith("failed to drop database:", 1);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("`prisma migration deploy` exited with a non-zero exit code")
    );

    expect(exitCode).toBe(1);
  });
});

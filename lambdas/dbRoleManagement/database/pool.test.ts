import type * as poolModule from "./pool";
import type * as envModule from "../util/env";
import type * as secretsManagerModule from "@aws-sdk/client-secrets-manager";
import type { Mock } from "vitest";

vi.mock("@aws-sdk/client-secrets-manager");

describe("pool", () => {
  let pool: typeof poolModule;
  let env: typeof envModule;
  let secretsManager: typeof secretsManagerModule;

  beforeEach(async () => {
    vi.resetModules();
    // @ts-expect-error Vitest supports dynamic imports for resetting module state in tests.
    pool = await import("./pool");
    // @ts-expect-error 
    env = await import("../util/env");
    // @ts-expect-error 
    secretsManager = await import("@aws-sdk/client-secrets-manager");
  });


  describe("getPool", () => {
    test("should return existing pool if it exists", async () => {
      const mockArn = "unit-test-arn";
      vi.spyOn(env, "getDBSecretArn").mockImplementation(() => mockArn);
      const mockDBValues = {
        dbname: "utdb",
        engine: "postgres",
        port: 5432,
        dbInstanceIdentifier: "unit-test-rds",
        host: "unit.test.rds.host",
        password: "thisiafakepassword", // pragma: allowlist secret
        username: "dbusername",
      };
      const sendMock = vi.fn().mockResolvedValue({ SecretString: JSON.stringify(mockDBValues) });
      (secretsManager.SecretsManagerClient as unknown as Mock).mockImplementation(function() {return { send: sendMock }});

      const firstPool = await pool.getPool();
      const secondPool = await pool.getPool();

      expect(firstPool).toBe(secondPool);
    });
  });
  describe("getDatabaseSecret", () => {
    test("should return secret if it exists", async () => {
      const mockArn = "unit-test-arn";
      vi.spyOn(env, "getDBSecretArn").mockImplementation(() => mockArn);
      const mockSecret = { mockValue: "testing" };
      const sendMock = vi.fn().mockResolvedValue({ SecretString: JSON.stringify(mockSecret) });
      (secretsManager.SecretsManagerClient as unknown as Mock).mockImplementation(function() {return { send: sendMock }});
      const getCmd = vi.spyOn(secretsManager, "GetSecretValueCommand");

      const resp = await pool.getDatabaseSecret();
      expect(getCmd).toHaveBeenCalledWith({ SecretId: mockArn });
      expect(resp).toEqual(mockSecret);

      getCmd.mockClear();
      await pool.getDatabaseSecret();
      expect(getCmd).not.toHaveBeenCalled();
    });
  });
  describe("getDatabaseUrl", () => {
    test("should return properly formatted connection string", async () => {
      const mockArn = "unit-test-arn";
      vi.spyOn(env, "getDBSecretArn").mockImplementation(() => mockArn);
      const mockDBValues = {
        dbname: "utdb",
        engine: "postgres",
        port: 5432,
        dbInstanceIdentifier: "unit-test-rds",
        host: "unit.test.rds.host",
        password: "thisiafakepassword", // pragma: allowlist secret
        username: "dbusername",
      };
       const sendMock = vi.fn().mockResolvedValue({ SecretString: JSON.stringify(mockDBValues) });
      (secretsManager.SecretsManagerClient as unknown as Mock).mockImplementation(function() {return { send: sendMock }});
      const getCmd = vi.spyOn(secretsManager, "GetSecretValueCommand");

      const url = await pool.getDatabaseUrl();
      // expect(sendMock).toHaveBeenCalled()

      expect(url).toEqual(
        `postgresql://${mockDBValues.username}:${mockDBValues.password}@${mockDBValues.host}:${mockDBValues.port}/${mockDBValues.dbname}?schema=demos_app`
      );
    });
  });
});

import * as pool from "./pool";

import {
  SecretsManagerClient,
  CreateSecretCommand,
  RotateSecretCommand,
  DeleteSecretCommand,
} from "@aws-sdk/client-secrets-manager";

jest.mock("@aws-sdk/client-secrets-manager");

describe("pool", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });
  describe("getPool", () => {
    test("should return existing pool if it exists", async () => {
      const spy = jest.spyOn(pool, "getDatabaseUrl").mockResolvedValue("databaseURL");
      await pool.getPool();
      expect(spy).toHaveBeenCalledTimes(1);
      await pool.getPool();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  describe("getDatabaseSecret", () => {
    test("should return secret if it exists", async () => {
      const mockArn = "unit-test-arn";
      process.env.DATABASE_SECRET_ARN = mockArn;
      const mockSecret = { mockValue: "testing" };
      const sendMock = jest.fn().mockResolvedValue({ SecretString: JSON.stringify(mockSecret) });
      (SecretsManagerClient as jest.Mock).mockImplementation(() => ({ send: sendMock }));
      const getCmd = jest.spyOn(require("@aws-sdk/client-secrets-manager"), "GetSecretValueCommand");

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
      const mockDBValues = {
        dbname: "utdb",
        engine: "postgres",
        port: 5432,
        dbInstanceIdentifier: "unit-test-rds",
        host: "unit.test.rds.host",
        password: "thisiafakepassword", // pragma: allowlist secret
        username: "dbusername",
      };
      jest.spyOn(pool, "getDatabaseSecret").mockResolvedValue(mockDBValues);

      const url = await pool.getDatabaseUrl();
      expect(url).toEqual(
        `postgresql://${mockDBValues.username}:${mockDBValues.password}@${mockDBValues.host}:${mockDBValues.port}/${mockDBValues.dbname}?schema=demos_app`
      );
    });
  });
});

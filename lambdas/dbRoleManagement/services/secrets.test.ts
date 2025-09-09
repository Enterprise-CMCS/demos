import { deleteSecrets, storeSecret } from "./secrets";

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { getDatabaseSecret } from "../database/pool";

jest.mock("@aws-sdk/client-secrets-manager");
jest.mock("../database/pool");

const mockDBValues = {
  dbname: "utdb",
  engine: "postgres",
  port: 5432,
  dbInstanceIdentifier: "unit-test-rds",
  host: "unit.test.rds.host",
};

describe("secrets", () => {
  test("should properly create the db secret and rotation", async () => {
    (getDatabaseSecret as jest.Mock).mockResolvedValue(mockDBValues);

    const sendMock = jest.fn().mockResolvedValue({ ARN: "mock:arn" });
    (SecretsManagerClient as jest.Mock).mockImplementation(() => ({ send: sendMock }));
    const createCmd = jest.spyOn(require("@aws-sdk/client-secrets-manager"), "CreateSecretCommand");
    const rotateCmd = jest.spyOn(require("@aws-sdk/client-secrets-manager"), "RotateSecretCommand");

    await storeSecret("unit-test", "myRole", "mockPass");

    expect(sendMock).toHaveBeenCalledTimes(2);

    expect(createCmd).toHaveBeenCalledWith(
      expect.objectContaining({
        SecretString: JSON.stringify({ password: "mockPass", ...mockDBValues, username: "myRole" }),
      })
    );

    expect(rotateCmd).toHaveBeenCalledWith(
      expect.objectContaining({
        SecretId: "mock:arn", // pragma: allowlist secret
      })
    );
  });

  test("should properly delete the db secret", async () => {
    (getDatabaseSecret as jest.Mock).mockResolvedValue(mockDBValues);

    const sendMock = jest.fn().mockResolvedValue({ ARN: "mock:arn" });
    (SecretsManagerClient as jest.Mock).mockImplementation(() => ({ send: sendMock }));
    const deleteCmd = jest.spyOn(require("@aws-sdk/client-secrets-manager"), "DeleteSecretCommand");

    await deleteSecrets([
      { name: "mockRole1", memberships: [] },
      { name: "mockRole2", memberships: [] },
    ]);

    expect(sendMock).toHaveBeenCalledTimes(2);

    expect(deleteCmd).toHaveBeenCalledWith(
      expect.objectContaining({
        SecretId: "demos-unit-test-rds-mockRole1", // pragma: allowlist secret
      })
    );
    expect(deleteCmd).toHaveBeenCalledWith(
      expect.objectContaining({
        SecretId: "demos-unit-test-rds-mockRole2", // pragma: allowlist secret
      })
    );
  });
});

import { deleteSecrets, storeSecret } from "./secrets";

import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import * as secretsManager from "@aws-sdk/client-secrets-manager";

import { getDatabaseSecret } from "../database/pool";
import { Mock } from "vitest";

vi.mock("@aws-sdk/client-secrets-manager");
vi.mock("../database/pool");

const mockDBValues = {
  dbname: "utdb",
  engine: "postgres",
  port: 5432,
  dbInstanceIdentifier: "unit-test-rds",
  host: "unit.test.rds.host",
};

describe("secrets", () => {
  test("should properly create the db secret and rotation", async () => {
    (getDatabaseSecret as Mock).mockResolvedValue(mockDBValues);

    const sendMock = vi.fn().mockResolvedValue({ ARN: "mock:arn" });
    (SecretsManagerClient as Mock).mockImplementation(function() { return { send: sendMock }});
    const createCmd = vi.spyOn(secretsManager, "CreateSecretCommand");
    const rotateCmd = vi.spyOn(secretsManager, "RotateSecretCommand");

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
    (getDatabaseSecret as Mock).mockResolvedValue(mockDBValues);

    const sendMock = vi.fn(() => ({ ARN: "mock:arn" }));
    (SecretsManagerClient as Mock).mockImplementation(function() { return {send: sendMock }});
    const deleteCmd = vi.spyOn(secretsManager, "DeleteSecretCommand");

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

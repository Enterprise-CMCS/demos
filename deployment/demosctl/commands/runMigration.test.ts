import { runMigration } from "./runMigration";

import { runShell } from "../lib/runCommand";
import { getSecret } from "../lib/getSecret";

jest.mock("../lib/runCommand");
jest.mock("../lib/getSecret");

const mockDBData = {
  username: "test",
  password: "fake", // pragma: allowlist secret
  host: "host",
  port: 1234,
  dbname: "hostDB",
};

describe("runMigration", () => {
  test("should set env and run migration command", async () => {
    const mockStageName = "unit-test";

    const targetDB = "unit_test";
    await runMigration(mockStageName, targetDB, mockDBData);

    expect(runShell).toHaveBeenCalledWith(
      "server-build",
      "npm run migrate:deploy",
      expect.objectContaining({
        cwd: "../server",
        env: expect.objectContaining({
          DATABASE_URL: `postgresql://${mockDBData.username}:${mockDBData.password}@${mockDBData.host}:${mockDBData.port}/${targetDB}?schema=demos_app`,
        }),
      })
    );
  });

  test("should retrieve secrets if not passed", async () => {
    const mockStageName = "unit-test";

    const targetDB = "unit_test";

    const gs = getSecret as jest.Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValueOnce(mockDataString);

    await runMigration(mockStageName, targetDB);

    expect(runShell).toHaveBeenCalledWith(
      "server-build",
      "npm run migrate:deploy",
      expect.objectContaining({
        cwd: "../server",
        env: expect.objectContaining({
          DATABASE_URL: `postgresql://${mockDBData.username}:${mockDBData.password}@${mockDBData.host}:${mockDBData.port}/${targetDB}?schema=demos_app`,
        }),
      })
    );
  });

  test("should exit if no secret data", async () => {
    const mockStageName = "unit-test";

    const targetDB = "unit_test";

    const gs = getSecret as jest.Mock;
    gs.mockResolvedValueOnce(null);

    jest.spyOn(console, "error");
    // @ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    await runMigration(mockStageName, targetDB);

    expect(process.exit).toHaveBeenCalled();
  });

  test("should exit if secretData is empty", async () => {
    const mockStageName = "unit-test";

    const gs = getSecret as jest.Mock;
    gs.mockResolvedValueOnce("{}");

    jest.spyOn(console, "error");
    // @ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    await runMigration(mockStageName);

    expect(process.exit).toHaveBeenCalled();
  });
});

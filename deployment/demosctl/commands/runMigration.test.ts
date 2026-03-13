import { runMigration } from "./runMigration";

import { runShell } from "../lib/runCommand";
import { getSecret } from "../lib/getSecret";
import {Mock} from "vitest"

vi.mock("../lib/runCommand");
vi.mock("../lib/getSecret");

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
      "migrate-deploy",
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

    const gs = getSecret as Mock;
    const mockDataString = JSON.stringify(mockDBData);
    gs.mockResolvedValueOnce(mockDataString);

    await runMigration(mockStageName, targetDB);

    expect(runShell).toHaveBeenCalledWith(
      "migrate-deploy",
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

    const gs = getSecret as Mock;
    gs.mockResolvedValueOnce(null);

    vi.spyOn(console, "error");

    const exitCode = await runMigration(mockStageName, targetDB);

    expect(exitCode).toBe(1);
  });

  test("should exit if secretData is empty", async () => {
    const mockStageName = "unit-test";

    const gs = getSecret as Mock;
    gs.mockResolvedValueOnce("{}");

    vi.spyOn(console, "error");

    const exitCode = await runMigration(mockStageName);

    expect(exitCode).toBe(1);
  });
});

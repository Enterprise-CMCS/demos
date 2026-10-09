import { buildServer } from "./buildServer";

import { runShell } from "../lib/runCommand";
import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/readOutputs");
vi.mock("../lib/getOutputValue");

describe("buildServer", () => {
  test("should properly set vite envs", async () => {
    const rs = runShell as Mock;

    await buildServer("prod");
    expect(rs).toHaveBeenCalledWith(
      "server-build",
      "npm ci && npm run build:ci -- --define:process.env.CURRENT_ENV='\"prod\"'",
      expect.objectContaining({
        cwd: "../server",
      }),
    );
  });

  test("should properly set vite envs", async () => {
    await expect(buildServer("unittest")).resolves.not.toThrow();
    await expect(buildServer("dev")).resolves.not.toThrow();
    await expect(buildServer("prod")).resolves.not.toThrow();
    await expect(buildServer("bad code here;")).rejects.toThrow("invalid environment name");
    await expect(buildServer("invalid-env")).rejects.toThrow("invalid environment name");
  });
});

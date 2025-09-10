import { buildServer } from "./buildServer";

import { runShell } from "../lib/runCommand";

jest.mock("../lib/runCommand");
jest.mock("../lib/readOutputs");
jest.mock("../lib/getOutputValue");

describe("buildServer", () => {
  test("should properly set vite envs", async () => {
    const rs = runShell as jest.Mock;

    await buildServer();
    expect(rs).toHaveBeenCalledWith(
      "server-build",
      "npm ci && npm run build:ci",
      expect.objectContaining({
        cwd: "../server",
      })
    );
  });
});

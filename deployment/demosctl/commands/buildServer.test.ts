import { buildServer } from "./buildServer";

import { runShell } from "../lib/runCommand";
import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/readOutputs");
vi.mock("../lib/getOutputValue");

describe("buildServer", () => {
  test("should properly set vite envs", async () => {
    const rs = runShell as Mock;

    await buildServer();
    expect(rs).toHaveBeenCalledWith(
      "server-build",
      "npm ci && npm run build:ci",
      expect.objectContaining({
        cwd: "../server",
      }),
    );
  });
});

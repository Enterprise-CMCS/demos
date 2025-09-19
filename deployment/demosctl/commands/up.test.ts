import { up } from "./up";

import { buildClient } from "./buildClient";
import { buildServer } from "./buildServer";
import { fullDeploy } from "./fullDeploy";
import { getCoreOutputs } from "./getCoreOutputs";

jest.mock("./buildServer");
jest.mock("./buildClient");
jest.mock("./fullDeploy");
jest.mock("./getCoreOutputs");

describe("up", () => {
  beforeEach(() => {
    jest.spyOn(console, "error");
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test("should run commands to build ephemeral env", async () => {
    const mockStageName = "unit-test";

    const bc = (buildClient as jest.Mock).mockResolvedValue(0);
    const bs = (buildServer as jest.Mock).mockResolvedValue(0);

    await up(mockStageName);

    expect(getCoreOutputs).toHaveBeenCalledWith(mockStageName);
    expect(bs).toHaveBeenCalled();
    expect(bc).toHaveBeenCalledWith(mockStageName);
    expect(fullDeploy).toHaveBeenCalledWith(mockStageName);
  });

  test("should prevent users from running on any main environments", async () => {
    const mockStageNames = ["dev", "test", "impl", "prod"];

    const exitCodes: number[] = [];

    for (const mockStageName of mockStageNames) {
      exitCodes.push(await up(mockStageName));
    }

    expect(console.error).toHaveBeenCalledTimes(mockStageNames.length);
    expect(exitCodes).toEqual(Array(mockStageNames.length).fill(1));
  });

  test("should log if the deploy fails", async () => {
    const mockStageName = "unit-test";

    (buildServer as jest.Mock).mockRejectedValue(1);

    const exitCode = await up(mockStageName);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("deployment failed"));
    expect(exitCode).toBe(1);
  });
});

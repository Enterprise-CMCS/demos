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
    //@ts-expect-error ignore invalid mock type
    jest.spyOn(process, "exit").mockImplementation(() => "exit");
  });

  afterEach(() => {
    // @ts-expect-error ignore invalid mock type
    (process.exit as jest.Mock).mockRestore();
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

    for (const mockStageName of mockStageNames) {
      await up(mockStageName);
    }

    expect(console.error).toHaveBeenCalledTimes(mockStageNames.length);
    expect(process.exit).toHaveBeenCalledTimes(mockStageNames.length);
  });

  test("should log if the deploy fails", async () => {
    const mockStageName = "unit-test";

    (buildServer as jest.Mock).mockRejectedValue(1);

    await up(mockStageName);

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("deployment failed"));
    expect(process.exit).toHaveBeenCalledTimes(1);
  });
});

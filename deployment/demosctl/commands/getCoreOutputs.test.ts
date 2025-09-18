import { getCoreOutputs } from "./getCoreOutputs";

import { runCommand } from "../lib/runCommand";

jest.mock("../lib/runCommand");
jest.mock("../lib/addCognitoRedirect");

describe("getCoreOutputs", () => {
  test("should successfully run a deploy on core only", async () => {
    const mockStageName = "unit-test";

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(0);

    jest.spyOn(console, "log");

    const exitCode = await getCoreOutputs(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "core-deploy",
      "npx",
      expect.arrayContaining(["deploy", `demos-${mockStageName}-core`, `stage=${mockStageName}`])
    );

    expect(exitCode).toBe(0);
  });
  test("should exit on error", async () => {
    const mockStageName = "unit-test";

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(1);

    jest.spyOn(console, "error");

    const exitCode = await getCoreOutputs(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "core-deploy",
      "npx",
      expect.arrayContaining(["deploy", `stage=${mockStageName}`, `stage=${mockStageName}`])
    );

    expect(console.error).toHaveBeenCalledWith("core output command failed with code 1");
    expect(exitCode).toBe(1);
  });
});

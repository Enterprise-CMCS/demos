import { getCoreOutputs } from "./getCoreOutputs";

import { runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";

jest.mock("../lib/runCommand");
jest.mock("../lib/readOutputs");
jest.mock("../lib/addCognitoRedirect");

describe("getCoreOutputs", () => {
  test("should successfully run a deploy on core only", async () => {
    const mockStageName = "unit-test";

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(0);

    jest.spyOn(console, "log");

    await getCoreOutputs(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "core-deploy",
      "npx",
      expect.arrayContaining(["deploy", `demos-${mockStageName}-core`, `stage=${mockStageName}`])
    );

    expect(readOutputs).toHaveBeenCalled();
  });
  test("should exit on error", async () => {
    const mockStageName = "unit-test";

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(1);

    jest.spyOn(console, "error");
    // @ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    await getCoreOutputs(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "core-deploy",
      "npx",
      expect.arrayContaining(["deploy", `stage=${mockStageName}`, `stage=${mockStageName}`])
    );

    expect(console.error).toHaveBeenCalledWith("core output command failed with code 1");
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

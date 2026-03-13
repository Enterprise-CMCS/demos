import { fullDeploy } from "./fullDeploy";

import { runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";

vi.mock("../lib/runCommand");
vi.mock("../lib/readOutputs");
vi.mock("../lib/addCognitoRedirect");

describe("fullDeploy", () => {
  test("should successfully run a full deploy", async () => {
    const mockStageName = "unit-test";

    const ro = readOutputs as vi.Mock;
    ro.mockReturnValue({
      [`demos-${mockStageName}-core`]: {
        cognitoAuthority: "authority",
        cognitoClientId: "client-id",
      },
      [`demos-${mockStageName}-ui`]: {
        CloudfrontURL: "cloudfront-url",
      },
    });

    const rc = runCommand as vi.Mock;
    rc.mockResolvedValue(0);

    vi.spyOn(console, "log");

    await fullDeploy(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "deploy-all",
      "npx",
      expect.arrayContaining(["deploy", "--all", `stage=${mockStageName}`])
    );

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("complete deploy command succeeded"));
  });
  test("should exit on error", async () => {
    const mockStageName = "unit-test";

    const rc = runCommand as vi.Mock;
    rc.mockResolvedValue(1);

    vi.spyOn(console, "error");

    const exitCode = await fullDeploy(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "deploy-all",
      "npx",
      expect.arrayContaining(["deploy", "--all", `stage=${mockStageName}`])
    );

    expect(console.error).toHaveBeenCalledWith("complete deploy command failed with code 1");
    expect(exitCode).toBe(1);
  });
});

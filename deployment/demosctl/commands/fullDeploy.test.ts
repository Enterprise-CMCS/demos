import { fullDeploy } from "./fullDeploy";

import { runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";

jest.mock("../lib/runCommand");
jest.mock("../lib/readOutputs");
jest.mock("../lib/addCognitoRedirect");

describe("fullDeploy", () => {
  test("should successfully run a full deploy", async () => {
    const mockStageName = "unit-test";

    const ro = readOutputs as jest.Mock;
    ro.mockReturnValue({
      [`demos-${mockStageName}-core`]: {
        cognitoAuthority: "authority",
        cognitoClientId: "client-id",
      },
      [`demos-${mockStageName}-ui`]: {
        CloudfrontURL: "cloudfront-url",
      },
    });

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(0);

    jest.spyOn(console, "log");

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

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(1);

    jest.spyOn(console, "error");
    // @ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");

    await fullDeploy(mockStageName);

    expect(rc).toHaveBeenCalledWith(
      "deploy-all",
      "npx",
      expect.arrayContaining(["deploy", "--all", `stage=${mockStageName}`])
    );

    expect(console.error).toHaveBeenCalledWith("complete deploy command failed with code 1");
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});

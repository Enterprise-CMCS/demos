vi.useFakeTimers();

import { addCloudfrontRedirect } from "./addCloudfrontRedirect";
import { runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";
import { addCognitoRedirect } from "../lib/addCognitoRedirect";

import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/addCognitoRedirect");
vi.mock("../lib/readOutputs");

describe("addCloudfrontRedirect", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => true);
    vi.spyOn(console, "error").mockImplementation(() => true);
  });

  afterEach(() => {
    (console.log as Mock).mockRestore();
    (console.error as Mock).mockRestore();
  });

  test("should properly request core outputs and pass values to cognito redirect", async () => {
    const rc = runCommand as Mock;
    rc.mockResolvedValue(0);

    const acr = addCognitoRedirect as Mock;
    acr.mockResolvedValue(0);

    const mockStageName = "unit-test";

    const ro = readOutputs as Mock;
    ro.mockReturnValue({
      [`demos-${mockStageName}-core`]: {
        cognitoAuthority: "test/value",
        cognitoClientId: "123",
      },
      [`demos-${mockStageName}-ui`]: {
        CloudfrontURL: "https://demos.com",
      },
    });

    await addCloudfrontRedirect(mockStageName);
    expect(rc).toHaveBeenCalledWith(
      "deploy-no-execute",
      "npx",
      expect.arrayContaining([`stage=${mockStageName}`, "--execute=false", "--outputs-file=all-outputs.json"]),
    );

    expect(acr).toHaveBeenCalledWith("value", "123", "https://demos.com");
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  test("should exit if runCommand returns non-zero exit", async () => {
    const rc = runCommand as Mock;
    rc.mockResolvedValue(1);
    const mockStageName = "unit-test";
    let exitCode;
    try {
      exitCode = await addCloudfrontRedirect(mockStageName);
    } finally {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(exitCode).toBe(1);
    }
  });
});

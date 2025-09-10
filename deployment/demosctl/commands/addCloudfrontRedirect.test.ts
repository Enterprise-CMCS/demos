jest.useFakeTimers();

import { addCloudfrontRedirect } from "./addCloudfrontRedirect";
import { runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";
import { addCognitoRedirect } from "../lib/addCognitoRedirect";

jest.mock("../lib/runCommand");
jest.mock("../lib/addCognitoRedirect");
jest.mock("../lib/readOutputs");

describe("addCloudfrontRedirect", () => {
  beforeEach(() => {
    //@ts-expect-error ignore invalid mock
    jest.spyOn(process, "exit").mockImplementation(() => "exit");
    jest.spyOn(console, "log").mockImplementation(() => true);
    jest.spyOn(console, "error").mockImplementation(() => true);
  });

  afterEach(() => {
    // @ts-expect-error ignore invalid mock
    (process.exit as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  test("should properly request core outputs and pass values to cognito redirect", async () => {
    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(0);

    const acr = addCognitoRedirect as jest.Mock;
    acr.mockResolvedValue(0);

    const mockStageName = "unit-test";

    const ro = readOutputs as jest.Mock;
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
      expect.arrayContaining([`stage=${mockStageName}`, "--execute=false", "--outputs-file=all-outputs.json"])
    );

    expect(acr).toHaveBeenCalledWith("value", "123", "https://demos.com");
    expect(console.log).toHaveBeenCalledTimes(1);
  });

  test("should exit if runCommand returns non-zero exit", async () => {
    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(1);
    const mockStageName = "unit-test";
    try {
      await addCloudfrontRedirect(mockStageName);
    } finally {
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(process.exit).toHaveBeenCalledWith(1);
    }
  });
});

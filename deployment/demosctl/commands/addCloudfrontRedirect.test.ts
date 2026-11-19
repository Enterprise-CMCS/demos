vi.useFakeTimers();

import { addCloudfrontRedirect } from "./addCloudfrontRedirect";
import { addCognitoRedirect } from "../lib/addCognitoRedirect";

import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/addCognitoRedirect");
vi.mock("../lib/readOutputs");

const mockCloudformationSend = vi.fn();

vi.mock(import("@aws-sdk/client-cloudformation"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    CloudFormationClient: vi.fn().mockImplementation(function () {
      return {
        send: mockCloudformationSend,
      };
    }),
  };
});

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
    const acr = addCognitoRedirect as Mock;
    acr.mockResolvedValue(0);

    const mockStageName = "unit-test";

    mockCloudformationSend
      .mockImplementationOnce(() => ({
        Stacks: [
          {
            Outputs: [
              { OutputKey: "cognitoAuthority", OutputValue: "test/value" },
              { OutputKey: "cognitoClientId", OutputValue: "123" },
            ],
          },
        ],
      }))
      .mockImplementationOnce(() => ({
        Stacks: [{ Outputs: [{ OutputKey: "CloudfrontURL", OutputValue: "https://demos.com" }] }],
      }));

    await addCloudfrontRedirect(mockStageName);
    expect(mockCloudformationSend).toHaveBeenCalledTimes(2);

    expect(acr).toHaveBeenCalledWith("value", "123", "https://demos.com");
    expect(console.log).toHaveBeenCalledTimes(1);
  });
});

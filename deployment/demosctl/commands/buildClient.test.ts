import { buildClient } from "./buildClient";

import { runShell } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";
import { getOutputValue } from "../lib/getOutputValue";

import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/readOutputs");
vi.mock("../lib/getOutputValue");

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

describe("buildClient", () => {
  test("should properly set vite envs", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [{ Outputs: [] }],
    }));

    const rs = runShell as Mock;

    await buildClient(mockStageName);

    expect(rs).toHaveBeenCalledWith(
      "client-build",
      "npm ci && npm run build:ci",
      expect.objectContaining({
        env: expect.objectContaining({
          VITE_COGNITO_AUTHORITY: "cognitoAuthority",
          VITE_COGNITO_DOMAIN: "cognitoDomain",
          VITE_COGNITO_CLIENT_ID: "cognitoClientId",
          VITE_API_URL_PREFIX: "/api/graphql",
        }),
      }),
    );
  });

  test.each([["dev"], ["test"]])("should use build:ci:dev command for %s environment", async (environment) => {
    const ro = readOutputs as Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rs = runShell as Mock;

    mockCloudformationSend.mockImplementationOnce(() => ({
      Stacks: [{ Outputs: [] }],
    }));

    await buildClient(environment);

    expect(rs).toHaveBeenCalledWith(
      "client-build",
      "npm ci && npm run build:ci:dev",
      expect.objectContaining({
        env: expect.objectContaining({
          VITE_COGNITO_AUTHORITY: "cognitoAuthority",
          VITE_COGNITO_DOMAIN: "cognitoDomain",
          VITE_COGNITO_CLIENT_ID: "cognitoClientId",
          VITE_API_URL_PREFIX: "/api/graphql",
        }),
      }),
    );
  });
});

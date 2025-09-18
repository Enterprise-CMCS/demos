import { buildClient } from "./buildClient";

import { runShell, runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";
import { getOutputValue } from "../lib/getOutputValue";

jest.mock("../lib/runCommand");
jest.mock("../lib/readOutputs");
jest.mock("../lib/getOutputValue");

describe("buildClient", () => {
  test("should properly set vite envs", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as jest.Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as jest.Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rs = runShell as jest.Mock;

    await buildClient(mockStageName);

    expect(rs).toHaveBeenCalledWith(
      "client-build",
      "npm ci && npm run build",
      expect.objectContaining({
        env: expect.objectContaining({
          VITE_COGNITO_AUTHORITY: "cognitoAuthority",
          VITE_COGNITO_DOMAIN: "cognitoDomain",
          VITE_COGNITO_CLIENT_ID: "cognitoClientId",
          VITE_API_URL_PREFIX: "/api/graphql",
        }),
      })
    );
  });

  test("should properly run core stack if requested", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as jest.Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as jest.Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rs = runShell as jest.Mock;
    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(0);

    await buildClient(mockStageName, true);
    expect(rc).toHaveBeenCalled();
    expect(rc).toHaveBeenCalledWith(
      "deploy-core-no-execute",
      "npx",
      expect.arrayContaining([`stage=${mockStageName}`, `demos-${mockStageName}-core`])
    );

    expect(rs).toHaveBeenCalledWith(
      "client-build",
      "npm ci && npm run build",
      expect.objectContaining({
        env: expect.objectContaining({
          VITE_COGNITO_AUTHORITY: "cognitoAuthority",
          VITE_COGNITO_DOMAIN: "cognitoDomain",
          VITE_COGNITO_CLIENT_ID: "cognitoClientId",
          VITE_API_URL_PREFIX: "/api/graphql",
          VITE_IDM_LOGOUT_URI: "",
        }),
      })
    );
  });

  test("should exit if core deploy fails", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as jest.Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as jest.Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rc = runCommand as jest.Mock;
    rc.mockResolvedValue(1);

    const exitCode = await buildClient(mockStageName, true);
    expect(rc).toHaveBeenCalled();
    expect(rc).toHaveBeenCalledWith(
      "deploy-core-no-execute",
      "npx",
      expect.arrayContaining([`stage=${mockStageName}`, `demos-${mockStageName}-core`])
    );

    expect(exitCode).toBe(1);
  });
});

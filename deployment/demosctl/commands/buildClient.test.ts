import { buildClient } from "./buildClient";

import { runShell, runCommand } from "../lib/runCommand";
import { readOutputs } from "../lib/readOutputs";
import { getOutputValue } from "../lib/getOutputValue";

import { Mock } from "vitest";

vi.mock("../lib/runCommand");
vi.mock("../lib/readOutputs");
vi.mock("../lib/getOutputValue");

describe("buildClient", () => {
  test("should properly set vite envs", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

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

  test("should properly run core stack if requested", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rs = runShell as Mock;
    const rc = runCommand as Mock;
    rc.mockResolvedValue(0);

    await buildClient(mockStageName, true);
    expect(rc).toHaveBeenCalled();
    expect(rc).toHaveBeenCalledWith(
      "deploy-core-no-execute",
      "npx",
      expect.arrayContaining([`stage=${mockStageName}`, `demos-${mockStageName}-core`]),
    );

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

  test("should exit if core deploy fails", async () => {
    const mockStageName = "unit-test";
    const ro = readOutputs as Mock;
    ro.mockReturnValue({});

    const gov = getOutputValue as Mock;
    gov.mockImplementation((_, __, name) => {
      return name;
    });

    const rc = runCommand as Mock;
    rc.mockResolvedValue(1);

    const exitCode = await buildClient(mockStageName, true);
    expect(rc).toHaveBeenCalled();
    expect(rc).toHaveBeenCalledWith(
      "deploy-core-no-execute",
      "npx",
      expect.arrayContaining([`stage=${mockStageName}`, `demos-${mockStageName}-core`]),
    );

    expect(exitCode).toBe(1);
  });
});

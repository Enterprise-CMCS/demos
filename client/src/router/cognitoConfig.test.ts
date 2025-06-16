import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LOCAL_COGNITO_CONFIG,
  getCognitoLogoutUrl,
  getCognitoConfig,
} from "./cognitoConfig";

vi.mock("config/env", () => ({
  getAppMode: vi.fn(),
}));

describe("cognitoConfig", () => {
  describe("getCognitoLogoutUrl", () => {
    it("should generate the correct logout URL", () => {
      const expectedUrl =
        "https://us-east-1a7car2wo3.auth.us-east-1.amazoncognito.com/logout?client_id=5km9thunj8g6qd32s5et2i8pga&logout_uri=http%3A%2F%2Flocalhost%3A3000";
      const url = getCognitoLogoutUrl(LOCAL_COGNITO_CONFIG);
      expect(url).toBe(expectedUrl);
    });
  });

  describe("getCognitoConfig", () => {
    const mockGetAppMode = vi.mocked(vi.fn());

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return LOCAL_COGNITO_CONFIG for development", async () => {
      mockGetAppMode.mockReturnValue("development");
      const { getAppMode } = await import("config/env");
      vi.mocked(getAppMode).mockImplementation(mockGetAppMode);

      expect(getCognitoConfig()).toBe(LOCAL_COGNITO_CONFIG);
    });

    it("should return LOCAL_COGNITO_CONFIG for test", async () => {
      mockGetAppMode.mockReturnValue("test");
      const { getAppMode } = await import("config/env");
      vi.mocked(getAppMode).mockImplementation(mockGetAppMode);

      expect(getCognitoConfig()).toBe(LOCAL_COGNITO_CONFIG);
    });

    it("should return production config that matches local", async () => {
      mockGetAppMode.mockReturnValue("production");
      const { getAppMode } = await import("config/env");
      vi.mocked(getAppMode).mockImplementation(mockGetAppMode);

      window._env_ = {};
      const config = getCognitoConfig();
      const keys = Object.keys(LOCAL_COGNITO_CONFIG);
      keys.forEach((k) => {
        expect(config).toHaveProperty(k);
      });
    });

    it("should throw error for unknown environment", async () => {
      mockGetAppMode.mockReturnValue("staging" as "development");
      const { getAppMode } = await import("config/env");
      vi.mocked(getAppMode).mockImplementation(mockGetAppMode);

      expect(() => getCognitoConfig()).toThrow(
        "Cognito configuration for staging is not defined."
      );
    });
  });
});

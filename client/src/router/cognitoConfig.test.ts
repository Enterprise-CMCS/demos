import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { User } from "oidc-client-ts";
import { LOCAL_COGNITO_CONFIG, getCognitoLogoutUrl, getCognitoConfig } from "./cognitoConfig";

vi.mock("config/env", () => ({
  getAppMode: vi.fn(),
}));

describe("cognitoConfig", () => {
  describe("onSigninCallback", () => {
    const callback = LOCAL_COGNITO_CONFIG.onSigninCallback!;
    const userWithState = (state: unknown) =>
      new User({
        access_token: "test-token",
        token_type: "Bearer",
        profile: { sub: "test-user", iss: "test", aud: "test", exp: 0, iat: 0 },
        userState: state,
      });

    beforeEach(() => {
      window.history.replaceState({}, "", "/?code=test-code&state=test-state");
    });

    afterEach(() => {
      window.history.replaceState({}, "", "/");
    });

    it("restores the email destination including its query and fragment", () => {
      const returnUrl = "/deliverables/deliverable-1?tab=documents#uploaded";
      callback(userWithState({ returnUrl }));
      expect(window.location.pathname + window.location.search + window.location.hash).toBe(
        returnUrl
      );
    });

    it.each([undefined, {}])(
      "cleans the callback URL without a saved destination (%j)",
      (state) => {
        callback(state === undefined ? undefined : userWithState(state));
        expect(window.location.pathname + window.location.search).toBe("/");
      }
    );

    it.each([
      "https://example.com/",
      "//example.com/",
      "/\\example.com/",
      "javascript:alert(1)",
      123,
    ])("rejects an invalid return URL (%s)", (returnUrl) => {
      expect(() => callback(userWithState({ returnUrl }))).toThrow(
        "Invalid login return URL: expected a URL within this application."
      );
      expect(window.location.search).toBe("?code=test-code&state=test-state");
    });
  });

  describe("getCognitoLogoutUrl", () => {
    it("should generate the correct logout URL", () => {
      const expectedUrl =
        "https://demos-dev-login-user-pool-client.auth.us-east-1.amazoncognito.com/logout?client_id=5p61qososiui75cmclcift45oi&logout_uri=http%3A%2F%2Flocalhost%3A3000%2F";
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

      expect(() => getCognitoConfig()).toThrow("Cognito configuration for staging is not defined.");
    });
  });
});

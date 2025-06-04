import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LOCAL_COGNITO_CONFIG, getCognitoLogoutUrl, getCognitoConfig } from "./cognitoConfig";

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
    const OLD_ENV = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterEach(() => {
      process.env = OLD_ENV;
    });

    it("should return LOCAL_COGNITO_CONFIG for development", () => {
      process.env.NODE_ENV = "development";
      expect(getCognitoConfig()).toBe(LOCAL_COGNITO_CONFIG);
    });

    it("should return LOCAL_COGNITO_CONFIG for test", () => {
      process.env.NODE_ENV = "test";
      expect(getCognitoConfig()).toBe(LOCAL_COGNITO_CONFIG);
    });

    it("should throw error for production", () => {
      process.env.NODE_ENV = "production";
      expect(() => getCognitoConfig()).toThrow(
        "Production Cognito configuration is not defined."
      );
    });

    it("should throw error for unknown environment", () => {
      process.env.NODE_ENV = "staging";
      expect(() => getCognitoConfig()).toThrow(
        "Cognito configuration for staging is not defined."
      );
    });
  });
});

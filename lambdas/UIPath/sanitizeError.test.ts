import { describe, expect, it } from "vitest";

import { createSanitizedError, sanitizeError } from "./sanitizeError";

describe("sanitizeError", () => {
  it("redacts Basic auth and token response data from Axios token errors", () => {
    const sanitized = sanitizeError({
      name: "AxiosError",
      message: "Request failed with status code 401",
      isAxiosError: true,
      config: {
        method: "post",
        url: "https://govcloud.uipath.us/identity_/connect/token",
        headers: {
          Authorization: "Basic client-id-and-secret", // pragma: allowlist secret
        },
      },
      response: {
        status: 401,
        data: {
          error: "invalid_client",
          access_token: "token-123", // pragma: allowlist secret
          clientSecret: "secret-123", // pragma: allowlist secret
        },
      },
    });

    expect(sanitized).toEqual({
      name: "AxiosError",
      message: "Request failed with status code 401",
      status: 401,
      responseData: {
        error: "invalid_client",
        access_token: "[REDACTED]",
        clientSecret: "[REDACTED]",
      },
      method: "POST",
      url: "https://govcloud.uipath.us/identity_/connect/token",
    });
    expect(JSON.stringify(sanitized)).not.toContain("client-id-and-secret");
    expect(JSON.stringify(sanitized)).not.toContain("token-123");
    expect(JSON.stringify(sanitized)).not.toContain("secret-123");
  });

  it("redacts Bearer auth and nested sensitive fields from Axios UiPath API errors", () => {
    const sanitized = sanitizeError({
      name: "AxiosError",
      message: "Bearer token-123 failed", // pragma: allowlist secret
      isAxiosError: true,
      config: {
        method: "get",
        url: "https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects",
        headers: {
          Authorization: "Bearer token-123", // pragma: allowlist secret
        },
      },
      response: {
        status: 403,
        data: {
          metadata: {
            token: "token-123", // pragma: allowlist secret
            password: "password-123", // pragma: allowlist secret
            secret: "secret-123", // pragma: allowlist secret
          },
          headers: {
            Authorization: "Bearer token-123", // pragma: allowlist secret
          },
        },
      },
    });

    expect(sanitized).toEqual({
      name: "AxiosError",
      message: "Bearer [REDACTED] failed",
      status: 403,
      responseData: {
        metadata: {
          token: "[REDACTED]",
          password: "[REDACTED]",
          secret: "[REDACTED]",
        },
      },
      method: "GET",
      url: "https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects",
    });
    expect(JSON.stringify(sanitized)).not.toContain("token-123");
    expect(JSON.stringify(sanitized)).not.toContain("password-123");
    expect(JSON.stringify(sanitized)).not.toContain("secret-123");
  });

  it("preserves only safe fields for non-Axios errors", () => {
    const sanitized = sanitizeError(new TypeError("Bad input"));

    expect(sanitized).toEqual({
      name: "TypeError",
      message: "Bad input",
    });
  });

  it("creates a plain sanitized error for rethrowing", () => {
    const safeError = createSanitizedError({
      name: "AxiosError",
      message: "Bearer token-123 failed", // pragma: allowlist secret
      isAxiosError: true,
      config: {
        headers: {
          Authorization: "Bearer token-123", // pragma: allowlist secret
        },
      },
    });

    expect(safeError).toBeInstanceOf(Error);
    expect(safeError.name).toBe("AxiosError");
    expect(safeError.message).toBe("Bearer [REDACTED] failed");
    expect(JSON.stringify(safeError)).not.toContain("token-123");
  });
});

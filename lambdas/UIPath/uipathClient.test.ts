import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMock: vi.fn(),
  getMock: vi.fn(),
  postMock: vi.fn(),
  responseUseMock: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    create: mocks.createMock.mockImplementation(() => ({
      get: mocks.getMock,
      post: mocks.postMock,
      interceptors: {
        response: {
          use: mocks.responseUseMock,
        },
      },
    })),
  },
}));

import { getProjectId, setProjectId, uipathGetRequest, uipathPostRequest } from "./uipathClient";

describe("uipathClient", () => {
  beforeEach(() => {
    mocks.getMock.mockReset();
    mocks.postMock.mockReset();
  });

  it("installs a redacting response interceptor on the shared axios instance", async () => {
    expect(mocks.responseUseMock).toHaveBeenCalledWith(undefined, expect.any(Function));
    const errorInterceptor = mocks.responseUseMock.mock.calls[0]?.[1];

    await expect(
      errorInterceptor({
        isAxiosError: true,
        message: "Request failed with status code 401",
        config: {
          method: "get",
          url: "https://example.com/resource?token=token-123", // pragma: allowlist secret
          data: { token: "token-123" }, // pragma: allowlist secret
        },
        request: {
          path: "/resource?token=token-123", // pragma: allowlist secret
        },
        response: {
          status: 401,
          statusText: "Unauthorized",
          data: { access_token: "token-123" }, // pragma: allowlist secret
        },
      })
    ).rejects.toEqual({
      isErrorRedactedResponse: true,
      fullURL: "https://example.com/resource?<REDACTED>",
      message: "Request failed with status code 401",
      response: {
        statusCode: 401,
        statusMessage: "Unauthorized",
        data: {
          access_token: "<REDACTED>",
        },
      },
      request: {
        baseURL: "",
        path: "https://example.com/resource?<REDACTED>",
        method: "get",
        data: {
          token: "<REDACTED>",
        },
      },
    });
  });

  it("uipathGetRequest adds bearer auth and api-version", async () => {
    mocks.getMock.mockResolvedValue({ data: { ok: true } });

    await uipathGetRequest("https://example.com/resource", "token-123");

    expect(mocks.getMock).toHaveBeenCalledWith("https://example.com/resource", {
      headers: {
        Authorization: "Bearer token-123",
      },
      params: {
        "api-version": "1.0",
      },
    });
  });

  it("uipathGetRequest merges headers, params and rest options", async () => {
    mocks.getMock.mockResolvedValue({ data: { ok: true } });

    await uipathGetRequest("https://example.com/resource", "token-123", {
      headers: { "x-custom": "value" },
      params: { status: "active" },
      timeout: 5000,
    });

    expect(mocks.getMock).toHaveBeenCalledWith("https://example.com/resource", {
      headers: {
        Authorization: "Bearer token-123",
        "x-custom": "value",
      },
      params: {
        "api-version": "1.0",
        status: "active",
      },
      timeout: 5000,
    });
  });

  it("uipathPostRequest adds bearer auth, api-version and forwards body", async () => {
    mocks.postMock.mockResolvedValue({ data: { ok: true } });
    const body = { documentId: "doc-1" };

    await uipathPostRequest("https://example.com/resource", "token-123", body);

    expect(mocks.postMock).toHaveBeenCalledWith("https://example.com/resource", body, {
      headers: {
        Authorization: "Bearer token-123",
      },
      params: {
        "api-version": "1.0",
      },
    });
  });

  it("uipathPostRequest merges headers, params and rest options", async () => {
    mocks.postMock.mockResolvedValue({ data: { ok: true } });
    const body = { documentId: "doc-1" };

    await uipathPostRequest("https://example.com/resource", "token-123", body, {
      headers: { "content-type": "application/json" },
      params: { mode: "fast" },
      timeout: 2000,
    });

    expect(mocks.postMock).toHaveBeenCalledWith("https://example.com/resource", body, {
      headers: {
        Authorization: "Bearer token-123",
        "content-type": "application/json",
      },
      params: {
        "api-version": "1.0",
        mode: "fast",
      },
      timeout: 2000,
    });
  });

  describe("project id cache", () => {
    it("throws when project id is not set", () => {
      expect(() => getProjectId()).toThrow("UiPath project id is not set.");
    });

    it("trims and stores project id", () => {
      setProjectId("  project-1  ");
      expect(getProjectId()).toBe("project-1");
    });

    it("rejects empty project id", () => {
      expect(() => setProjectId("   ")).toThrow("UiPath project id cannot be empty.");
    });
  });
});

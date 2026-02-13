import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: mocks.getMock,
    post: mocks.postMock,
  },
}));

import { uipathGetRequest, uipathPostRequest } from "./uipathClient";

describe("uipathClient", () => {
  beforeEach(() => {
    mocks.getMock.mockReset();
    mocks.postMock.mockReset();
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
});

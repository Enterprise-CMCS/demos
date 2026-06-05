import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Readable } from "node:stream";

const mocks = vi.hoisted(() => ({
  createReadStreamMock: vi.fn(),
  uipathPostRequestMock: vi.fn(),
  logErrorMock: vi.fn(),
  logInfoMock: vi.fn(),
}));

vi.mock("node:fs", () => ({
  default: {
    createReadStream: mocks.createReadStreamMock,
  },
}));

vi.mock("./uipathClient", () => ({
  UIPATH_BASE_URL: "https://govcloud.uipath.us",
  UIPATH_TENANT: "globalalliant/Dev",
  uipathPostRequest: (...args: unknown[]) => mocks.uipathPostRequestMock(...args),
}));

vi.mock("./log", () => ({
  log: {
    error: mocks.logErrorMock,
    info: mocks.logInfoMock,
  },
}));

import { uploadDocument } from "./uploadDocument";

describe("uploadDocument", () => {
  beforeEach(() => {
    mocks.createReadStreamMock.mockReturnValue(Readable.from(["content"]));
    mocks.uipathPostRequestMock.mockReset();
    mocks.logErrorMock.mockReset();
    mocks.logInfoMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("logs sanitized Axios errors and rethrows a sanitized Error", async () => {
    mocks.uipathPostRequestMock.mockRejectedValue({
      name: "AxiosError",
      message: "Request failed with Bearer token-123", // pragma: allowlist secret
      isAxiosError: true,
      config: {
        method: "post",
        url: "https://govcloud.uipath.us/upload",
        headers: {
          Authorization: "Bearer token-123", // pragma: allowlist secret
        },
      },
      response: {
        status: 500,
        data: {
          error: "server_error",
          access_token: "token-123", // pragma: allowlist secret
        },
      },
    });

    await expect(uploadDocument("token-123", "file.pdf", "project-1")).rejects.toThrow(
      "Request failed with Bearer [REDACTED]"
    );

    expect(mocks.logErrorMock).toHaveBeenCalledWith(
      {
        error: {
          name: "AxiosError",
          message: "Request failed with Bearer [REDACTED]",
          status: 500,
          responseData: {
            error: "server_error",
            access_token: "[REDACTED]",
          },
          method: "POST",
          url: "https://govcloud.uipath.us/upload",
        },
      },
      "Error uploading document"
    );
    expect(JSON.stringify(mocks.logErrorMock.mock.calls)).not.toContain("token-123");
  });
});

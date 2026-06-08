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

  it("rethrows redacted errors from the shared UiPath client", async () => {
    const redactedError = {
      isErrorRedactedResponse: true,
      message: "Request failed with status code 500",
      fullURL: "https://govcloud.uipath.us/upload",
      response: {
        statusCode: 500,
        statusMessage: "Internal Server Error",
        data: "<REDACTED>",
      },
      request: {
        baseURL: "",
        path: "https://govcloud.uipath.us/upload",
        method: "post",
        data: "<REDACTED>",
      },
    };
    mocks.uipathPostRequestMock.mockRejectedValue(redactedError);

    await expect(uploadDocument("token-123", "file.pdf", "project-1")).rejects.toBe(redactedError);

    expect(mocks.logErrorMock).not.toHaveBeenCalled();
    expect(JSON.stringify(mocks.logErrorMock.mock.calls)).not.toContain("token-123");
  });
});

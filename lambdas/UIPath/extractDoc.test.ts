import { describe, expect, it, vi, beforeEach } from "vitest";

const uipathPostRequestMock = vi.fn();
const getExtractorUrlMock = vi.fn();

vi.mock("./uipathClient", () => ({
  uipathPostRequest: (...args: unknown[]) => uipathPostRequestMock(...args),
}));

vi.mock("./getExtractorUrl", () => ({
  getExtractorUrl: (...args: unknown[]) => getExtractorUrlMock(...args),
}));

import { extractDoc } from "./extractDoc";

describe("extractDoc", () => {
  beforeEach(() => {
    uipathPostRequestMock.mockReset();
    getExtractorUrlMock.mockReset();
  });

  it("posts extraction request and returns resultUrl", async () => {
    getExtractorUrlMock.mockResolvedValue("https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects/project-1/extractors/async");
    uipathPostRequestMock.mockResolvedValue({ data: { resultUrl: "result-1" } });

    await expect(extractDoc("token-1", "doc-1", "project-1")).resolves.toBe("result-1");

    expect(uipathPostRequestMock).toHaveBeenCalledWith(
      "https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects/project-1/extractors/async",
      "token-1",
      {
        documentId: "doc-1",
        pageRange: null,
        configuration: null,
      }
    );
  });

  it("throws when resultUrl is missing", async () => {
    getExtractorUrlMock.mockResolvedValue("https://govcloud.uipath.us/globalalliant/Dev/du_/api/framework/projects/project-1/extractors/async");
    uipathPostRequestMock.mockResolvedValue({ data: {} });

    await expect(extractDoc("token-1", "doc-1", "project-1")).rejects.toThrow(
      "UiPath extraction did not return a resultUrl."
    );
  });
});

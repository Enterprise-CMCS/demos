import { describe, expect, it, vi, beforeEach } from "vitest";

const documentUnderstandingPostMock = vi.fn();
const getExtractorGuidMock = vi.fn();
const getProjectIdMock = vi.fn();

vi.mock("./uipathClient", () => ({
  documentUnderstandingPost: (...args: unknown[]) => documentUnderstandingPostMock(...args),
  getExtractorGuid: () => getExtractorGuidMock(),
  getProjectId: () => getProjectIdMock(),
  UIPATH_EXTRACTOR_NAME: "generative_extractor",
}));

import { extractDoc } from "./extractDoc";

describe("extractDoc", () => {
  beforeEach(() => {
    documentUnderstandingPostMock.mockReset();
    getExtractorGuidMock.mockReset();
    getProjectIdMock.mockReset();
  });

  it("posts extraction request and returns resultUrl", async () => {
    getExtractorGuidMock.mockResolvedValue("tenant/guid");
    getProjectIdMock.mockReturnValue("project-1");
    documentUnderstandingPostMock.mockResolvedValue({ data: { resultUrl: "result-1" } });

    const prompts = [
      {
        id: "prompt-1",
        question: "What is the state?",
        fieldType: "Text",
        multiValued: false,
      },
    ];

    await expect(extractDoc("token-1", "doc-1", prompts)).resolves.toBe("result-1");

    expect(documentUnderstandingPostMock).toHaveBeenCalledWith(
      "https://govcloud.uipath.us/tenant/guid/du_/api/framework/projects/project-1/extractors/generative_extractor/extraction/start?api-version=1.0",
      "token-1",
      {
        documentId: "doc-1",
        pageRange: null,
        prompts,
        configuration: null,
      }
    );
  });

  it("throws when resultUrl is missing", async () => {
    getExtractorGuidMock.mockResolvedValue("tenant/guid");
    getProjectIdMock.mockReturnValue("project-1");
    documentUnderstandingPostMock.mockResolvedValue({ data: {} });

    await expect(
      extractDoc("token-1", "doc-1", [
        {
          id: "prompt-1",
          question: "What is the state?",
          fieldType: "Text",
          multiValued: false,
        },
      ])
    ).rejects.toThrow("UiPath extraction did not return a resultUrl.");
  });
});

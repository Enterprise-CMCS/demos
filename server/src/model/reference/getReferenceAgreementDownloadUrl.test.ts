// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { SelectReferenceAgreementResult } from "../referenceAgreement/queries/selectReferenceAgreement";

// Functions under test
import { getReferenceAgreementDownloadUrl } from "./getReferenceAgreementDownloadUrl";

// Mock imports
vi.mock("../referenceAgreement/queries", () => ({
  selectReferenceAgreement: vi.fn(),
}));

vi.mock("../../log", () => ({
  log: {
    info: vi.fn(),
  },
}));

const mockS3Adapter = {
  getPresignedDownloadUrl: vi.fn(),
};

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(() => mockS3Adapter),
}));

import { selectReferenceAgreement } from "../referenceAgreement/queries";
import { log } from "../../log";
import { getS3Adapter } from "../../adapters";

describe("getReferenceAgreementDownloadUrl", () => {
  const testReferenceAgreementId = "reference-agreement-1";

  const mockActiveReferenceAgreement: Partial<SelectReferenceAgreementResult> = {
    id: testReferenceAgreementId,
    s3Path: "some/s3/path",
    inActiveUse: true,
  };

  const mockInactiveReferenceAgreement: Partial<SelectReferenceAgreementResult> = {
    id: testReferenceAgreementId,
    s3Path: "some/s3/path",
    inActiveUse: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(selectReferenceAgreement).mockResolvedValue(
      mockActiveReferenceAgreement as SelectReferenceAgreementResult
    );
    mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue("https://example.com/download");
  });

  it("throws REFERENCE_AGREEMENT_NOT_FOUND if the reference agreement does not exist", async () => {
    vi.mocked(selectReferenceAgreement).mockResolvedValueOnce(null);

    await expect(
      getReferenceAgreementDownloadUrl({}, { id: testReferenceAgreementId })
    ).rejects.toMatchObject({
      message: `Reference agreement ${testReferenceAgreementId} not found.`,
      extensions: { code: "REFERENCE_AGREEMENT_NOT_FOUND" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference agreement "${testReferenceAgreementId}" was requested, but could not be found.`
    );
  });

  it("throws REFERENCE_AGREEMENT_NOT_ACTIVE if the reference agreement is not in active use", async () => {
    vi.mocked(selectReferenceAgreement).mockResolvedValueOnce(
      mockInactiveReferenceAgreement as SelectReferenceAgreementResult
    );

    await expect(
      getReferenceAgreementDownloadUrl({}, { id: testReferenceAgreementId })
    ).rejects.toMatchObject({
      message: `Reference agreement ${testReferenceAgreementId} not found.`,
      extensions: { code: "REFERENCE_AGREEMENT_NOT_ACTIVE" },
    });
    expect(log.info).toHaveBeenCalledExactlyOnceWith(
      `Reference agreement "${testReferenceAgreementId}" was requested but is not assigned to any active reference configurations.`
    );
  });

  it("returns a presigned download URL for an active reference agreement", async () => {
    const result = await getReferenceAgreementDownloadUrl({}, { id: testReferenceAgreementId });
    expect(getS3Adapter).toHaveBeenCalledOnce();
    expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith("some/s3/path");
    expect(result).toBe("https://example.com/download");
  });
});

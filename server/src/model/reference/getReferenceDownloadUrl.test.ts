// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { DeepPartial } from "../../testUtilities";
import { GraphQLContext } from "../../auth";

// Functions under test
import { getReferenceDownloadUrl } from "./getReferenceDownloadUrl";

// Mock imports
vi.mock("./validateReferenceDownloadRequest", () => ({
  validateReferenceDownloadRequest: vi.fn(),
}));

vi.mock("../referenceAgreementAcceptance/queries", () => ({
  insertReferenceAgreementAcceptance: vi.fn(),
}));

const mockS3Adapter = {
  getPresignedDownloadUrl: vi.fn(),
};

vi.mock("../../adapters", () => ({
  getS3Adapter: vi.fn(() => mockS3Adapter),
}));

import { validateReferenceDownloadRequest } from "./validateReferenceDownloadRequest";
import { insertReferenceAgreementAcceptance } from "../referenceAgreementAcceptance/queries";
import { getS3Adapter } from "../../adapters";

describe("getReferenceDownloadUrl", () => {
  const testReferenceConfigurationId = "reference-configuration-1";
  const testReferenceAgreementId = "reference-agreement-1";
  const testReferenceId = "reference-1";
  const testUserId = "user-1";
  const testDownloadUrl = "https://example.com/download";
  const testS3Path = "some/s3/path";

  const testContext: DeepPartial<GraphQLContext> = {
    user: { id: testUserId },
  };

  const mockReferenceConfiguration = {
    reference: {
      id: testReferenceId,
      s3Path: testS3Path,
    },
    referenceAgreement: {
      id: testReferenceAgreementId,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateReferenceDownloadRequest).mockResolvedValue(
      mockReferenceConfiguration as any
    );
    mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue(testDownloadUrl);
  });

  it("calls validateReferenceDownloadRequest with the configuration ID and agreement ID", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId, acceptedAgreementId: testReferenceAgreementId },
      testContext as GraphQLContext
    );
    expect(validateReferenceDownloadRequest).toHaveBeenCalledExactlyOnceWith(
      testReferenceConfigurationId,
      testReferenceAgreementId
    );
  });

  it("inserts an acceptance record when an agreement ID is provided", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId, acceptedAgreementId: testReferenceAgreementId },
      testContext as GraphQLContext
    );
    expect(insertReferenceAgreementAcceptance).toHaveBeenCalledExactlyOnceWith({
      referenceId: testReferenceId,
      referenceAgreementId: testReferenceAgreementId,
      userId: testUserId,
    });
  });

  it("does not insert an acceptance record when no agreement ID is provided", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId },
      testContext as GraphQLContext
    );
    expect(insertReferenceAgreementAcceptance).not.toHaveBeenCalled();
  });

  it("returns a presigned download URL", async () => {
    const result = await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId },
      testContext as GraphQLContext
    );
    expect(getS3Adapter).toHaveBeenCalledOnce();
    expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(testS3Path);
    expect(result).toBe(testDownloadUrl);
  });
});

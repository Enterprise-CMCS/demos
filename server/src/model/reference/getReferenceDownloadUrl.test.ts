// Vitest and other helpers
import { beforeEach, describe, expect, it, vi } from "vitest";

// Types
import { DeepPartial } from "../../testUtilities";
import { GraphQLContext } from "../../auth";

// Functions under test
import { getReferenceDownloadUrl } from "./getReferenceDownloadUrl";

import { enqueueAndTrackRealtimeEmail } from "../email/emailNotification";
import { log } from "../../log";

vi.mock("../email/emailNotification", () => ({ enqueueAndTrackRealtimeEmail: vi.fn() }));
vi.mock("../../log", () => ({ log: { error: vi.fn() } }));

// Mock imports
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

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

import { prisma } from "../../prismaClient";
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

  const testReferenceName = "Sample Reference";
  const mockReferenceConfiguration = {
    id: testReferenceConfigurationId,
    reference: {
      id: testReferenceId,
      name: testReferenceName,
      s3Path: testS3Path,
    },
    referenceAgreement: {
      id: testReferenceAgreementId,
    },
  };

  // Mock transaction
  const mockTransaction: any = "Test!";
  const mockPrismaClient = {
    $transaction: vi.fn(),
    person: { findUniqueOrThrow: vi.fn() },
    referenceAgreement: { findUniqueOrThrow: vi.fn() },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    vi.mocked(validateReferenceDownloadRequest).mockResolvedValue(
      mockReferenceConfiguration as any
    );
    mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue(testDownloadUrl);
    mockPrismaClient.person.findUniqueOrThrow.mockResolvedValue({
      id: testUserId,
      email: "registered@example.test",
    });
    mockPrismaClient.referenceAgreement.findUniqueOrThrow.mockResolvedValue({
      id: testReferenceAgreementId,
      name: "Terms.pdf",
      s3Path: "agreement-key",
    });
    vi.mocked(enqueueAndTrackRealtimeEmail).mockResolvedValue("sqs-id");
  });

  it("creates a transaction whenever it is called", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId },
      testContext as GraphQLContext
    );
    expect(prisma).toHaveBeenCalledOnce();
    expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
  });

  it("calls validateReferenceDownloadRequest with the configuration ID, transaction, and agreement ID", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId, acceptedAgreementId: testReferenceAgreementId },
      testContext as GraphQLContext
    );
    expect(validateReferenceDownloadRequest).toHaveBeenCalledExactlyOnceWith(
      testReferenceConfigurationId,
      mockTransaction,
      testReferenceAgreementId
    );
  });

  it("inserts an acceptance record when an agreement ID is provided", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId, acceptedAgreementId: testReferenceAgreementId },
      testContext as GraphQLContext
    );
    expect(insertReferenceAgreementAcceptance).toHaveBeenCalledExactlyOnceWith(
      {
        referenceId: testReferenceId,
        referenceAgreementId: testReferenceAgreementId,
        userId: testUserId,
      },
      mockTransaction
    );
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
    expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledExactlyOnceWith(
      testS3Path,
      testReferenceName,
      { disposition: "attachment" }
    );
    expect(result).toBe(testDownloadUrl);
  });
  it("queues the accepted agreement for the registered user after committing acceptance", async () => {
    let committed = false;
    mockPrismaClient.$transaction.mockImplementation(async (callback) => {
      const result = await callback(mockTransaction);
      committed = true;
      return result;
    });
    vi.mocked(enqueueAndTrackRealtimeEmail).mockImplementation(async () => {
      expect(committed).toBe(true);
      return "sqs-id";
    });
    await expect(
      getReferenceDownloadUrl(
        {},
        {
          id: testReferenceConfigurationId,
          acceptedAgreementId: testReferenceAgreementId,
          emailRequested: true,
        },
        testContext as GraphQLContext
      )
    ).resolves.toBe(testDownloadUrl);
    expect(mockPrismaClient.person.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: testUserId },
    });
    expect(mockPrismaClient.referenceAgreement.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: testReferenceAgreementId },
    });
    expect(enqueueAndTrackRealtimeEmail).toHaveBeenCalledWith(
      {
        emailType: "Terms And Conditions Requested",
        entityType: "reference",
        entityId: testReferenceConfigurationId,
        triggeredBy: { type: "realtime", id: testUserId },
        payload: {
          recipients: { to: ["registered@example.test"] },
          reference: { name: testReferenceName },
          agreement: { id: testReferenceAgreementId, name: "Terms.pdf", s3Path: "agreement-key" },
        },
      },
      { referenceConfigurationId: testReferenceConfigurationId },
      [{ personId: testUserId }]
    );
  });

  it.each([false, undefined])(
    "does not request email when emailRequested is %s",
    async (emailRequested) => {
      await getReferenceDownloadUrl(
        {},
        {
          id: testReferenceConfigurationId,
          acceptedAgreementId: testReferenceAgreementId,
          emailRequested,
        },
        testContext as GraphQLContext
      );
      expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
      expect(mockPrismaClient.person.findUniqueOrThrow).not.toHaveBeenCalled();
    }
  );

  it("does not request email without an accepted agreement", async () => {
    await getReferenceDownloadUrl(
      {},
      { id: testReferenceConfigurationId, emailRequested: true },
      testContext as GraphQLContext
    );
    expect(enqueueAndTrackRealtimeEmail).not.toHaveBeenCalled();
  });

  it("logs an email failure and still returns the reference URL", async () => {
    const error = new Error("SQS unavailable");
    vi.mocked(enqueueAndTrackRealtimeEmail).mockRejectedValue(error);
    await expect(
      getReferenceDownloadUrl(
        {},
        {
          id: testReferenceConfigurationId,
          acceptedAgreementId: testReferenceAgreementId,
          emailRequested: true,
        },
        testContext as GraphQLContext
      )
    ).resolves.toBe(testDownloadUrl);
    expect(log.error).toHaveBeenCalledWith(
      { error, referenceConfigurationId: testReferenceConfigurationId, userId: testUserId },
      "Unable to queue accepted reference agreement email"
    );
  });
});

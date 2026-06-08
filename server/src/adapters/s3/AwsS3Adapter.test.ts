// Vitest and other helpers
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";

// Types
import { Prisma } from "@prisma/client";

// Functions under test
import { createAWSS3Adapter } from "./AwsS3Adapter";

// Mock imports
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "../../prismaClient";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
  CopyObjectCommand: vi.fn(),
  DeleteObjectCommand: vi.fn(),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

describe("AwsS3Adapter", () => {
  // Stash original environment
  let originalEnv: NodeJS.ProcessEnv;

  // Test values
  const testKey = "test-document-id";
  const testUploadBucket = "test-upload-bucket";
  const testCleanBucket = "test-clean-bucket";
  const testDeletedBucket = "test-deleted-bucket";

  // Mock values
  const mockSend = vi.fn();
  const mockS3Client: Partial<S3Client> = { send: mockSend };
  const mockPutObjectCommand: Partial<PutObjectCommand> = {
    input: { Bucket: "test-bucket", Key: "put-object-command" },
  };
  const mockGetObjectCommand: Partial<GetObjectCommand> = {
    input: { Bucket: "test-bucket", Key: "get-object-command" },
  };
  const mockCopyObjectCommand: Partial<CopyObjectCommand> = {
    input: { Bucket: "test-bucket", CopySource: "test-source", Key: "copy-object-command" },
  };
  const mockDeleteObjectCommand: Partial<DeleteObjectCommand> = {
    input: { Bucket: "test-bucket", Key: "delete-object-command" },
  };

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.UPLOAD_BUCKET = testUploadBucket;
    process.env.CLEAN_BUCKET = testCleanBucket;
    process.env.DELETED_BUCKET = testDeletedBucket;
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(S3Client).mockImplementation(function () {
      return mockS3Client as S3Client;
    });
    vi.mocked(PutObjectCommand).mockImplementation(function () {
      return mockPutObjectCommand as PutObjectCommand;
    });
    vi.mocked(GetObjectCommand).mockImplementation(function () {
      return mockGetObjectCommand as GetObjectCommand;
    });
    vi.mocked(CopyObjectCommand).mockImplementation(function () {
      return mockCopyObjectCommand as CopyObjectCommand;
    });
    vi.mocked(DeleteObjectCommand).mockImplementation(function () {
      return mockDeleteObjectCommand as DeleteObjectCommand;
    });
    vi.mocked(getSignedUrl).mockResolvedValue("https://presigned-url");
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  describe("getPresignedUploadUrl", () => {
    it("should create a presigned upload URL for the document", async () => {
      const adapter = createAWSS3Adapter();
      await adapter.getPresignedUploadUrl(testKey);

      expect(PutObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testUploadBucket,
        Key: testKey,
      });
      expect(getSignedUrl).toHaveBeenCalledExactlyOnceWith(mockS3Client, mockPutObjectCommand, {
        expiresIn: 10,
      });
    });
  });

  describe("getPresignedDownloadUrl", () => {
    it("should create a presigned download URL for the document", async () => {
      const adapter = createAWSS3Adapter();
      await adapter.getPresignedDownloadUrl(testKey);

      expect(GetObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testCleanBucket,
        Key: testKey,
      });
      expect(getSignedUrl).toHaveBeenCalledExactlyOnceWith(mockS3Client, mockGetObjectCommand, {
        expiresIn: 10,
      });
    });
  });

  describe("moveDocumentFromCleanToDeleted", () => {
    it("should copy document from clean to deleted bucket and delete from clean", async () => {
      const adapter = createAWSS3Adapter();
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 204 } });
      await adapter.moveDocumentFromCleanToDeleted(testKey);

      expect(CopyObjectCommand).toHaveBeenCalledExactlyOnceWith({
        CopySource: `${testCleanBucket}/${testKey}`,
        Bucket: testDeletedBucket,
        Key: testKey,
      });
      expect(DeleteObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testCleanBucket,
        Key: testKey,
      });
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenNthCalledWith(1, mockCopyObjectCommand);
      expect(mockSend).toHaveBeenNthCalledWith(2, mockDeleteObjectCommand);
    });

    it("should throw error if copy operation fails", async () => {
      const adapter = createAWSS3Adapter();
      mockSend.mockResolvedValue({ $metadata: { httpStatusCode: 500 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testKey)).rejects.toThrow(
        "Error while copying document to deleted bucket"
      );
      expect(CopyObjectCommand).toHaveBeenCalledExactlyOnceWith({
        CopySource: `${testCleanBucket}/${testKey}`,
        Bucket: testDeletedBucket,
        Key: testKey,
      });
      expect(DeleteObjectCommand).not.toHaveBeenCalled();
    });

    it("should throw error if delete operation fails", async () => {
      const adapter = createAWSS3Adapter();
      mockSend
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 200 } })
        .mockResolvedValueOnce({ $metadata: { httpStatusCode: 500 } });

      await expect(adapter.moveDocumentFromCleanToDeleted(testKey)).rejects.toThrow(
        "Failed to delete document from clean bucket"
      );
      expect(CopyObjectCommand).toHaveBeenCalledExactlyOnceWith({
        CopySource: `${testCleanBucket}/${testKey}`,
        Bucket: testDeletedBucket,
        Key: testKey,
      });
      expect(DeleteObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testCleanBucket,
        Key: testKey,
      });
    });
  });

  describe("uploadDocument", () => {
    const mockUploadInput: Prisma.DocumentPendingUploadCreateArgs["data"] = {
      name: "test.pdf",
      description: "Test document",
      documentTypeId: "State Application",
      applicationId: "app-123",
      phaseId: "Concept",
      ownerUserId: "user-123",
    };

    const mockCreate = vi.fn();
    const mockTransaction = {
      documentPendingUpload: { create: mockCreate },
    } as any;
    const mockPrismaClient = {
      $transaction: vi.fn(),
    };

    beforeEach(() => {
      mockCreate.mockResolvedValue({
        id: "pending-doc-123",
        ...mockUploadInput,
        createdAt: new Date(),
      });
      vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
      mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
    });

    it("should create the pending upload within the provided transaction", async () => {
      const adapter = createAWSS3Adapter();
      const result = await adapter.uploadDocument(mockUploadInput, mockTransaction);

      expect(prisma).not.toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalledExactlyOnceWith({ data: mockUploadInput });
      expect(result).toMatchObject(mockUploadInput);
    });

    it("should create the pending upload in a new transaction when none is provided", async () => {
      const adapter = createAWSS3Adapter();
      const result = await adapter.uploadDocument(mockUploadInput);

      expect(prisma).toHaveBeenCalledOnce();
      expect(mockPrismaClient.$transaction).toHaveBeenCalledOnce();
      expect(mockCreate).toHaveBeenCalledExactlyOnceWith({ data: mockUploadInput });
      expect(result).toMatchObject(mockUploadInput);
    });
  });

  describe("uploadOnDemandReport", () => {
    it("should upload the report to the clean bucket and return its key", async () => {
      const reportId = "report-123";
      const reportKey = `reports/on-demand/${reportId}.xlsx`;
      const reportFileData = Buffer.from("report-content");

      const adapter = createAWSS3Adapter();
      const result = await adapter.uploadOnDemandReport(reportId, reportFileData);

      expect(PutObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testCleanBucket,
        Key: reportKey,
        Body: reportFileData,
        ContentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      expect(mockSend).toHaveBeenCalledExactlyOnceWith(mockPutObjectCommand);
      expect(result).toBe(reportKey);
    });
  });

  describe("deleteOnDemandReport", () => {
    it("should delete the report from the clean bucket and return its key", async () => {
      const reportId = "report-123";
      const reportKey = `reports/on-demand/${reportId}.xlsx`;

      const adapter = createAWSS3Adapter();
      const result = await adapter.deleteOnDemandReport(reportId);

      expect(DeleteObjectCommand).toHaveBeenCalledExactlyOnceWith({
        Bucket: testCleanBucket,
        Key: reportKey,
      });
      expect(mockSend).toHaveBeenCalledExactlyOnceWith(mockDeleteObjectCommand);
      expect(result).toBe(reportKey);
    });
  });

  describe("S3Client configuration", () => {
    afterEach(() => {
      delete process.env.S3_ENDPOINT_LOCAL;
    });

    it("should configure S3Client with S3_ENDPOINT_LOCAL when set", () => {
      process.env.S3_ENDPOINT_LOCAL = "http://custom-endpoint:4566";

      createAWSS3Adapter();

      expect(S3Client).toHaveBeenCalledExactlyOnceWith({
        region: "us-east-1",
        endpoint: "http://custom-endpoint:4566",
        forcePathStyle: true,
        credentials: expect.any(Object),
      });
    });

    it("should configure S3Client with default config when no local endpoint", () => {
      delete process.env.S3_ENDPOINT_LOCAL;

      createAWSS3Adapter();

      expect(S3Client).toHaveBeenCalledExactlyOnceWith({});
    });
  });
});

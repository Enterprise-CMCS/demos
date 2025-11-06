import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { documentResolvers } from "./documentResolvers.js";
import { prisma } from "../../prismaClient.js";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

const mockS3ClientInstance = { send: vi.fn() };

vi.mock("@aws-sdk/client-s3", () => {
  class MockPutObjectCommand {
    public readonly input;
    constructor(input: unknown) {
      this.input = input;
    }
  }

  const MockS3Client = vi.fn(() => mockS3ClientInstance);

  return {
    S3Client: MockS3Client,
    PutObjectCommand: MockPutObjectCommand,
  };
});

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(),
}));

describe("documentResolvers uploadDocument", () => {
  const mockPrismaClient = {
    documentPendingUpload: {
      create: vi.fn(),
    },
  };

  const mockUser = { id: "user-123" };
  const baseInput = {
    name: "test-document",
    description: "Test description",
    documentType: "State Application", // Use a valid value from UploadDocumentInput
    applicationId: "app-123",
    phaseName: "Application Intake",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as unknown as ReturnType<typeof prisma>);
    mockPrismaClient.documentPendingUpload.create.mockResolvedValue({
      id: "pending-upload-id",
    });
    vi.mocked(getSignedUrl).mockResolvedValue("https://example.com/presigned-upload");

    process.env.UPLOAD_BUCKET = "unit-test-upload-bucket";
    process.env.S3_ENDPOINT_LOCAL = "http://localhost:4566";
  });

  afterEach(() => {
    delete process.env.UPLOAD_BUCKET;
    delete process.env.S3_ENDPOINT_LOCAL;
  });

  it("creates a pending upload and returns a presigned S3 upload URL", async () => {
    const result = await documentResolvers.Mutation.uploadDocument(
      null,
      { input: baseInput },
      { user: mockUser } as any
    );

    expect(mockPrismaClient.documentPendingUpload.create).toHaveBeenCalledWith({
      data: {
        name: baseInput.name,
        description: baseInput.description,
        ownerUserId: mockUser.id,
        documentTypeId: baseInput.documentType,
        applicationId: baseInput.applicationId,
        phaseId: baseInput.phaseName,
      },
    });

    expect(S3Client).toHaveBeenCalledWith({
      region: "us-east-1",
      endpoint: "http://localhost:4566",
      forcePathStyle: true,
      credentials: { // pragma: allowlist secret
        accessKeyId: "test", // pragma: allowlist secret
        secretAccessKey: "test", // pragma: allowlist secret
      },
    });

    const [client, command, options] = vi.mocked(getSignedUrl).mock.calls[0];
    expect(client).toBe(mockS3ClientInstance);
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect((command as any).input).toEqual({
      Bucket: "unit-test-upload-bucket",
      Key: "pending-upload-id",
    });
    expect(options).toEqual({ expiresIn: 3600 });

    expect(result).toEqual({
      presignedURL: "https://example.com/presigned-upload",
    });
  });
});

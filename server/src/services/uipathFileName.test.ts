import { HeadObjectCommand, type HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import { resolveFileNameWithExtension } from "./uipathFileName";

type MockS3HeadClient = {
  send: ReturnType<typeof vi.fn>;
};

function createMockS3HeadClient(output: HeadObjectCommandOutput): MockS3HeadClient {
  return {
    send: vi.fn().mockResolvedValue(output),
  };
}

describe("resolveFileNameWithExtension", () => {
  it("returns original document name when it already has an extension", async () => {
    const mockS3 = createMockS3HeadClient({ $metadata: { httpStatusCode: 200 } });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc.pdf",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.pdf");
    expect(mockS3.send).not.toHaveBeenCalled();
  });

  it("uses metadata filename extension when available", async () => {
    const mockS3 = createMockS3HeadClient({
      Metadata: {
        filename: "source.docx",
      },
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.docx");
    expect(mockS3.send).toHaveBeenCalledOnce();
    const command = mockS3.send.mock.calls[0]?.[0];
    expect(command).toBeInstanceOf(HeadObjectCommand);
    expect(command.input).toEqual({
      Bucket: "clean-bucket",
      Key: "123/doc",
    });
  });

  it("uses content-disposition filename extension when metadata filename is unavailable", async () => {
    const mockS3 = createMockS3HeadClient({
      ContentDisposition: 'attachment; filename="source.txt"',
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.txt");
  });

  it("uses content-type extension as a fallback", async () => {
    const mockS3 = createMockS3HeadClient({
      ContentType: "application/pdf; charset=utf-8",
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.pdf");
  });

  it("throws when no extension can be inferred", async () => {
    const mockS3 = createMockS3HeadClient({ $metadata: { httpStatusCode: 200 } });

    await expect(
      resolveFileNameWithExtension({
        bucket: "clean-bucket",
        key: "123/doc",
        documentName: "doc",
        s3Client: mockS3,
      })
    ).rejects.toThrow(
      "Unable to infer file extension for s3://clean-bucket/123/doc. Set object metadata filename/originalfilename or ContentType."
    );
  });
});

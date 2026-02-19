import {
  GetObjectCommand,
  HeadObjectCommand,
  type GetObjectCommandOutput,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { describe, expect, it, vi } from "vitest";
import { resolveFileNameWithExtension } from "./uipathFileName";

type MockS3Client = {
  send: ReturnType<typeof vi.fn>;
};

function createMockS3Client(
  headOutput: HeadObjectCommandOutput,
  getObjectOutput: GetObjectCommandOutput = { $metadata: { httpStatusCode: 200 } }
): MockS3Client {
  return {
    send: vi.fn().mockImplementation((command: unknown) => {
      if (command instanceof HeadObjectCommand) {
        return Promise.resolve(headOutput);
      }

      if (command instanceof GetObjectCommand) {
        return Promise.resolve(getObjectOutput);
      }

      throw new Error("Unexpected command type");
    }),
  };
}

describe("resolveFileNameWithExtension", () => {
  it("uses metadata filename extension when available", async () => {
    const mockS3 = createMockS3Client({
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

  it.each([
    { metadata: { "file-name": "source.docx" }, label: "file-name" },
    { metadata: { originalfilename: "source.docx" }, label: "originalfilename" },
    { metadata: { "original-file-name": "source.docx" }, label: "original-file-name" },
  ])("uses metadata $label extension aliases when available", async ({ metadata }) => {
    const mockS3 = createMockS3Client({
      Metadata: metadata,
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.docx");
  });

  it("uses content-disposition filename extension when metadata filename is unavailable", async () => {
    const mockS3 = createMockS3Client({
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

  it("uses UTF-8 content-disposition filename extension when present", async () => {
    const mockS3 = createMockS3Client({
      ContentDisposition: "attachment; filename*=UTF-8''source%20name.xlsx",
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.xlsx");
  });

  it("falls back to undecoded UTF-8 filename when URI decoding fails", async () => {
    const mockS3 = createMockS3Client({
      ContentDisposition: "attachment; filename*=UTF-8''source%ZZ.docx",
      $metadata: { httpStatusCode: 200 },
    });

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.docx");
  });

  it("uses content-type extension as a fallback", async () => {
    const mockS3 = createMockS3Client({
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

  it("uses file-type extension when metadata and content-type are missing", async () => {
    const mockS3 = createMockS3Client(
      {
        $metadata: { httpStatusCode: 200 },
      },
      {
        Body: {
          transformToByteArray: vi
            .fn()
            .mockResolvedValue(Uint8Array.from(Buffer.from("%PDF-1.7\nmock"))),
        } as unknown as GetObjectCommandOutput["Body"],
        $metadata: { httpStatusCode: 206 },
      }
    );

    const result = await resolveFileNameWithExtension({
      bucket: "clean-bucket",
      key: "123/doc",
      documentName: "doc",
      s3Client: mockS3,
    });

    expect(result).toBe("doc.pdf");
    expect(mockS3.send).toHaveBeenCalledTimes(2);
  });

  it("throws when no extension can be inferred", async () => {
    const mockS3 = createMockS3Client({ $metadata: { httpStatusCode: 200 } });

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

  it("throws when content-type is present but not recognized", async () => {
    const mockS3 = createMockS3Client({
      ContentType: "application/x-custom",
      $metadata: { httpStatusCode: 200 },
    });

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

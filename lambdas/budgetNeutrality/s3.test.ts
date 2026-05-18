import { describe, it, expect, beforeEach, vi } from "vitest";
import { Readable } from "node:stream";
import * as path from "node:path";
import * as os from "node:os";
import { resolveS3Location, downloadDocumentFromS3 } from "./s3";

vi.mock("@aws-sdk/client-s3");
vi.mock("node:fs");
vi.mock("node:stream/promises");

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

const mockedS3Send = vi.mocked(S3Client.prototype.send as any);

describe("s3 module", () => {
  describe("resolveS3Location", () => {
    it("should parse full s3:// URI with bucket and key", () => {
      const result = resolveS3Location("s3://my-bucket/path/to/file.xlsx");
      expect(result).toEqual({
        bucket: "my-bucket",
        key: "path/to/file.xlsx",
      });
    });

    it("should parse s3:// URI with nested paths", () => {
      const result = resolveS3Location("s3://bucket-name/folder/subfolder/document.xlsx");
      expect(result).toEqual({
        bucket: "bucket-name",
        key: "folder/subfolder/document.xlsx",
      });
    });

    it("should use CLEAN_BUCKET env var when path does not start with s3://", () => {
      process.env.CLEAN_BUCKET = "my-clean-bucket";
      const result = resolveS3Location("/documents/file.xlsx");
      expect(result).toEqual({
        bucket: "my-clean-bucket",
        key: "documents/file.xlsx",
      });
      delete process.env.CLEAN_BUCKET;
    });

    it("should use default clean-bucket when CLEAN_BUCKET env var is not set", () => {
      delete process.env.CLEAN_BUCKET;
      const result = resolveS3Location("documents/file.xlsx");
      expect(result).toEqual({
        bucket: "clean-bucket",
        key: "documents/file.xlsx",
      });
    });

    it("should strip leading slashes from relative paths", () => {
      process.env.CLEAN_BUCKET = "default-bucket";
      const result = resolveS3Location("///documents/file.xlsx");
      expect(result.key).toBe("documents/file.xlsx");
      delete process.env.CLEAN_BUCKET;
    });

    it("should throw error for invalid s3:// URI without key", () => {
      expect(() => resolveS3Location("s3://bucket-only")).toThrow(
        "Invalid document s3_path value: s3://bucket-only"
      );
    });

    it("should throw error for s3:// URI with empty bucket", () => {
      expect(() => resolveS3Location("s3:///path")).toThrow(
        "Invalid document s3_path value: s3:///path"
      );
    });

    it("should throw error for s3:// URI with trailing slash only", () => {
      expect(() => resolveS3Location("s3://bucket/")).toThrow(
        "Invalid document s3_path value: s3://bucket/"
      );
    });
  });

  describe("downloadDocumentFromS3", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      process.env.CLEAN_BUCKET = "test-bucket";
    });

    afterEach(() => {
      delete process.env.CLEAN_BUCKET;
    });

    it("should download document from S3 and save to temp directory", async () => {
      const mockStream = new Readable();
      const mockReadableStream = Readable.from(["test data"]);

      mockedS3Send.mockResolvedValue({
        Body: mockReadableStream,
      });

      vi.mocked(createWriteStream).mockReturnValue({} as any);
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const result = await downloadDocumentFromS3("test-file.xlsx");

      expect(result).toMatch(/^\/tmp.*test-file\.xlsx$/);
      expect(mockedS3Send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );
      expect(vi.mocked(pipeline)).toHaveBeenCalled();
    });

    it("should successfully resolve s3:// URI for download", async () => {
      const mockReadableStream = Readable.from(["test data"]);
      mockedS3Send.mockResolvedValue({
        Body: mockReadableStream,
      });

      vi.mocked(createWriteStream).mockReturnValue({} as any);
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const result = await downloadDocumentFromS3("s3://custom-bucket/documents/file.xlsx");

      expect(mockedS3Send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );
      expect(result).toContain("file.xlsx");
    });

    it("should successfully resolve relative path with CLEAN_BUCKET for download", async () => {
      process.env.CLEAN_BUCKET = "my-bucket";
      const mockReadableStream = Readable.from(["test data"]);
      mockedS3Send.mockResolvedValue({
        Body: mockReadableStream,
      });

      vi.mocked(createWriteStream).mockReturnValue({} as any);
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const result = await downloadDocumentFromS3("documents/file.xlsx");

      expect(mockedS3Send).toHaveBeenCalledWith(
        expect.any(GetObjectCommand)
      );
      expect(result).toContain("file.xlsx");
    });

    it("should throw error when S3 response body is empty", async () => {
      mockedS3Send.mockResolvedValue({
        Body: undefined,
      });

      await expect(
        downloadDocumentFromS3("s3://bucket/file.xlsx")
      ).rejects.toThrow(
        "No body returned when fetching s3://bucket/file.xlsx"
      );
    });

    it("should throw error when S3 request fails", async () => {
      const error = new Error("S3 connection failed");
      mockedS3Send.mockRejectedValue(error);

      await expect(
        downloadDocumentFromS3("s3://bucket/file.xlsx")
      ).rejects.toThrow("S3 connection failed");
    });

    it("should use basename of key as filename in temp directory", async () => {
      const mockReadableStream = Readable.from(["test data"]);
      mockedS3Send.mockResolvedValue({
        Body: mockReadableStream,
      });

      vi.mocked(createWriteStream).mockReturnValue({} as any);
      vi.mocked(pipeline).mockResolvedValue(undefined);

      const result = await downloadDocumentFromS3(
        "s3://bucket/deeply/nested/path/myfile.xlsx"
      );

      expect(result).toContain("myfile.xlsx");
    });

    it("should call pipeline to stream data to file", async () => {
      const mockReadableStream = Readable.from(["test data"]);
      mockedS3Send.mockResolvedValue({
        Body: mockReadableStream,
      });

      const mockWriteStream = {};
      vi.mocked(createWriteStream).mockReturnValue(mockWriteStream as any);
      vi.mocked(pipeline).mockResolvedValue(undefined);

      await downloadDocumentFromS3("test.xlsx");

      expect(vi.mocked(pipeline)).toHaveBeenCalledWith(
        mockReadableStream,
        mockWriteStream
      );
    });
  });
});

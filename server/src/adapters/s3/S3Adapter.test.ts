import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getS3Adapter } from "./S3Adapter.js";

// Mock the adapter creation functions
vi.mock("./AwsS3Adapter.js", () => ({
  createAWSS3Adapter: vi.fn(() => ({
    type: "aws",
    getPresignedUploadUrl: vi.fn(),
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  })),
}));

vi.mock("./LocalS3Adapter.js", () => ({
  createLocalS3Adapter: vi.fn(() => ({
    type: "local",
    getPresignedUploadUrl: vi.fn(),
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  })),
}));

import { createAWSS3Adapter } from "./AwsS3Adapter.js";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";

describe("S3Adapter", () => {
  const originalEnv = process.env.LOCAL_SIMPLE_UPLOAD;

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the singleton by clearing the module cache
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv !== undefined) {
      process.env.LOCAL_SIMPLE_UPLOAD = originalEnv;
    } else {
      delete process.env.LOCAL_SIMPLE_UPLOAD;
    }
  });

  describe("adapter creation", () => {
    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is not set", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "aws");
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is 'false'", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "aws");
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is empty string", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "aws");
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is 'True' (wrong case)", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "True";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "aws");
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is '1'", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "1";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "aws");
    });

    it("should create local S3 adapter when LOCAL_SIMPLE_UPLOAD is 'true'", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "true";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(createLocalS3Adapter).toHaveBeenCalledOnce();
      expect(createAWSS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toHaveProperty("type", "local");
    });
  });

  describe("singleton behavior", () => {
    it("should return the same instance on subsequent calls with AWS adapter", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter1 = getS3Adapter();
      const adapter2 = getS3Adapter();
      const adapter3 = getS3Adapter();

      expect(adapter1).toBe(adapter2);
      expect(adapter2).toBe(adapter3);
      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
    });

    it("should return the same instance on subsequent calls with local adapter", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "true";

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter1 = getS3Adapter();
      const adapter2 = getS3Adapter();
      const adapter3 = getS3Adapter();

      expect(adapter1).toBe(adapter2);
      expect(adapter2).toBe(adapter3);
      expect(createLocalS3Adapter).toHaveBeenCalledOnce();
    });

    it("should only call adapter creation function once for multiple calls", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;

      const { getS3Adapter } = await import("./S3Adapter.js");

      for (let i = 0; i < 10; i++) {
        getS3Adapter();
      }

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
    });

    it("should create adapter lazily on first call", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;

      // Just importing shouldn't create the adapter
      await import("./S3Adapter.js");

      expect(createAWSS3Adapter).not.toHaveBeenCalled();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();

      // Only when getS3Adapter is called should it be created
      const { getS3Adapter } = await import("./S3Adapter.js");
      getS3Adapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
    });
  });

  describe("adapter interface", () => {
    it("should return adapter with all required methods", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;

      const { getS3Adapter } = await import("./S3Adapter.js");
      const adapter = getS3Adapter();

      expect(adapter).toHaveProperty("getPresignedUploadUrl");
      expect(adapter).toHaveProperty("getPresignedDownloadUrl");
      expect(adapter).toHaveProperty("moveDocumentFromCleanToDeleted");
      expect(adapter).toHaveProperty("uploadDocument");
      expect(typeof adapter.getPresignedUploadUrl).toBe("function");
      expect(typeof adapter.getPresignedDownloadUrl).toBe("function");
      expect(typeof adapter.moveDocumentFromCleanToDeleted).toBe("function");
      expect(typeof adapter.uploadDocument).toBe("function");
    });
  });
});

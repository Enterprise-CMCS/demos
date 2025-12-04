import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { S3Adapter, createS3Adapter } from "./S3Adapter.js";

// Mock the adapter implementations
vi.mock("./AwsS3Adapter.js", () => ({
  createAWSS3Adapter: vi.fn(),
}));

vi.mock("./LocalS3Adapter.js", () => ({
  createLocalS3Adapter: vi.fn(),
}));

// Import after mocks
import { createAWSS3Adapter } from "./AwsS3Adapter.js";
import { createLocalS3Adapter } from "./LocalS3Adapter.js";

describe("S3Adapter", () => {
  const mockAWSAdapter: S3Adapter = {
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  };

  const mockLocalAdapter: S3Adapter = {
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  };

  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original env value
    originalEnv = process.env.LOCAL_SIMPLE_UPLOAD;
    // Clear the singleton instance by deleting and reimporting
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env value
    if (originalEnv === undefined) {
      delete process.env.LOCAL_SIMPLE_UPLOAD;
    } else {
      process.env.LOCAL_SIMPLE_UPLOAD = originalEnv;
    }
  });

  describe("createS3Adapter", () => {
    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is not set", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;
      vi.mocked(createAWSS3Adapter).mockReturnValue(mockAWSAdapter);

      // Re-import to get fresh module
      const { createS3Adapter: freshCreateAdapter } = await import(
        "./S3Adapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockAWSAdapter);
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is false", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3Adapter).mockReturnValue(mockAWSAdapter);

      const { createS3Adapter: freshCreateAdapter } = await import(
        "./S3Adapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
      expect(createLocalS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockAWSAdapter);
    });

    it("should create local adapter when LOCAL_SIMPLE_UPLOAD is true", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "true";
      vi.mocked(createLocalS3Adapter).mockReturnValue(mockLocalAdapter);

      const { createS3Adapter: freshCreateAdapter } = await import(
        "./S3Adapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createLocalS3Adapter).toHaveBeenCalledOnce();
      expect(createAWSS3Adapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockLocalAdapter);
    });

    it("should return singleton instance on subsequent calls", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3Adapter).mockReturnValue(mockAWSAdapter);

      const { createS3Adapter: freshCreateAdapter } = await import(
        "./S3Adapter.js?t=" + Date.now()
      );

      const adapter1 = freshCreateAdapter();
      const adapter2 = freshCreateAdapter();
      const adapter3 = freshCreateAdapter();

      expect(adapter1).toBe(adapter2);
      expect(adapter2).toBe(adapter3);
      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
    });

    it("should only initialize adapter once even with multiple calls", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3Adapter).mockReturnValue(mockAWSAdapter);

      const { createS3Adapter: freshCreateAdapter } = await import(
        "./S3Adapter.js?t=" + Date.now()
      );

      // Call multiple times rapidly
      const adapters = await Promise.all([
        freshCreateAdapter(),
        freshCreateAdapter(),
        freshCreateAdapter(),
        freshCreateAdapter(),
        freshCreateAdapter(),
      ]);

      // All should be the same instance
      adapters.forEach((adapter) => {
        expect(adapter).toBe(mockAWSAdapter);
      });

      // Factory should only be called once
      expect(createAWSS3Adapter).toHaveBeenCalledOnce();
    });
  });
});

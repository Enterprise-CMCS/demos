import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DocumentAdapter, createDocumentAdapter } from "./DocumentAdapter.js";

// Mock the adapter implementations
vi.mock("./AwsS3DocumentAdapter.js", () => ({
  createAWSS3DocumentAdapter: vi.fn(),
}));

vi.mock("./LocalDocumentAdapter.js", () => ({
  createLocalDocumentAdapter: vi.fn(),
}));

// Import after mocks
import { createAWSS3DocumentAdapter } from "./AwsS3DocumentAdapter.js";
import { createLocalDocumentAdapter } from "./LocalDocumentAdapter.js";

describe("DocumentAdapter", () => {
  const mockAWSAdapter: DocumentAdapter = {
    getPresignedDownloadUrl: vi.fn(),
    moveDocumentFromCleanToDeleted: vi.fn(),
    uploadDocument: vi.fn(),
  };

  const mockLocalAdapter: DocumentAdapter = {
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

  describe("createDocumentAdapter", () => {
    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is not set", async () => {
      delete process.env.LOCAL_SIMPLE_UPLOAD;
      vi.mocked(createAWSS3DocumentAdapter).mockReturnValue(mockAWSAdapter);

      // Re-import to get fresh module
      const { createDocumentAdapter: freshCreateAdapter } = await import(
        "./DocumentAdapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createAWSS3DocumentAdapter).toHaveBeenCalledOnce();
      expect(createLocalDocumentAdapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockAWSAdapter);
    });

    it("should create AWS S3 adapter when LOCAL_SIMPLE_UPLOAD is false", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3DocumentAdapter).mockReturnValue(mockAWSAdapter);

      const { createDocumentAdapter: freshCreateAdapter } = await import(
        "./DocumentAdapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createAWSS3DocumentAdapter).toHaveBeenCalledOnce();
      expect(createLocalDocumentAdapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockAWSAdapter);
    });

    it("should create local adapter when LOCAL_SIMPLE_UPLOAD is true", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "true";
      vi.mocked(createLocalDocumentAdapter).mockReturnValue(mockLocalAdapter);

      const { createDocumentAdapter: freshCreateAdapter } = await import(
        "./DocumentAdapter.js?t=" + Date.now()
      );

      const adapter = freshCreateAdapter();

      expect(createLocalDocumentAdapter).toHaveBeenCalledOnce();
      expect(createAWSS3DocumentAdapter).not.toHaveBeenCalled();
      expect(adapter).toBe(mockLocalAdapter);
    });

    it("should return singleton instance on subsequent calls", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3DocumentAdapter).mockReturnValue(mockAWSAdapter);

      const { createDocumentAdapter: freshCreateAdapter } = await import(
        "./DocumentAdapter.js?t=" + Date.now()
      );

      const adapter1 = freshCreateAdapter();
      const adapter2 = freshCreateAdapter();
      const adapter3 = freshCreateAdapter();

      expect(adapter1).toBe(adapter2);
      expect(adapter2).toBe(adapter3);
      expect(createAWSS3DocumentAdapter).toHaveBeenCalledOnce();
    });

    it("should only initialize adapter once even with multiple calls", async () => {
      process.env.LOCAL_SIMPLE_UPLOAD = "false";
      vi.mocked(createAWSS3DocumentAdapter).mockReturnValue(mockAWSAdapter);

      const { createDocumentAdapter: freshCreateAdapter } = await import(
        "./DocumentAdapter.js?t=" + Date.now()
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
      expect(createAWSS3DocumentAdapter).toHaveBeenCalledOnce();
    });
  });
});

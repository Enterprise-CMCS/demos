import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(() => ({
    bundle: {
      findUnique: vi.fn(),
    },
  })),
}));

vi.mock("../demonstration/demonstrationResolvers.js", () => ({
  getDemonstration: vi.fn(),
}));

vi.mock("../modification/modificationResolvers.js", () => ({
  getAmendment: vi.fn(),
  getExtension: vi.fn(),
}));

import { prisma } from "../../prismaClient.js";
import { getDemonstration } from "../demonstration/demonstrationResolvers.js";
import { getAmendment, getExtension } from "../modification/modificationResolvers.js";
import { getBundle } from "./bundleResolvers";
import { BundleType } from "../../types.js";

describe("bundleResolvers", () => {
  const mockPrisma = {
    bundle: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).mockReturnValue(mockPrisma);
  });

  describe("getBundle", () => {
    it("should return demonstration when bundleType is DEMONSTRATION", async () => {
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: "demo-1",
        name: "Test Demonstration",
        bundleTypeId: "DEMONSTRATION",
        description: "Test demonstration description",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      const result = await getBundle("demo-1");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "demo-1",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getDemonstration).toHaveBeenCalledWith(undefined, { id: "demo-1" });
      expect(result).toEqual(mockDemonstration);
    });

    it("should return amendment when bundleType is AMENDMENT", async () => {
      const mockBundle = {
        bundleType: {
          id: "AMENDMENT" as BundleType,
        },
      };

      const mockAmendment = {
        id: "amendment-1",
        name: "Test Amendment",
        bundleTypeId: "AMENDMENT",
        description: "Test amendment description",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getAmendment as any).mockResolvedValue(mockAmendment);

      const result = await getBundle("amendment-1");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "amendment-1",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getAmendment).toHaveBeenCalledWith(undefined, { id: "amendment-1" });
      expect(result).toEqual(mockAmendment);
    });

    it("should return extension when bundleType is EXTENSION", async () => {
      const mockBundle = {
        bundleType: {
          id: "EXTENSION" as BundleType,
        },
      };

      const mockExtension = {
        id: "extension-1",
        name: "Test Extension",
        bundleTypeId: "EXTENSION",
        description: "Test extension description",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getExtension as any).mockResolvedValue(mockExtension);

      const result = await getBundle("extension-1");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "extension-1",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getExtension).toHaveBeenCalledWith(undefined, { id: "extension-1" });
      expect(result).toEqual(mockExtension);
    });

    it("should return undefined when bundle is not found", async () => {
      mockPrisma.bundle.findUnique.mockResolvedValue(null);

      const result = await getBundle("non-existent");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "non-existent",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getDemonstration).not.toHaveBeenCalled();
      expect(getAmendment).not.toHaveBeenCalled();
      expect(getExtension).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("should return undefined when bundleType is not recognized", async () => {
      const mockBundle = {
        bundleType: {
          id: "UNKNOWN_TYPE" as BundleType,
        },
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);

      const result = await getBundle("unknown-bundle");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "unknown-bundle",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getDemonstration).not.toHaveBeenCalled();
      expect(getAmendment).not.toHaveBeenCalled();
      expect(getExtension).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it("should return undefined when bundleType.id is null", async () => {
      const mockBundle = {
        bundleType: {
          id: null,
        },
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);

      const result = await getBundle("bundle-with-null-id");

      expect(result).toBeUndefined();
    });

    it("should handle different bundle ID formats", async () => {
      const bundleIds = [
        "demo-123",
        "amendment_456",
        "extension-789-abc",
        "BUNDLE_ID_UPPERCASE",
        "bundle.with.dots",
        "bundle with spaces",
        "bundle-with-unicode-🚀",
      ];

      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: "test",
        name: "Test",
        bundleTypeId: "DEMONSTRATION",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      for (const bundleId of bundleIds) {
        await getBundle(bundleId);

        expect(mockPrisma.bundle.findUnique).toHaveBeenLastCalledWith({
          where: {
            id: bundleId,
          },
          select: {
            bundleType: true,
          },
        });

        expect(getDemonstration).toHaveBeenLastCalledWith(undefined, { id: bundleId });
      }
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockPrisma.bundle.findUnique.mockRejectedValue(dbError);

      await expect(getBundle("bundle-1")).rejects.toThrow("Database connection failed");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "bundle-1",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getDemonstration).not.toHaveBeenCalled();
      expect(getAmendment).not.toHaveBeenCalled();
      expect(getExtension).not.toHaveBeenCalled();
    });

    it("should handle errors from getDemonstration", async () => {
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const demoError = new Error("Demonstration not found");
      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockRejectedValue(demoError);

      await expect(getBundle("demo-1")).rejects.toThrow("Demonstration not found");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalled();
      expect(getDemonstration).toHaveBeenCalledWith(undefined, { id: "demo-1" });
    });

    it("should handle errors from getAmendment", async () => {
      const mockBundle = {
        bundleType: {
          id: "AMENDMENT" as BundleType,
        },
      };

      const amendmentError = new Error("Amendment not found");
      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getAmendment as any).mockRejectedValue(amendmentError);

      await expect(getBundle("amendment-1")).rejects.toThrow("Amendment not found");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalled();
      expect(getAmendment).toHaveBeenCalledWith(undefined, { id: "amendment-1" });
    });

    it("should handle errors from getExtension", async () => {
      const mockBundle = {
        bundleType: {
          id: "EXTENSION" as BundleType,
        },
      };

      const extensionError = new Error("Extension not found");
      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getExtension as any).mockRejectedValue(extensionError);

      await expect(getBundle("extension-1")).rejects.toThrow("Extension not found");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalled();
      expect(getExtension).toHaveBeenCalledWith(undefined, { id: "extension-1" });
    });

    it("should handle empty string bundle ID", async () => {
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: "",
        name: "Empty ID Demo",
        bundleTypeId: "DEMONSTRATION",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      const result = await getBundle("");

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: "",
        },
        select: {
          bundleType: true,
        },
      });

      expect(getDemonstration).toHaveBeenCalledWith(undefined, { id: "" });
      expect(result).toEqual(mockDemonstration);
    });

    it("should handle very long bundle IDs", async () => {
      const longBundleId = "a".repeat(1000);
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: longBundleId,
        name: "Long ID Demo",
        bundleTypeId: "DEMONSTRATION",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      const result = await getBundle(longBundleId);

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: {
          id: longBundleId,
        },
        select: {
          bundleType: true,
        },
      });

      expect(result).toEqual(mockDemonstration);
    });

    it("should handle concurrent getBundle calls", async () => {
      const mockBundles = [
        { bundleType: { id: "DEMONSTRATION" as BundleType } },
        { bundleType: { id: "AMENDMENT" as BundleType } },
        { bundleType: { id: "EXTENSION" as BundleType } },
      ];

      const mockResults = [
        { id: "demo-1", bundleTypeId: "DEMONSTRATION" },
        { id: "amendment-1", bundleTypeId: "AMENDMENT" },
        { id: "extension-1", bundleTypeId: "EXTENSION" },
      ];

      mockPrisma.bundle.findUnique
        .mockResolvedValueOnce(mockBundles[0])
        .mockResolvedValueOnce(mockBundles[1])
        .mockResolvedValueOnce(mockBundles[2]);

      (getDemonstration as any).mockResolvedValue(mockResults[0]);
      (getAmendment as any).mockResolvedValue(mockResults[1]);
      (getExtension as any).mockResolvedValue(mockResults[2]);

      const promises = [
        getBundle("demo-1"),
        getBundle("amendment-1"),
        getBundle("extension-1"),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(mockResults);
      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledTimes(3);
      expect(getDemonstration).toHaveBeenCalledTimes(1);
      expect(getAmendment).toHaveBeenCalledTimes(1);
      expect(getExtension).toHaveBeenCalledTimes(1);
    });

    it("should handle malformed bundleType structure", async () => {
      const malformedBundles = [
        { bundleType: {} },
        { bundleType: { name: "test" } },
        { bundleType: { id: undefined } },
        { bundleType: { id: 123 } },
        { bundleType: { id: [] } },
        { bundleType: { id: {} } },
      ];

      for (const malformedBundle of malformedBundles) {
        mockPrisma.bundle.findUnique.mockResolvedValue(malformedBundle);

        const result = await getBundle("malformed-bundle");

        expect(result).toBeUndefined();
        expect(getDemonstration).not.toHaveBeenCalled();
        expect(getAmendment).not.toHaveBeenCalled();
        expect(getExtension).not.toHaveBeenCalled();

        vi.clearAllMocks();
        (prisma as any).mockReturnValue(mockPrisma);
      }
    });

    it("should handle case sensitivity in bundle types", async () => {
      const caseSensitiveTypes = [
        "demonstration",
        "DEMONSTRATION",
        "Demonstration",
        "amendment",
        "AMENDMENT",
        "Amendment",
        "extension",
        "EXTENSION",
        "Extension",
      ];

      for (const bundleType of caseSensitiveTypes) {
        const mockBundle = {
          bundleType: {
            id: bundleType as BundleType,
          },
        };

        mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);

        const result = await getBundle("test-bundle");

        // Only uppercase versions should match
        if (bundleType === "DEMONSTRATION") {
          expect(getDemonstration).toHaveBeenCalled();
        } else if (bundleType === "AMENDMENT") {
          expect(getAmendment).toHaveBeenCalled();
        } else if (bundleType === "EXTENSION") {
          expect(getExtension).toHaveBeenCalled();
        } else {
          expect(result).toBeUndefined();
        }

        vi.clearAllMocks();
        (prisma as any).mockReturnValue(mockPrisma);
      }
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete workflow for demonstration bundle", async () => {
      const bundleId = "demo-123";
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: bundleId,
        name: "Complete Demo",
        bundleTypeId: "DEMONSTRATION",
        description: "Complete demonstration workflow",
        stateId: "CA",
        status: "Active",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      const result = await getBundle(bundleId);

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: { id: bundleId },
        select: { bundleType: true },
      });

      expect(getDemonstration).toHaveBeenCalledWith(undefined, { id: bundleId });
      expect(result).toEqual(mockDemonstration);
      expect(result.bundleTypeId).toBe("DEMONSTRATION");
    });

    it("should handle complete workflow for amendment bundle", async () => {
      const bundleId = "amendment-456";
      const mockBundle = {
        bundleType: {
          id: "AMENDMENT" as BundleType,
        },
      };

      const mockAmendment = {
        id: bundleId,
        name: "Complete Amendment",
        bundleTypeId: "AMENDMENT",
        description: "Complete amendment workflow",
        parentBundleId: "demo-123",
        status: "Active",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getAmendment as any).mockResolvedValue(mockAmendment);

      const result = await getBundle(bundleId);

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: { id: bundleId },
        select: { bundleType: true },
      });

      expect(getAmendment).toHaveBeenCalledWith(undefined, { id: bundleId });
      expect(result).toEqual(mockAmendment);
      expect(result.bundleTypeId).toBe("AMENDMENT");
    });

    it("should handle complete workflow for extension bundle", async () => {
      const bundleId = "extension-789";
      const mockBundle = {
        bundleType: {
          id: "EXTENSION" as BundleType,
        },
      };

      const mockExtension = {
        id: bundleId,
        name: "Complete Extension",
        bundleTypeId: "EXTENSION",
        description: "Complete extension workflow",
        parentBundleId: "demo-123",
        status: "Active",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getExtension as any).mockResolvedValue(mockExtension);

      const result = await getBundle(bundleId);

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledWith({
        where: { id: bundleId },
        select: { bundleType: true },
      });

      expect(getExtension).toHaveBeenCalledWith(undefined, { id: bundleId });
      expect(result).toEqual(mockExtension);
      expect(result.bundleTypeId).toBe("EXTENSION");
    });
  });

  describe("Performance and edge cases", () => {
    it("should handle rapid successive calls with same bundle ID", async () => {
      const bundleId = "rapid-test";
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const mockDemonstration = {
        id: bundleId,
        name: "Rapid Test Demo",
        bundleTypeId: "DEMONSTRATION",
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(mockDemonstration);

      const calls = Array.from({ length: 10 }, () => getBundle(bundleId));
      const results = await Promise.all(calls);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toEqual(mockDemonstration);
      });

      expect(mockPrisma.bundle.findUnique).toHaveBeenCalledTimes(10);
      expect(getDemonstration).toHaveBeenCalledTimes(10);
    });

    it("should handle memory pressure with large result objects", async () => {
      const bundleId = "large-bundle";
      const mockBundle = {
        bundleType: {
          id: "DEMONSTRATION" as BundleType,
        },
      };

      const largeDemonstration = {
        id: bundleId,
        name: "Large Demonstration",
        bundleTypeId: "DEMONSTRATION",
        largeData: new Array(10000).fill("large-data").join(""),
        metadata: {
          complexObject: new Array(1000).fill({ key: "value", data: "test" }),
        },
      };

      mockPrisma.bundle.findUnique.mockResolvedValue(mockBundle);
      (getDemonstration as any).mockResolvedValue(largeDemonstration);

      const result = await getBundle(bundleId);

      expect(result).toEqual(largeDemonstration);
      expect(result.largeData).toBeDefined();
      expect(result.metadata.complexObject).toHaveLength(1000);
    });
  });
});
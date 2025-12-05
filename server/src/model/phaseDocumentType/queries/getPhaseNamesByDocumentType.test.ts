import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPhasesByDocumentType } from "./getPhaseNamesByDocumentType.js";
import { DocumentType } from "../../../types.js";

describe("getPhasesByDocumentType", () => {
  const transactionMocks = {
    phaseDocumentType: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    phaseDocumentType: {
      findMany: transactionMocks.phaseDocumentType.findMany,
    },
  } as any;
  const testDocumentType: DocumentType = "State Application";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should get phases by document type from the database", async () => {
    // The mock return value is to support the map statement at the end
    vi.mocked(transactionMocks.phaseDocumentType.findMany).mockResolvedValue([
      {
        phase: {
          id: "Concept",
          name: "Concept",
          order: 1,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      },
      {
        phase: {
          id: "Application Intake",
          name: "Application Intake",
          order: 2,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      },
    ]);
    const expectedCall = {
      include: {
        phase: true,
      },
      where: {
        documentTypeId: testDocumentType,
      },
    };

    await getPhasesByDocumentType(mockTransaction, testDocumentType);
    expect(transactionMocks.phaseDocumentType.findMany).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });

  it("should map phaseDocumentType results to array of phases", async () => {
    const mockPhaseDocumentTypes = [
      {
        id: "pdt-1",
        phaseId: "Concept",
        documentTypeId: testDocumentType,
        phase: {
          id: "Concept",
          name: "Concept",
          order: 1,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      },
      {
        id: "pdt-2",
        phaseId: "Application Intake",
        documentTypeId: testDocumentType,
        phase: {
          id: "Application Intake",
          name: "Application Intake",
          order: 2,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      },
    ];
    vi.mocked(transactionMocks.phaseDocumentType.findMany).mockResolvedValue(
      mockPhaseDocumentTypes
    );

    const result = await getPhasesByDocumentType(mockTransaction, testDocumentType);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockPhaseDocumentTypes[0].phase);
    expect(result[1]).toEqual(mockPhaseDocumentTypes[1].phase);
  });
});

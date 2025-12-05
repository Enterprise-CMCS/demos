import { describe, it, expect, vi, beforeEach } from "vitest";
import { startPhaseByDocument } from "./startPhaseByDocument.js";
import { ApplicationDateInput, DocumentType, PhaseNameWithTrackedStatus } from "../../types.js";
import { EasternNow } from "../../dateUtilities.js";

// Mock dependencies
vi.mock("../phaseDocumentType/queries/getPhaseNamesByDocumentType.js", () => ({
  getPhasesByDocumentType: vi.fn(),
}));

vi.mock("../applicationPhase/index.js", () => ({
  startPhase: vi.fn(),
}));

vi.mock("../applicationDate/createPhaseStartDate.js", () => ({
  createPhaseStartDate: vi.fn(),
}));

import { getPhasesByDocumentType } from "../phaseDocumentType/queries/getPhaseNamesByDocumentType.js";
import { startPhase } from "../applicationPhase/index.js";
import { createPhaseStartDate } from "../applicationDate/createPhaseStartDate.js";
import { Phase as PrismaPhase } from "@prisma/client";
import { TZDate } from "@date-fns/tz";

describe("startPhaseByDocument", () => {
  const mockTransaction = "mockTransaction" as any;
  const testApplicationId = "app-123-456";
  const testDocumentType: DocumentType = "State Application";
  const mockEasternNow: EasternNow = {
    "End of Day": {
      easternTZDate: new TZDate("2025-01-15T23:59:59.999Z"),
      isEasternTZDate: true,
    },
    "Start of Day": {
      easternTZDate: new TZDate("2025-01-15T00:00:00.000Z"),
      isEasternTZDate: true,
    },
  };

  const mockPhase: PrismaPhase = {
    id: "Concept",
    phaseNumber: 1,
  };

  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Application Intake Completion Date",
    dateValue: new TZDate("2025-01-20"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should start phase and return start date when phase is successfully started", async () => {
    vi.mocked(getPhasesByDocumentType).mockResolvedValue([mockPhase]);
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(mockPhaseStartDate);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      testDocumentType,
      mockEasternNow
    );

    expect(getPhasesByDocumentType).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testDocumentType
    );
    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toEqual(mockPhaseStartDate);
  });

  it("should return null when phase is not started", async () => {
    vi.mocked(getPhasesByDocumentType).mockResolvedValue([mockPhase]);
    vi.mocked(startPhase).mockResolvedValue(false);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      testDocumentType,
      mockEasternNow
    );

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("should return null when createPhaseStartDate returns null", async () => {
    vi.mocked(getPhasesByDocumentType).mockResolvedValue([mockPhase]);
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(null);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      testDocumentType,
      mockEasternNow
    );

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toBeNull();
  });

  it("should throw error when document type is associated with no phases", async () => {
    vi.mocked(getPhasesByDocumentType).mockResolvedValue([]);

    await expect(
      startPhaseByDocument(mockTransaction, testApplicationId, testDocumentType, mockEasternNow)
    ).rejects.toThrow(
      `Document type ${testDocumentType} is associated with 0 phases, expected exactly 1 phase.`
    );

    expect(getPhasesByDocumentType).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testDocumentType
    );
    expect(startPhase).not.toHaveBeenCalled();
    expect(createPhaseStartDate).not.toHaveBeenCalled();
  });

  it("should throw error when document type is associated with multiple phases", async () => {
    const multiplePhases: PrismaPhase[] = [
      mockPhase,
      {
        id: "Application Intake",
        phaseNumber: 2,
      },
      {
        id: "Review",
        phaseNumber: 3,
      },
    ];
    vi.mocked(getPhasesByDocumentType).mockResolvedValue(multiplePhases);

    await expect(
      startPhaseByDocument(mockTransaction, testApplicationId, testDocumentType, mockEasternNow)
    ).rejects.toThrow(
      `Document type ${testDocumentType} is associated with 3 phases, expected exactly 1 phase.`
    );

    expect(getPhasesByDocumentType).toHaveBeenCalledExactlyOnceWith(
      mockTransaction,
      testDocumentType
    );
    expect(startPhase).not.toHaveBeenCalled();
    expect(createPhaseStartDate).not.toHaveBeenCalled();
  });

  it("should use phase ID from the first phase when exactly one phase exists", async () => {
    const testPhase: PrismaPhase = {
      id: "Application Intake" as PhaseNameWithTrackedStatus,
      phaseNumber: 1,
    };
    vi.mocked(getPhasesByDocumentType).mockResolvedValue([testPhase]);
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue({
      dateType: "Application Intake Start Date",
      dateValue: new TZDate("2025-01-15"),
    });

    await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      testDocumentType,
      mockEasternNow
    );

    expect(startPhase).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Application Intake",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith(
      "Application Intake",
      mockEasternNow
    );
  });
});

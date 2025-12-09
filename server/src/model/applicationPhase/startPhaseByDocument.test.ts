import { describe, it, expect, vi, beforeEach } from "vitest";
import { TZDate } from "@date-fns/tz";
import { ApplicationDateInput, UploadDocumentInput } from "../../types";
import { EasternNow } from "../../dateUtilities";
import { createPhaseStartDate } from "../applicationDate";
import { startPhaseByDocument, setPhaseToStarted } from ".";

vi.mock("./setPhaseToStarted", () => ({
  setPhaseToStarted: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  createPhaseStartDate: vi.fn(),
}));

describe("startPhaseByDocument", () => {
  const mockTransaction = "mockTransaction" as any;
  const testApplicationId = "app-123-456";
  const mockDocument: Pick<UploadDocumentInput, "phaseName"> = {
    phaseName: "Concept",
  };
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

  const mockPhaseStartDate: ApplicationDateInput = {
    dateType: "Application Intake Completion Date",
    dateValue: new TZDate("2025-01-20"),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should start phase and return start date when phase is successfully started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(mockPhaseStartDate);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      mockDocument,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toEqual(mockPhaseStartDate);
  });

  it("should return null when phase is not started", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(false);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      mockDocument,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it("should return null when createPhaseStartDate returns null", async () => {
    vi.mocked(setPhaseToStarted).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(null);

    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      mockDocument,
      mockEasternNow
    );

    expect(setPhaseToStarted).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      "Concept",
      mockTransaction
    );
    expect(createPhaseStartDate).toHaveBeenCalledExactlyOnceWith("Concept", mockEasternNow);
    expect(result).toBeNull();
  });

  it("should return null immediately when phaseName is 'None'", async () => {
    const result = await startPhaseByDocument(
      mockTransaction,
      testApplicationId,
      {
        phaseName: "None",
      },
      mockEasternNow
    );

    expect(setPhaseToStarted).not.toHaveBeenCalled();
    expect(createPhaseStartDate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

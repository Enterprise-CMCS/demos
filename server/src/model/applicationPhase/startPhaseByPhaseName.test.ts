import { describe, it, expect, vi, beforeEach } from "vitest";
import { startPhaseByPhaseName } from "./startPhaseByPhaseName.js";
import {
  ApplicationDateInput,
  DocumentType,
  PhaseName,
  PhaseNameWithTrackedStatus,
} from "../../types.js";
import { EasternNow } from "../../dateUtilities.js";

// Mock dependencies
vi.mock("../applicationPhase/index.js", () => ({
  startPhase: vi.fn(),
}));

vi.mock("../applicationDate/createPhaseStartDate.js", () => ({
  createPhaseStartDate: vi.fn(),
}));

import { startPhase } from "./index.js";
import { createPhaseStartDate } from "../applicationDate/createPhaseStartDate.js";
import { Phase as PrismaPhase } from "@prisma/client";
import { TZDate } from "@date-fns/tz";

describe("startPhaseByPhaseName", () => {
  const mockTransaction = "mockTransaction" as any;
  const testApplicationId = "app-123-456";
  const testPhaseName: PhaseName = "Concept";
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
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(mockPhaseStartDate);

    const result = await startPhaseByPhaseName(
      mockTransaction,
      testApplicationId,
      testPhaseName,
      mockEasternNow
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
    vi.mocked(startPhase).mockResolvedValue(false);

    const result = await startPhaseByPhaseName(
      mockTransaction,
      testApplicationId,
      testPhaseName,
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
    vi.mocked(startPhase).mockResolvedValue(true);
    vi.mocked(createPhaseStartDate).mockReturnValue(null);

    const result = await startPhaseByPhaseName(
      mockTransaction,
      testApplicationId,
      testPhaseName,
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

  it("should return null immediately when phaseName is 'None'", async () => {
    const result = await startPhaseByPhaseName(
      mockTransaction,
      testApplicationId,
      "None",
      mockEasternNow
    );

    expect(startPhase).not.toHaveBeenCalled();
    expect(createPhaseStartDate).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

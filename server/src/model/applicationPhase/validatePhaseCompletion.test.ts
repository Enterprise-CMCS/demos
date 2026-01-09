import { describe, it, expect, vi, beforeEach } from "vitest";
import { validatePhaseCompletion } from "./validatePhaseCompletion.js";
import { PhaseNameWithTrackedStatus } from "../../types.js";

// Mock imports
import {
  getApplicationPhaseDocumentTypes,
  getApplicationPhaseStatuses,
  checkPhaseCompletionRules,
} from ".";
import { getApplicationDates } from "../applicationDate";
import { getApplication } from "../application/applicationResolvers";

vi.mock(".", () => ({
  getApplicationPhaseDocumentTypes: vi.fn(),
  getApplicationPhaseStatuses: vi.fn(),
  checkPhaseCompletionRules: vi.fn(),
}));

vi.mock("../applicationDate", () => ({
  getApplicationDates: vi.fn(),
}));

vi.mock("../application/applicationResolvers", () => ({
  getApplication: vi.fn(),
}));

describe("validatePhaseCompletion", () => {
  const testApplicationId: string = "4884dd86-4ebd-4530-9204-0d687e4ba6c7";
  const testPhaseName: PhaseNameWithTrackedStatus = "Approval Package";
  const testApplicationDates: any = "Test Application Dates";
  const testApplicationPhaseDocumentTypes: any = "Test Application Phase Document Types";
  const testApplicationPhaseStatuses: any = "Test Application Phase Statuses";
  const mockTransaction: any = "A mock transaction";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should pull required data and validate that the phase completion rules are met", async () => {
    vi.mocked(getApplicationDates).mockReturnValue(testApplicationDates);
    vi.mocked(getApplicationPhaseDocumentTypes).mockReturnValue(testApplicationPhaseDocumentTypes);
    vi.mocked(getApplicationPhaseStatuses).mockReturnValue(testApplicationPhaseStatuses);
    vi.mocked(getApplication).mockReturnValue({
      clearanceLevelId: "CMS (OSORA)",
    } as any);

    await validatePhaseCompletion(testApplicationId, testPhaseName, mockTransaction);
    expect(getApplicationDates).toHaveBeenCalledExactlyOnceWith(testApplicationId, mockTransaction);
    expect(getApplicationPhaseDocumentTypes).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      mockTransaction
    );
    expect(getApplicationPhaseStatuses).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      mockTransaction
    );
    expect(checkPhaseCompletionRules).toHaveBeenCalledExactlyOnceWith(
      testApplicationId,
      testPhaseName,
      testApplicationDates,
      testApplicationPhaseDocumentTypes,
      testApplicationPhaseStatuses,
      "CMS (OSORA)"
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplicationPhaseDocumentTypes } from "./getApplicationPhaseDocumentTypes.js";

describe("getApplicationPhaseDocumentTypes", () => {
  const transactionMocks = {
    document: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    document: {
      findMany: transactionMocks.document.findMany,
    },
  } as any;
  const testApplicationId: string = "2833603e-0f61-4d18-a74d-08e8f22ffed3";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.document.findMany).mockResolvedValue([
      {
        phaseId: "Concept",
        documentTypeId: "The Document",
      },
      {
        phaseId: "Application Intake",
        documentTypeId: "A Better Document",
      },
    ]);
    const expectedCall = {
      select: {
        phaseId: true,
        documentTypeId: true,
      },
      distinct: ["phaseId", "documentTypeId"],
      where: {
        applicationId: testApplicationId,
        NOT: {
          phaseId: "None",
        },
      },
    };

    await getApplicationPhaseDocumentTypes(testApplicationId, mockTransaction);
    expect(transactionMocks.document.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

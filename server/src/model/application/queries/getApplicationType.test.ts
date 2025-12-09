import { describe, it, expect, vi, beforeEach } from "vitest";
import { getApplicationType } from "./getApplicationType.js";

describe("getApplicationType", () => {
  const transactionMocks = {
    application: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      findUniqueOrThrow: transactionMocks.application.findUniqueOrThrow,
    },
  } as any;
  const testApplicationId: string = "f036a1a4-039f-464a-b73c-f806b0ff17b6";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request the application type for the application from the database", async () => {
    // The mock return value is to support the return at the end
    vi.mocked(transactionMocks.application.findUniqueOrThrow).mockResolvedValue({
      applicationTypeId: "Demonstration",
    });
    const expectedCall = {
      select: {
        applicationTypeId: true,
      },
      where: {
        id: testApplicationId,
      },
    };

    await getApplicationType(mockTransaction, testApplicationId);
    expect(transactionMocks.application.findUniqueOrThrow).toHaveBeenCalledExactlyOnceWith(
      expectedCall
    );
  });
});

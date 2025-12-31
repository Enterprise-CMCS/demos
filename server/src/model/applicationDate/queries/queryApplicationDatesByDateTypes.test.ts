import { describe, it, expect, vi, beforeEach } from "vitest";
import { queryApplicationDatesByDateTypes } from "./queryApplicationDatesByDateTypes.js";
import { DateType } from "../../../types";

describe("queryApplicationDatesByDateTypes", () => {
  const transactionMocks = {
    applicationDate: {
      findMany: vi.fn(),
    },
  };
  const mockTransaction = {
    applicationDate: {
      findMany: transactionMocks.applicationDate.findMany,
    },
  } as any;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should request dates for the application from the database by date types", async () => {
    const testApplicationId = "f036a1a4-039f-464a-b73c-f806b0ff17b6";
    const testDateTypes: DateType[] = ["Concept Start Date", "Federal Comment Period Start Date"];

    const expectedCall = {
      where: {
        applicationId: testApplicationId,
        dateTypeId: { in: testDateTypes },
      },
      select: {
        dateTypeId: true,
        dateValue: true,
      },
    };

    await queryApplicationDatesByDateTypes(mockTransaction, testApplicationId, testDateTypes);
    expect(transactionMocks.applicationDate.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
  });
});

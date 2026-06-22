import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteBudgetNeutralityWorkbook } from "./deleteBudgetNeutralityWorkbook";

describe("deleteBudgetNeutralityWorkbook", () => {
  const transactionMocks = {
    budgetNeutralityWorkbook: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    budgetNeutralityWorkbook: {
      delete: transactionMocks.budgetNeutralityWorkbook.delete,
    },
  } as any;
  const testBudgetNeutralityWorkbookId = "doc-123-456";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete budgetNeutralityWorkbook from the database", async () => {
    const where = { id: testBudgetNeutralityWorkbookId };

    await deleteBudgetNeutralityWorkbook(where, mockTransaction);
    expect(transactionMocks.budgetNeutralityWorkbook.delete).toHaveBeenCalledExactlyOnceWith({ where });
  });

  it("should throw an error if the budgetNeutralityWorkbook cannot be deleted", async () => {
    const where = { id: testBudgetNeutralityWorkbookId };
    transactionMocks.budgetNeutralityWorkbook.delete.mockRejectedValueOnce("Prisma error :(");

    await expect(deleteBudgetNeutralityWorkbook(where, mockTransaction)).rejects.toThrow("Prisma error :(");
    expect(transactionMocks.budgetNeutralityWorkbook.delete).toHaveBeenCalledExactlyOnceWith({ where });
  });
});

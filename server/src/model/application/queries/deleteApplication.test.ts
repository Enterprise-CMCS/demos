import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApplicationType } from "../../../types";
import { deleteApplication } from "./deleteApplication";

// Mock imports
import { handlePrismaError } from "../../../errors/handlePrismaError";

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

describe("deleteApplication", () => {
  const transactionMocks = {
    application: {
      delete: vi.fn(),
    },
    demonstration: {
      delete: vi.fn(),
    },
    amendment: {
      delete: vi.fn(),
    },
    extension: {
      delete: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      delete: transactionMocks.application.delete,
    },
    demonstration: {
      delete: transactionMocks.demonstration.delete,
    },
    amendment: {
      delete: transactionMocks.amendment.delete,
    },
    extension: {
      delete: transactionMocks.extension.delete,
    },
  } as any;
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testAmendmentApplicationTypeId: ApplicationType = "Amendment";
  const testExtensionApplicationTypeId: ApplicationType = "Extension";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should delete the application and then the demonstration in a transaction", async () => {
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
    };
    await deleteApplication(testApplicationId, testDemonstrationApplicationTypeId, mockTransaction);
    expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
    expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should delete the application and then the amendment in a transaction", async () => {
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
    };
    await deleteApplication(testApplicationId, testAmendmentApplicationTypeId, mockTransaction);
    expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should delete the application and then the extension in a transaction", async () => {
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
    };
    await deleteApplication(testApplicationId, testExtensionApplicationTypeId, mockTransaction);
    expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
    expect(transactionMocks.extension.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(handlePrismaError).not.toHaveBeenCalled();
  });

  it("should properly handle failures when doing a delete", async () => {
    const testError = new Error("Database connection failed");
    transactionMocks.application.delete.mockRejectedValueOnce(testError);
    const expectedCall = {
      where: {
        id: testApplicationId,
      },
    };
    await expect(
      deleteApplication(testApplicationId, testDemonstrationApplicationTypeId, mockTransaction)
    ).rejects.toThrowError(testHandlePrismaError);
    expect(transactionMocks.application.delete).toHaveBeenCalledExactlyOnceWith(expectedCall);
    expect(transactionMocks.demonstration.delete).not.toHaveBeenCalled();
    expect(transactionMocks.amendment.delete).not.toHaveBeenCalled();
    expect(transactionMocks.extension.delete).not.toHaveBeenCalled();
    expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
  });
});

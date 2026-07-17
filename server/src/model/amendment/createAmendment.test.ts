import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAmendment } from "./createAmendment";
import { ApplicationStatus, ApplicationType, PhaseName } from "../../types";
import { Prisma } from "@prisma/client";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock(".", () => ({
  validateCreateAmendmentInput: vi.fn(),
}));

import { prisma } from "../../prismaClient";
import { validateCreateAmendmentInput } from ".";

describe("createAmendment", () => {
  const testDemonstrationId = "518aa497-d547-422e-95a0-02076c7f7698";
  const testAmendmentName = "The Amendment";
  const testAmendmentTypeId: ApplicationType = "Amendment";
  const testAmendmentStatusId: ApplicationStatus = "Pre-Submission";
  const testAmendmentPhaseId: PhaseName = "Concept";

  const transactionMocks = {
    application: {
      create: vi.fn(),
    },
    amendment: {
      create: vi.fn(),
    },
  };

  const mockTransaction = {
    application: {
      create: transactionMocks.application.create,
    },
    amendment: {
      create: transactionMocks.amendment.create,
    },
  };

  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
  };

  const testAmendmentId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testAmendmentDescription = "A description of an amendment";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  it("should validate and create an application and an amendment in a transaction", async () => {
    transactionMocks.application.create.mockResolvedValueOnce({
      id: testAmendmentId,
      applicationTypeId: testAmendmentTypeId,
    });
    const testInput: Pick<
      Prisma.AmendmentUncheckedCreateInput,
      "demonstrationId" | "name" | "description" | "signatureLevelId"
    > = {
      demonstrationId: testDemonstrationId,
      name: testAmendmentName,
      description: testAmendmentDescription,
      signatureLevelId: "OA",
    };
    await createAmendment(testInput);
    expect(validateCreateAmendmentInput).toHaveBeenCalledExactlyOnceWith(
      {
        demonstrationId: testDemonstrationId,
        name: testAmendmentName,
        description: testAmendmentDescription,
        signatureLevelId: "OA",
      },
      mockTransaction
    );
    expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        applicationTypeId: testAmendmentTypeId,
      },
    });
    expect(transactionMocks.amendment.create).toHaveBeenCalledExactlyOnceWith({
      data: {
        id: testAmendmentId,
        applicationTypeId: testAmendmentTypeId,
        demonstrationId: testDemonstrationId,
        name: testAmendmentName,
        description: testAmendmentDescription,
        statusId: testAmendmentStatusId,
        currentPhaseId: testAmendmentPhaseId,
        demonstrationStatusId: "Approved" satisfies ApplicationStatus,
        signatureLevelId: "OA",
      },
    });
  });
});

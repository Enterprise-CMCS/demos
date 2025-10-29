import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import {
  __getAmendment,
  __getManyAmendments,
  __createAmendment,
  __updateAmendment,
  __deleteAmendment,
  __resolveParentDemonstration,
} from "./amendmentResolvers.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateAmendmentInput,
  PhaseName,
} from "../../types.js";
import {
  getApplication,
  getManyApplications,
  deleteApplication,
  resolveApplicationDocuments,
  // None of these are tested but need to be exported to avoid mocking issues
  resolveApplicationCurrentPhaseName,
  resolveApplicationStatus,
  resolveApplicationPhases,
} from "../application/applicationResolvers.js";
import { prisma } from "../../prismaClient.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("../application/applicationResolvers.js", () => ({
  getApplication: vi.fn(),
  getManyApplications: vi.fn(),
  deleteApplication: vi.fn(),
  resolveApplicationDocuments: vi.fn(),
  resolveApplicationCurrentPhaseName: vi.fn(),
  resolveApplicationStatus: vi.fn(),
  resolveApplicationPhases: vi.fn(),
}));

describe("amendmentResolvers", () => {
  const mockApplicationTransactionCreate = vi.fn();
  const mockAmendmentTransactionCreate = vi.fn();
  const mockAmendmentTransactionUpdate = vi.fn();
  const mockAmendmentUpdate = vi.fn();
  const mockTransaction = {
    application: {
      create: mockApplicationTransactionCreate,
    },
    amendment: {
      create: mockAmendmentTransactionCreate,
      update: mockAmendmentTransactionUpdate,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    amendment: {
      update: mockAmendmentUpdate,
    },
  };
  const testApplicationId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testAmendmentName = "The Amendment";
  const testAmendmentDescription = "A description of an amendment";

  const testDemonstrationApplicationTypeId: ApplicationType = "Demonstration";
  const testAmendmentApplicationTypeId: ApplicationType = "Amendment";
  const testExtensionApplicationTypeId: ApplicationType = "Extension";
  const testPhaseId: PhaseName = "Application Intake";
  const testApplicationStatusId: ApplicationStatus = "Approved";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__getAmendment", () => {
    it("should request the amendment", async () => {
      const testInputData = {
        id: testApplicationId,
      };
      await __getAmendment(undefined, testInputData);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId, "Amendment");
    });
  });
});

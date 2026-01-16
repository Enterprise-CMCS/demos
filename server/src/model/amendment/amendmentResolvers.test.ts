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
  UpdateAmendmentInput,
} from "../../types.js";
import { Amendment as PrismaAmendment } from "@prisma/client";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient.js";
import {
  getApplication,
  getManyApplications,
  deleteApplication,
  // None of these are tested but need to be exported to avoid mocking issues
  resolveApplicationDocuments,
  resolveApplicationCurrentPhaseName,
  resolveApplicationStatus,
  resolveApplicationPhases,
  resolveApplicationClearanceLevel,
  resolveApplicationTags,
} from "../application/applicationResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";

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
  resolveApplicationClearanceLevel: vi.fn(),
  resolveApplicationTags: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields.js", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError.js", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../applicationDate/checkInputDateFunctions.js", () => ({
  checkInputDateIsStartOfDay: vi.fn(),
  checkInputDateIsEndOfDay: vi.fn(),
}));

vi.mock("../../dateUtilities.js", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
}));

describe("amendmentResolvers", () => {
  const regularMocks = {
    amendment: {
      update: vi.fn(),
    },
    demonstration: {
      findUnique: vi.fn(),
    },
  };
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
    amendment: {
      update: regularMocks.amendment.update,
    },
    demonstration: {
      findUnique: regularMocks.demonstration.findUnique,
    },
  };
  const testAmendmentId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationId = "518aa497-d547-422e-95a0-02076c7f7698";
  const testAmendmentName = "The Amendment";
  const testAmendmentDescription = "A description of an amendment";
  const testAmendmentTypeId: ApplicationType = "Amendment";
  const testAmendmentStatusId: ApplicationStatus = "Pre-Submission";
  const testAmendmentPhaseId: PhaseName = "Concept";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__getAmendment", () => {
    it("should request the amendment", async () => {
      const testInput = {
        id: testAmendmentId,
      };
      await __getAmendment(undefined, testInput);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testAmendmentId, "Amendment");
    });
  });

  describe("__getManyAmendments", () => {
    it("should request many amendments with the right type", async () => {
      await __getManyAmendments();
      expect(getManyApplications).toHaveBeenCalledExactlyOnceWith("Amendment");
    });
  });

  describe("__createAmendment", () => {
    it("should create an application and an amendment in a transaction", async () => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testAmendmentId,
        applicationTypeId: testAmendmentTypeId,
      });
      const testInput: { input: CreateAmendmentInput } = {
        input: {
          demonstrationId: testDemonstrationId,
          name: testAmendmentName,
          description: testAmendmentDescription,
        },
      };
      const expectedCalls = [
        {
          data: {
            applicationTypeId: testAmendmentTypeId,
          },
        },
        {
          data: {
            id: testAmendmentId,
            applicationTypeId: testAmendmentTypeId,
            demonstrationId: testDemonstrationId,
            name: testAmendmentName,
            description: testAmendmentDescription,
            statusId: testAmendmentStatusId,
            currentPhaseId: testAmendmentPhaseId,
          },
        },
      ];
      await __createAmendment(undefined, testInput);
      expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
      expect(transactionMocks.amendment.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
    });
  });

  describe("__updateAmendment", () => {
    const testInput: { id: string; input: UpdateAmendmentInput } = {
      id: testAmendmentId,
      input: {
        description: testAmendmentDescription,
      },
    };
    const expectedCheckOptionalNotNullFieldList = ["demonstrationId", "name", "status"];
    const testEasternTZDate: EasternTZDate = {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 1, 1, 0, 0, 0, 0, "America/New_York"),
    };
    const testDate: Date = new Date(2025, 1, 1, 5, 0, 0, 0);

    it("should call update on the amendment", async () => {
      const expectedCall = {
        where: {
          id: testAmendmentId,
        },
        data: {
          description: testAmendmentDescription,
        },
      };

      await __updateAmendment(undefined, testInput);

      expect(regularMocks.amendment.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should not parse or check input dates if they don't exist", async () => {
      await __updateAmendment(undefined, testInput);

      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should not parse or check input dates if they are null, but should pass them through", async () => {
      const testInput: { id: string; input: UpdateAmendmentInput } = {
        id: testAmendmentId,
        input: {
          name: testAmendmentDescription,
          effectiveDate: null,
          expirationDate: null,
        },
      };
      const expectedCall = {
        where: {
          id: testAmendmentId,
        },
        data: {
          name: testAmendmentDescription,
          effectiveDate: null,
          expirationDate: null,
        },
      };

      await __updateAmendment(undefined, testInput);
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(regularMocks.amendment.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should parse and check effective date if it is provided", async () => {
      const testInput: { id: string; input: UpdateAmendmentInput } = {
        id: testAmendmentId,
        input: {
          effectiveDate: testDate,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(testEasternTZDate);

      await __updateAmendment(undefined, testInput);

      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testEasternTZDate.easternTZDate,
        "Start of Day"
      );
      expect(checkInputDateIsStartOfDay).toHaveBeenCalledExactlyOnceWith(
        "effectiveDate",
        testEasternTZDate
      );
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should check expiration date if it is provided", async () => {
      const testInput: { id: string; input: UpdateAmendmentInput } = {
        id: testAmendmentId,
        input: {
          expirationDate: testDate,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(testEasternTZDate);

      await __updateAmendment(undefined, testInput);

      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testEasternTZDate.easternTZDate,
        "End of Day"
      );
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith(
        "expirationDate",
        testEasternTZDate
      );
    });

    it("should properly handle an error if it occurs", async () => {
      const testError = new Error("Database connection failed");
      regularMocks.amendment.update.mockRejectedValueOnce(testError);

      await expect(__updateAmendment(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("__deleteAmendment", () => {
    const testInput = {
      id: testAmendmentId,
    };

    it("should call the delete function on the correct ID", async () => {
      await __deleteAmendment(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(testAmendmentId, "Amendment");
    });
  });

  describe("__resolveParentDemonstration", () => {
    it("should look up the relevant demonstration", async () => {
      const input: Partial<PrismaAmendment> = {
        demonstrationId: testDemonstrationId,
      };
      const expectedCall = {
        where: {
          id: testDemonstrationId,
        },
      };
      await __resolveParentDemonstration(input as PrismaAmendment);
      expect(regularMocks.demonstration.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});

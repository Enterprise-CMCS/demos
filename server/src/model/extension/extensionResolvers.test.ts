import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import {
  __getExtension,
  __getManyExtensions,
  __createExtension,
  __updateExtension,
  __deleteExtension,
  __resolveParentDemonstration,
} from "./extensionResolvers.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateExtensionInput,
  PhaseName,
  UpdateExtensionInput,
} from "../../types.js";
import { Extension as PrismaExtension } from "@prisma/client";
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

describe("extensionResolvers", () => {
  const regularMocks = {
    extension: {
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
    extension: {
      create: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      create: transactionMocks.application.create,
    },
    extension: {
      create: transactionMocks.extension.create,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    extension: {
      update: regularMocks.extension.update,
    },
    demonstration: {
      findUnique: regularMocks.demonstration.findUnique,
    },
  };
  const testExtensionId = "8167c039-9c08-4203-b7d2-9e35ec156993";
  const testDemonstrationId = "518aa497-d547-422e-95a0-02076c7f7698";
  const testExtensionName = "The Extension";
  const testExtensionDescription = "A description of an extension";
  const testExtensionTypeId: ApplicationType = "Extension";
  const testExtensionStatusId: ApplicationStatus = "Pre-Submission";
  const testExtensionPhaseId: PhaseName = "Concept";

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__getExtension", () => {
    it("should request the extension", async () => {
      const testInput = {
        id: testExtensionId,
      };
      await __getExtension(undefined, testInput);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testExtensionId, "Extension");
    });
  });

  describe("__getManyExtensions", () => {
    it("should request many extensions with the right type", async () => {
      await __getManyExtensions();
      expect(getManyApplications).toHaveBeenCalledExactlyOnceWith("Extension");
    });
  });

  describe("__createExtension", () => {
    it("should create an application and an extension in a transaction", async () => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testExtensionId,
        applicationTypeId: testExtensionTypeId,
      });
      const testInput: { input: CreateExtensionInput } = {
        input: {
          demonstrationId: testDemonstrationId,
          name: testExtensionName,
          description: testExtensionDescription,
        },
      };
      const expectedCalls = [
        {
          data: {
            applicationTypeId: testExtensionTypeId,
          },
        },
        {
          data: {
            id: testExtensionId,
            applicationTypeId: testExtensionTypeId,
            demonstrationId: testDemonstrationId,
            name: testExtensionName,
            description: testExtensionDescription,
            statusId: testExtensionStatusId,
            currentPhaseId: testExtensionPhaseId,
          },
        },
      ];
      await __createExtension(undefined, testInput);
      expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
      expect(transactionMocks.extension.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
    });
  });

  describe("__updateExtension", () => {
    const testInput: { id: string; input: UpdateExtensionInput } = {
      id: testExtensionId,
      input: {
        description: testExtensionDescription,
      },
    };
    const expectedCheckOptionalNotNullFieldList = [
      "demonstrationId",
      "name",
      "status",
      "currentPhaseName",
    ];
    const testEasternTZDate: EasternTZDate = {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 1, 1, 0, 0, 0, 0, "America/New_York"),
    };
    const testDate: Date = new Date(2025, 1, 1, 5, 0, 0, 0);

    it("should call update on the extension", async () => {
      const expectedCall = {
        where: {
          id: testExtensionId,
        },
        data: {
          description: testExtensionDescription,
        },
      };

      await __updateExtension(undefined, testInput);

      expect(regularMocks.extension.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should not parse or check input dates if they don't exist", async () => {
      await __updateExtension(undefined, testInput);

      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should not parse or check input dates if they are null, but should pass them through", async () => {
      const testInput: { id: string; input: UpdateExtensionInput } = {
        id: testExtensionId,
        input: {
          name: testExtensionDescription,
          effectiveDate: null,
          expirationDate: null,
        },
      };
      const expectedCall = {
        where: {
          id: testExtensionId,
        },
        data: {
          name: testExtensionDescription,
          effectiveDate: null,
          expirationDate: null,
        },
      };

      await __updateExtension(undefined, testInput);
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(regularMocks.extension.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should parse and check effective date if it is provided", async () => {
      const testInput: { id: string; input: UpdateExtensionInput } = {
        id: testExtensionId,
        input: {
          effectiveDate: testDate,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(testEasternTZDate);

      await __updateExtension(undefined, testInput);

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
      const testInput: { id: string; input: UpdateExtensionInput } = {
        id: testExtensionId,
        input: {
          expirationDate: testDate,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(testEasternTZDate);

      await __updateExtension(undefined, testInput);

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
      regularMocks.extension.update.mockRejectedValueOnce(testError);

      await expect(__updateExtension(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("__deleteExtension", () => {
    const testInput = {
      id: testExtensionId,
    };

    it("should call the delete function on the correct ID", async () => {
      await __deleteExtension(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(testExtensionId, "Extension");
    });
  });

  describe("__resolveParentDemonstration", () => {
    it("should look up the relevant demonstration", async () => {
      const input: Partial<PrismaExtension> = {
        demonstrationId: testDemonstrationId,
      };
      const expectedCall = {
        where: {
          id: testDemonstrationId,
        },
      };
      await __resolveParentDemonstration(input as PrismaExtension);
      expect(regularMocks.demonstration.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});

import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import {
  __createExtension,
  __updateExtension,
  deleteExtension,
  extensionResolvers,
} from "./extensionResolvers.js";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateExtensionInput,
  PhaseName,
  SignatureLevel,
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
  resolveApplicationPhases,
  resolveApplicationTags,
} from "../application";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities.js";
import { ContextUser, GraphQLContext } from "../../auth/auth.util.js";
import { getExtension, getManyExtensions } from "./Extension.js";
import { getDemonstration } from "../demonstration/Demonstration.js";

vi.mock("../../prismaClient.js", () => ({
  prisma: vi.fn(),
}));

vi.mock("./Extension.js", () => ({
  getExtension: vi.fn(),
  getManyExtensions: vi.fn(),
}));

vi.mock("../demonstration/Demonstration.js", () => ({
  getDemonstration: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
  getManyApplications: vi.fn(),
  deleteApplication: vi.fn(),
  resolveApplicationDocuments: vi.fn(),
  resolveApplicationCurrentPhaseName: vi.fn(),
  resolveApplicationStatus: vi.fn(),
  resolveApplicationPhases: vi.fn(),
  resolveApplicationClearanceLevel: vi.fn(),
  resolveApplicationTags: vi.fn(),
  resolveApplicationSignatureLevel: vi.fn(),
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

  const mockUser = {
    id: "user-123",
  } as unknown as ContextUser;
  const mockContext = {
    user: mockUser,
  };
  it("delegates `Query.extension` to `Extension.getExtension`", async () => {
    const extension = {
      id: testExtensionId,
    } as PrismaExtension;

    await extensionResolvers.Query.extension(undefined, extension, mockContext);
    expect(getExtension).toHaveBeenCalledExactlyOnceWith({ id: testExtensionId }, mockUser);
  });

  it("delegates `Query.extensions` to `Extension.getManyExtensions`", async () => {
    await extensionResolvers.Query.extensions(undefined, {}, mockContext);
    expect(getManyExtensions).toHaveBeenCalledExactlyOnceWith({}, mockUser);
  });

  it("resolves `Extension.currentPhaseName`", () => {
    const extension = {
      currentPhaseId: "Application Intake" satisfies PhaseName,
    } as PrismaExtension;

    const result = extensionResolvers.Extension.currentPhaseName(extension);
    expect(result).toBe(extension.currentPhaseId);
  });

  it("resolves `Extension.signatureLevel`", () => {
    const extension = {
      signatureLevelId: "OA" satisfies SignatureLevel,
    } as PrismaExtension;

    const result = extensionResolvers.Extension.signatureLevel(extension);
    expect(result).toBe(extension.signatureLevelId);
  });

  it("resolves `Extension.status`", () => {
    const extension = {
      statusId: "Pre-Submission" satisfies ApplicationStatus,
    } as PrismaExtension;

    const result = extensionResolvers.Extension.status(extension);
    expect(result).toBe(extension.statusId);
  });

  it("resolves the `Extension.clearanceLevel`", () => {
    const extension = {
      clearanceLevelId: "COMMs" satisfies ClearanceLevel,
    } as PrismaExtension;

    const result = extensionResolvers.Extension.clearanceLevel(extension);
    expect(result).toBe(extension.clearanceLevelId);
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
    const expectedCheckOptionalNotNullFieldList = ["demonstrationId", "name", "status"];
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
        },
      };
      const expectedCall = {
        where: {
          id: testExtensionId,
        },
        data: {
          name: testExtensionDescription,
          effectiveDate: null,
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

    it("should properly handle an error if it occurs", async () => {
      const testError = new Error("Database connection failed");
      regularMocks.extension.update.mockRejectedValueOnce(testError);

      await expect(__updateExtension(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("deleteExtension", () => {
    const testInput = {
      id: testExtensionId,
    };

    it("should call the delete function on the correct ID", async () => {
      await deleteExtension(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(
        testExtensionId,
        "Extension",
        mockTransaction
      );
    });
  });

  it("delegates `Extension.demonstration` to `Demonstration.getDemonstration`", async () => {
    await extensionResolvers.Extension.demonstration(
      { demonstrationId: "abc123" } as PrismaExtension,
      {},
      mockContext
    );
    expect(getDemonstration).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
  });
});

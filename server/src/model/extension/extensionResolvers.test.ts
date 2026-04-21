import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import {
  __createExtension,
  __updateExtension,
  deleteExtension,
  extensionResolvers,
} from "./extensionResolvers";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateExtensionInput,
  PhaseName,
  SignatureLevel,
  UpdateExtensionInput,
} from "../../types";
import { Extension as PrismaExtension } from "@prisma/client";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient";
import {
  deleteApplication,
  // None of these are tested but need to be exported to avoid mocking issues
  resolveSuggestedApplicationTags,
} from "../application";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { ContextUser, GraphQLContext } from "../../auth";
import { getDemonstration } from "../demonstration";
import { getExtension, getManyExtensions } from "./extensionData";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";
import { getManyApplicationTagAssignments } from "../applicationTagAssignment";
import { ApplicationTagAssignmentQueryResult } from "../applicationTagAssignment/queries";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./extensionData", () => ({
  getExtension: vi.fn(),
  getManyExtensions: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("../applicationPhase", () => ({
  getManyApplicationPhases: vi.fn(),
}));

vi.mock("../demonstration", () => ({
  getDemonstration: vi.fn(),
}));

vi.mock("../applicationTagAssignment", () => ({
  getManyApplicationTagAssignments: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
  getManyApplications: vi.fn(),
  deleteApplication: vi.fn(),
  resolveSuggestedApplicationTags: vi.fn(),
}));

vi.mock("../../errors/checkOptionalNotNullFields", () => ({
  checkOptionalNotNullFields: vi.fn(),
}));

const testHandlePrismaError = new Error("Test handlePrismaError!");
vi.mock("../../errors/handlePrismaError", () => ({
  handlePrismaError: vi.fn(() => {
    throw testHandlePrismaError;
  }),
}));

vi.mock("../applicationDate/checkInputDateFunctions", () => ({
  checkInputDateIsStartOfDay: vi.fn(),
  checkInputDateIsEndOfDay: vi.fn(),
}));

vi.mock("../../dateUtilities", () => ({
  parseDateTimeOrLocalDateToEasternTZDate: vi.fn(),
}));

describe("extensionResolvers", () => {
  const regularMocks = {
    extension: {
      update: vi.fn(),
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
  };

  const mockUser = {
    id: "user-123",
  } as unknown as ContextUser;
  const mockContext: GraphQLContext = {
    user: mockUser,
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

  describe("Query.extension", () => {
    it("delegates to `extensionData.getExtension`", async () => {
      await extensionResolvers.Query.extension(undefined, { id: "abc123" }, mockContext);
      expect(getExtension).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
    });
  });

  describe("Query.extensions", () => {
    it("delegates to `extensionData.getManyExtensions`", async () => {
      await extensionResolvers.Query.extensions(undefined, {}, mockContext);
      expect(getManyExtensions).toHaveBeenCalledExactlyOnceWith({}, mockUser);
    });
  });

  describe("Extension.documents", () => {
    it("delegates to `documentData.getManyDocuments`", async () => {
      const mockExtension = { id: "abc123" } as PrismaExtension;
      await extensionResolvers.Extension.documents(mockExtension, undefined, mockContext);
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "abc123" },
        mockUser
      );
    });
  });

  describe("Extension.phases", () => {
    it("delegates to `applicationPhaseData.getManyApplicationPhases`", async () => {
      await extensionResolvers.Extension.phases(
        { id: "extensionId" } as PrismaExtension,
        {},
        mockContext
      );
      expect(getManyApplicationPhases).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "extensionId" },
        mockUser
      );
    });
  });

  describe("Extension.tags", () => {
    it("delegates to applicationTagAssignmentData.getManyApplicationTagAssignments and maps result", async () => {
      const mockExtension = { id: "abc123" } as PrismaExtension;
      vi.mocked(getManyApplicationTagAssignments).mockResolvedValueOnce([
        {
          tag: {
            tagNameId: "Tag1",
            statusId: "Approved",
          },
        },
        {
          tag: {
            tagNameId: "Tag2",
            statusId: "Unapproved",
          },
        },
      ] as ApplicationTagAssignmentQueryResult[]);

      const result = await extensionResolvers.Extension.tags(mockExtension, undefined, mockContext);
      expect(getManyApplicationTagAssignments).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "abc123" },
        mockUser
      );
      expect(result).toEqual([
        {
          tagName: "Tag1",
          approvalStatus: "Approved",
        },
        {
          tagName: "Tag2",
          approvalStatus: "Unapproved",
        },
      ]);
    });
  });

  describe("Extension.currentPhaseName", () => {
    it("returns currentPhaseId", () => {
      const extension = {
        currentPhaseId: "Application Intake" satisfies PhaseName,
      } as PrismaExtension;

      const result = extensionResolvers.Extension.currentPhaseName(extension);
      expect(result).toBe(extension.currentPhaseId);
    });
  });

  describe("Extension.signatureLevel", () => {
    it("returns signatureLevelId", () => {
      const extension = {
        signatureLevelId: "OA" satisfies SignatureLevel,
      } as PrismaExtension;

      const result = extensionResolvers.Extension.signatureLevel(extension);
      expect(result).toBe(extension.signatureLevelId);
    });
  });

  describe("Extension.status", () => {
    it("returns statusId", () => {
      const extension = {
        statusId: "Pre-Submission" satisfies ApplicationStatus,
      } as PrismaExtension;

      const result = extensionResolvers.Extension.status(extension);
      expect(result).toBe(extension.statusId);
    });
  });

  describe("Extension.clearanceLevel", () => {
    it("returns clearanceLevelId", () => {
      const extension = {
        clearanceLevelId: "COMMs" satisfies ClearanceLevel,
      } as PrismaExtension;

      const result = extensionResolvers.Extension.clearanceLevel(extension);
      expect(result).toBe(extension.clearanceLevelId);
    });
  });

  describe("Extension.demonstrations", () => {
    it("delegates to `Demonstration.getDemonstration`", async () => {
      await extensionResolvers.Extension.demonstration(
        { demonstrationId: "abc123" } as PrismaExtension,
        {},
        mockContext
      );
      expect(getDemonstration).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
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
});

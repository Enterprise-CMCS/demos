import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __createAmendment,
  __updateAmendment,
  deleteAmendment,
  amendmentResolvers,
} from "./amendmentResolvers";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateAmendmentInput,
  PhaseName,
  SignatureLevel,
  UpdateAmendmentInput,
} from "../../types";
import {
  ApplicationTagSuggestion as PrismaApplicationTagSuggestion,
  Amendment as PrismaAmendment,
} from "@prisma/client";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient";
import { deleteApplication } from "../application";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions";
import { EasternTZDate, parseDateTimeOrLocalDateToEasternTZDate } from "../../dateUtilities";
import { ContextUser, GraphQLContext } from "../../auth";
import { getDemonstration } from "../demonstration";
import { getAmendment, getManyAmendments } from "./amendmentData";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";
import { getManyApplicationTagAssignments } from "../applicationTagAssignment";
import { ApplicationTagAssignmentQueryResult } from "../applicationTagAssignment/queries";
import { getManyApplicationTagSuggestions } from "../applicationTagSuggestion";
vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./amendmentData", () => ({
  getAmendment: vi.fn(),
  getManyAmendments: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("../demonstration", () => ({
  getDemonstration: vi.fn(),
}));

vi.mock("../applicationPhase", () => ({
  getManyApplicationPhases: vi.fn(),
}));

vi.mock("../applicationTagAssignment", () => ({
  getManyApplicationTagAssignments: vi.fn(),
}));

vi.mock("../applicationTagSuggestion", () => ({
  getManyApplicationTagSuggestions: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
  getManyApplications: vi.fn(),
  deleteApplication: vi.fn(),
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

describe("amendmentResolvers", () => {
  const regularMocks = {
    amendment: {
      update: vi.fn(),
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
  };
  const mockUser = {} as unknown as ContextUser;
  const mockContext: GraphQLContext = {
    user: mockUser,
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

  describe("Query.amendment", () => {
    it("delegates to amendmentData.getAmendment", async () => {
      await amendmentResolvers.Query.amendment(undefined, { id: "abc123" }, mockContext);
      expect(getAmendment).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
    });
  });

  describe("Query.amendments", () => {
    it("delegates to amendmentData.getManyAmendments", async () => {
      await amendmentResolvers.Query.amendments(undefined, {}, mockContext);
      expect(getManyAmendments).toHaveBeenCalledExactlyOnceWith({}, mockUser);
    });
  });

  describe("Amendment.documents", () => {
    it("delegates to documentData.getManyDocuments", async () => {
      const mockAmendment = { id: "abc123" } as PrismaAmendment;
      await amendmentResolvers.Amendment.documents(mockAmendment, undefined, mockContext);
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "abc123" },
        mockUser
      );
    });
  });

  describe("Amendment.demonstration", () => {
    it("delegates to `Demonstration.getDemonstration`", async () => {
      await amendmentResolvers.Amendment.demonstration(
        { demonstrationId: "abc123" } as PrismaAmendment,
        {},
        mockContext
      );
      expect(getDemonstration).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
    });
  });

  describe("Amendment.phases", () => {
    it("delegates to `applicationPhaseData.getManyApplicationPhases`", async () => {
      await amendmentResolvers.Amendment.phases(
        { id: "amendmentId" } as PrismaAmendment,
        {},
        mockContext
      );
      expect(getManyApplicationPhases).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "amendmentId" },
        mockUser
      );
    });
  });

  describe("Amendment.tags", () => {
    it("delegates to applicationTagAssignmentData.getManyApplicationTagAssignments and maps result", async () => {
      const mockAmendment = { id: "abc123" } as PrismaAmendment;
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

      const result = await amendmentResolvers.Amendment.tags(mockAmendment, undefined, mockContext);
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

  describe("Amendment.applicationTagSuggestions", () => {
    it("delegates to applicationTagSuggestionData.getManyApplicationTagSuggestions and maps result", async () => {
      const mockAmendment = { id: "abc123" } as PrismaAmendment;
      vi.mocked(getManyApplicationTagSuggestions).mockResolvedValueOnce([
        {
          value: "Suggestion1",
        },
        {
          value: "Suggestion2",
        },
      ] as PrismaApplicationTagSuggestion[]);

      const result = await amendmentResolvers.Amendment.suggestedApplicationTags(
        mockAmendment,
        undefined,
        mockContext
      );
      expect(getManyApplicationTagSuggestions).toHaveBeenCalledExactlyOnceWith(
        {
          applicationId: "abc123",
          statusId: {
            in: ["Pending"],
          },
        },
        mockUser
      );
      expect(result).toEqual(["Suggestion1", "Suggestion2"]);
    });
  });

  describe("Amendment.currentPhaseName", () => {
    it("returns currentPhaseId", () => {
      const amendment = {
        currentPhaseId: "Application Intake" satisfies PhaseName,
      } as PrismaAmendment;

      const result = amendmentResolvers.Amendment.currentPhaseName(amendment);
      expect(result).toBe(amendment.currentPhaseId);
    });
  });

  describe("Amendment.signatureLevel", () => {
    it("return signatureLevelId", () => {
      const amendment = {
        signatureLevelId: "OA" satisfies SignatureLevel,
      } as PrismaAmendment;

      const result = amendmentResolvers.Amendment.signatureLevel(amendment);
      expect(result).toBe(amendment.signatureLevelId);
    });
  });

  describe("Amendment.status", () => {
    it("returns statusId", () => {
      const amendment = {
        statusId: "Pre-Submission" satisfies ApplicationStatus,
      } as PrismaAmendment;

      const result = amendmentResolvers.Amendment.status(amendment);
      expect(result).toBe(amendment.statusId);
    });
  });

  describe("Amendment.clearanceLevel", () => {
    it("returns clearanceLevelId", () => {
      const amendment = {
        clearanceLevelId: "COMMs" satisfies ClearanceLevel,
      } as PrismaAmendment;

      const result = amendmentResolvers.Amendment.clearanceLevel(amendment);
      expect(result).toBe(amendment.clearanceLevelId);
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
        },
      };
      const expectedCall = {
        where: {
          id: testAmendmentId,
        },
        data: {
          name: testAmendmentDescription,
          effectiveDate: null,
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

    it("should properly handle an error if it occurs", async () => {
      const testError = new Error("Database connection failed");
      regularMocks.amendment.update.mockRejectedValueOnce(testError);

      await expect(__updateAmendment(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("deleteAmendment", () => {
    const testInput = {
      id: testAmendmentId,
    };

    it("should call the delete function on the correct ID", async () => {
      await deleteAmendment(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(
        testAmendmentId,
        "Amendment",
        mockTransaction
      );
    });
  });
});

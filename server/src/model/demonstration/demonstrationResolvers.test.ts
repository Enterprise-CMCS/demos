import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __createDemonstration,
  __updateDemonstration,
  deleteDemonstration,
  demonstrationResolvers,
} from "./demonstrationResolvers";
import {
  ApplicationStatus,
  ApplicationType,
  ClearanceLevel,
  CreateDemonstrationInput,
  GrantLevel,
  PersonType,
  PhaseName,
  Role,
  SdgDivision,
  SignatureLevel,
  UpdateDemonstrationInput,
} from "../../types";
import {
  ApplicationTagSuggestion as PrismaApplicationTagSuggestion,
  Demonstration as PrismaDemonstration,
} from "@prisma/client";
import { TZDate } from "@date-fns/tz";

// Mock imports
import { prisma } from "../../prismaClient";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions";
import {
  deleteApplication,
  getApplication,
  // None of these are tested but need to be exported to avoid mocking issues
} from "../application";
import { parseDateTimeOrLocalDateToEasternTZDate, EasternTZDate } from "../../dateUtilities";
import { getDemonstration, getManyDemonstrations } from "./demonstrationData";
import { ContextUser, GraphQLContext } from "../../auth";
import { getManyAmendments } from "../amendment";
import { getManyExtensions } from "../extension";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";
import { getManyApplicationTagAssignments } from "../applicationTagAssignment";
import { ApplicationTagAssignmentQueryResult } from "../applicationTagAssignment/queries";
import { getManyDemonstrationTypeTagAssignments } from "../demonstrationTypeTagAssignment";
import { DemonstrationTypeTagAssignmentQueryResult } from "../demonstrationTypeTagAssignment/queries";
import {
  getDemonstrationRoleAssignment,
  getManyDemonstrationRoleAssignments,
} from "../demonstrationRoleAssignment";
import { getManyApplicationTagSuggestions } from "../applicationTagSuggestion";
import { getState } from "../state";
import { getPerson } from "../person";
import { DemonstrationRoleAssignmentQueryResult } from "../demonstrationRoleAssignment/queries";

vi.mock("../../prismaClient", () => ({
  prisma: vi.fn(),
}));

vi.mock("./demonstrationData", () => ({
  getDemonstration: vi.fn(),
  getManyDemonstrations: vi.fn(),
}));

vi.mock("../document", () => ({
  getManyDocuments: vi.fn(),
}));

vi.mock("../amendment", () => ({
  getManyAmendments: vi.fn(),
}));

vi.mock("../extension", () => ({
  getManyExtensions: vi.fn(),
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

vi.mock("../demonstrationTypeTagAssignment", () => ({
  getManyDemonstrationTypeTagAssignments: vi.fn(),
}));

vi.mock("../demonstrationRoleAssignment", () => ({
  getDemonstrationRoleAssignment: vi.fn(),
  getManyDemonstrationRoleAssignments: vi.fn(),
}));

vi.mock("../person", () => ({
  getPerson: vi.fn(),
}));

vi.mock("../state", () => ({
  getState: vi.fn(),
}));

vi.mock("../application", () => ({
  getApplication: vi.fn(),
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

vi.mock("./determineDemonstrationTypeStatus", () => ({
  determineDemonstrationTypeStatus: vi.fn(),
}));

describe("demonstrationResolvers", () => {
  const regularMocks = {
    primaryDemonstrationRoleAssignment: {
      findUniqueOrThrow: vi.fn(),
    },
  };
  const transactionMocks = {
    application: {
      create: vi.fn(),
    },
    demonstration: {
      create: vi.fn(),
      update: vi.fn(),
    },
    person: {
      findUnique: vi.fn(),
    },
    demonstrationRoleAssignment: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    primaryDemonstrationRoleAssignment: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
  };
  const mockTransaction = {
    application: {
      create: transactionMocks.application.create,
    },
    demonstration: {
      create: transactionMocks.demonstration.create,
      update: transactionMocks.demonstration.update,
    },
    person: {
      findUnique: transactionMocks.person.findUnique,
    },
    demonstrationRoleAssignment: {
      create: transactionMocks.demonstrationRoleAssignment.create,
      upsert: transactionMocks.demonstrationRoleAssignment.upsert,
    },
    primaryDemonstrationRoleAssignment: {
      create: transactionMocks.primaryDemonstrationRoleAssignment.create,
      upsert: transactionMocks.primaryDemonstrationRoleAssignment.upsert,
    },
  };
  const mockPrismaClient = {
    $transaction: vi.fn((callback) => callback(mockTransaction)),
    primaryDemonstrationRoleAssignment: {
      findUniqueOrThrow: regularMocks.primaryDemonstrationRoleAssignment.findUniqueOrThrow,
    },
  };
  const mockUser = {} as unknown as ContextUser;
  const mockContext: GraphQLContext = {
    user: mockUser,
  };

  type TestValues = {
    demonstrationId: string;
    userId: string;
    stateId: string;
    applicationTypeId: ApplicationType;
    demonstrationName: string;
    demonstrationDescription: string;
    sdgDivisionId: SdgDivision;
    signatureLevelId: SignatureLevel;
    personTypeId: PersonType;
    newApplicationStatusId: ApplicationStatus;
    newApplicationPhaseId: PhaseName;
    projectOfficerRole: Role;
    demonstrationGrantLevelId: GrantLevel;
    dateValue: Date;
    easternTZDate: EasternTZDate;
  };
  const testValues: TestValues = {
    demonstrationId: "8167c039-9c08-4203-b7d2-9e35ec156993",
    userId: "e382a1de-ada0-4432-8f8a-4600b9e6373a",
    stateId: "OH",
    applicationTypeId: "Demonstration",
    demonstrationName: "The Demonstration",
    demonstrationDescription: "A description of a demonstration",
    sdgDivisionId: "Division of Eligibility and Coverage Demonstrations",
    signatureLevelId: "OCD",
    personTypeId: "demos-cms-user",
    newApplicationStatusId: "Pre-Submission",
    newApplicationPhaseId: "Concept",
    projectOfficerRole: "Project Officer",
    demonstrationGrantLevelId: "Demonstration",
    dateValue: new Date(2025, 1, 1, 5, 0, 0, 0),
    easternTZDate: {
      isEasternTZDate: true,
      easternTZDate: new TZDate(2025, 1, 1, 0, 0, 0, 0, "America/New_York"),
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("Query.demonstration", () => {
    it("delegates to `demonstrationData.getDemonstration`", async () => {
      await demonstrationResolvers.Query.demonstration(undefined, { id: "abc123" }, mockContext);
      expect(getDemonstration).toHaveBeenCalledExactlyOnceWith({ id: "abc123" }, mockUser);
    });
  });

  describe("Query.demonstrations", () => {
    it("delegates to `demonstrationData.getManyDemonstrations`", async () => {
      await demonstrationResolvers.Query.demonstrations(undefined, {}, mockContext);
      expect(getManyDemonstrations).toHaveBeenCalledExactlyOnceWith({}, mockUser);
    });
  });

  describe("Demonstration.documents", () => {
    it("delegates to `documentData.getManyDocuments`", async () => {
      const mockDemonstration = { id: "abc123" } as PrismaDemonstration;
      await demonstrationResolvers.Demonstration.documents(
        mockDemonstration,
        undefined,
        mockContext
      );
      expect(getManyDocuments).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "abc123" },
        mockUser
      );
    });
  });

  describe("Demonstration.amendments", () => {
    it("delegates to `amendmentData.getManyAmendments`", async () => {
      await demonstrationResolvers.Demonstration.amendments(
        { id: "demonstrationId" } as PrismaDemonstration,
        {},
        mockContext
      );
      expect(getManyAmendments).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: "demonstrationId" },
        mockUser
      );
    });
  });

  describe("Demonstration.extensions", () => {
    it("delegates to `extensionData.getManyExtensions`", async () => {
      await demonstrationResolvers.Demonstration.extensions(
        { id: "demonstrationId" } as PrismaDemonstration,
        {},
        mockContext
      );
      expect(getManyExtensions).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: "demonstrationId" },
        mockUser
      );
    });
  });

  describe("Demonstration.phases", () => {
    it("delegates to `applicationPhaseData.getManyApplicationPhases`", async () => {
      await demonstrationResolvers.Demonstration.phases(
        { id: "demonstrationId" } as PrismaDemonstration,
        {},
        mockContext
      );
      expect(getManyApplicationPhases).toHaveBeenCalledExactlyOnceWith(
        { applicationId: "demonstrationId" },
        mockUser
      );
    });
  });

  describe("Demonstration.tags", () => {
    it("delegates to applicationTagAssignmentData.getManyApplicationTagAssignments and maps result", async () => {
      const mockDemonstration = { id: "abc123" } as PrismaDemonstration;
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

      const result = await demonstrationResolvers.Demonstration.tags(
        mockDemonstration,
        undefined,
        mockContext
      );
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

  describe("Demonstration.applicationTagSuggestions", () => {
    it("delegates to applicationTagSuggestionData.getManyApplicationTagSuggestions and maps result", async () => {
      const mockDemonstration = { id: "abc123" } as PrismaDemonstration;
      vi.mocked(getManyApplicationTagSuggestions).mockResolvedValueOnce([
        {
          value: "Suggestion1",
        },
        {
          value: "Suggestion2",
        },
      ] as PrismaApplicationTagSuggestion[]);

      const result = await demonstrationResolvers.Demonstration.suggestedApplicationTags(
        mockDemonstration,
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

  describe("Demonstration.demonstrationTypes", () => {
    it("delegates to demonstrationTypeTagAssignmentData.getManyDemonstrationTypeTagAssignments and maps result", async () => {
      const mockDemonstration = { id: "abc123" } as PrismaDemonstration;
      vi.mocked(getManyDemonstrationTypeTagAssignments).mockResolvedValueOnce([
        {
          tagNameId: "Tag1",
          tag: {
            statusId: "Approved",
          },
        },
        {
          tagNameId: "Tag2",
          tag: {
            statusId: "Unapproved",
          },
        },
      ] as DemonstrationTypeTagAssignmentQueryResult[]);

      const result = await demonstrationResolvers.Demonstration.demonstrationTypes(
        mockDemonstration,
        undefined,
        mockContext
      );
      expect(getManyDemonstrationTypeTagAssignments).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: "abc123" },
        mockUser
      );
      expect(result).toEqual([
        {
          demonstrationTypeName: "Tag1",
          approvalStatus: "Approved",
        },
        {
          demonstrationTypeName: "Tag2",
          approvalStatus: "Unapproved",
        },
      ]);
    });
  });

  describe("Demonstration.roles", () => {
    it("delegates to demonstrationRoleAssignmentData.getManyDemonstrationRoleAssignments", async () => {
      await demonstrationResolvers.Demonstration.roles(
        { id: "demonstrationId" } as PrismaDemonstration,
        {},
        mockContext
      );
      expect(getManyDemonstrationRoleAssignments).toHaveBeenCalledExactlyOnceWith(
        { demonstrationId: "demonstrationId" },
        mockUser
      );
    });
  });

  describe("Demonstration.primaryProjectOfficer", () => {
    it("delegates to demonstrationRoleAssignmentData.getManyDemonstrationRoleAssignments and getPerson", async () => {
      vi.mocked(getDemonstrationRoleAssignment).mockResolvedValueOnce({
        personId: "personId",
      } as DemonstrationRoleAssignmentQueryResult);

      await demonstrationResolvers.Demonstration.primaryProjectOfficer(
        { id: "demonstrationId" } as PrismaDemonstration,
        undefined,
        mockContext
      );

      expect(getDemonstrationRoleAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          demonstrationId: "demonstrationId",
          roleId: "Project Officer",
          primaryDemonstrationRoleAssignment: { isNot: null },
        },
        mockUser
      );

      expect(getPerson).toHaveBeenCalledExactlyOnceWith({ id: "personId" }, mockUser);
    });

    it("throws an error if primary project officer is not found", async () => {
      vi.mocked(getDemonstrationRoleAssignment).mockResolvedValueOnce(null);

      expect(
        demonstrationResolvers.Demonstration.primaryProjectOfficer(
          { id: "demonstrationId" } as PrismaDemonstration,
          undefined,
          mockContext
        )
      ).rejects.toThrow(
        `Primary project officer not found for demonstration with id demonstrationId`
      );

      expect(getDemonstrationRoleAssignment).toHaveBeenCalledExactlyOnceWith(
        {
          demonstrationId: "demonstrationId",
          roleId: "Project Officer",
          primaryDemonstrationRoleAssignment: { isNot: null },
        },
        mockUser
      );

      expect(getPerson).not.toHaveBeenCalled();
    });
  });

  describe("Demonstration.state", () => {
    it("delegates to stateData.getState", async () => {
      await demonstrationResolvers.Demonstration.state({ stateId: "NC" } as PrismaDemonstration);
      expect(getState).toHaveBeenCalledExactlyOnceWith({ id: "NC" });
    });
  });

  describe("Demonstration.currentPhaseName", () => {
    it("returns currentPhaseId", () => {
      const demonstration = {
        currentPhaseId: "Application Intake" satisfies PhaseName,
      } as PrismaDemonstration;

      const result = demonstrationResolvers.Demonstration.currentPhaseName(demonstration);
      expect(result).toBe(demonstration.currentPhaseId);
    });
  });

  describe("Demonstration.signatureLevel", () => {
    it("returns signatureLevelId", () => {
      const demonstration = {
        signatureLevelId: "OA" satisfies SignatureLevel,
      } as PrismaDemonstration;

      const result = demonstrationResolvers.Demonstration.signatureLevel(demonstration);
      expect(result).toBe(demonstration.signatureLevelId);
    });
  });

  describe("Demonstration.sdgDivision", () => {
    it("returns sdgDivisionId", () => {
      const demonstration = {
        sdgDivisionId: "Division of Eligibility and Coverage Demonstrations" satisfies SdgDivision,
      } as PrismaDemonstration;

      const result = demonstrationResolvers.Demonstration.sdgDivision(demonstration);
      expect(result).toBe(demonstration.sdgDivisionId);
    });
  });

  describe("Demonstration.status", () => {
    it("return statusId", () => {
      const demonstration = {
        statusId: "Pre-Submission" satisfies ApplicationStatus,
      } as PrismaDemonstration;

      const result = demonstrationResolvers.Demonstration.status(demonstration);
      expect(result).toBe(demonstration.statusId);
    });
  });

  describe("Demonstration.clearanceLevel", () => {
    it("returns clearanceLevelId", () => {
      const demonstration = {
        clearanceLevelId: "COMMs" satisfies ClearanceLevel,
      } as PrismaDemonstration;

      const result = demonstrationResolvers.Demonstration.clearanceLevel(demonstration);
      expect(result).toBe(demonstration.clearanceLevelId);
    });
  });

  describe("__createDemonstration", () => {
    it("should create a new application and demonstration in a transaction", async () => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testValues.demonstrationId,
        applicationTypeId: testValues.applicationTypeId,
      });
      transactionMocks.person.findUnique.mockResolvedValueOnce({
        personTypeId: testValues.personTypeId,
      });

      const testInput: { input: CreateDemonstrationInput } = {
        input: {
          name: testValues.demonstrationName,
          projectOfficerUserId: testValues.userId,
          stateId: testValues.stateId,
          description: testValues.demonstrationDescription,
          sdgDivision: testValues.sdgDivisionId,
          signatureLevel: testValues.signatureLevelId,
        },
      };

      const expectedCalls = [
        {
          data: {
            applicationTypeId: testValues.applicationTypeId,
          },
        },
        {
          data: {
            id: testValues.demonstrationId,
            applicationTypeId: testValues.applicationTypeId,
            name: testValues.demonstrationName,
            description: testValues.demonstrationDescription,
            sdgDivisionId: testValues.sdgDivisionId,
            signatureLevelId: testValues.signatureLevelId,
            statusId: testValues.newApplicationStatusId,
            stateId: testValues.stateId,
            currentPhaseId: testValues.newApplicationPhaseId,
          },
        },
        {
          where: {
            id: testValues.userId,
          },
          select: {
            personTypeId: true,
          },
        },
        {
          data: {
            demonstrationId: testValues.demonstrationId,
            personId: testValues.userId,
            personTypeId: testValues.personTypeId,
            roleId: testValues.projectOfficerRole,
            stateId: testValues.stateId,
            grantLevelId: testValues.demonstrationGrantLevelId,
          },
        },
        {
          data: {
            demonstrationId: testValues.demonstrationId,
            personId: testValues.userId,
            roleId: testValues.projectOfficerRole,
          },
        },
      ];
      await __createDemonstration(undefined, testInput);
      expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
      expect(transactionMocks.demonstration.create).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[1]
      );
      expect(transactionMocks.person.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCalls[2]);
      expect(transactionMocks.demonstrationRoleAssignment.create).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[3]
      );
      expect(
        transactionMocks.primaryDemonstrationRoleAssignment.create
      ).toHaveBeenCalledExactlyOnceWith(expectedCalls[4]);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(testValues.demonstrationId, {
        applicationTypeId: testValues.applicationTypeId,
      });
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should throw if the requested person does not exist", async () => {
      transactionMocks.application.create.mockResolvedValueOnce({
        id: testValues.demonstrationId,
        applicationTypeId: testValues.applicationTypeId,
      });
      transactionMocks.person.findUnique.mockResolvedValueOnce(null);

      const testInput: { input: CreateDemonstrationInput } = {
        input: {
          name: testValues.demonstrationName,
          projectOfficerUserId: testValues.userId,
          stateId: testValues.stateId,
          description: testValues.demonstrationDescription,
          sdgDivision: testValues.sdgDivisionId,
          signatureLevel: testValues.signatureLevelId,
        },
      };

      const expectedCalls = [
        {
          data: {
            applicationTypeId: testValues.applicationTypeId,
          },
        },
        {
          data: {
            id: testValues.demonstrationId,
            applicationTypeId: testValues.applicationTypeId,
            name: testValues.demonstrationName,
            description: testValues.demonstrationDescription,
            sdgDivisionId: testValues.sdgDivisionId,
            signatureLevelId: testValues.signatureLevelId,
            statusId: testValues.newApplicationStatusId,
            stateId: testValues.stateId,
            currentPhaseId: testValues.newApplicationPhaseId,
          },
        },
        {
          where: {
            id: testValues.userId,
          },
          select: {
            personTypeId: true,
          },
        },
      ];
      await expect(__createDemonstration(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(transactionMocks.application.create).toHaveBeenCalledExactlyOnceWith(expectedCalls[0]);
      expect(transactionMocks.demonstration.create).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[1]
      );
      expect(transactionMocks.person.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCalls[2]);
      expect(transactionMocks.demonstrationRoleAssignment.create).not.toHaveBeenCalled();
      expect(transactionMocks.primaryDemonstrationRoleAssignment.create).not.toHaveBeenCalled();
      expect(getApplication).not.toHaveBeenCalled();
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(
        new Error(`Person with id ${testValues.userId} not found.`)
      );
    });
  });

  describe("__updateDemonstration", () => {
    const testInput: { id: string; input: UpdateDemonstrationInput } = {
      id: testValues.demonstrationId,
      input: {
        name: testValues.demonstrationName,
      },
    };
    const expectedCheckOptionalNotNullFieldList = [
      "name",
      "status",
      "stateId",
      "projectOfficerUserId",
    ];

    it("should call update on the demonstration in a transaction", async () => {
      const expectedCall = {
        where: {
          id: testValues.demonstrationId,
        },
        data: {
          name: testValues.demonstrationName,
        },
      };

      await __updateDemonstration(undefined, testInput);

      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should not touch the person tables if no update to project officer is requested", async () => {
      await __updateDemonstration(undefined, testInput);

      expect(transactionMocks.person.findUnique).not.toHaveBeenCalled();
      expect(transactionMocks.demonstrationRoleAssignment.upsert).not.toHaveBeenCalled();
      expect(transactionMocks.primaryDemonstrationRoleAssignment.upsert).not.toHaveBeenCalled();
    });

    it("should update the project officer in a transaction if included", async () => {
      transactionMocks.demonstration.update.mockResolvedValueOnce({
        stateId: testValues.stateId,
      });
      transactionMocks.person.findUnique.mockResolvedValueOnce({
        personTypeId: testValues.personTypeId,
      });

      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          projectOfficerUserId: testValues.userId,
        },
      };

      const expectedCalls = [
        {
          where: {
            id: testValues.demonstrationId,
          },
          data: {
            undefined,
          },
        },
        {
          where: {
            id: testValues.userId,
          },
          select: {
            personTypeId: true,
          },
        },
        {
          where: {
            personId_demonstrationId_roleId: {
              demonstrationId: testValues.demonstrationId,
              personId: testValues.userId,
              roleId: testValues.projectOfficerRole,
            },
          },
          update: {},
          create: {
            demonstrationId: testValues.demonstrationId,
            personId: testValues.userId,
            personTypeId: testValues.personTypeId,
            roleId: testValues.projectOfficerRole,
            stateId: testValues.stateId,
            grantLevelId: testValues.demonstrationGrantLevelId,
          },
        },
        {
          where: {
            demonstrationId_roleId: {
              demonstrationId: testValues.demonstrationId,
              roleId: testValues.projectOfficerRole,
            },
          },
          update: {
            personId: testValues.userId,
          },
          create: {
            demonstrationId: testValues.demonstrationId,
            personId: testValues.userId,
            roleId: testValues.projectOfficerRole,
          },
        },
      ];

      await __updateDemonstration(undefined, testInput);

      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[0]
      );
      expect(transactionMocks.person.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
      expect(transactionMocks.demonstrationRoleAssignment.upsert).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[2]
      );
      expect(
        transactionMocks.primaryDemonstrationRoleAssignment.upsert
      ).toHaveBeenCalledExactlyOnceWith(expectedCalls[3]);
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should throw if the requested person does not exist", async () => {
      transactionMocks.demonstration.update.mockResolvedValueOnce({
        stateId: testValues.stateId,
      });
      transactionMocks.person.findUnique.mockResolvedValueOnce(null);

      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          projectOfficerUserId: testValues.userId,
        },
      };

      const expectedCalls = [
        {
          where: {
            id: testValues.demonstrationId,
          },
          data: {
            undefined,
          },
        },
        {
          where: {
            id: testValues.userId,
          },
          select: {
            personTypeId: true,
          },
        },
      ];

      await expect(__updateDemonstration(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );

      expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith(
        expectedCalls[0]
      );
      expect(transactionMocks.person.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCalls[1]);
      expect(transactionMocks.demonstrationRoleAssignment.upsert).not.toHaveBeenCalled();
      expect(transactionMocks.primaryDemonstrationRoleAssignment.upsert).not.toHaveBeenCalled();
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(
        new Error(`Person with id ${testValues.userId} not found.`)
      );
    });

    it("should not parse or check input dates if they don't exist", async () => {
      await __updateDemonstration(undefined, testInput);

      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should not parse or check input dates if they are null, but should pass them through", async () => {
      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          name: testValues.demonstrationName,
          effectiveDate: null,
          expirationDate: null,
        },
      };
      const expectedCall = {
        where: {
          id: testValues.demonstrationId,
        },
        data: {
          name: testValues.demonstrationName,
          effectiveDate: null,
          expirationDate: null,
        },
      };

      await __updateDemonstration(undefined, testInput);
      expect(checkOptionalNotNullFields).toHaveBeenCalledExactlyOnceWith(
        expectedCheckOptionalNotNullFieldList,
        testInput.input
      );
      expect(transactionMocks.demonstration.update).toHaveBeenCalledExactlyOnceWith(expectedCall);
      expect(parseDateTimeOrLocalDateToEasternTZDate).not.toHaveBeenCalled();
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
      expect(handlePrismaError).not.toHaveBeenCalled();
    });

    it("should parse and check effective date if it is provided", async () => {
      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          effectiveDate: testValues.dateValue,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(
        testValues.easternTZDate
      );

      await __updateDemonstration(undefined, testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testValues.dateValue,
        "Start of Day"
      );
      expect(checkInputDateIsStartOfDay).toHaveBeenCalledExactlyOnceWith(
        "effectiveDate",
        testValues.easternTZDate
      );
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should parse and check expiration date if it is provided", async () => {
      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          expirationDate: testValues.dateValue,
        },
      };
      vi.mocked(parseDateTimeOrLocalDateToEasternTZDate).mockReturnValueOnce(
        testValues.easternTZDate
      );

      await __updateDemonstration(undefined, testInput);
      expect(parseDateTimeOrLocalDateToEasternTZDate).toHaveBeenCalledExactlyOnceWith(
        testValues.dateValue,
        "End of Day"
      );
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith(
        "expirationDate",
        testValues.easternTZDate
      );
    });

    it("should properly handle an error if it occurs", async () => {
      const testError = new Error("Database connection failed");
      transactionMocks.demonstration.update.mockRejectedValueOnce(testError);
      await expect(__updateDemonstration(undefined, testInput)).rejects.toThrowError(
        testHandlePrismaError
      );
      expect(handlePrismaError).toHaveBeenCalledExactlyOnceWith(testError);
    });
  });

  describe("deleteDemonstration", () => {
    const testInput = {
      id: testValues.demonstrationId,
    };

    it("should call the delete function on the correct ID", async () => {
      await deleteDemonstration(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(
        testValues.demonstrationId,
        testValues.applicationTypeId,
        mockTransaction
      );
    });
  });
});

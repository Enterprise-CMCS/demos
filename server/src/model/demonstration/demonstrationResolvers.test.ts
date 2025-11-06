import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  __getDemonstration,
  __getManyDemonstrations,
  __createDemonstration,
  __updateDemonstration,
  __deleteDemonstration,
  __resolveDemonstrationState,
  __resolveDemonstrationAmendments,
  __resolveDemonstrationExtensions,
  __resolveDemonstrationSdgDivision,
  __resolveDemonstrationSignatureLevel,
  __resolveDemonstrationRoleAssignments,
  __resolveDemonstrationPrimaryProjectOfficer,
} from "./demonstrationResolvers.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateDemonstrationInput,
  GrantLevel,
  PersonType,
  PhaseName,
  Role,
  SdgDivision,
  SignatureLevel,
  UpdateDemonstrationInput,
} from "../../types.js";
import { Demonstration as PrismaDemonstration } from "@prisma/client";

// Mock imports
import { prisma } from "../../prismaClient.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";
import {
  deleteApplication,
  getApplication,
  getManyApplications,
  // None of these are tested but need to be exported to avoid mocking issues
  resolveApplicationCurrentPhaseName,
  resolveApplicationDocuments,
  resolveApplicationPhases,
  resolveApplicationStatus,
} from "../application/applicationResolvers.js";
import test from "node:test";

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

describe("demonstrationResolvers", () => {
  const regularMocks = {
    state: {
      findUnique: vi.fn(),
    },
    amendment: {
      findMany: vi.fn(),
    },
    extension: {
      findMany: vi.fn(),
    },
    demonstrationRoleAssignment: {
      findMany: vi.fn(),
    },
    primaryDemonstrationRoleAssignment: {
      findUnique: vi.fn(),
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
    state: {
      findUnique: regularMocks.state.findUnique,
    },
    amendment: {
      findMany: regularMocks.amendment.findMany,
    },
    extension: {
      findMany: regularMocks.extension.findMany,
    },
    demonstrationRoleAssignment: {
      findMany: regularMocks.demonstrationRoleAssignment.findMany,
    },
    primaryDemonstrationRoleAssignment: {
      findUnique: regularMocks.primaryDemonstrationRoleAssignment.findUnique,
    },
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
    dateValue: new Date(2025, 1, 1, 0, 0, 0, 0),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(prisma).mockReturnValue(mockPrismaClient as any);
    // Note: this line is necessary because resetAllMocks() clears the implementation each time
    mockPrismaClient.$transaction.mockImplementation((callback) => callback(mockTransaction));
  });

  describe("__getDemonstration", () => {
    it("should request the demonstration", async () => {
      const testInput = {
        id: testValues.demonstrationId,
      };
      await __getDemonstration(undefined, testInput);
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(
        testValues.demonstrationId,
        "Demonstration"
      );
    });
  });

  describe("__getManyDemonstrations", () => {
    it("should request many demonstrations with the right type", async () => {
      await __getManyDemonstrations();
      expect(getManyApplications).toHaveBeenCalledExactlyOnceWith("Demonstration");
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
      expect(getApplication).toHaveBeenCalledExactlyOnceWith(
        testValues.demonstrationId,
        testValues.applicationTypeId
      );
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
        new Error(`Person with id ${testValues.userId} not found`)
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
      "currentPhaseName",
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
        new Error(`Person with id ${testValues.userId} not found`)
      );
    });

    it("should not check input dates if they don't exist", async () => {
      await __updateDemonstration(undefined, testInput);
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should check effective date if it is provided", async () => {
      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          effectiveDate: testValues.dateValue,
        },
      };
      await __updateDemonstration(undefined, testInput);
      expect(checkInputDateIsStartOfDay).toHaveBeenCalledExactlyOnceWith({
        dateType: "effectiveDate",
        dateValue: testValues.dateValue,
      });
      expect(checkInputDateIsEndOfDay).not.toHaveBeenCalled();
    });

    it("should check expiration date if it is provided", async () => {
      const testInput: { id: string; input: UpdateDemonstrationInput } = {
        id: testValues.demonstrationId,
        input: {
          expirationDate: testValues.dateValue,
        },
      };
      await __updateDemonstration(undefined, testInput);
      expect(checkInputDateIsStartOfDay).not.toHaveBeenCalled();
      expect(checkInputDateIsEndOfDay).toHaveBeenCalledExactlyOnceWith({
        dateType: "expirationDate",
        dateValue: testValues.dateValue,
      });
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

  describe("__deleteDemonstration", () => {
    const testInput = {
      id: testValues.demonstrationId,
    };

    it("should call the delete function on the correct ID", async () => {
      await __deleteDemonstration(undefined, testInput);
      expect(deleteApplication).toHaveBeenCalledExactlyOnceWith(
        testValues.demonstrationId,
        testValues.applicationTypeId
      );
    });
  });

  describe("__resolveDemonstrationState", () => {
    it("should look up the relevant state", async () => {
      const input: Partial<PrismaDemonstration> = {
        stateId: testValues.stateId,
      };
      const expectedCall = {
        where: {
          id: testValues.stateId,
        },
      };
      await __resolveDemonstrationState(input as PrismaDemonstration);
      expect(regularMocks.state.findUnique).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("__resolveDemonstrationAmendments", () => {
    it("should look up the relevant amendments", async () => {
      const input: Partial<PrismaDemonstration> = {
        id: testValues.demonstrationId,
      };
      const expectedCall = {
        where: {
          demonstrationId: testValues.demonstrationId,
        },
      };
      await __resolveDemonstrationAmendments(input as PrismaDemonstration);
      expect(regularMocks.amendment.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("__resolveDemonstrationExtensions", () => {
    it("should look up the relevant extensions", async () => {
      const input: Partial<PrismaDemonstration> = {
        id: testValues.demonstrationId,
      };
      const expectedCall = {
        where: {
          demonstrationId: testValues.demonstrationId,
        },
      };
      await __resolveDemonstrationExtensions(input as PrismaDemonstration);
      expect(regularMocks.extension.findMany).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });

  describe("__resolveDemonstrationSdgDivision", () => {
    it("should resolve the relevant SDG Division", () => {
      const input: Partial<PrismaDemonstration> = {
        sdgDivisionId: testValues.sdgDivisionId,
      };
      expect(__resolveDemonstrationSdgDivision(input as PrismaDemonstration)).toBe(
        testValues.sdgDivisionId
      );
    });
  });

  describe("__resolveDemonstrationSignatureLevel", () => {
    it("should resolve the relevant signature level", () => {
      const input: Partial<PrismaDemonstration> = {
        signatureLevelId: testValues.signatureLevelId,
      };
      expect(__resolveDemonstrationSignatureLevel(input as PrismaDemonstration)).toBe(
        testValues.signatureLevelId
      );
    });
  });

  describe("__resolveDemonstrationRoleAssignments", () => {
    it("should look up the relevant assignments", async () => {
      const input: Partial<PrismaDemonstration> = {
        id: testValues.demonstrationId,
      };
      const expectedCall = {
        where: {
          demonstrationId: testValues.demonstrationId,
        },
      };
      await __resolveDemonstrationRoleAssignments(input as PrismaDemonstration);
      expect(regularMocks.demonstrationRoleAssignment.findMany).toHaveBeenCalledExactlyOnceWith(
        expectedCall
      );
    });
  });

  describe("__resolveDemonstrationPrimaryProjectOfficer", () => {
    it("should look up the primary project officer", async () => {
      regularMocks.primaryDemonstrationRoleAssignment.findUnique.mockResolvedValueOnce({
        demonstrationRoleAssignment: {
          person: {
            id: testValues.userId,
          },
        },
      });
      const input: Partial<PrismaDemonstration> = {
        id: testValues.demonstrationId,
      };
      const expectedCall = {
        where: {
          demonstrationId_roleId: {
            demonstrationId: testValues.demonstrationId,
            roleId: testValues.projectOfficerRole,
          },
        },
        include: {
          demonstrationRoleAssignment: {
            include: { person: true },
          },
        },
      };
      await __resolveDemonstrationPrimaryProjectOfficer(input as PrismaDemonstration);
      expect(
        regularMocks.primaryDemonstrationRoleAssignment.findUnique
      ).toHaveBeenCalledExactlyOnceWith(expectedCall);
    });
  });
});

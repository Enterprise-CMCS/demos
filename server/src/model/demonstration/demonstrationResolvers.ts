import { Demonstration as PrismaDemonstration } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateDemonstrationInput,
  GrantLevel,
  PhaseName,
  Role,
  UpdateDemonstrationInput,
} from "../../types.js";
import { resolveApplicationStatus } from "../applicationStatus/applicationStatusResolvers.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateIsEndOfDay,
} from "../applicationDate/checkInputDateFunctions.js";
import { getApplication, getManyApplications } from "../application/applicationResolvers.js";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

export async function __getDemonstration(
  parent: undefined,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return (await getApplication(id, "Demonstration")) as PrismaDemonstration;
}

export async function __getManyDemonstrations() {
  return await getManyApplications("Demonstration");
}

export async function createDemonstration(
  parent: undefined,
  { input }: { input: CreateDemonstrationInput }
): Promise<PrismaDemonstration> {
  let newApplicationId: string;
  try {
    newApplicationId = await prisma().$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          applicationTypeId: demonstrationApplicationType,
        },
      });

      await tx.demonstration.create({
        data: {
          id: application.id,
          applicationTypeId: application.applicationTypeId,
          name: input.name,
          description: input.description,
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: input.signatureLevel,
          statusId: newApplicationStatusId,
          stateId: input.stateId,
          currentPhaseId: conceptPhaseName,
        },
      });

      const person = await tx.person.findUnique({
        where: { id: input.projectOfficerUserId },
        select: { personTypeId: true },
      });

      if (!person) {
        throw new Error(`Person with id ${input.projectOfficerUserId} not found`);
      }

      await tx.demonstrationRoleAssignment.create({
        data: {
          demonstrationId: application.id,
          personId: input.projectOfficerUserId,
          personTypeId: person.personTypeId,
          roleId: roleProjectOfficer,
          stateId: input.stateId,
          grantLevelId: grantLevelDemonstration,
        },
      });

      await tx.primaryDemonstrationRoleAssignment.create({
        data: {
          demonstrationId: application.id,
          personId: input.projectOfficerUserId,
          roleId: "Project Officer",
        },
      });

      return application.id;
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return (await getApplication(newApplicationId, "Demonstration")) as PrismaDemonstration;
}

export async function updateDemonstration(
  parent: undefined,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
): Promise<PrismaDemonstration> {
  if (input.effectiveDate) {
    checkInputDateIsStartOfDay({ dateType: "effectiveDate", dateValue: input.effectiveDate });
  }
  if (input.expirationDate) {
    checkInputDateIsEndOfDay({ dateType: "expirationDate", dateValue: input.expirationDate });
  }
  checkOptionalNotNullFields(
    ["name", "status", "currentPhaseName", "stateId", "projectOfficerUserId"],
    input
  );
  try {
    return await prisma().$transaction(async (tx) => {
      const demonstration = await tx.demonstration.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          effectiveDate: input.effectiveDate,
          expirationDate: input.expirationDate,
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: input.signatureLevel,
          statusId: input.status,
          currentPhaseId: input.currentPhaseName,
          stateId: input.stateId,
        },
      });

      if (input.projectOfficerUserId) {
        const person = await tx.person.findUnique({
          where: { id: input.projectOfficerUserId },
          select: { personTypeId: true },
        });
        if (!person) {
          throw new Error(`Person with id ${input.projectOfficerUserId} not found`);
        }

        await tx.demonstrationRoleAssignment.upsert({
          where: {
            personId_demonstrationId_roleId: {
              demonstrationId: id,
              personId: input.projectOfficerUserId,
              roleId: roleProjectOfficer,
            },
          },
          update: {},
          create: {
            demonstrationId: id,
            personId: input.projectOfficerUserId,
            personTypeId: person.personTypeId,
            roleId: roleProjectOfficer,
            stateId: demonstration.stateId,
            grantLevelId: grantLevelDemonstration,
          },
        });

        await tx.primaryDemonstrationRoleAssignment.upsert({
          where: {
            demonstrationId_roleId: {
              demonstrationId: id,
              roleId: roleProjectOfficer,
            },
          },
          update: {
            personId: input.projectOfficerUserId,
          },
          create: {
            demonstrationId: id,
            personId: input.projectOfficerUserId,
            roleId: roleProjectOfficer,
          },
        });
      }

      return demonstration;
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function deleteDemonstration(
  parent: undefined,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  try {
    return await prisma().$transaction(async (tx) => {
      await tx.application.delete({
        where: {
          id: id,
        },
      });

      const demonstration = await tx.demonstration.delete({
        where: {
          id: id,
        },
      });

      return demonstration;
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export const demonstrationResolvers = {
  Query: {
    demonstration: __getDemonstration,
    demonstrations: __getManyDemonstrations,
  },

  Mutation: {
    createDemonstration: createDemonstration,
    updateDemonstration: updateDemonstration,
    deleteDemonstration: deleteDemonstration,
  },

  Demonstration: {
    state: async (parent: PrismaDemonstration) => {
      return await prisma().state.findUnique({
        where: { id: parent.stateId },
      });
    },

    documents: async (parent: PrismaDemonstration) => {
      return await prisma().document.findMany({
        where: {
          applicationId: parent.id,
        },
      });
    },

    amendments: async (parent: PrismaDemonstration) => {
      return await prisma().amendment.findMany({
        where: {
          demonstrationId: parent.id,
        },
      });
    },

    extensions: async (parent: PrismaDemonstration) => {
      return await prisma().extension.findMany({
        where: {
          demonstrationId: parent.id,
        },
      });
    },

    sdgDivision: async (parent: PrismaDemonstration) => {
      return parent.sdgDivisionId;
    },

    signatureLevel: async (parent: PrismaDemonstration) => {
      return parent.signatureLevelId;
    },

    currentPhaseName: async (parent: PrismaDemonstration) => {
      return parent.currentPhaseId;
    },

    roles: async (parent: PrismaDemonstration) => {
      return await prisma().demonstrationRoleAssignment.findMany({
        where: { demonstrationId: parent.id },
      });
    },

    status: resolveApplicationStatus,

    phases: async (parent: PrismaDemonstration) => {
      return await prisma().applicationPhase.findMany({
        where: {
          applicationId: parent.id,
        },
      });
    },

    primaryProjectOfficer: async (parent: PrismaDemonstration) => {
      const primaryRoleAssignment = await prisma().primaryDemonstrationRoleAssignment.findUnique({
        where: {
          demonstrationId_roleId: {
            demonstrationId: parent.id,
            roleId: roleProjectOfficer,
          },
        },
        include: {
          demonstrationRoleAssignment: {
            include: { person: true },
          },
        },
      });

      if (!primaryRoleAssignment) {
        throw new Error(`No primary project officer found for demonstration with id ${parent.id}`);
      }

      return primaryRoleAssignment.demonstrationRoleAssignment.person;
    },
  },
};

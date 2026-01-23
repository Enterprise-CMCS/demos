import {
  Demonstration as PrismaDemonstration,
  State as PrismaState,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
} from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  ApplicationStatus,
  ApplicationType,
  CreateDemonstrationInput,
  DemonstrationTypeAssignment,
  GrantLevel,
  PhaseName,
  Role,
  UpdateDemonstrationInput,
} from "../../types.js";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import {
  deleteApplication,
  getApplication,
  getManyApplications,
  resolveApplicationClearanceLevel,
  resolveApplicationCurrentPhaseName,
  resolveApplicationDocuments,
  resolveApplicationPhases,
  resolveApplicationStatus,
  resolveApplicationTags,
} from "../application/applicationResolvers.js";
import { determineDemonstrationTypeStatus } from "./determineDemonstrationTypeStatus.js";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

export async function __getDemonstration(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return await getApplication(id, "Demonstration");
}

export async function __getManyDemonstrations(): Promise<PrismaDemonstration[]> {
  return await getManyApplications("Demonstration");
}

export async function __createDemonstration(
  parent: unknown,
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
        throw new Error(`Person with id ${input.projectOfficerUserId} not found.`);
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
          roleId: roleProjectOfficer,
        },
      });

      return application.id;
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(newApplicationId, "Demonstration");
}

export async function __updateDemonstration(
  parent: unknown,
  { id, input }: { id: string; input: UpdateDemonstrationInput }
): Promise<PrismaDemonstration> {
  const { effectiveDate, expirationDate } = parseAndValidateEffectiveAndExpirationDates(input);
  checkOptionalNotNullFields(["name", "status", "stateId", "projectOfficerUserId"], input);
  try {
    return await prisma().$transaction(async (tx) => {
      const demonstration = await tx.demonstration.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          effectiveDate: effectiveDate,
          expirationDate: expirationDate,
          sdgDivisionId: input.sdgDivision,
          signatureLevelId: input.signatureLevel,
          statusId: input.status,
          stateId: input.stateId,
        },
      });

      if (input.projectOfficerUserId) {
        const person = await tx.person.findUnique({
          where: { id: input.projectOfficerUserId },
          select: { personTypeId: true },
        });
        if (!person) {
          throw new Error(`Person with id ${input.projectOfficerUserId} not found.`);
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

export async function __deleteDemonstration(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return await deleteApplication(id, "Demonstration");
}

export async function __resolveDemonstrationState(
  parent: PrismaDemonstration
): Promise<PrismaState> {
  // State can never be null thanks to the database
  const result = await prisma().state.findUnique({
    where: { id: parent.stateId },
  });
  return result!;
}

export async function __resolveDemonstrationAmendments(
  parent: PrismaDemonstration
): Promise<PrismaAmendment[] | null> {
  return await prisma().amendment.findMany({
    where: {
      demonstrationId: parent.id,
    },
  });
}

export async function __resolveDemonstrationExtensions(
  parent: PrismaDemonstration
): Promise<PrismaExtension[] | null> {
  return await prisma().extension.findMany({
    where: {
      demonstrationId: parent.id,
    },
  });
}

export function __resolveDemonstrationSdgDivision(parent: PrismaDemonstration): string | null {
  return parent.sdgDivisionId;
}

export function __resolveDemonstrationSignatureLevel(parent: PrismaDemonstration): string | null {
  return parent.signatureLevelId;
}

export async function __resolveDemonstrationRoleAssignments(
  parent: PrismaDemonstration
): Promise<PrismaDemonstrationRoleAssignment[]> {
  // There will always be at least one assignment for primary project officer
  const result = await prisma().demonstrationRoleAssignment.findMany({
    where: { demonstrationId: parent.id },
  });
  return result!;
}

export async function __resolveDemonstrationPrimaryProjectOfficer(
  parent: PrismaDemonstration
): Promise<PrismaPerson> {
  // It is not possible in the DB for the primary project officer not to exist
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
  return primaryRoleAssignment!.demonstrationRoleAssignment!.person;
}

export async function resolveDemonstrationTypes(
  parent: PrismaDemonstration
): Promise<DemonstrationTypeAssignment[]> {
  const assignments = await prisma().demonstrationTypeTagAssignment.findMany({
    where: {
      demonstrationId: parent.id,
    },
  });
  return assignments.map((assignment) => ({
    demonstrationType: assignment.tagId,
    effectiveDate: assignment.effectiveDate,
    expirationDate: assignment.expirationDate,
    status: determineDemonstrationTypeStatus(assignment.effectiveDate, assignment.expirationDate),
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  }));
}

export const demonstrationResolvers = {
  Query: {
    demonstration: __getDemonstration,
    demonstrations: __getManyDemonstrations,
  },

  Mutation: {
    createDemonstration: __createDemonstration,
    updateDemonstration: __updateDemonstration,
    deleteDemonstration: __deleteDemonstration,
  },

  Demonstration: {
    state: __resolveDemonstrationState,
    documents: resolveApplicationDocuments,
    amendments: __resolveDemonstrationAmendments,
    extensions: __resolveDemonstrationExtensions,
    sdgDivision: __resolveDemonstrationSdgDivision,
    signatureLevel: __resolveDemonstrationSignatureLevel,
    currentPhaseName: resolveApplicationCurrentPhaseName,
    roles: __resolveDemonstrationRoleAssignments,
    status: resolveApplicationStatus,
    phases: resolveApplicationPhases,
    primaryProjectOfficer: __resolveDemonstrationPrimaryProjectOfficer,
    clearanceLevel: resolveApplicationClearanceLevel,
    tags: resolveApplicationTags,
    demonstrationTypes: resolveDemonstrationTypes,
  },
};

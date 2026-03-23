import {
  Demonstration as PrismaDemonstration,
  State as PrismaState,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
  Demonstration,
  Prisma,
  Amendment,
  Extension,
  DemonstrationRoleAssignment,
} from "@prisma/client";
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
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import { deleteApplication, getApplication, getManyApplications } from "../application";
import { getDocuments } from "../document/documentResolvers.js";
import { getApplicationPhases } from "../applicationPhase/applicationPhaseResolvers.js";
import { getAmendments } from "../amendment/amendmentResolvers.js";
import { getExtensions } from "../extension/extensionResolvers.js";
import { getState } from "../state/stateResolvers.js";
import {
  getDemonstrationPrimaryProjectOfficer,
  getDemonstrationRoleAssignments,
} from "../demonstrationRoleAssignment/demonstrationRoleAssignmentResolvers.js";
import { getApplicationTags } from "../tag/tagResolvers.js";
import { getDemonstrationTypeTagAssignments } from "../demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers.js";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

export async function getDemonstration(
  parent: Amendment | Extension | DemonstrationRoleAssignment,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<Demonstration | null> {
  const parentType = info.parentType.name;
  let filter: Prisma.DemonstrationWhereUniqueInput;

  switch (parentType) {
    case Prisma.ModelName.Amendment:
      filter = { id: (parent as Extract<typeof parent, Amendment>).demonstrationId };
      break;
    case Prisma.ModelName.Extension:
      filter = { id: (parent as Extract<typeof parent, Extension>).demonstrationId };
      break;
    case Prisma.ModelName.DemonstrationRoleAssignment:
      filter = {
        id: (parent as Extract<typeof parent, DemonstrationRoleAssignment>).demonstrationId,
      };
      break;

    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().demonstration.findUnique({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

export async function __getDemonstration(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return await getApplication(id, { applicationTypeId: "Demonstration" });
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
  return await getApplication(newApplicationId, { applicationTypeId: "Demonstration" });
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

export async function deleteDemonstration(
  parent: unknown,
  { id }: { id: string }
): Promise<PrismaDemonstration> {
  return await prisma().$transaction(async (tx) => {
    return await deleteApplication(id, "Demonstration", tx);
  });
}

export const demonstrationResolvers = {
  Query: {
    demonstration: __getDemonstration,
    demonstrations: __getManyDemonstrations,
  },

  Mutation: {
    createDemonstration: __createDemonstration,
    updateDemonstration: __updateDemonstration,
    deleteDemonstration: deleteDemonstration,
  },

  Demonstration: {
    state: getState,
    documents: getDocuments,
    amendments: getAmendments,
    extensions: getExtensions,
    sdgDivision: (parent: Demonstration) => parent.sdgDivisionId,
    signatureLevel: (parent: Demonstration) => parent.signatureLevelId,
    currentPhaseName: (parent: Demonstration) => parent.currentPhaseId,
    roles: getDemonstrationRoleAssignments,
    status: (parent: Demonstration) => parent.statusId,
    phases: getApplicationPhases,
    primaryProjectOfficer: getDemonstrationPrimaryProjectOfficer,
    clearanceLevel: (parent: Demonstration) => parent.clearanceLevelId,
    tags: getApplicationTags,
    demonstrationTypes: getDemonstrationTypeTagAssignments,
  },
};

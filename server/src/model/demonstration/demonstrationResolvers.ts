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
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import {
  deleteApplication,
  getApplication,
  resolveApplicationClearanceLevel,
  resolveApplicationDocuments,
  resolveApplicationPhases,
  resolveApplicationTags,
} from "../application";
import { GraphQLContext } from "../../auth/auth.util.js";
import { determineDemonstrationTypeStatus } from "./determineDemonstrationTypeStatus.js";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

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

async function resolveDemonstrationState(parent: PrismaDemonstration) {
  return await prisma().state.findUnique({
    where: { id: parent.stateId },
  });
}

async function resolveDemonstrationRoleAssignments(parent: PrismaDemonstration) {
  return await prisma().demonstrationRoleAssignment.findMany({
    where: { demonstrationId: parent.id },
  });
}

async function resolveDemonstrationPrimaryProjectOfficer(parent: PrismaDemonstration) {
  const primaryProjectOfficer = await prisma().primaryDemonstrationRoleAssignment.findUnique({
    where: {
      demonstrationId_roleId: {
        demonstrationId: parent.id,
        roleId: roleProjectOfficer,
      },
    },
    include: {
      demonstrationRoleAssignment: {
        include: {
          person: true,
        },
      },
    },
  });

  if (!primaryProjectOfficer) {
    throw new Error(`Primary project officer not found for demonstration ${parent.id}.`);
  }

  return primaryProjectOfficer.demonstrationRoleAssignment.person;
}

async function resolveDemonstrationTypes(parent: PrismaDemonstration) {
  const assignments = await prisma().demonstrationTypeTagAssignment.findMany({
    where: {
      demonstrationId: parent.id,
    },
    include: {
      tag: true,
    },
  });

  return assignments.map((assignment) => ({
    demonstrationTypeName: assignment.tagNameId,
    effectiveDate: assignment.effectiveDate,
    expirationDate: assignment.expirationDate,
    status: determineDemonstrationTypeStatus(assignment.effectiveDate, assignment.expirationDate),
    approvalStatus: assignment.tag.statusId,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  }));
}

export const demonstrationResolvers = {
  Query: {
    demonstration: (parent: never, args: { id: string }, context: GraphQLContext) =>
      context.services.demonstration.get({ id: args.id }),
    demonstrations: (parent: never, args: never, context: GraphQLContext) =>
      context.services.demonstration.getMany(),
  },

  Mutation: {
    createDemonstration: __createDemonstration,
    updateDemonstration: __updateDemonstration,
    deleteDemonstration: deleteDemonstration,
  },

  Demonstration: {
    state: resolveDemonstrationState,
    documents: resolveApplicationDocuments,
    amendments: (parent: { id: string }, args: never, context: GraphQLContext) =>
      context.services.amendment.getMany({ demonstrationId: parent.id }),
    extensions: (parent: { id: string }, args: never, context: GraphQLContext) =>
      context.services.extension.getMany({ demonstrationId: parent.id }),
    sdgDivision: (parent: PrismaDemonstration) => parent.sdgDivisionId,
    signatureLevel: (parent: PrismaDemonstration) => parent.signatureLevelId,
    currentPhaseName: (parent: PrismaDemonstration) => parent.currentPhaseId,
    roles: resolveDemonstrationRoleAssignments,
    status: (parent: PrismaDemonstration) => parent.statusId,
    phases: resolveApplicationPhases,
    primaryProjectOfficer: resolveDemonstrationPrimaryProjectOfficer,
    clearanceLevel: resolveApplicationClearanceLevel,
    tags: resolveApplicationTags,
    demonstrationTypes: resolveDemonstrationTypes,
  },
};

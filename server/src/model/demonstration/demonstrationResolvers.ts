import {
  Demonstration as PrismaDemonstration,
  State as PrismaState,
  DemonstrationRoleAssignment as PrismaDemonstrationRoleAssignment,
  Person as PrismaPerson,
} from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  CreateDemonstrationInput,
  GrantLevel,
  PhaseName,
  Role,
  UiPathResultStatus,
  UpdateDemonstrationInput,
} from "../../types";
import { checkOptionalNotNullFields } from "../../errors/checkOptionalNotNullFields";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { parseAndValidateEffectiveAndExpirationDates } from "../applicationDate";
import { deleteApplication, getApplication } from "../application";
import { determineDemonstrationTypeStatus } from "./determineDemonstrationTypeStatus";
import { resolveManyDeliverables } from "../deliverable";
import { GraphQLContext } from "../../auth";
import { getDemonstration, getManyDemonstrations } from "./demonstrationData";
import { getManyAmendments } from "../amendment";
import { getManyExtensions } from "../extension";
import { getManyDocuments } from "../document";
import { getManyApplicationPhases } from "../applicationPhase";
import { getManyApplicationTagAssignments } from "../applicationTagAssignment";
import { getManyDemonstrationTypeTagAssignments } from "../demonstrationTypeTagAssignment";
import { getManyDemonstrationRoleAssignments } from "../demonstrationRoleAssignment";
import { getManyApplicationTagSuggestions } from "../applicationTagSuggestion";

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

export async function __resolveDemonstrationState(
  parent: PrismaDemonstration
): Promise<PrismaState> {
  // State can never be null thanks to the database
  const result = await prisma().state.findUniqueOrThrow({
    where: { id: parent.stateId },
  });
  return result;
}

export async function __resolveDemonstrationRoleAssignments(
  parent: PrismaDemonstration
): Promise<PrismaDemonstrationRoleAssignment[]> {
  // There will always be at least one assignment for primary project officer
  const result = await prisma().demonstrationRoleAssignment.findMany({
    where: { demonstrationId: parent.id },
  });
  return result;
}

export async function __resolveDemonstrationPrimaryProjectOfficer(
  parent: PrismaDemonstration
): Promise<PrismaPerson> {
  // It is not possible in the DB for the primary project officer not to exist
  const primaryRoleAssignment = await prisma().primaryDemonstrationRoleAssignment.findUniqueOrThrow(
    {
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
    }
  );
  return primaryRoleAssignment.demonstrationRoleAssignment.person;
}

export const demonstrationResolvers = {
  Query: {
    demonstration: (parent: unknown, args: { id: string }, context: GraphQLContext) =>
      getDemonstration({ id: args.id }, context.user),
    demonstrations: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getManyDemonstrations({}, context.user),
  },

  Mutation: {
    createDemonstration: __createDemonstration,
    updateDemonstration: __updateDemonstration,
    deleteDemonstration: deleteDemonstration,
  },

  Demonstration: {
    state: __resolveDemonstrationState,
    documents: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ applicationId: parent.id }, context.user),
    amendments: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyAmendments({ demonstrationId: parent.id }, context.user),
    extensions: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyExtensions({ demonstrationId: parent.id }, context.user),
    sdgDivision: (parent: PrismaDemonstration) => parent.sdgDivisionId,
    signatureLevel: (parent: PrismaDemonstration) => parent.signatureLevelId,
    currentPhaseName: (parent: PrismaDemonstration) => parent.currentPhaseId,
    roles: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyDemonstrationRoleAssignments({ demonstrationId: parent.id }, context.user),
    status: (parent: PrismaDemonstration) => parent.statusId,
    phases: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyApplicationPhases({ applicationId: parent.id }, context.user),
    primaryProjectOfficer: __resolveDemonstrationPrimaryProjectOfficer,
    clearanceLevel: (parent: PrismaDemonstration) => parent.clearanceLevelId,
    tags: async (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      (await getManyApplicationTagAssignments({ applicationId: parent.id }, context.user)).map(
        (assignment) => {
          const { statusId, tagNameId, ...tag } = assignment.tag;
          return {
            ...tag,
            tagName: tagNameId,
            approvalStatus: statusId,
          };
        }
      ),
    suggestedApplicationTags: async (
      parent: PrismaDemonstration,
      args: unknown,
      context: GraphQLContext
    ) =>
      (
        await getManyApplicationTagSuggestions(
          {
            applicationId: parent.id,
            statusId: {
              in: ["Pending" satisfies UiPathResultStatus],
            },
          },
          context.user
        )
      ).map((suggestion) => suggestion.value),
    demonstrationTypes: async (
      parent: PrismaDemonstration,
      args: unknown,
      context: GraphQLContext
    ) =>
      (
        await getManyDemonstrationTypeTagAssignments({ demonstrationId: parent.id }, context.user)
      ).map((assignment) => {
        const { tagNameId, tag, ...rest } = assignment;
        return {
          ...rest,
          demonstrationTypeName: tagNameId,
          status: determineDemonstrationTypeStatus(
            assignment.effectiveDate,
            assignment.expirationDate
          ),
          approvalStatus: tag.statusId,
        };
      }),
    deliverables: resolveManyDeliverables,
  },
};

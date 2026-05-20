import { Demonstration as PrismaDemonstration, Person as PrismaPerson } from "@prisma/client";
import { prisma } from "../../prismaClient";
import {
  ApplicationStatus,
  ApplicationType,
  CreateDemonstrationInput,
  GrantLevel,
  PhaseName,
  Role,
  SignatureLevel,
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
import { selectManyApplicationPhases } from "../applicationPhase/queries";
import { selectManyApplicationTagAssignments } from "../applicationTagAssignment/queries";
import { selectManyDemonstrationTypeTagAssignments } from "../demonstrationTypeTagAssignment/queries";
import {
  selectDemonstrationRoleAssignmentOrThrow,
  selectManyDemonstrationRoleAssignments,
} from "../demonstrationRoleAssignment/queries";
import { selectManyApplicationTagSuggestions } from "../applicationTagSuggestion/queries";
import { getState } from "../state";
import { selectPersonOrThrow } from "../person/queries";

const grantLevelDemonstration: GrantLevel = "Demonstration";
const roleProjectOfficer: Role = "Project Officer";
const conceptPhaseName: PhaseName = "Concept";
const newApplicationStatusId: ApplicationStatus = "Pre-Submission";
const demonstrationApplicationType: ApplicationType = "Demonstration";

const DEFAULT_SIGNATURE_LEVEL: SignatureLevel = "OA";

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
          signatureLevelId: DEFAULT_SIGNATURE_LEVEL,
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

export const resolvePrimaryProjectOfficer = async (parent: PrismaDemonstration) => {
  const primaryProjectOfficerAssignment = await selectDemonstrationRoleAssignmentOrThrow({
    demonstrationId: parent.id,
    roleId: roleProjectOfficer,
    primaryDemonstrationRoleAssignment: {
      isNot: null,
    },
  });
  return selectPersonOrThrow({ id: primaryProjectOfficerAssignment.personId });
};

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
    state: (parent: PrismaDemonstration) => getState({ id: parent.stateId }),
    documents: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ applicationId: parent.id }, context.user),
    amendments: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyAmendments({ demonstrationId: parent.id }, context.user),
    extensions: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      getManyExtensions({ demonstrationId: parent.id }, context.user),
    sdgDivision: (parent: PrismaDemonstration) => parent.sdgDivisionId,
    signatureLevel: (parent: PrismaDemonstration) => parent.signatureLevelId,
    currentPhaseName: (parent: PrismaDemonstration) => parent.currentPhaseId,
    roles: (parent: PrismaDemonstration) =>
      selectManyDemonstrationRoleAssignments({ demonstrationId: parent.id }),
    status: (parent: PrismaDemonstration) => parent.statusId,
    phases: (parent: PrismaDemonstration, args: unknown, context: GraphQLContext) =>
      selectManyApplicationPhases({ applicationId: parent.id }),
    primaryProjectOfficer: resolvePrimaryProjectOfficer,
    clearanceLevel: (parent: PrismaDemonstration) => parent.clearanceLevelId,
    tags: async (parent: PrismaDemonstration) =>
      (await selectManyApplicationTagAssignments({ applicationId: parent.id })).map(
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
    ) =>
      (
        await selectManyApplicationTagSuggestions(
          {
            applicationId: parent.id,
            statusId: {
              in: ["Pending" satisfies UiPathResultStatus],
            },
          },
        )
      ).map((suggestion) => suggestion.value),
    demonstrationTypes: async (parent: PrismaDemonstration) =>
      (await selectManyDemonstrationTypeTagAssignments({ demonstrationId: parent.id })).map(
        (assignment) => {
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
        }
      ),
    deliverables: resolveManyDeliverables,
  },
};

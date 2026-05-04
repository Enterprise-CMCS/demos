import {
  Demonstration as PrismaDemonstration,
  Deliverable as PrismaDeliverable,
  Document as PrismaDocument,
  Prisma,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";
import {
  completeDeliverable,
  createDeliverable,
  getDeliverable,
  getManyDeliverables,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
} from ".";
import {
  CreateDeliverableInput,
  DeliverableAction,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  FinalDeliverableStatus,
  RequestDeliverableResubmissionInput,
  UpdateDeliverableInput,
} from "../../types";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getManyDocuments } from "../document";
import { getFormattedDeliverableActions } from "../deliverableAction";
import { getManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";

export async function resolveDeliverable(
  parent: PrismaDocument,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDeliverable | null> {
  const parentType = info.parentType.name;
  let filter: Prisma.DeliverableWhereUniqueInput | null;

  if (parentType === Prisma.ModelName.Document) {
    if (parent.deliverableId) {
      filter = { id: parent.deliverableId };
    } else {
      filter = null;
    }
  } else {
    throw new Error(`Unsupported parent type: ${parentType}`);
  }

  if (filter === null) {
    return null;
  }
  const result = await getDeliverable(filter);
  return result;
}

export async function resolveManyDeliverables(
  parent: PrismaDemonstration | PrismaUser,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDeliverable[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.DeliverableWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { demonstrationId: parent.id };
      break;
    case Prisma.ModelName.User:
      filter = { cmsOwnerUserId: parent.id };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  const results = await getManyDeliverables(filter);
  return results;
}

export async function queryDeliverables(): Promise<PrismaDeliverable[]> {
  return await getManyDeliverables();
}

export function resolveDeliverableType(parent: PrismaDeliverable): DeliverableType {
  return parent.deliverableTypeId as DeliverableType;
}

export function resolveDeliverableStatus(parent: PrismaDeliverable): DeliverableStatus {
  return parent.statusId as DeliverableStatus;
}

export function resolveDeliverableDueDateType(parent: PrismaDeliverable): DeliverableDueDateType {
  return parent.dueDateTypeId as DeliverableDueDateType;
}

export async function resolveDemonstration(
  parent: PrismaDeliverable
): Promise<PrismaDemonstration> {
  return await getApplication(parent.demonstrationId, { applicationTypeId: "Demonstration" });
}

export async function resolveDeliverableCmsOwner(parent: PrismaDeliverable): Promise<PrismaUser> {
  return getUser({ id: parent.cmsOwnerUserId });
}

export const deliverableResolvers = {
  Query: {
    deliverable: async (parent: unknown, args: { id: string }) =>
      await getDeliverable({ id: args.id }),
    deliverables: queryDeliverables,
  },

  Mutation: {
    createDeliverable: async (
      parent: unknown,
      args: { input: CreateDeliverableInput },
      context: GraphQLContext
    ) => {
      return await createDeliverable(args.input, context);
    },
    updateDeliverable: async (
      parent: unknown,
      args: { id: string; input: UpdateDeliverableInput },
      context: GraphQLContext
    ) => {
      return await updateDeliverable(args.id, args.input, context);
    },
    submitDeliverable: async (parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return await submitDeliverable(args.id, context);
    },
    startDeliverableReview: async (
      parent: unknown,
      args: { id: string },
      context: GraphQLContext
    ) => {
      return await startDeliverableReview(args.id, context);
    },
    completeDeliverable: async (
      parent: unknown,
      args: { id: string; finalStatus: FinalDeliverableStatus },
      context: GraphQLContext
    ) => {
      return await completeDeliverable(args.id, args.finalStatus, context);
    },
    requestDeliverableResubmission: async (
      parent: unknown,
      args: { id: string; input: RequestDeliverableResubmissionInput },
      context: GraphQLContext
    ) => {
      return await requestDeliverableResubmission(args.id, args.input, context);
    },
  },

  Deliverable: {
    deliverableType: resolveDeliverableType,
    demonstration: resolveDemonstration,
    status: resolveDeliverableStatus,
    cmsOwner: resolveDeliverableCmsOwner,
    dueDateType: resolveDeliverableDueDateType,
    demonstrationTypes: async (parent: PrismaDeliverable, args: unknown, context: GraphQLContext) =>
      (await getManyDeliverableDemonstrationTypes({ deliverableId: parent.id }, context.user)).map(
        (deliverableDemonstrationType) => {
          const { statusId, tagNameId, ...tag } =
            deliverableDemonstrationType.demonstrationTypeTagAssignment.tag;
          return {
            ...tag,
            tagName: tagNameId,
            approvalStatus: statusId,
          };
        }
      ),
    cmsDocuments: async (
      parent: PrismaDeliverable,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      await getManyDocuments(
        {
          AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: true }],
        },
        context.user
      ),
    stateDocuments: async (
      parent: PrismaDeliverable,
      args: unknown,
      context: GraphQLContext
    ): Promise<PrismaDocument[]> =>
      await getManyDocuments(
        {
          AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: false }],
        },
        context.user
      ),
    deliverableActions: async (parent: PrismaDeliverable): Promise<DeliverableAction[]> => {
      return await getFormattedDeliverableActions(parent.id);
    },
  },
};

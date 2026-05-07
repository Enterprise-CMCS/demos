import {
  Demonstration as PrismaDemonstration,
  Deliverable as PrismaDeliverable,
  DeliverableExtension as PrismaDeliverableExtension,
  Document as PrismaDocument,
  Prisma,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { GraphQLResolveInfo } from "graphql";
import {
  approveDeliverableExtension,
  completeDeliverable,
  createDeliverable,
  denyDeliverableExtension,
  getDeliverable,
  getManyDeliverables,
  requestDeliverableExtension,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
} from ".";
import {
  ApproveDeliverableExtensionInput,
  CreateDeliverableInput,
  DeliverableAction,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  DenyDeliverableExtensionInput,
  FinalDeliverableStatus,
  RequestDeliverableExtensionInput,
  RequestDeliverableResubmissionInput,
  UpdateDeliverableInput,
} from "../../types";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getManyDocuments } from "../document";
import { getFormattedDeliverableActions } from "../deliverableAction";
import { getManyDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";
import { selectManyDeliverableExtensions } from "../deliverableExtension/queries";
import { DELETED_DELIVERABLE_STATUS } from "../../constants";

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
      filter = { id: parent.deliverableId, NOT: { statusId: DELETED_DELIVERABLE_STATUS } };
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
      filter = { demonstrationId: parent.id, NOT: { statusId: DELETED_DELIVERABLE_STATUS } };
      break;
    case Prisma.ModelName.User:
      filter = { cmsOwnerUserId: parent.id, NOT: { statusId: DELETED_DELIVERABLE_STATUS } };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  const results = await getManyDeliverables(filter);
  return results;
}

export async function queryDeliverables(): Promise<PrismaDeliverable[]> {
  return await getManyDeliverables({ NOT: { statusId: DELETED_DELIVERABLE_STATUS } });
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
    requestDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: RequestDeliverableExtensionInput },
      context: GraphQLContext
    ) => {
      return await requestDeliverableExtension(args.deliverableId, args.input, context);
    },
    approveDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: ApproveDeliverableExtensionInput },
      context: GraphQLContext
    ) => {
      return await approveDeliverableExtension(args.deliverableId, args.input, context);
    },
    denyDeliverableExtension: async (
      parent: unknown,
      args: { deliverableId: string; input: DenyDeliverableExtensionInput },
      context: GraphQLContext
    ) => {
      return await denyDeliverableExtension(args.deliverableId, args.input, context);
    },
  },

  Deliverable: {
    deliverableType: resolveDeliverableType,
    demonstration: resolveDemonstration,
    status: resolveDeliverableStatus,
    cmsOwner: (parent: PrismaDeliverable, args: unknown, context: GraphQLContext) =>
      getUser({ id: parent.cmsOwnerUserId }, context.user),
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
    extensionRequests: async (parent: PrismaDeliverable): Promise<PrismaDeliverableExtension[]> => {
      return await selectManyDeliverableExtensions({ deliverableId: parent.id });
    },
  },
};

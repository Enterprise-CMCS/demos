import {
  Demonstration as PrismaDemonstration,
  Deliverable as PrismaDeliverable,
  Document as PrismaDocument,
  Prisma,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";
import { GraphQLResolveInfo } from "graphql";
import { createDeliverable, getDeliverable, getManyDeliverables, updateDeliverable } from ".";
import {
  CreateDeliverableInput,
  DeliverableDueDateType,
  DeliverableStatus,
  DeliverableType,
  UpdateDeliverableInput,
} from "../../types";
import { getApplication } from "../application";
import { getUser } from "../user";
import { getManyDocuments } from "../document";
import { getDeliverableDemonstrationTypes } from "../deliverableDemonstrationType";

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

export async function resolveDeliverableCmsDocuments(
  parent: PrismaDeliverable
): Promise<PrismaDocument[]> {
  return await getManyDocuments({
    AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: true }],
  });
}

export async function resolveDeliverableStateDocuments(
  parent: PrismaDeliverable
): Promise<PrismaDocument[]> {
  return await getManyDocuments({
    AND: [{ deliverableId: parent.id }, { deliverableIsCmsAttachedFile: false }],
  });
}

export const deliverableResolvers = {
  Query: {
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
  },

  Deliverable: {
    deliverableType: resolveDeliverableType,
    demonstration: resolveDemonstration,
    status: resolveDeliverableStatus,
    cmsOwner: resolveDeliverableCmsOwner,
    dueDateType: resolveDeliverableDueDateType,
    demonstrationTypes: async (parent: PrismaDeliverable) => {
      return await getDeliverableDemonstrationTypes(parent.id);
    },
    cmsDocuments: resolveDeliverableCmsDocuments,
    stateDocuments: resolveDeliverableStateDocuments,
  },
};

import {
  Demonstration as PrismaDemonstration,
  Deliverable as PrismaDeliverable,
  Prisma,
  User as PrismaUser,
} from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util";
import { GraphQLResolveInfo } from "graphql";
import { getManyDeliverables } from ".";
import { DeliverableDueDateType, DeliverableStatus, DeliverableType } from "../../types";
import { getApplication } from "../application";
import { getUser } from "../user";

export async function resolveDeliverables(
  parent: PrismaDemonstration,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<PrismaDeliverable[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.DeliverableWhereInput;

  switch (parentType) {
    case Prisma.ModelName.Demonstration:
      filter = { demonstrationId: parent.id };
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
  return getUser(parent.cmsOwnerUserId);
}

export const deliverableResolvers = {
  Query: {
    deliverables: queryDeliverables,
  },

  Deliverable: {
    deliverableType: resolveDeliverableType,
    demonstration: resolveDemonstration,
    status: resolveDeliverableStatus,
    cmsOwner: resolveDeliverableCmsOwner,
    dueDateType: resolveDeliverableDueDateType,
  },
};

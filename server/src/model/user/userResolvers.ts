import { prisma } from "../../prismaClient.js";
import type { GraphQLContext } from "../../auth/auth.util.js";
import {
  Document as PrismaDocument,
  Event as PrismaEvent,
  Person as PrismaPerson,
  User as PrismaUser,
} from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";

export async function queryCurrentUser(
  parent: unknown,
  args: unknown,
  context: GraphQLContext
): Promise<PrismaUser | null> {
  if (!context.user) return null;
  return await prisma().user.findUniqueOrThrow({
    where: { id: context.user.id },
  });
}

export async function resolvePerson(parent: PrismaUser): Promise<PrismaPerson> {
  return await prisma().person.findUniqueOrThrow({
    where: {
      id: parent.id,
    },
  });
}

export async function resolveEvents(parent: PrismaUser): Promise<PrismaEvent[]> {
  return await prisma().event.findMany({
    where: {
      userId: parent.id,
    },
  });
}

export async function resolveOwnedDocuments(parent: PrismaUser): Promise<PrismaDocument[]> {
  return await prisma().document.findMany({
    where: {
      ownerUserId: parent.id,
    },
  });
}

export const userResolvers = {
  Query: {
    currentUser: queryCurrentUser,
  },
  User: {
    person: resolvePerson,
    events: resolveEvents,
    ownedDocuments: resolveOwnedDocuments,
    ownedDeliverables: resolveManyDeliverables,
  },
};

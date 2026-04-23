import { prisma } from "../../prismaClient";
import type { GraphQLContext } from "../../auth";
import { Event as PrismaEvent, Person as PrismaPerson, User as PrismaUser } from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";

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

export const userResolvers = {
  Query: {
    currentUser: queryCurrentUser,
  },
  User: {
    person: resolvePerson,
    events: resolveEvents,
    ownedDocuments: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ ownerUserId: parent.id }, context.user),
    ownedDeliverables: resolveManyDeliverables,
  },
};

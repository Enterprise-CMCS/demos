import { prisma } from "../../prismaClient";
import type { GraphQLContext } from "../../auth";
import { Event as PrismaEvent, User as PrismaUser } from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
import { getUser } from "./userData";
import { getPerson } from "../person";

export async function resolveEvents(parent: PrismaUser): Promise<PrismaEvent[]> {
  return await prisma().event.findMany({
    where: {
      userId: parent.id,
    },
  });
}

export const userResolvers = {
  Query: {
    currentUser: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getUser({ id: context.user.id }, context.user),
  },
  User: {
    person: (parent: PrismaUser) => getPerson({ id: parent.id }),
    events: resolveEvents,
    ownedDocuments: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ ownerUserId: parent.id }, context.user),
    ownedDeliverables: resolveManyDeliverables,
  },
};

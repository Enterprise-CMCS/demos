import { prisma } from "../../prismaClient";
import type { GraphQLContext } from "../../auth";
import { User as PrismaUser } from "@prisma/client";
import { resolveManyDeliverables } from "../deliverable";
import { getManyDocuments } from "../document";
import { getUser } from "./userData";
import { getPerson } from "../person";

export const userResolvers = {
  Query: {
    currentUser: (parent: unknown, args: unknown, context: GraphQLContext) =>
      getUser({ id: context.user.id }, context.user),
  },
  User: {
    person: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getPerson({ id: parent.id }, context.user),
    ownedDocuments: (parent: PrismaUser, args: unknown, context: GraphQLContext) =>
      getManyDocuments({ ownerUserId: parent.id }, context.user),
    ownedDeliverables: resolveManyDeliverables,
  },
};

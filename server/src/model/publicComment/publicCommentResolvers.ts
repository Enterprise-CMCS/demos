import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { resolveDeliverable } from "../deliverable";
import { getUser } from "../user";
import { createPublicComment } from ".";

export const publicCommentResolvers = {
  Mutation: {
    createPublicComment: async (
      parent: unknown,
      args: { deliverableId: string; comment: NonEmptyString },
      context: GraphQLContext
    ) => {
      return await createPublicComment(args.deliverableId, args.comment, context);
    },
  },

  DeliverableComment: {
    deliverable: resolveDeliverable,
    authorUser: async (
      parent: PrismaPublicComment | PrismaPrivateComment,
      args: undefined,
      context: GraphQLContext
    ) => {
      return await getUser({ id: parent.authorUserId }, context.user);
    },
  },
};

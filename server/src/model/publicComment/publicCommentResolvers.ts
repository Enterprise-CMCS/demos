import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
} from "@prisma/client";
import { GraphQLContext } from "../../auth";
import { resolveDeliverable } from "../deliverable";
import { getUser } from "../user";

export const publicCommentResolvers = {
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

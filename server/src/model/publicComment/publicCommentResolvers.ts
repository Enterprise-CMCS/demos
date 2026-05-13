import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
  User as PrismaUser,
} from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { resolveDeliverable } from "../deliverable";
import { selectUser } from "../user/queries";
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
    authorUser: async (parent: PrismaPublicComment | PrismaPrivateComment): Promise<PrismaUser> => {
      return await selectUser({ id: parent.authorUserId }, true);
    },
  },
};

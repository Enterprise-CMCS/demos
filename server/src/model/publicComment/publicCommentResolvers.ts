import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
  User as PrismaUser,
} from "@prisma/client";
import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { resolveDeliverable } from "../deliverable";
import { selectUserOrThrow } from "../user/queries";
import { createPublicComment } from ".";

export const publicCommentResolvers = {
  Mutation: {
    createPublicComment: (
      parent: unknown,
      args: { deliverableId: string; comment: NonEmptyString },
      context: GraphQLContext
    ): Promise<PrismaPublicComment> =>
      createPublicComment(args.deliverableId, args.comment, context),
  },

  DeliverableComment: {
    deliverable: resolveDeliverable,
    authorUser: (parent: PrismaPublicComment | PrismaPrivateComment): Promise<PrismaUser> =>
      selectUserOrThrow({ id: parent.authorUserId }),
  },
};

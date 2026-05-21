import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { createPrivateComment } from ".";
import { PrivateComment as PrismaPrivateComment } from "@prisma/client";

export const privateCommentResolvers = {
  Mutation: {
    createPrivateComment: (
      parent: unknown,
      args: { deliverableId: string; comment: NonEmptyString },
      context: GraphQLContext
    ): Promise<PrismaPrivateComment> =>
      createPrivateComment(args.deliverableId, args.comment, context),
  },
};

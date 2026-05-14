import { NonEmptyString } from "../../types";
import { GraphQLContext } from "../../auth";
import { createPrivateComment } from ".";

export const privateCommentResolvers = {
  Mutation: {
    createPrivateComment: async (
      parent: unknown,
      args: { deliverableId: string; comment: NonEmptyString },
      context: GraphQLContext
    ) => {
      return await createPrivateComment(args.deliverableId, args.comment, context);
    },
  },
};

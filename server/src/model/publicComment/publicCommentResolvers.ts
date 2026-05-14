import {
  PrivateComment as PrismaPrivateComment,
  PublicComment as PrismaPublicComment,
  User as PrismaUser,
} from "@prisma/client";
import { resolveDeliverable } from "../deliverable";
import { selectUser } from "../user/queries";

export const publicCommentResolvers = {
  DeliverableComment: {
    deliverable: resolveDeliverable,
    authorUser: async (parent: PrismaPublicComment | PrismaPrivateComment): Promise<PrismaUser> => {
      return await selectUser({ id: parent.authorUserId }, true);
    },
  },
};

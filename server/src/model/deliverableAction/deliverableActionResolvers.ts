import { DeliverableAction as PrismaDeliverableAction, User as PrismaUser } from "@prisma/client";
import { getUser } from "../user";

export const deliverableActionResolvers = {
  DeliverableAction: {
    user: async (parent: PrismaDeliverableAction): Promise<PrismaUser | null> => {
      if (parent.userId) {
        return await getUser({ id: parent.userId });
      } else {
        return null;
      }
    },
  },
};

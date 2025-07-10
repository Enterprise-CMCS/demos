import { prisma } from "../../prismaClient.js";

export const eventTypeResolvers = {
  Query: {
    eventTypes: async () => {
      return await prisma.eventType.findMany({
        orderBy: { id: 'asc' }
      });
    },

    eventType: async (_: undefined, { id }: { id: string }) => {
      return await prisma.eventType.findUnique({
        where: { id }
      });
    }
  }
};

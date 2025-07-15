import { prisma } from '../../prismaClient.js';
import { LogEventInput } from './eventSchema.js';
import { GraphQLContext, getCurrentUserId, getCurrentUserRoleId } from '../../auth/auth.util.js';

export const eventResolvers = {
  Query: {
    events: async () => {
      return await prisma().event.findMany({
        include: {
          user: true,
          eventType: true,
          withRole: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    event: async (_: undefined, { id }: { id: string }) => {
      return await prisma().event.findUnique({
        where: { id },
        include: {
          user: true,
          eventType: true,
          withRole: true
        }
      });
    },

    eventsByType: async (_: undefined, { eventTypeId }: { eventTypeId: string }) => {
      return await prisma().event.findMany({
        where: { eventTypeId },
        include: {
          user: true,
          eventType: true,
          withRole: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    eventsByUser: async (_: undefined, { userId }: { userId: string }) => {
      return await prisma().event.findMany({
        where: { userId },
        include: {
          user: true,
          eventType: true,
          withRole: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    eventsByRoute: async (_: undefined, { route }: { route: string }) => {
      return await prisma().event.findMany({
        where: { route },
        include: {
          user: true,
          eventType: true,
          withRole: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    logEvent: async (_: undefined, { input }: { input: LogEventInput }, context: GraphQLContext) => {
      const { eventTypeId, route, eventData } = input;
      
      const userId = await getCurrentUserId(context);
      const withRoleId = await getCurrentUserRoleId(context);
      
      try {
        await prisma().event.create({
          data: {
            userId,
            eventTypeId,
            withRoleId,
            route,
            eventData
          }
        });
        return { success: true };
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
      }
    }
  }
};

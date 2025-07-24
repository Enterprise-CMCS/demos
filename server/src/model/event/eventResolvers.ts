import { prisma } from '../../prismaClient.js';
import { LogEventInput } from './eventSchema.js';
import { Event } from '@prisma/client';
import { GraphQLContext, getCurrentUserId, getCurrentUserRoleId } from '../../auth/auth.util.js';
export const eventResolvers = {
  Query: {
    events: async () => {
      return await prisma().event.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    logEvent: async (_: undefined, { input }: { input: LogEventInput }, context: GraphQLContext) => {
      const { eventType, logLevel, route, eventData: clientEventData } = input;

      const userId = await getCurrentUserId(context);
      const roleId = await getCurrentUserRoleId(context);

      const eventData = { ...clientEventData, userId, roleId };

      try {
        await prisma().event.create({
          data: {
            userId: userId,
            eventType: eventType,
            logLevel: logLevel,
            withRoleId: roleId,
            route: route,
            eventData: eventData
          }
        });
        return { success: true };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      }
    }
  },

  Event: {
    user: async (parent: Event) => {
      return await prisma().user.findUnique({
        where: { id: parent.userId },
      });
    },

    withRole: async (parent: Event) => {
      return await prisma().role.findUnique({
        where: { id: parent.withRoleId },
      });
    },
  }
};

import { prisma } from '../../prismaClient.js';
import { LogEventInput } from './eventSchema.js';
import { Event } from "@prisma/client";
import { GraphQLContext, getCurrentUserId, getCurrentUserRoleId } from '../../auth/auth.util.js';

export const eventResolvers = {
  Query: {
    events: async () => {
      return await prisma().event.findMany({
        orderBy: { createdAt: 'desc' }
      });
    },

    event: async (_: undefined, { id }: { id: string }) => {
      return await prisma().event.findUnique({
        where: { id }
      });
    },

    eventsByType: async (_: undefined, { eventTypeId }: { eventTypeId: string }) => {
      return await prisma().event.findMany({
        where: { eventTypeId },
        orderBy: { createdAt: 'desc' }
      });
    },

    eventsByRoute: async (_: undefined, { route }: { route: string }) => {
      return await prisma().event.findMany({
        where: { route },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    createEvent: async (_: undefined, { input }: { input: LogEventInput }, context: GraphQLContext) => {
      const { eventType, logLevel, route, eventData } = input;

      const userId = await getCurrentUserId(context);
      const roleId = await getCurrentUserRoleId(context);

      return await prisma().event.create({
        data: {
          userId: userId,
          user: {
            connect: {
              id: userId 
            }
          },
          eventType: eventType,
          logLevel: logLevel,
          roleId: roleId,
          role: {
            connect: {
              id: roleId
            }
          },
          route: route,
          eventData: eventData
        }
      });
    }
  },

  Event: {
    user: async (parent: Event) => {
      return await prisma().user.findUnique({
        where: { id: parent.userId },
      });
    },

    role: async (parent: Event) => {
      return await prisma().role.findUnique({
        where: { id: parent.withRoleId },
      });
    },
  }

};

import { PrismaClient } from '@prisma/client';
import { CreateEventInput } from './eventSchema';

const prisma = new PrismaClient();

export const eventResolvers = {
  Query: {
    events: async () => {
      return await prisma.event.findMany({
        include: {
          user: true,
          eventType: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    event: async (_: undefined, { id }: { id: string }) => {
      return await prisma.event.findUnique({
        where: { id },
        include: {
          user: true,
          eventType: true
        }
      });
    },

    eventsByType: async (_: undefined, { eventTypeId }: { eventTypeId: string }) => {
      return await prisma.event.findMany({
        where: { eventTypeId },
        include: {
          user: true,
          eventType: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    eventsByUser: async (_: undefined, { userId }: { userId: string }) => {
      return await prisma.event.findMany({
        where: { userId },
        include: {
          user: true,
          eventType: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
  },

  Mutation: {
    createEvent: async (_: undefined, { input }: { input: CreateEventInput }) => {
      const { userId, eventTypeId, route, eventData } = input;
      
      return await prisma.event.create({
        data: {
          userId,
          eventTypeId,
          route,
          eventData
        },
        include: {
          user: true,
          eventType: true
        }
      });
    }
  }
};

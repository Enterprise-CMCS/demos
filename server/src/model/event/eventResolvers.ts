import { prisma } from "../../prismaClient.js";
import { LogEventInput } from "./eventSchema.js";
import { Event as PrismaEvent } from "@prisma/client";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { GraphQLContext, getCurrentUserId } from "../../auth/auth.util.js";

export async function logEvent(
  parent: undefined,
  { input }: { input: LogEventInput },
  context: GraphQLContext
) {
  const userId = await getCurrentUserId(context);
  const eventData = {
    ...input.eventData,
    userId: userId,
    roleId: input.role,
    applicationId: input.applicationId,
  };
  return await prisma().event.create({
    data: {
      userId: userId,
      roleId: input.role,
      applicationId: input.applicationId,
      eventTypeId: input.eventType,
      logLevelId: input.logLevel,
      route: input.route,
      eventData: eventData,
    },
  });
}

export const eventResolvers = {
  Query: {
    events: async () => {
      return prisma().event.findMany({
        orderBy: { createdAt: "desc" },
      });
    },
    eventsByApplication: async (_: undefined, { applicationId }: { applicationId: string }) => {
      return prisma().event.findMany({
        where: { applicationId },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    logEvent: logEvent,
  },

  Event: {
    user: async (parent: PrismaEvent) => {
      if (!parent.userId) {
        return null;
      }
      return await prisma().user.findUnique({
        where: { id: parent.userId },
      });
    },

    role: async (parent: PrismaEvent) => {
      return parent.roleId;
    },

    application: async (parent: PrismaEvent): Promise<PrismaApplication | null> => {
      if (!parent.applicationId) {
        return null;
      }
      return await getApplication(parent.applicationId);
    },

    eventType: async (parent: PrismaEvent) => {
      return parent.eventTypeId;
    },

    logLevel: async (parent: PrismaEvent) => {
      return parent.logLevelId;
    },
  },
};

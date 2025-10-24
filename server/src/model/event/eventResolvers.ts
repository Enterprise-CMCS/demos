import { prisma } from "../../prismaClient.js";
import { LogEventInput } from "./eventSchema.js";
import { Event } from "@prisma/client";
import { getApplication } from "../application/applicationResolvers.js";
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
    roleId: input.roleId,
    applicationId: input.applicationId,
  };
  return await prisma().event.create({
    data: {
      userId: userId,
      roleId: input.roleId,
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
    user: async (parent: Event) => {
      if (!parent.userId) {
        return null;
      }
      return await prisma().user.findUnique({
        where: { id: parent.userId },
      });
    },

    role: async (parent: Event) => {
      return parent.roleId;
    },

    application: async (parent: Event) => {
      if (!parent.applicationId) {
        return null;
      }
      return await getApplication(parent.applicationId);
    },
  },
};

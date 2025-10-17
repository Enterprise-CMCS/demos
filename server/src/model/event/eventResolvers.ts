import { prisma } from "../../prismaClient.js";
import { LogEventInput } from "./eventSchema.js";
import { Event } from "@prisma/client";
import { getApplication } from "../application/applicationResolvers.js";
import { GraphQLContext, getCurrentUserId, getCurrentUserRoleId } from "../../auth/auth.util.js";

export const eventResolvers = {
  Query: {
    events: async () => {
      return prisma().event.findMany({
        orderBy: { createdAt: "desc" },
      });
    },
    eventsByApplication: async (_: unknown, { applicationId }: { applicationId: string }) => {
      return prisma().event.findMany({
        where: { applicationId },
        orderBy: { createdAt: "desc" },
      });
    },
  },

  Mutation: {
    logEvent: async (
      _: undefined,
      { input }: { input: LogEventInput },
      context: GraphQLContext
    ) => {
      const { eventType, logLevel, route, eventData: clientEventData, applicationId } = input;

      const userId = await getCurrentUserId(context);
      const roleId = await getCurrentUserRoleId(context);

      const eventData = { ...clientEventData, userId, roleId, applicationId };

      try {
        await prisma().event.create({
          data: {
            userId: userId ?? null,
            withRoleId: roleId ?? null,
            eventType,
            logLevel,
            route,
            applicationId: applicationId ?? null,
            eventData,
          },
        });
        return { success: true };
      } catch (error) {
        return { success: false, message: (error as Error).message };
      }
    },
  },

  Event: {
    user: (parent: Event) =>
      parent.userId ? prisma().user.findUnique({ where: { id: parent.userId } }) : null,

    withRole: (parent: Event) => parent.withRoleId ?? null,

    application: (parent: Event) =>
      parent.applicationId ? getApplication(parent.applicationId) : null,
  },
};

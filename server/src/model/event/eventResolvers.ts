import { prisma } from "../../prismaClient.js";
import { LogEventInput } from "./eventSchema.js";
import { Event } from "@prisma/client";
import {
  GraphQLContext,
  getCurrentUserId,
  getCurrentUserRoleId,
} from "../../auth/auth.util.js";

export const eventResolvers = {
  Query: {
    // Only return events that are actually associated to a bundle
    events: async () => {
      return prisma().event.findMany({
        where: { bundleId: { not: null } },
        orderBy: { createdAt: "desc" },
      });
    },

    // Handy focused query for timelines on a specific bundle
    eventsByBundle: async (_: unknown, { bundleId }: { bundleId: string }) => {
      return prisma().event.findMany({
        where: { bundleId },
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
      const { eventType, logLevel, route, eventData: clientEventData, bundleId } = input;

      const userId = await getCurrentUserId(context);
      const roleId = await getCurrentUserRoleId(context);

      const eventData = { ...clientEventData, userId, roleId, bundleId };

      try {
        await prisma().event.create({
          data: {
            userId: userId ?? null,
            withRoleId: roleId ?? null,
            eventType,
            logLevel,
            route,
            bundleId: bundleId ?? null, // nullable FK
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
      parent.userId
        ? prisma().user.findUnique({ where: { id: parent.userId } })
        : null,

    withRole: (parent: Event) => parent.withRoleId ?? null,

    bundle: (parent: Event) =>
      parent.bundleId
        ? prisma().bundle.findUnique({ where: { id: parent.bundleId } })
        : null,
  },
};

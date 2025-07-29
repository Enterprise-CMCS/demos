import { PrismaClient } from "@prisma/client";

import { GQLContext } from "../../types";

const prisma = new PrismaClient();

export interface CreateExtensionInput {
  title: string;
  state: string;
  projectOfficerId: string;
  effectiveDate?: string | null;
  expirationDate?: string | null;
  description?: string;
  demonstrationId: string;
}

export const extensionResolvers = {
  Mutation: {
    async createExtension(
      _: unknown,
      { input }: { input: CreateExtensionInput },
      context: GQLContext,
    ) {
      const newExtension = await prisma.extension.create({
        data: {
          title: input.title,
          state: input.state,
          projectOfficerId: input.projectOfficerId,
          effectiveDate: input.effectiveDate
            ? new Date(input.effectiveDate)
            : null,
          expirationDate: input.expirationDate
            ? new Date(input.expirationDate)
            : null,
          description: input.description,
          demonstrationId: input.demonstrationId,
        },
      });

      // Type-safe event logging
      await context?.logEvent?.({
        eventType: "create_extension",
        eventData: { extensionId: newExtension.id }, // string value is allowed
      });

      return newExtension;
    },
  },
};

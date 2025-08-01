import { DemonstrationStatus } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import {
  CreateDemonstrationStatusInput,
  UpdateDemonstrationStatusInput,
} from "./demonstrationStatusSchema.js";

export const demonstrationStatusResolvers = {
  Query: {
    demonstrationStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstrationStatus.findUnique({
        where: { id },
      });
    },
    demonstrationStatuses: async () => {
      return await prisma().demonstrationStatus.findMany();
    },
  },

  Mutation: {
    createDemonstrationStatus: async (
      _: undefined,
      { input }: { input: CreateDemonstrationStatusInput },
    ) => {
      return await prisma().demonstrationStatus.create({
        data: input,
      });
    },

    updateDemonstrationStatus: async (
      _: undefined,
      { id, input }: { id: string; input: UpdateDemonstrationStatusInput },
    ) => {
      return await prisma().demonstrationStatus.update({
        where: { id },
        data: input,
      });
    },

    deleteDemonstrationStatus: async (_: undefined, { id }: { id: string }) => {
      return await prisma().demonstrationStatus.delete({
        where: { id },
      });
    },
  },

  DemonstrationStatus: {
    demonstrations: async (parent: DemonstrationStatus) => {
      return await prisma().demonstration.findMany({
        where: { demonstrationStatusId: parent.id },
      });
    },
  },
};

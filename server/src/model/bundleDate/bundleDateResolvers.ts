import { prisma } from "../../prismaClient.js";
import { SetBundleDateInput } from "../../types.js";
import { getBundle } from "../bundle/bundleResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";

export async function setBundleDate(_: undefined, { input }: { input: SetBundleDateInput }) {
  try {
    await prisma().bundleDate.upsert({
      where: {
        bundleId_dateTypeId: {
          bundleId: input.bundleId,
          dateTypeId: input.dateType,
        },
      },
      update: {
        dateValue: input.dateValue,
      },
      create: {
        bundleId: input.bundleId,
        dateTypeId: input.dateType,
        dateValue: input.dateValue,
      },
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getBundle(input.bundleId);
}

export async function getBundleDatesForPhase(bundleId: string, phaseId: string) {
  const rows = await prisma().bundleDate.findMany({
    select: {
      dateTypeId: true,
      dateValue: true,
      createdAt: true,
      updatedAt: true,
    },
    where: {
      bundleId: bundleId,
      dateType: {
        phaseDateTypes: {
          some: { phaseId: phaseId },
        },
      },
    },
  });
  return rows.map((row) => ({
    dateType: row.dateTypeId,
    dateValue: row.dateValue,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export const bundleDateResolvers = {
  Mutation: {
    setBundleDate: setBundleDate,
  },
};

import {
  Prisma,
  DeliverableAction as PrismaDeliverableAction,
  DeliverableExtension as PrismaDeliverableExtension,
  Person as PrismaPerson,
  User as PrismaUser,
} from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export type SelectManyDeliverableActionsRowResult = PrismaDeliverableAction & {
  user: (PrismaUser & { person: PrismaPerson }) | null;
} & {
  activeExtension: PrismaDeliverableExtension | null;
};

export async function selectManyDeliverableActions(
  where: Prisma.DeliverableActionWhereInput = {},
  tx?: PrismaTransactionClient
): Promise<SelectManyDeliverableActionsRowResult[]> {
  const prismaClient = tx ?? prisma();
  const deliverableActions = await prismaClient.deliverableAction.findMany({
    where: where,
    include: {
      user: {
        include: {
          person: true,
        },
      },
      activeExtension: true,
    },
  });

  return deliverableActions;
}

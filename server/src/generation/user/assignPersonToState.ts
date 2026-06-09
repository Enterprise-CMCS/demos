import { prisma } from "../../prismaClient";

export const assignPersonToState = async (personId: string, stateId: string) => {
  await prisma().personState.upsert({
    create: {
      personId,
      stateId,
    },
    update: {},
    where: {
      personId_stateId: {
        personId,
        stateId,
      },
    },
  });
};

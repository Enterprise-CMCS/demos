import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";

export let prisma: any = undefined; // eslint-disable-line -- temporary until solution is developed
export const initializeClient = () => {
  if (!prisma) {
    prisma = new PrismaClient().$extends(prismaRandom());
  }

  return prisma;
}

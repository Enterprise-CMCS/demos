import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";

export let prisma = new PrismaClient().$extends(prismaRandom());
export const initializeClient = () => {
  if (!prisma) {
    prisma = new PrismaClient().$extends(prismaRandom());
  }

  return prisma;
}

import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";

// really annoying typescript hackiness to get the types to play well with the $extends method
// the prisma random extension will be eventually removed.
const createExtendedClient = () => new PrismaClient().$extends(prismaRandom());
type PrismaExtendedClient = ReturnType<typeof createExtendedClient>;

let prismaClient: PrismaExtendedClient | undefined;

export const prisma = () => {
  if (!prismaClient) {
    prismaClient = createExtendedClient();
  }
  return prismaClient;
};

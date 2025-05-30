import { PrismaClient } from "@prisma/client";
import prismaRandom from "prisma-extension-random";

export const prisma = new PrismaClient().$extends(prismaRandom());

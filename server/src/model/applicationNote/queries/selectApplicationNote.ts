import { ApplicationNote as PrismaApplicationNote, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectApplicationNote(
  where: Prisma.ApplicationNoteWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationNote | null> {
  const prismaClient = tx ?? prisma();
  return prismaClient.applicationNote.findAtMostOne({ where });
}

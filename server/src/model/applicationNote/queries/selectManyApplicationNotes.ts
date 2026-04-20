import { ApplicationNote as PrismaApplicationNote, Prisma } from "@prisma/client";
import { prisma, PrismaTransactionClient } from "../../../prismaClient";

export async function selectManyApplicationNotes(
  where: Prisma.ApplicationNoteWhereInput,
  tx?: PrismaTransactionClient
): Promise<PrismaApplicationNote[]> {
  const prismaClient = tx ?? prisma();
  return await prismaClient.applicationNote.findMany({ where });
}

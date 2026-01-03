import { PrismaTransactionClient } from "../../../prismaClient";
import { NoteType } from "../../../types";
import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";

export const queryApplicationNotesByNoteTypes = async (
  tx: PrismaTransactionClient,
  applicationId: string,
  noteTypes: NoteType[]
): Promise<Pick<PrismaApplicationNote, "noteTypeId" | "content">[]> => {
  return await tx.applicationNote.findMany({
    where: {
      applicationId: applicationId,
      noteTypeId: { in: noteTypes },
    },
    select: {
      noteTypeId: true,
      content: true,
    },
  });
};

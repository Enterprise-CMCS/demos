import { ApplicationNote as PrismaApplicationNote } from "@prisma/client";
import { prisma } from "../../prismaClient.js";
import { NoteType, SetApplicationNotesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseSetApplicationNotesInput, upsertApplicationNotes, deleteApplicationNotes } from ".";
import { validateAllowedNoteChangeByPhase } from "./validateAllowedNoteChangeByPhase.js";

export function checkForDuplicateNoteTypes(input: SetApplicationNotesInput): void {
  const inputNoteTypes = input.applicationNotes.map((applicationNote) => applicationNote.noteType);
  const inputNoteTypeCounts = new Map<NoteType, number>();
  for (const noteType of inputNoteTypes) {
    inputNoteTypeCounts.set(noteType, (inputNoteTypeCounts.get(noteType) || 0) + 1);
  }
  const duplicatedNoteTypes: NoteType[] = [];
  for (const [noteType, count] of inputNoteTypeCounts) {
    if (count > 1) {
      duplicatedNoteTypes.push(noteType);
    }
  }
  if (duplicatedNoteTypes.length > 0) {
    throw new Error(
      `The input contained the same noteType more than once for ` +
        `these noteTypes: ${duplicatedNoteTypes.join(", ")}.`
    );
  }
}

export async function __setApplicationNotes(
  _: unknown,
  { input }: { input: SetApplicationNotesInput }
): Promise<PrismaApplication> {
  if (input.applicationNotes.length === 0) {
    return await getApplication(input.applicationId);
  }
  try {
    checkForDuplicateNoteTypes(input);
    await prisma().$transaction(async (tx) => {
      await validateAllowedNoteChangeByPhase(tx, input);
      const parsedSetApplicationNotesInput = parseSetApplicationNotesInput(input);
      await upsertApplicationNotes(parsedSetApplicationNotesInput, tx);
      await deleteApplicationNotes(parsedSetApplicationNotesInput, tx);
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

export function __resolveApplicationNoteType(parent: PrismaApplicationNote): string {
  return parent.noteTypeId;
}

export const applicationNoteResolvers = {
  Mutation: {
    setApplicationNotes: __setApplicationNotes,
  },
  ApplicationNote: {
    noteType: __resolveApplicationNoteType,
  },
};

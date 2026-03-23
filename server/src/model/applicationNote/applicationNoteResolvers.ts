import { prisma } from "../../prismaClient.js";
import { NoteType, SetApplicationNotesInput } from "../../types.js";
import { getApplication, PrismaApplication } from "../application";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { parseSetApplicationNotesInput, upsertApplicationNotes, deleteApplicationNotes } from ".";
import { validateAllowedNoteChangeByPhase } from "./validateAllowedNoteChangeByPhase.js";
import { ApplicationNote, ApplicationPhase, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export async function getApplicationNotes(
  parent: ApplicationPhase,
  args: never,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): Promise<ApplicationNote[]> {
  const parentType = info.parentType.name;
  let filter: Prisma.ApplicationNoteWhereInput;

  switch (parentType) {
    case Prisma.ModelName.ApplicationPhase:
      filter = {
        applicationId: parent.applicationId,
        noteType: {
          phaseNoteTypes: {
            some: { phaseId: (parent as Extract<typeof parent, ApplicationPhase>).phaseId },
          },
        },
      };
      break;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }

  try {
    return await prisma().applicationNote.findMany({
      where: { ...filter },
    });
  } catch (error) {
    handlePrismaError(error);
  }
}

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

export const applicationNoteResolvers = {
  Mutation: {
    setApplicationNotes: __setApplicationNotes,
  },
  ApplicationNote: {
    noteType: (parent: ApplicationNote) => parent.noteTypeId,
  },
};

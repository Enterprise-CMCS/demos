import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { NOTE_TYPES } from "../../constants.js";
import { ApplicationNote, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export const noteTypeResolvers = {
  NoteType: generateCustomSetScalar(
    NOTE_TYPES,
    "NoteType",
    "A string representing a kind of note for a phase."
  ),
};

export function getNoteType(
  parent: ApplicationNote,
  args: unknown,
  context: GraphQLContext,
  info: GraphQLResolveInfo
): string | null {
  const parentType = info.parentType.name;
  switch (parentType) {
    case Prisma.ModelName.ApplicationNote:
      return parent.noteTypeId;
    default:
      throw new Error(`Unsupported parent type: ${parentType}`);
  }
}

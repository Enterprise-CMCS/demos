import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { NOTE_TYPES } from "../../constants.js";

export const noteTypeResolvers = {
  NoteType: generateCustomSetScalar(
    NOTE_TYPES,
    "NoteType",
    "A string representing a kind of note for a phase."
  ),
};

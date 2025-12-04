import { PhaseName } from "demos-server";

// Document Messages
export const DOCUMENT_UPLOADED_MESSAGE = "Your document has been added.";
export const DOCUMENT_FAILED_UPLOAD_MESSAGE =
  "Your document could not be added because of an unknown problem.";
export const DOCUMENT_FAILED_VIRUS_SCAN_MESSAGE =
  "Your document was not uploaded because malicious content was detected in the file.";
export const DOCUMENT_REMOVED_MESSAGE = "Your document has been removed.";
export const DOCUMENT_REMOVAL_FAILED_MESSAGE =
  "Your document could not be removed because of an unknown problem.";

// Phase Messages
export const SAVE_FOR_LATER_MESSAGE = "Updates  saved successfully";
export const FAILED_TO_SAVE_MESSAGE = "Failed to save updates.";
export const getPhaseCompletedMessage = (phaseName: PhaseName) => {
  return `${phaseName} has been completed`;
};

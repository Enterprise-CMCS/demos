import { PhaseName } from "demos-server";

// Demonstration
export const EXPIRATION_DATE_ERROR_MESSAGE = "Expiration Date cannot be before Effective Date.";

// Document Messages
export const DOCUMENT_UPLOADED_MESSAGE = "Your document has been added.";
export const DOCUMENT_FAILED_UPLOAD_MESSAGE =
  "Your document could not be added because of an unknown problem.";
export const DOCUMENT_FAILED_VIRUS_SCAN_MESSAGE =
  "An Error has occurred - Document appears to be corrupted; upload a new file.";
export const DOCUMENT_REMOVED_MESSAGE = "Your document has been removed.";
export const DOCUMENT_REMOVAL_FAILED_MESSAGE =
  "Your document could not be removed because of an unknown problem.";

// Phase Messages
export const SAVE_FOR_LATER_MESSAGE = "Updates  saved successfully";
export const FAILED_TO_SAVE_MESSAGE = "Failed to save updates.";
export const getPhaseCompletedMessage = (phaseName: PhaseName) => {
  return `${phaseName} has been completed`;
};

// Deliverable Messages
export const DELIVERABLE_SLOTS_CREATED_MESSAGE = "Deliverable Slot(s) - have been added";
export const DELIVERABLE_UPDATED_MESSAGE = "Changes have been saved to the deliverable";
export const DELIVERABLE_EXTENSION_REQUESTED_MESSAGE = "Extension Request - has been Submitted";

// Functions
export {
  checkApplicationDateExistsForCompletion,
  checkApplicationIntakeStatusForIncomplete,
  checkCompletenessStatusForIncomplete,
  checkConceptPhaseStartedBeforeSkipping,
  checkDocumentTypeExistsForCompletion,
  checkPhaseStartedBeforeCompletion,
  checkPriorPhaseCompleteForCompletion,
} from "./checkPhaseFunctions.js";
export { checkPhaseCompletionRules } from "./checkPhaseCompletionRules.js";
export { validatePhaseCompletion } from "./validatePhaseCompletion.js";
export { setPhaseToStarted } from "./setPhaseToStarted.js";
export { completePhase } from "./completePhase.js";
export { skipConceptPhase } from "./skipConceptPhase.js";
export { declareCompletenessPhaseIncomplete } from "./declareCompletenessPhaseIncomplete.js";
export { startPhasesByDates } from "./startPhasesByDates.js";
export { startPhaseByDocument } from "./startPhaseByDocument.js";
export { updateApplicationStatus, updateStatusToUnderReviewIfNeeded } from "./updateApplicationStatus.js";

// Queries
export { getApplicationPhaseDocumentTypes } from "./queries/getApplicationPhaseDocumentTypes.js";
export { getApplicationPhaseStatus } from "./queries/getApplicationPhaseStatus.js";
export { getApplicationPhaseStatuses } from "./queries/getApplicationPhaseStatuses.js";
export { updatePhaseStatus } from "./queries/updatePhaseStatus.js";
export { getFinishedApplicationPhaseIds } from "./queries/getFinishedApplicationPhaseIds";

// Types & Constants
export type {
  ApplicationPhaseDocumentTypeRecord,
  ApplicationPhaseStatusRecord,
  PhaseActionRecord,
  PhaseActions,
  PhaseCompletionValidationChecksRecord,
  PrismaApplicationDateResults,
  ValidationChecks,
} from "./applicationPhaseTypes.js";
export { PHASE_ACTIONS } from "./applicationPhaseConstants.js";

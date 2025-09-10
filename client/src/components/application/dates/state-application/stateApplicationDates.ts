/**
 * State Application Phase
 *
 * State Application Start Date - Can start in one of two ways, whichever comes first:
 * 1. User clicked Skip or Finish on the Concept Phase
 * 2. When a change is submitted on this phase - document or date update.
 *
 * State Application Completion Date - Completed when user clicks Finish to progress to the next phase.
 * Note: If the user skips the concept phase this will be marked completed
 * when the user clicks Finish on the State Application Phase.
 */

import { EndDate, StartDate } from "../applicationDates";

export type StateApplicationStartDate = StartDate & { readonly __stateAppStartDate: never };
export type StateApplicationCompletionDate = EndDate & { readonly __stateAppEndDate: never };

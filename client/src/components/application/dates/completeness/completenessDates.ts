import { EndDate, StartDate } from "../applicationDates";

/**
 * Completeness Phase
 *
 * Completeness Start Date - As soon as the "State Application Submitted Date" field is populated on the State Application Phase.
 * Can also start when a change is submitted on this phase - document or date update. Start date is set to whichever of the dates above, is first
 * Completeness Completion Date - Completed when user clicks "Finish" to progress to the next phase. Completed Date is set to this date.
 */
export type CompletenessStartDate = StartDate & { readonly __completenessStart: never };
export type CompletenessCompletionDate = EndDate & { readonly __completenessEnd: never };

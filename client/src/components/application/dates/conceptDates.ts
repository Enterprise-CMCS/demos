import { DateUTC, EndDate } from "./applicationDates";

/**
 * Concept Phase
 *
 * Concept Start Date - Begins when the demonstration, amendment or extension is created.
 * Concept Completion Date - When user clicks the Finish or skip button.
 *
 * Note: If the user doesn't "click" skip and goes to the next phase, this will be marked completed
 * when the user clicks Finish on the State Application Phase.
 */
export type ConceptStartDate = DateUTC & { readonly __conceptStartDate: never };
export type ConceptCompletionDate = EndDate & { readonly __conceptEndDate: never };

type Application = { createdAt: Date };

export const getConceptStartDate = (application: Application): ConceptStartDate => {
  return application.createdAt as ConceptStartDate;
};

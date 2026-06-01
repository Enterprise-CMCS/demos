import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { BUDGET_NEUTRALITY_VALIDATION_STATUSES } from "../../constants.js";

export const budgetNeutralityValidationStatusResolvers = {
  BudgetNeutralityValidationStatus: generateCustomSetScalar(
    BUDGET_NEUTRALITY_VALIDATION_STATUSES,
    "BudgetNeutralityValidationStatus",
    "A string representing the validation status of a BN workbook."
  ),
};

import { de } from "@faker-js/faker";
import { PhaseName } from "../constants";

export const completeApplicationPhase = async (applicationId: string, phaseName: PhaseName) => {
  switch (phaseName) {
    case "Concept":
      completeConceptPhase(applicationId);
      break;
    case "Application Intake":
      completeApplicationPhase(applicationId);
      break;
    case "Completeness":
      completeCompletenessPhase(applicationId);
      break;
    case "Federal Comment":
      completeTechnicalReviewPhase(applicationId);
      break;
    case "SDG Preparation":
      completeRecommendationPhase(applicationId);
      break;
    case "Review":
      completeApprovalPhase(applicationId);
      break;
    case "Approval Package":
      completeApprovalPackagePhase(applicationId);
      break;
    case "Approval Summary":
      completeApprovalSummaryPhase(applicationId);
      break;
    default:
      throw new Error(`Unknown phase name: ${phaseName}`);
  }
};

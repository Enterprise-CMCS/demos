import { TZDate } from "@date-fns/tz";
import { PHASE_NAMES, PhaseName } from "../../constants";
import { completeApplicationIntakePhase } from "./completeApplicationIntakePhase";
import { completeApprovalPackagePhase } from "./completeApprovalPackagePhase";
import { completeApprovalSummaryPhase } from "./completeApprovalSummaryPhase";
import { completeCompletenessPhase } from "./completeCompletenessPhase";
import { completeConceptPhase } from "./completeConceptPhase";
import { completeReviewPhase } from "./completeReviewPhase";
import { completeSdgPreparationPhase } from "./completeSdgPreparationPhase";
import { updateCronbasedPhaseStatuses } from "./updateCronbasedPhaseStatuses";

export const progressThroughPhase = async (
  demonstrationId: string,
  phaseName: PhaseName,
  contextUserId: string,
  baseNow: TZDate
) => {
  const targetPhaseIndex = PHASE_NAMES.indexOf(phaseName);

  if (targetPhaseIndex === -1) {
    throw new Error(`Unknown phase name: ${phaseName}`);
  }

  for (const currentPhaseName of PHASE_NAMES.slice(0, targetPhaseIndex + 1)) {
    switch (currentPhaseName) {
      case "Concept":
        await completeConceptPhase(demonstrationId, contextUserId, baseNow);
        break;
      case "Application Intake":
        await completeApplicationIntakePhase(demonstrationId, contextUserId, baseNow);
        break;
      case "Completeness":
        await completeCompletenessPhase(demonstrationId, contextUserId, baseNow);
        break;
      case "Federal Comment":
        await updateCronbasedPhaseStatuses();
        break;
      case "SDG Preparation":
        await completeSdgPreparationPhase(demonstrationId, baseNow);
        break;
      case "Review":
        await completeReviewPhase(demonstrationId, "CMS (OSORA)", baseNow);
        break;
      case "Approval Package":
        await completeApprovalPackagePhase(demonstrationId, contextUserId);
        break;
      case "Approval Summary":
        await completeApprovalSummaryPhase(demonstrationId, baseNow, "Demonstration");
        break;
      default:
        throw new Error(`No completion handler configured for phase ${currentPhaseName}`);
    }
  }
};

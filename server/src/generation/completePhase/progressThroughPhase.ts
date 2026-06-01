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
import { ApplicationType } from "../../types";
import { addDays } from "date-fns";

export type ProgressThroughPhaseInput = {
  applicationId: string;
  documentOwnerUserId: string;
  phaseName?: PhaseName;
  baseNow?: TZDate;
  applicationType: ApplicationType;
};

export const progressThroughPhase = async ({
  applicationId,
  documentOwnerUserId,
  phaseName = "Approval Summary",
  baseNow = addDays(new TZDate(), -90),
  applicationType,
}: ProgressThroughPhaseInput) => {
  const targetPhaseIndex = PHASE_NAMES.indexOf(phaseName);

  if (targetPhaseIndex === -1) {
    throw new Error(`Unknown phase name: ${phaseName}`);
  }

  for (const currentPhaseName of PHASE_NAMES.slice(0, targetPhaseIndex + 1)) {
    switch (currentPhaseName) {
      case "Concept":
        await completeConceptPhase({
          applicationId,
          documentOwnerUserId,
          baseNow,
          applicationType,
        });
        break;
      case "Application Intake":
        await completeApplicationIntakePhase({
          applicationId,
          documentOwnerUserId,
          baseNow,
          applicationType,
        });
        break;
      case "Completeness":
        await completeCompletenessPhase({
          applicationId,
          documentOwnerUserId,
          baseNow,
          applicationType,
        });
        break;
      case "Federal Comment":
        await updateCronbasedPhaseStatuses();
        break;
      case "SDG Preparation":
        await completeSdgPreparationPhase({ applicationId, baseNow, applicationType });
        break;
      case "Review":
        await completeReviewPhase({
          applicationId,
          baseNow,
          clearanceLevel: "CMS (OSORA)",
          applicationType,
        });
        break;
      case "Approval Package":
        await completeApprovalPackagePhase({ applicationId, documentOwnerUserId, applicationType });
        break;
      case "Approval Summary":
        await completeApprovalSummaryPhase({ applicationId, baseNow, applicationType });
        break;
      default:
        throw new Error(`No completion handler configured for phase ${currentPhaseName}`);
    }
  }
};

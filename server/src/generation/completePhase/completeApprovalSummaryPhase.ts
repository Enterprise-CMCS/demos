import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, LocalDate, PhaseName } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";
import { applyDemonstrationTypes } from "../applyDemonstrationTypes";
import { applyRequiredAttributesForApplicationApproval } from "../applyRequiredAttributesForDemonstrationApproval";

const PHASE_NAME: PhaseName = "Approval Summary";

export const completeApprovalSummaryPhase = async (
  applicationId: string,
  baseNow: TZDate,
  applicationType: ApplicationType
) => {
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates: [
        {
          dateType: "Application Details Marked Complete Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "Application Demonstration Types Marked Complete Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
      ],
    },
  });

  if (applicationType === "Demonstration") {
    await applyDemonstrationTypes(applicationId);
  }
  await applyRequiredAttributesForApplicationApproval(applicationId, baseNow, applicationType);

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};

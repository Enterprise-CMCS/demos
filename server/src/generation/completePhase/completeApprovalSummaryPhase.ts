import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { TZDate } from "@date-fns/tz";
import { addApplicationDates } from "../addApplicationDates";

const PHASE_NAME: PhaseName = "Approval Summary";

export const completeApprovalSummaryPhase = async ({
  applicationId,
  baseNow,
  applicationType,
}: {
  applicationId: string;
  baseNow: TZDate;
  applicationType: ApplicationType;
}) => {
  await addApplicationDates({
    applicationId,
    dates: [
      {
        dateType: "Application Details Marked Complete Date",
        dateValue: baseNow,
      },
      {
        dateType: "Application Demonstration Types Marked Complete Date",
        dateValue: baseNow,
      },
    ],
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};

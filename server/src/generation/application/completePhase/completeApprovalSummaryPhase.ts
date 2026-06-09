import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { DatesInput } from "../../types";

const PHASE_NAME: PhaseName = "Approval Summary";

export const completeApprovalSummaryPhase = async ({
  applicationId,
  dates,
}: {
  applicationId: string;
  dates: DatesInput<
    | "Application Details Marked Complete Date"
    | "Application Demonstration Types Marked Complete Date"
  >;
}) => {
  await addApplicationDates({
    applicationId,
    dates,
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: { applicationId, phaseName: PHASE_NAME },
  });
};

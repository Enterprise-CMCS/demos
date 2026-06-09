import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { DatesInput } from "../../types";

const PHASE_NAME: PhaseName = "SDG Preparation";

export const completeSdgPreparationPhase = async ({
  applicationId,
  dates,
}: {
  applicationId: string;
  dates: DatesInput<
    | "Expected Approval Date"
    | "SME Review Date"
    | "FRT Initial Meeting Date"
    | "BNPMT Initial Meeting Date"
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

import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { TZDate } from "@date-fns/tz";
import { addApplicationDates } from "../addApplicationDates";

const PHASE_NAME: PhaseName = "SDG Preparation";

export const completeSdgPreparationPhase = async ({
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
        dateType: "Expected Approval Date",
        dateValue: baseNow,
      },
      {
        dateType: "SME Review Date",
        dateValue: baseNow,
      },
      {
        dateType: "FRT Initial Meeting Date",
        dateValue: baseNow,
      },
      {
        dateType: "BNPMT Initial Meeting Date",
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

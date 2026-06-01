import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { uploadDocumentsToPhase } from "../uploadDocumentsToPhase";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";
import { addApplicationDates } from "../addApplicationDates";

const PHASE_NAME: PhaseName = "Application Intake";

export const completeApplicationIntakePhase = async ({
  applicationId,
  documentOwnerUserId,
  baseNow,
  applicationType,
}: {
  applicationId: string;
  documentOwnerUserId: string;
  baseNow: TZDate;
  applicationType: ApplicationType;
}) => {
  await uploadDocumentsToPhase({
    applicationId,
    phaseName: PHASE_NAME,
    documentOwnerUserId,
    documentTypes: ["State Application"],
  });

  await addApplicationDates({
    applicationId,
    dates: [
      {
        dateType: "State Application Submitted Date",
        dateValue: baseNow,
      },
      {
        dateType: "Completeness Review Due Date",
        dateValue: addDays(baseNow, 15),
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

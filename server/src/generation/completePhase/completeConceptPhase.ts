import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { uploadDocumentsToPhase } from "../uploadDocumentsToPhase";
import { TZDate } from "@date-fns/tz";
import { addApplicationDates } from "../addApplicationDates";

const PHASE_NAME: PhaseName = "Concept";

export const completeConceptPhase = async ({
  applicationId,
  documentOwnerUserId,
  baseNow = new TZDate(),
  applicationType,
}: {
  applicationId: string;
  documentOwnerUserId: string;
  baseNow?: TZDate;
  applicationType: ApplicationType;
}) => {
  await uploadDocumentsToPhase({
    applicationId,
    phaseName: PHASE_NAME,
    documentTypes: ["Pre-Submission"],
    documentOwnerUserId,
  });

  await addApplicationDates({
    applicationId,
    dates: [
      {
        dateType: "Pre-Submission Submitted Date",
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

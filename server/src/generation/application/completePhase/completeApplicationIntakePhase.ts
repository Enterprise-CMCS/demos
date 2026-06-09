import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { uploadDocumentsToPhase } from "../../document/uploadDocumentsToPhase";
import { DatesInput, DocumentsInput } from "../../types";
import { addDays } from "date-fns";

const PHASE_NAME: PhaseName = "Application Intake";

export const completeApplicationIntakePhase = async ({
  applicationId,
  documentOwnerUserId,
  documents,
  dates,
}: {
  applicationId: string;
  documents: DocumentsInput<"State Application">;
  dates: DatesInput<"State Application Submitted Date">;
  documentOwnerUserId: string;
}) => {
  await uploadDocumentsToPhase({
    documents,
    applicationId,
    phaseName: PHASE_NAME,
    ownerUserId: documentOwnerUserId,
  });
  await addApplicationDates({
    applicationId,
    dates: {
      ...dates,
      "Completeness Review Due Date": addDays(dates["State Application Submitted Date"], 15),
    },
  });
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: { applicationId, phaseName: PHASE_NAME },
  });
};

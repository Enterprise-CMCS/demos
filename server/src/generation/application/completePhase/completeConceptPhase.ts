import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { uploadDocumentsToPhase } from "../../document/uploadDocumentsToPhase";
import { DatesInput, DocumentsInput } from "../../types";

const PHASE_NAME: PhaseName = "Concept";

export const completeConceptPhase = async ({
  applicationId,
  documentOwnerUserId,
  documents,
  dates,
}: {
  applicationId: string;
  documents: DocumentsInput<"Pre-Submission">;
  dates: DatesInput<"Pre-Submission Submitted Date">;
  documentOwnerUserId: string;
}) => {
  await uploadDocumentsToPhase({
    documents,
    applicationId,
    phaseName: PHASE_NAME,
    ownerUserId: documentOwnerUserId,
  });
  await addApplicationDates({ applicationId, dates });
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};

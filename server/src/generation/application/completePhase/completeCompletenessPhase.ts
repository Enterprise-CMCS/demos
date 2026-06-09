import { applicationPhaseResolvers } from "../../../model/applicationPhase/applicationPhaseResolvers";
import { PhaseName } from "../../../types";
import { addApplicationDates } from "../addApplicationDates";
import { uploadDocumentsToPhase } from "../../document/uploadDocumentsToPhase";
import { DatesInput, DocumentsInput } from "../../types";
import { addDays } from "date-fns";

const PHASE_NAME: PhaseName = "Completeness";

export const completeCompletenessPhase = async ({
  applicationId,
  documentOwnerUserId,
  documents,
  dates,
}: {
  applicationId: string;
  documents: DocumentsInput<
    "Application Completeness Letter" | "Internal Completeness Review Form"
  >;
  dates: DatesInput<
    | "State Application Deemed Complete"
    | "Federal Comment Period Start Date"
    | "Federal Comment Period End Date"
  >;
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
      "Federal Comment Period Start Date": addDays(dates["State Application Deemed Complete"], 1),
      "Federal Comment Period End Date": addDays(dates["State Application Deemed Complete"], 31),
    },
  });
  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: { applicationId, phaseName: PHASE_NAME },
  });
};

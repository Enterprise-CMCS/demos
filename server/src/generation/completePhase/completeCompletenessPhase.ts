import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { ApplicationType, PhaseName } from "../../types";
import { uploadDocumentsToPhase } from "../uploadDocumentsToPhase";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";
import { addApplicationDates } from "../addApplicationDates";

const PHASE_NAME: PhaseName = "Completeness";

export const completeCompletenessPhase = async ({
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
    documentTypes: ["Application Completeness Letter", "Internal Completeness Review Form"],
    documentOwnerUserId,
  });

  await addApplicationDates({
    applicationId,
    dates: [
      {
        dateType: "State Application Deemed Complete",
        dateValue: baseNow,
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: addDays(baseNow, 1),
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: addDays(baseNow, 31),
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

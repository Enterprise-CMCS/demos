import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { LocalDate, PhaseName } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { uploadDocumentToPhase } from "../uploadDocumentToPhase";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

const PHASE_NAME: PhaseName = "Application Intake";

export const completeApplicationIntakePhase = async (
  applicationId: string,
  contextUserId: string,
  baseNow: TZDate
) => {
  await uploadDocumentToPhase(applicationId, PHASE_NAME, "State Application", contextUserId);

  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "Completeness Review Due Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(addDays(baseNow, 15))
          ) as LocalDate,
        },
      ],
    },
  });

  await applicationPhaseResolvers.Mutation.completePhase(null, {
    input: {
      applicationId,
      phaseName: PHASE_NAME,
    },
  });
};

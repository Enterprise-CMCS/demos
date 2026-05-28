import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { LocalDate, PhaseName } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { uploadDocumentToPhase } from "../uploadDocumentToPhase";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

const PHASE_NAME: PhaseName = "Completeness";

export const completeCompletenessPhase = async (
  applicationId: string,
  contextUserId: string,
  baseNow: TZDate
) => {
  await uploadDocumentToPhase(
    applicationId,
    PHASE_NAME,
    "Application Completeness Letter",
    contextUserId
  );
  await uploadDocumentToPhase(
    applicationId,
    PHASE_NAME,
    "Internal Completeness Review Form",
    contextUserId
  );

  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Deemed Complete",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "Federal Comment Period Start Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(addDays(baseNow, 1))
          ) as LocalDate,
        },
        {
          dateType: "Federal Comment Period End Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(addDays(baseNow, 31))
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

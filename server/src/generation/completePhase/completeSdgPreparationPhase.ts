import { applicationPhaseResolvers } from "../../model/applicationPhase/applicationPhaseResolvers";
import { LocalDate, PhaseName } from "../../types";
import { applicationDateResolvers } from "../../model/applicationDate/applicationDateResolvers";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../../dateUtilities";
import { TZDate } from "@date-fns/tz";

const PHASE_NAME: PhaseName = "SDG Preparation";

export const completeSdgPreparationPhase = async (applicationId: string, baseNow: TZDate) => {
  await applicationDateResolvers.Mutation.setApplicationDates(null, {
    input: {
      applicationId,
      applicationDates: [
        {
          dateType: "Expected Approval Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "SME Review Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "FRT Initial Meeting Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
        },
        {
          dateType: "BNPMT Initial Meeting Date",
          dateValue: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
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

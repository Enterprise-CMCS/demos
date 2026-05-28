import { addDays } from "date-fns";
import { formatEasternTZDateToMMDDYYYY, parseJSDateToEasternTZDate } from "../dateUtilities";
import { demonstrationResolvers } from "../model/demonstration/demonstrationResolvers";
import { ApplicationType, LocalDate } from "../types";
import { TZDate } from "@date-fns/tz";
import { amendmentResolvers } from "../model/amendment/amendmentResolvers";
import { extensionResolvers } from "../model/extension/extensionResolvers";

export const applyRequiredAttributesForApplicationApproval = async (
  applicationId: string,
  baseNow: TZDate,
  applicationType: ApplicationType
) => {
  switch (applicationType) {
    case "Demonstration":
      await demonstrationResolvers.Mutation.updateDemonstration(null, {
        id: applicationId,
        input: {
          effectiveDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
          expirationDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(addDays(baseNow, 5))
          ) as LocalDate,
          sdgDivision: "Division of Eligibility and Coverage Demonstrations",
        },
      });
      break;
    case "Amendment":
      await amendmentResolvers.Mutation.updateAmendment(null, {
        id: applicationId,
        input: {
          effectiveDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
          signatureLevel: "OCD",
        },
      });
      break;
    case "Extension":
      await extensionResolvers.Mutation.updateExtension(null, {
        id: applicationId,
        input: {
          effectiveDate: formatEasternTZDateToMMDDYYYY(
            parseJSDateToEasternTZDate(baseNow)
          ) as LocalDate,
          signatureLevel: "OCD",
        },
      });
      break;
    default:
      throw new Error(`Invalid ApplicationType: ${applicationType}`);
  }
};

import { parseJSDateToEasternTZDate } from "../../dateUtilities";
import { DemonstrationTypeStatus } from "../../types";

export function determineDemonstrationTypeStatus(
  effectiveDate: Date,
  expirationDate: Date
): DemonstrationTypeStatus {
  const easternNow = parseJSDateToEasternTZDate(new Date());
  // DB constraints ensure effectiveDate always <= expirationDate
  if (easternNow.easternTZDate < effectiveDate) {
    return "Pending";
  } else if (easternNow.easternTZDate > expirationDate) {
    return "Expired";
  }
  return "Active";
}

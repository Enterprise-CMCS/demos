import { PHASE_START_END_DATES } from "../../constants";
import { EasternNow, getDayBoundaryLabel } from "../../dateUtilities";
import { PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput } from "./applicationDateSchema";

export function createPhaseStartDate(
  phaseId: PhaseNameWithTrackedStatus,
  easternNow: EasternNow
): ApplicationDateInput | null {
  const phaseStartDateType = PHASE_START_END_DATES[phaseId].startDate;
  if (!phaseStartDateType) {
    return null;
  }
  return {
    dateType: phaseStartDateType,
    dateValue: easternNow[getDayBoundaryLabel(phaseStartDateType)].easternTZDate,
  };
}

import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS, PHASE_META_DATES } from "../../constants";
import { getEasternNow } from "../../dateUtilities";
import { PhaseNameWithTrackedStatus } from "../../types";
import { ApplicationDateInput } from "./applicationDateSchema";

export function createPhaseStartDate(
  phaseId: PhaseNameWithTrackedStatus
): ApplicationDateInput | undefined {
  const easternNow = getEasternNow();
  const phaseStartDateType = PHASE_META_DATES[phaseId].startDate;
  if (phaseStartDateType) {
    return {
      dateType: phaseStartDateType,
      dateValue:
        easternNow[DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseStartDateType].expectedTimestamp]
          .easternTZDate,
    };
  }
}

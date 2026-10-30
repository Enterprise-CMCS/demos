import { PHASE_START_END_DATES } from "../../constants";
import { PhaseName } from "../../types";
import { ApplicationDateInput } from "./applicationDateSchema";

export function createPhaseStartDate(
  phaseId: PhaseName,
  easternToday: string
): ApplicationDateInput | null {
  const phaseStartDateType = PHASE_START_END_DATES[phaseId].startDate;
  if (!phaseStartDateType) {
    return null;
  }
  return {
    dateType: phaseStartDateType,
    plainDate: easternToday,
  };
}

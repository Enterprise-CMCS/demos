import { TZDate } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { BundlePhase, PhaseName, PhaseStatus, BundlePhaseDate, DateType } from "demos-server";

export type SimplePhaseDate = Omit<BundlePhaseDate, "createdAt" | "updatedAt">;
export type SimplePhase = Omit<BundlePhase, "createdAt" | "updatedAt" | "phaseDates"> & {
  phaseDates: SimplePhaseDate[];
};

/**
 * Application Dates Library
 *
 * Reminder: The JS Date object simply wraps a number, the number of milliseconds since the epoch (Jan 1, 1970 midnight UTC).
 * In DEMOS we largely care about dates in EST timezone, centered around the CMS headquarters in that timezone.
 * (EST is UTC-5 or UTC-4 depending on daylight savings time.)
 *
 * In general when we talk about dates in the application, we are referring to dates in EST timezone.
 * The typing here attempts to make it clear when we are dealing with dates in EST timezone vs UTC.
 * as well as prevent function calls from accidentally passing in a date that is not in a date in the wrong timezone.
 */

type TimeZone = "America/New_York" | "UTC";
const EST_TIMEZONE: TimeZone = "America/New_York";

/**
 * Base date types.
 *
 * DateUTC: A date in UTC timezone - Used when the date is set by a user event
 * DateEST: A date in EST timezone - Used when the date is calculated for a deadline or beginning period
 * StartDate: A date that marks the beginning of a phase. Timestamp should be SOD - 00:00:00.000 EST.
 * EndDate: A date that marks the end of a phase. Timestamp should be EOD - 23:59:59.999 EST.
 *
 * This file uses branded types to prevent mixing up date types in function calls:
 * https://www.learningtypescript.com/articles/branded-types
 */
export type DateUTC = UTCDate & { readonly __utc: never };
export type DateEST = TZDate & { readonly __est: never };
export type StartOfDayEST = DateEST & { readonly __start: never };
export type EndOfDayEST = DateEST & { readonly __end: never };

export const getStartOfDayEST = (year: number, month: number, day: number): StartOfDayEST => {
  return new TZDate(year, month, day, 0, 0, 0, 0, EST_TIMEZONE) as StartOfDayEST;
};

export const getEndOfDayEST = (year: number, month: number, day: number): EndOfDayEST => {
  return new TZDate(year, month, day, 23, 59, 59, 999, EST_TIMEZONE) as EndOfDayEST;
};

/**
 * Phase Status Operations
 */
export const getStatusForPhase = (
  bundlePhases: SimplePhase[],
  phaseName: PhaseName
): PhaseStatus | null => {
  const phase = bundlePhases.find((p) => p.phaseName === phaseName);
  return phase ? phase.phaseStatus : null;
};

export const setStatusForPhase = (
  bundlePhases: SimplePhase[],
  phaseName: PhaseName,
  phaseStatus: PhaseStatus
): SimplePhase[] => {
  return bundlePhases.map((phase) => {
    if (phase.phaseName === phaseName) {
      return { ...phase, phaseStatus };
    }
    return phase;
  });
};

/**
 * Phase Date Operations
 */
export const getDateFromPhaseDates = (
  phaseDates: SimplePhaseDate[],
  dateType: DateType
): Date | null => {
  const dateEntry = phaseDates.find((d) => d.dateType === dateType);
  return dateEntry ? dateEntry.dateValue : null;
};

export const setDateInPhaseDates = (
  phaseDates: SimplePhaseDate[],
  dateType: DateType,
  dateValue: Date
): SimplePhaseDate[] => {
  return phaseDates.map((date) => {
    if (date.dateType === dateType) {
      return { ...date, dateValue };
    }
    return date;
  });
};

export const getAllDatesForPhase = (
  bundlePhases: SimplePhase[],
  phaseName: PhaseName
): SimplePhaseDate[] | null => {
  const phase = bundlePhases.find((p) => p.phaseName === phaseName);
  return phase ? phase.phaseDates : null;
};

export const setAllDatesForPhase = (
  phaseDates: SimplePhaseDate[],
  dateType: DateType,
  dateValue: Date
): SimplePhaseDate[] => {
  return phaseDates.map((date) => {
    if (date.dateType === dateType) {
      return { ...date, dateValue };
    }
    return date;
  });
};

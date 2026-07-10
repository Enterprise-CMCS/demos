import { APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE, SEED_CONFIG } from "./config.js";

function toLocalDateString(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function fromLocalDateString(localDateString) {
  const [year, month, day] = localDateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addDays(localDateString, days) {
  const date = fromLocalDateString(localDateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toLocalDateString(date);
}

function addYears(localDateString, years) {
  const date = fromLocalDateString(localDateString);
  date.setUTCFullYear(date.getUTCFullYear() + years);
  return toLocalDateString(date);
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months);
  return nextDate;
}

export function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function buildDemonstrationWindow() {
  const latestEffectiveDate = new Date();
  latestEffectiveDate.setUTCHours(0, 0, 0, 0);

  const earliestEffectiveDate = addMonths(
    latestEffectiveDate,
    -SEED_CONFIG.effectiveDateLookbackMonths
  );
  const daysInWindow = Math.floor(
    (latestEffectiveDate.getTime() - earliestEffectiveDate.getTime()) / 86_400_000
  );
  const effectiveDate = new Date(earliestEffectiveDate);
  effectiveDate.setUTCDate(effectiveDate.getUTCDate() + randomIntInclusive(0, daysInWindow));

  const effectiveDateString = toLocalDateString(effectiveDate);
  return {
    effectiveDate: effectiveDateString,
    expirationDate: addYears(effectiveDateString, SEED_CONFIG.demoWindowYears),
  };
}

export function buildApplicationDates(effectiveDate) {
  return APPLICATION_DATE_OFFSETS_FROM_EFFECTIVE_DATE.map(
    ([dateType, daysBeforeEffectiveDate]) => ({
      dateType,
      dateValue: addDays(effectiveDate, -daysBeforeEffectiveDate),
    })
  );
}

export function selectApplicationDates(applicationDates, dateTypes) {
  return dateTypes.map((dateType) => {
    const applicationDate = applicationDates.find((date) => date.dateType === dateType);
    if (!applicationDate) {
      throw new Error(`No generated application date found for ${dateType}.`);
    }
    return applicationDate;
  });
}

import { SetBundleDateInput } from "../../types.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  checkInputDateIsEndOfDay,
  DateOffset,
} from "./checkInputDateFunctions.js";

export async function validateInputDate(input: SetBundleDateInput): Promise<void> {
  const inputDate = {
    dateType: input.dateType,
    dateValue: input.dateValue,
  };

  let dateOffset: DateOffset;

  switch (input.dateType) {
    case "Concept Start Date":
    case "Pre-Submission Submitted Date":
    case "State Application Start Date":
    case "State Application Submitted Date":
    case "Completeness Start Date":
    case "SDG Preparation Start Date":
    case "Expected Approval Date":
    case "SME Review Date":
    case "FRT Initial Meeting Date":
    case "BNPMT Initial Meeting Date":
    case "SDG Preparation Completion Date":
    case "OGC & OMB Review Start Date":
    case "OGC Review Complete":
    case "OMB Review Complete":
    case "PO & OGD Sign-Off":
    case "OGC & OMB Review Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Concept Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Start Date",
      });
      break;

    case "Completeness Review Due Date":
      checkInputDateIsEndOfDay(inputDate);

      dateOffset = {
        days: 15,
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      };

      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
        offset: dateOffset,
      });
      break;

    case "State Application Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Completion Date",
      });
      break;

    case "State Application Deemed Complete":
      checkInputDateIsStartOfDay(inputDate);
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
      });
      break;

    case "Federal Comment Period Start Date":
      checkInputDateIsStartOfDay(inputDate);

      dateOffset = {
        days: 1,
        hours: 0,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      };

      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Deemed Complete",
        offset: dateOffset,
      });
      break;

    case "Federal Comment Period End Date":
      checkInputDateIsEndOfDay(inputDate);

      dateOffset = {
        days: 30,
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999,
      };

      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "Federal Comment Period Start Date",
        offset: dateOffset,
      });
      break;

    case "Completeness Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Completeness Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Completion Date",
      });
      break;

    default:
      break;
  }
}

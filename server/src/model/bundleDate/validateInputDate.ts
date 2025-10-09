import { SetBundleDateInput } from "../../types.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
  checkInputDateIsEndOfDay,
} from "./checkInputDateFunctions.js";

export async function validateInputDate(input: SetBundleDateInput): Promise<void> {
  const inputDate = {
    dateType: input.dateType,
    dateValue: input.dateValue,
  };

  switch (input.dateType) {
    case "Concept Start Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Pre-Submission Submitted Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Concept Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Start Date",
      });
      break;

    case "State Application Start Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "State Application Submitted Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Completeness Review Due Date":
      checkInputDateIsEndOfDay(inputDate);
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
        offsetDays: 15,
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

    case "Completeness Start Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Completeness Due Date":
      checkInputDateIsEndOfDay(inputDate);
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
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Deemed Complete",
        offsetDays: 1,
      });
      break;

    case "Federal Comment Period End Date":
      checkInputDateIsEndOfDay(inputDate);
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "Federal Comment Period Start Date",
        offsetDays: 30,
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

    case "SDG Preparation Start Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "Expected Approval Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "SME Review Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "FRT Initial Meeting Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "BNPMT Initial Meeting Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "SDG Preparation Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "OGC & OMB Review Start Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "OGC Review Complete":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "OMB Review Complete":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "PO & OGD Sign-Off":
      checkInputDateIsStartOfDay(inputDate);
      break;

    case "OGC & OMB Review Completion Date":
      checkInputDateIsStartOfDay(inputDate);
      break;

    default:
      break;
  }
}

import { SetBundleDateInput } from "../../types.js";
import {
  checkInputDateIsStartOfDay,
  checkInputDateGreaterThan,
  checkInputDateGreaterThanOrEqual,
  checkInputDateMeetsOffset,
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
    case "Concept Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Start Date",
      });
      break;
    case "State Application Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "Concept Completion Date",
      });
      break;
    case "Completeness Completion Date":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "Completeness Start Date",
      });
      await checkInputDateGreaterThanOrEqual(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Completion Date",
      });
      break;
    case "State Application Deemed Complete":
      await checkInputDateGreaterThan(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
      });
      break;
    case "Completeness Review Due Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Submitted Date",
        offsetDays: 15,
      });
      break;
    case "Federal Comment Period Start Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "State Application Deemed Complete",
        offsetDays: 1,
      });
      break;
    case "Federal Comment Period End Date":
      await checkInputDateMeetsOffset(inputDate, {
        bundleId: input.bundleId,
        dateType: "Federal Comment Period Start Date",
        offsetDays: 30,
      });
      break;
    default:
      break;
  }
}

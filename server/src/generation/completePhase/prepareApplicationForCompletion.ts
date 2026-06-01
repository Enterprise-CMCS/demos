import { TZDate } from "@date-fns/tz";
import { ApplicationType } from "../../types";
import { applyDemonstrationTypes } from "../applyDemonstrationTypes";
import { applyRequiredAttributesForApplicationApproval } from "../applyRequiredAttributesForDemonstrationApproval";

export const prepareApplicationForCompletion = async (
  applicationId: string,
  applicationType: ApplicationType,
  baseNow: TZDate
): Promise<void> => {
  if (applicationType === "Demonstration") {
    await applyDemonstrationTypes(applicationId);
  }

  await applyRequiredAttributesForApplicationApproval(applicationId, baseNow, applicationType);
};

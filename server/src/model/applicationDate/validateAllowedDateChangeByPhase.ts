import { PrismaTransactionClient } from "../../prismaClient";
import { PhaseName, SetApplicationDatesInput } from "../../types";
import { getFinishedApplicationPhaseIds } from "../applicationPhase";
import { getPhaseDateTypesByIds, PhaseDateType } from "../phaseDateType";
import { SemVer } from "semver";
import { __DEMOS_VERSION__, getFeatureFlags } from "../../flags";

export async function validateAllowedDateChangeByPhase(
  tx: PrismaTransactionClient,
  input: SetApplicationDatesInput,
  currentVersion: SemVer = __DEMOS_VERSION__
): Promise<void> {
  const completedPhaseIds: PhaseName[] = await getFinishedApplicationPhaseIds(
    tx,
    input.applicationId
  );
  let disallowedDateInputs: PhaseDateType[] = await getPhaseDateTypesByIds(
    tx,
    completedPhaseIds,
    input.applicationDates.map((applicationDate) => applicationDate.dateType)
  );

  if (getFeatureFlags(currentVersion).declareFederalCommentDatesInPhase4) {
    disallowedDateInputs = disallowedDateInputs.filter(
      ({ phaseId, dateTypeId }) =>
        phaseId !== "Completeness" ||
        (dateTypeId !== "Federal Comment Period Start Date" &&
          dateTypeId !== "Federal Comment Period End Date")
    );
  }

  // Special case: Internal Expected Approval Date is allowed to be edited after SDG Preparation completed
  // It cannot be deleted after SDG Preparation is completed
  const disallowedContainsExpectedApprovalDate = disallowedDateInputs.some(
    (phaseDateType) => phaseDateType.dateTypeId === "Internal Expected Approval Date"
  );

  // If we see it in disallowed, check if it is a deletion or an edit
  // If deletion, we'll catch the special case, otherwise, we remove it as it is allowed
  if (disallowedContainsExpectedApprovalDate) {
    const disallowedOperationIsDeletion = input.applicationDates.some(
      (applicationDate) =>
        applicationDate.dateType === "Internal Expected Approval Date" &&
        applicationDate.plainDate === null
    );

    if (disallowedOperationIsDeletion) {
      throw new Error(
        "You cannot delete the Internal Expected Approval Date after the SDG Preparation phase is completed."
      );
    }
    disallowedDateInputs = disallowedDateInputs.filter(
      (phaseDateType) => phaseDateType.dateTypeId !== "Internal Expected Approval Date"
    );
  }

  if (disallowedDateInputs.length > 0) {
    const errorMessages = disallowedDateInputs.map(
      (disallowedDateInput) =>
        `${disallowedDateInput.dateTypeId} date on ${disallowedDateInput.phaseId} phase`
    );
    throw new Error(
      `Cannot modify dates because they are associated with finished phases: ${errorMessages.join(", ")}.`
    );
  }
}

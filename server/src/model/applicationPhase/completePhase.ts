import { CompletePhaseInput, ApplicationDateInput } from "../../types.js";
import { DATE_TYPES_WITH_EXPECTED_TIMESTAMPS } from "../../constants.js";
import { prisma, PrismaTransactionClient } from "../../prismaClient.js";
import { getApplication, PrismaApplication } from "../application/applicationResolvers.js";
import { handlePrismaError } from "../../errors/handlePrismaError.js";
import { getEasternNow } from "../../dateUtilities.js";
import { setPhaseToStarted, updatePhaseStatus, validatePhaseCompletion, PHASE_ACTIONS, updateStatusToUnderReviewIfNeeded } from ".";
import { validateAndUpdateDates, getApplicationDates } from "../applicationDate";
import { TZDate } from "@date-fns/tz";
export async function completePhase(
  _: unknown,
  { input }: { input: CompletePhaseInput }
): Promise<PrismaApplication> {
  const phaseActions = PHASE_ACTIONS[input.phaseName];
  const easternNow = getEasternNow();

  if (phaseActions === "Not Permitted") {
    throw new Error(`Operations against the ${input.phaseName} phase are not permitted via API.`);
  } else if (phaseActions === "Not Implemented") {
    throw new Error(`Completion of the ${input.phaseName} phase via API is not yet implemented.`);
  }

  try {
    await prisma().$transaction(async (tx) => {
      // Special handling for Application Intake phase - ensure Completeness Review Due Date is set
      if (input.phaseName === "Application Intake") {
        await ensureCompletenessReviewDueDateExists(input.applicationId, tx);
      }
      
      await validatePhaseCompletion(input.applicationId, input.phaseName, tx);
      await updatePhaseStatus(input.applicationId, input.phaseName, "Completed", tx);

      const applicationDatesToUpdate: ApplicationDateInput[] = [];
      applicationDatesToUpdate.push({
        dateType: phaseActions.dateToComplete,
        dateValue:
          easternNow[
            DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.dateToComplete].expectedTimestamp
          ].easternTZDate,
      });

      if (phaseActions.nextPhase) {
        const nextPhaseWasStarted = await setPhaseToStarted(
          input.applicationId,
          phaseActions.nextPhase.phaseName,
          tx
        );
        if (nextPhaseWasStarted) {
          if (phaseActions.nextPhase.dateToStart) {
            applicationDatesToUpdate.push({
              dateType: phaseActions.nextPhase.dateToStart,
              dateValue:
                easternNow[
                  DATE_TYPES_WITH_EXPECTED_TIMESTAMPS[phaseActions.nextPhase.dateToStart]
                    .expectedTimestamp
                ].easternTZDate,
            });
          }
        }
      }

      await validateAndUpdateDates(
        { applicationId: input.applicationId, applicationDates: applicationDatesToUpdate },
        tx
      );

      // Update application status to "Under Review" when completing Concept phase
      if (input.phaseName === "Concept") {
        await updateStatusToUnderReviewIfNeeded(input.applicationId, tx);
      }
    });
  } catch (error) {
    handlePrismaError(error);
  }
  return await getApplication(input.applicationId);
}

/**
 * Ensures that the Completeness Review Due Date exists when completing Application Intake phase.
 * This date is required for validation and should be calculated as State Application Submitted Date + 15 days.
 */
async function ensureCompletenessReviewDueDateExists(
  applicationId: string, 
  tx: PrismaTransactionClient
): Promise<void> {
  const existingDates = await getApplicationDates(applicationId, tx);
  
  // Check if Completeness Review Due Date already exists
  const completenessReviewDueDate = existingDates.find(
    date => date.dateType === "Completeness Review Due Date"
  );
  
  if (!completenessReviewDueDate) {
    // Check if State Application Submitted Date exists
    const stateApplicationSubmittedDate = existingDates.find(
      date => date.dateType === "State Application Submitted Date"
    );
    
    if (stateApplicationSubmittedDate) {
      // Calculate Completeness Review Due Date as State Application Submitted Date + 15 days
      const submittedDate = stateApplicationSubmittedDate.dateValue.easternTZDate;
      const dueDateCalc = new Date(submittedDate);
      dueDateCalc.setDate(dueDateCalc.getDate() + 15);
      
      // Create new Eastern timezone date for the calculated due date
      const dueDate = new TZDate(dueDateCalc, "America/New_York");
      
      await validateAndUpdateDates(
        {
          applicationId,
          applicationDates: [
            {
              dateType: "Completeness Review Due Date",
              dateValue: dueDate,
            },
          ],
        },
        tx
      );
    }
  }
}

import React, { useState } from "react";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, ApplicationDateInput, LocalDate } from "demos-server";
import {
  ReviewPhaseFormData,
  getFormDataFromPhase,
  isFormComplete,
  hasFormChanges,
} from "./review/reviewFunctions";
import { StepOne } from "./review/StepOne";
import { StepTwo } from "./review/StepTwo";

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase formData={reviewPhaseFormData} demonstrationId={demonstration.id} />;
};

export const ReviewPhase = ({
  formData,
  demonstrationId,
}: {
  formData: ReviewPhaseFormData;
  demonstrationId: string;
}) => {
  const { showSuccess } = useToast();
  const [reviewPhaseFormData, setReviewPhaseFormData] = useState<ReviewPhaseFormData>(formData);
  const [originalFormData, setOriginalFormData] = useState<ReviewPhaseFormData>(formData);
  const [isStep1Expanded, setIsStep1Expanded] = useState(true);
  const [isStep2Expanded, setIsStep2Expanded] = useState(true);

  const { setApplicationDates } = useSetApplicationDates();
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

  const formComplete = isFormComplete(reviewPhaseFormData);
  const formChanges = hasFormChanges(originalFormData, reviewPhaseFormData);

  const saveFormData = async () => {
    const dateUpdates: ApplicationDateInput[] = [
      {
        dateType: "OGC Approval to Share with SMEs" as DateType,
        dateValue: reviewPhaseFormData.ogcApprovalToShareDate as LocalDate | null,
      },
      {
        dateType: "Draft Approval Package to Prep" as DateType,
        dateValue: reviewPhaseFormData.draftApprovalPackageToPrepDate as LocalDate | null,
      },
      {
        dateType: "DDME Approval Received" as DateType,
        dateValue: reviewPhaseFormData.ddmeApprovalReceivedDate as LocalDate | null,
      },
      {
        dateType: "State Concurrence" as DateType,
        dateValue: reviewPhaseFormData.stateConcurrenceDate as LocalDate | null,
      },
      {
        dateType: "BN PMT Approval to Send to OMB" as DateType,
        dateValue: reviewPhaseFormData.bnPmtApprovalReceivedDate as LocalDate | null,
      },
      {
        dateType: "Draft Approval Package Shared" as DateType,
        dateValue: reviewPhaseFormData.draftApprovalPackageSharedDate as LocalDate | null,
      },
      {
        dateType: "Receive OMB Concurrence" as DateType,
        dateValue: reviewPhaseFormData.receiveOMBConcurrenceDate as LocalDate | null,
      },
      {
        dateType: "Receive OGC Legal Clearance" as DateType,
        dateValue: reviewPhaseFormData.receiveOGCLegalClearanceDate as LocalDate | null,
      },
    ].filter((dateUpdate) => dateUpdate.dateValue != null);

    if (dateUpdates.length > 0) {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: dateUpdates,
      });
    }
  };

  const handleSaveForLater = async () => {
    try {
      await saveFormData();
      setOriginalFormData(reviewPhaseFormData);
      showSuccess(SAVE_FOR_LATER_MESSAGE);
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  };

  const handleFinish = async () => {
    try {
      await saveFormData();
      await completeReviewPhase();
      showSuccess(getPhaseCompletedMessage("Review"));
    } catch (error) {
      console.error("Error completing Review phase:", error);
    }
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">REVIEW</h3>
      <p className="text-sm text-text-placeholder mb-1">
        Gather input and address comments from the HHS - Office of General Council (OGC) and the
        White House - Office of Management and Budget (OMB)
      </p>

      <section className="bg-white pt-2">
        <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
          <StepOne
            reviewPhaseFormData={reviewPhaseFormData}
            setReviewPhaseFormData={setReviewPhaseFormData}
            isStep1Expanded={isStep1Expanded}
            setIsStep1Expanded={setIsStep1Expanded}
          />

          <StepTwo
            reviewPhaseFormData={reviewPhaseFormData}
            setReviewPhaseFormData={setReviewPhaseFormData}
            isStep2Expanded={isStep2Expanded}
            setIsStep2Expanded={setIsStep2Expanded}
          />
        </div>

        <div className="flex justify-end mt-2 gap-2">
          <SecondaryButton
            onClick={handleSaveForLater}
            size="large"
            name="review-save-for-later"
            disabled={!formChanges}
          >
            Save For Later
          </SecondaryButton>
          <Button onClick={handleFinish} size="large" name="review-finish" disabled={!formComplete}>
            Finish
          </Button>
        </div>
      </section>
    </div>
  );
};

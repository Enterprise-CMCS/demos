import React, { useState } from "react";
import { ApplicationWorkflowDemonstration } from "../ApplicationWorkflow";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, ApplicationDateInput, LocalDate, ClearanceLevel } from "demos-server";
import { getFormDataFromPhase, hasFormChanges } from "./review/reviewFunctions";
import { ExpandableSection } from "./review/expandableSection";
import { PoAndOgdSectionFields } from "./review/poAndOgdSectionFields";
import { OmbAndOgcSectionFields } from "./review/ombAndOgcSectionFields";
import { CommsClearanceSectionFields } from "./review/commsClearanceSectionFields";
import { CmsOsoraClearanceSectionFields } from "./review/cmsOsoraClearanceSectionFields";

export interface ReviewPhaseFormData {
  ogcApprovalToShareDate?: string;
  draftApprovalPackageToPrepDate?: string;
  ddmeApprovalReceivedDate?: string;
  stateConcurrenceDate?: string;
  bnPmtApprovalReceivedDate?: string;
  draftApprovalPackageSharedDate?: string;
  receiveOMBConcurrenceDate?: string;
  receiveOGCLegalClearanceDate?: string;
  packageSentForCommsClearanceDate?: string;
  packageReturnedFromCommsClearanceDate?: string;
  commsClearanceReceivedDate?: string;
  submitApprovalPackageToOsoraDate?: string;
  osoraR1CommentsDueDate?: string;
  osoraR2CommentsDueDate?: string;
  cmsOsoraClearanceEndDate?: string;
  poOGDNotes?: string;
  ogcOMBNotes?: string;
  commsClearanceNotes?: string;
  cmsOsoraNotes?: string;
}

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase formData={reviewPhaseFormData} demonstrationId={demonstration.id} />;
};

export const ClearanceLevelRadioButtons = ({
  selectedClearanceLevel,
  setSelectedClearanceLevel,
}: {
  selectedClearanceLevel: ClearanceLevel;
  setSelectedClearanceLevel: (clearanceLevel: ClearanceLevel) => void;
}) => (
  <div className="col-span-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="radio-clearance-level"
        value="COMMS Clearance Required"
        checked={selectedClearanceLevel === "COMMS Clearance Required"}
        onChange={(e) => setSelectedClearanceLevel(e.target.value as ClearanceLevel)}
        className="cursor-pointer"
      />
      <span className="text-sm">COMMS Clearance Required</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="radio-clearance-level"
        value="CMS (OSORA) Clearance Required"
        checked={selectedClearanceLevel === "CMS (OSORA) Clearance Required"}
        onChange={(e) => setSelectedClearanceLevel(e.target.value as ClearanceLevel)}
        className="cursor-pointer"
      />
      <span className="text-sm">CMS (OSORA) Clearance Required</span>
    </label>
  </div>
);

export const ActionButtons = ({
  handleSaveForLater,
  formChanges,
  handleFinish,
  reviewSectionsComplete,
}: {
  handleSaveForLater: () => void;
  formChanges: boolean;
  handleFinish: () => void;
  reviewSectionsComplete: ReviewSectionsFlag;
}) => (
  <div className="flex justify-end mt-2 gap-2">
    <SecondaryButton
      onClick={handleSaveForLater}
      size="large"
      name="review-save-for-later"
      disabled={!formChanges}
    >
      Save For Later
    </SecondaryButton>
    <Button
      onClick={handleFinish}
      size="large"
      name="review-finish"
      disabled={
        !(
          reviewSectionsComplete.poAndOgd &&
          reviewSectionsComplete.ombAndOgc &&
          (reviewSectionsComplete.commsClearance || reviewSectionsComplete.cmsOsoraClearance)
        )
      }
    >
      Finish
    </Button>
  </div>
);

export type ReviewSectionsFlag = {
  poAndOgd: boolean;
  ombAndOgc: boolean;
  commsClearance: boolean;
  cmsOsoraClearance: boolean;
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
  const [selectedClearanceLevel, setSelectedClearanceLevel] = useState<ClearanceLevel>(
    "CMS (OSORA) Clearance Required"
  );
  const [reviewSectionsExpanded, setReviewSectionsExpanded] = useState<ReviewSectionsFlag>({
    poAndOgd: true,
    ombAndOgc: true,
    commsClearance: true,
    cmsOsoraClearance: true,
  });
  const [reviewSectionsComplete, setReviewSectionsComplete] = useState<ReviewSectionsFlag>({
    poAndOgd: false,
    ombAndOgc: false,
    commsClearance: false,
    cmsOsoraClearance: false,
  });

  const { setApplicationDates } = useSetApplicationDates();
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

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
          <ExpandableSection
            title="STEP 1 - PO & OGD"
            isComplete={reviewSectionsComplete.poAndOgd}
            isExpanded={reviewSectionsExpanded.poAndOgd}
            setIsExpanded={(isExpanded) =>
              setReviewSectionsExpanded((prev) => ({
                ...prev,
                poAndOgd: isExpanded,
              }))
            }
          >
            <PoAndOgdSectionFields
              reviewPhaseFormData={reviewPhaseFormData}
              setReviewPhaseFormData={setReviewPhaseFormData}
              setPhaseComplete={(isComplete) => {
                setReviewSectionsComplete((prev) => ({
                  ...prev,
                  poAndOgd: isComplete,
                }));
                setReviewSectionsExpanded((prev) => ({
                  ...prev,
                  poAndOgd: isComplete ? false : prev.poAndOgd,
                }));
              }}
            />
          </ExpandableSection>
          <ExpandableSection
            title="STEP 2 - OGC & OMB"
            isComplete={reviewSectionsComplete.ombAndOgc}
            isExpanded={reviewSectionsExpanded.ombAndOgc}
            setIsExpanded={(isExpanded) =>
              setReviewSectionsExpanded((prev) => ({
                ...prev,
                ombAndOgc: isExpanded,
              }))
            }
          >
            <OmbAndOgcSectionFields
              reviewPhaseFormData={reviewPhaseFormData}
              setReviewPhaseFormData={setReviewPhaseFormData}
              setPhaseComplete={(isComplete) => {
                setReviewSectionsComplete((prev) => ({
                  ...prev,
                  ombAndOgc: isComplete,
                }));
                setReviewSectionsExpanded((prev) => ({
                  ...prev,
                  ombAndOgc: isComplete ? false : prev.ombAndOgc,
                }));
              }}
            />
          </ExpandableSection>
          <ClearanceLevelRadioButtons
            selectedClearanceLevel={selectedClearanceLevel}
            setSelectedClearanceLevel={setSelectedClearanceLevel}
          />
          {selectedClearanceLevel === "COMMS Clearance Required" && (
            <ExpandableSection
              title="COMMS Clearance"
              isComplete={reviewSectionsComplete.commsClearance}
              isExpanded={reviewSectionsExpanded.commsClearance}
              setIsExpanded={(isExpanded) =>
                setReviewSectionsExpanded((prev) => ({
                  ...prev,
                  commsClearance: isExpanded,
                }))
              }
            >
              <CommsClearanceSectionFields
                reviewPhaseFormData={reviewPhaseFormData}
                setReviewPhaseFormData={setReviewPhaseFormData}
                setPhaseComplete={(isComplete) => {
                  setReviewSectionsComplete((prev) => ({
                    ...prev,
                    commsClearance: isComplete,
                  }));
                  setReviewSectionsExpanded((prev) => ({
                    ...prev,
                    commsClearance: isComplete ? false : prev.commsClearance,
                  }));
                }}
              />
            </ExpandableSection>
          )}
          {selectedClearanceLevel === "CMS (OSORA) Clearance Required" && (
            <ExpandableSection
              title="CMS (OSORA) Clearance"
              isComplete={reviewSectionsComplete.cmsOsoraClearance}
              isExpanded={reviewSectionsExpanded.cmsOsoraClearance}
              setIsExpanded={(isExpanded) =>
                setReviewSectionsExpanded((prev) => ({
                  ...prev,
                  cmsOsoraClearance: isExpanded,
                }))
              }
            >
              <CmsOsoraClearanceSectionFields
                reviewPhaseFormData={reviewPhaseFormData}
                setReviewPhaseFormData={setReviewPhaseFormData}
                setPhaseComplete={(isComplete) => {
                  setReviewSectionsComplete((prev) => ({
                    ...prev,
                    cmsOsoraClearance: isComplete,
                  }));
                  setReviewSectionsExpanded((prev) => ({
                    ...prev,
                    cmsOsoraClearance: isComplete ? false : prev.cmsOsoraClearance,
                  }));
                }}
              />
            </ExpandableSection>
          )}
        </div>
        <ActionButtons
          handleSaveForLater={handleSaveForLater}
          formChanges={formChanges}
          handleFinish={handleFinish}
          reviewSectionsComplete={reviewSectionsComplete}
        />
      </section>
    </div>
  );
};

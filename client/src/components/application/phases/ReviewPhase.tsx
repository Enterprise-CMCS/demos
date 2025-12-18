import React, { useState } from "react";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, ApplicationDateInput, LocalDate, ClearanceLevel, NoteType } from "demos-server";
import { ExpandableSection } from "./review/expandableSection";
import { PoAndOgdSectionFields } from "./review/poAndOgdSectionFields";
import { OmbAndOgcSectionFields } from "./review/ombAndOgcSectionFields";
import { CommsClearanceSectionFields } from "./review/commsClearanceSectionFields";
import { CmsOsoraClearanceSectionFields } from "./review/cmsOsoraClearanceSectionFields";
import { ClearanceLevelRadioButtons } from "./review/clearanceRadioButtons";

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase formData={reviewPhaseFormData} demonstrationId={demonstration.id} />;
};

export const ActionButtons = ({
  handleSaveForLater,
  formChanges,
  handleFinish,
  reviewSectionsComplete,
  selectedClearanceLevel,
}: {
  handleSaveForLater: () => void;
  formChanges: boolean;
  handleFinish: () => void;
  reviewSectionsComplete: ReviewPhasePageState["sectionsComplete"];
  selectedClearanceLevel: ClearanceLevel;
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
        !reviewSectionsComplete["PO and OGD"] ||
        !reviewSectionsComplete["OMB and OGC"] ||
        !(
          (selectedClearanceLevel === "COMMS Clearance Required" &&
            reviewSectionsComplete["COMMs Clearance"]) ||
          (selectedClearanceLevel === "CMS (OSORA) Clearance Required" &&
            reviewSectionsComplete["CMS (OSORA) Clearance"])
        )
      }
    >
      Finish
    </Button>
  </div>
);

export function hasFormChanges(
  originalFormData: ReviewPhaseFormData,
  activeFormData: ReviewPhaseFormData
): boolean {
  for (const dateType of REVIEW_PHASE_DATE_TYPES) {
    if (originalFormData.dates[dateType] !== activeFormData.dates[dateType]) {
      return true;
    }
  }
  for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
    if (originalFormData.notes[noteType] !== activeFormData.notes[noteType]) {
      return true;
    }
  }
  return false;
}

export function getFormDataFromPhase(reviewPhase: SimplePhase): ReviewPhaseFormData {
  const formData: ReviewPhaseFormData = {
    dates: {},
    notes: {},
    clearanceLevel: "CMS (OSORA) Clearance Required",
  };

  for (const dateType of REVIEW_PHASE_DATE_TYPES) {
    const date = reviewPhase.phaseDates.find((d) => d.dateType === dateType);
    if (date) {
      formData.dates[dateType] = date.dateValue as unknown as string; // temporary workaround, as dateValues are defined as Dates instead of Strings
    }
  }

  // MOCKING NOTES AND CLEARANCE LEVEL UNTIL BACKEND SUPPORTS IT
  // WILL LIKELY END UP LOOKING LIKE THIS
  // for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
  //   const note = reviewPhase.phaseNotes.find((n) => n.noteType === noteType);
  //   if (note) formData.notes[noteType] = note.content;
  // }
  // formData.clearanceLevel = reviewPhase.

  formData.notes = {
    "PO OGD Notes": "Mock PO OGD Note content",
    "CMS (OSORA) Clearance Notes": "Mock CMS (OSORA) Clearance Note content",
  };

  formData.clearanceLevel = "CMS (OSORA) Clearance Required";

  return formData;
}

const REVIEW_PHASE_DATE_TYPES: DateType[] = [
  "OGD Approval to Share with SMEs",
  "Draft Approval Package to Prep",
  "DDME Approval Received",
  "State Concurrence",
  "BNPMT Initial Meeting Date",
  "Draft Approval Package Shared",
  "Receive OMB Concurrence",
  "Receive OGC Legal Clearance",
  "Package Sent to COMMs Clearance",
  "COMMs Clearance Received",
  "Submit Approval Package to OSORA",
  "OSORA R1 Comments Due",
  "OSORA R2 Comments Due",
  "CMS (OSORA) Clearance End",
];

const REVIEW_PHASE_NOTE_TYPES: NoteType[] = [
  "PO OGD Notes",
  "OGC OMB Notes",
  "COMMs Clearance Notes",
  "CMS (OSORA) Clearance Notes",
];

export type ReviewPhaseFormData = {
  dates: Partial<Record<(typeof REVIEW_PHASE_DATE_TYPES)[number], string>>;
  notes: Partial<Record<(typeof REVIEW_PHASE_NOTE_TYPES)[number], string>>;
  clearanceLevel: ClearanceLevel;
};

type ReviewSections = "PO and OGD" | "OMB and OGC" | "COMMs Clearance" | "CMS (OSORA) Clearance";

export type ReviewPhasePageState = {
  sectionsExpanded: Record<ReviewSections, boolean>;
  sectionsComplete: Record<ReviewSections, boolean>;
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
  const [reviewPhasePageState, setReviewPhasePageState] = useState<ReviewPhasePageState>({
    sectionsExpanded: {
      "PO and OGD": true,
      "OMB and OGC": true,
      "COMMs Clearance": true,
      "CMS (OSORA) Clearance": true,
    },
    sectionsComplete: {
      "PO and OGD": false,
      "OMB and OGC": false,
      "COMMs Clearance": false,
      "CMS (OSORA) Clearance": false,
    },
  });

  const { setApplicationDates } = useSetApplicationDates();
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

  const saveFormData = async () => {
    const dateUpdates: ApplicationDateInput[] = [];
    for (const dateType of REVIEW_PHASE_DATE_TYPES) {
      const dateValue = reviewPhaseFormData.dates[dateType];
      if (dateValue) {
        dateUpdates.push({
          dateType: dateType as DateType,
          dateValue: dateValue as LocalDate,
        });
      }
    }

    const noteUpdates: ApplicationDateInput[] = [];
    for (const noteType of REVIEW_PHASE_NOTE_TYPES) {
      const noteContent = reviewPhaseFormData.notes[noteType];
      if (noteContent) {
        noteUpdates.push({
          dateType: noteType as DateType,
          dateValue: noteContent as unknown as LocalDate,
        });
      }
    }

    if (dateUpdates.length > 0) {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: dateUpdates,
      });
    }

    if (noteUpdates.length > 0) {
      // TODO: Implement setting notes when backend supports it
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
            isComplete={reviewPhasePageState.sectionsComplete["PO and OGD"]}
            isExpanded={reviewPhasePageState.sectionsExpanded["PO and OGD"]}
            setIsExpanded={(isExpanded) =>
              setReviewPhasePageState((prev) => ({
                ...prev,
                sectionsExpanded: {
                  ...prev.sectionsExpanded,
                  "PO and OGD": isExpanded,
                },
              }))
            }
          >
            <PoAndOgdSectionFields
              poAndOgdSectionFormData={reviewPhaseFormData}
              setPoAndOgdSectionFormData={(formData) =>
                setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
              }
              setPoAndOgdSectionComplete={(isComplete) => {
                setReviewPhasePageState((prev) => ({
                  sectionsComplete: {
                    ...prev.sectionsComplete,
                    "PO and OGD": isComplete,
                  },
                  sectionsExpanded: {
                    ...prev.sectionsExpanded,
                    "PO and OGD": isComplete ? false : prev.sectionsExpanded["PO and OGD"],
                  },
                }));
              }}
            />
          </ExpandableSection>
          <ExpandableSection
            title="STEP 2 - OGC & OMB"
            isComplete={reviewPhasePageState.sectionsComplete["OMB and OGC"]}
            isExpanded={reviewPhasePageState.sectionsExpanded["OMB and OGC"]}
            setIsExpanded={(isExpanded) =>
              setReviewPhasePageState((prev) => ({
                ...prev,
                sectionsExpanded: {
                  ...prev.sectionsExpanded,
                  "OMB and OGC": isExpanded,
                },
              }))
            }
          >
            <OmbAndOgcSectionFields
              ombAndOgcSectionFormData={reviewPhaseFormData}
              setOmbAndOgcSectionFormData={(formData) =>
                setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
              }
              setOmbAndOgcSectionComplete={(isComplete) => {
                setReviewPhasePageState((prev) => ({
                  ...prev,
                  sectionsComplete: {
                    ...prev.sectionsComplete,
                    "OMB and OGC": isComplete,
                  },
                  sectionsExpanded: {
                    ...prev.sectionsExpanded,
                    "OMB and OGC": isComplete ? false : prev.sectionsExpanded["OMB and OGC"],
                  },
                }));
              }}
            />
          </ExpandableSection>
          <ClearanceLevelRadioButtons
            selectedClearanceLevel={reviewPhaseFormData.clearanceLevel}
            setSelectedClearanceLevel={(clearanceLevel) => {
              setReviewPhaseFormData((prev) => ({ ...prev, clearanceLevel: clearanceLevel }));
            }}
          />
          {reviewPhaseFormData.clearanceLevel === "COMMS Clearance Required" && (
            <ExpandableSection
              title="COMMS Clearance"
              isComplete={reviewPhasePageState.sectionsComplete["COMMs Clearance"]}
              isExpanded={reviewPhasePageState.sectionsExpanded["COMMs Clearance"]}
              setIsExpanded={(isExpanded) =>
                setReviewPhasePageState((prev) => ({
                  ...prev,
                  sectionsExpanded: {
                    ...prev.sectionsExpanded,
                    "COMMs Clearance": isExpanded,
                  },
                }))
              }
            >
              <CommsClearanceSectionFields
                commsClearanceSectionFormData={reviewPhaseFormData}
                setCommsClearanceSectionFormData={(formData) =>
                  setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
                }
                setCommsClearanceSectionComplete={(isComplete) => {
                  setReviewPhasePageState((prev) => ({
                    sectionsComplete: {
                      ...prev.sectionsComplete,
                      "COMMs Clearance": isComplete,
                    },
                    sectionsExpanded: {
                      ...prev.sectionsExpanded,
                      "COMMs Clearance": isComplete
                        ? false
                        : prev.sectionsExpanded["COMMs Clearance"],
                    },
                  }));
                }}
              />
            </ExpandableSection>
          )}
          {reviewPhaseFormData.clearanceLevel === "CMS (OSORA) Clearance Required" && (
            <ExpandableSection
              title="CMS (OSORA) Clearance"
              isComplete={reviewPhasePageState.sectionsComplete["CMS (OSORA) Clearance"]}
              isExpanded={reviewPhasePageState.sectionsExpanded["CMS (OSORA) Clearance"]}
              setIsExpanded={(isExpanded) =>
                setReviewPhasePageState((prev) => ({
                  ...prev,
                  sectionsExpanded: {
                    ...prev.sectionsExpanded,
                    "CMS (OSORA) Clearance": isExpanded,
                  },
                }))
              }
            >
              <CmsOsoraClearanceSectionFields
                cmsOsoraClearanceSectionFormData={reviewPhaseFormData}
                setCmsOsoraClearanceSectionFormData={(formData) =>
                  setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
                }
                setCmsOsoraClearanceSectionComplete={(isComplete) => {
                  setReviewPhasePageState((prev) => ({
                    sectionsComplete: {
                      ...prev.sectionsComplete,
                      "CMS (OSORA) Clearance": isComplete,
                    },
                    sectionsExpanded: {
                      ...prev.sectionsExpanded,
                      "CMS (OSORA) Clearance": isComplete
                        ? false
                        : prev.sectionsExpanded["CMS (OSORA) Clearance"],
                    },
                  }));
                }}
              />
            </ExpandableSection>
          )}
        </div>
        <ActionButtons
          handleSaveForLater={handleSaveForLater}
          formChanges={hasFormChanges(originalFormData, reviewPhaseFormData)}
          handleFinish={handleFinish}
          reviewSectionsComplete={reviewPhasePageState.sectionsComplete}
          selectedClearanceLevel={reviewPhaseFormData.clearanceLevel}
        />
      </section>
    </div>
  );
};

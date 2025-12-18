import React, { useState } from "react";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType, ApplicationDateInput, LocalDate, ClearanceLevel, NoteType } from "demos-server";
import { PoAndOgdSection } from "./review/sections/poAndOgdSection";
import { OmbAndOgcSection } from "./review/sections/ombAndOgcSection";
import { CommsClearanceSection } from "./review/sections/commsClearanceSection";
import { CmsOsoraClearanceSection } from "./review/sections/cmsOsoraClearanceSection";
import { Radio } from "../../input/radio";
import { CLEARANCE_LEVELS } from "demos-server-constants";

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((phase) => phase.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase initialFormData={reviewPhaseFormData} demonstrationId={demonstration.id} />;
};

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
    clearanceLevel: "CMS (OSORA)",
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
    "PO and OGD": "Mock PO and OGD Note content",
    "CMS (OSORA) Clearance": "Mock CMS (OSORA) Clearance Note content",
  };

  formData.clearanceLevel = "CMS (OSORA)";

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
  "PO and OGD",
  "OGC and OMB",
  "COMMs Clearance",
  "CMS (OSORA) Clearance",
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
  initialFormData,
  demonstrationId,
}: {
  initialFormData: ReviewPhaseFormData;
  demonstrationId: string;
}) => {
  const { showSuccess } = useToast();

  const [reviewPhaseFormData, setReviewPhaseFormData] =
    useState<ReviewPhaseFormData>(initialFormData);
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

    // TODO: Implement setting clearance level when backend supports it
  };

  const handleSaveForLater = async () => {
    try {
      await saveFormData();
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

  const setSectionIsExpanded = (section: ReviewSections, isExpanded: boolean) => {
    setReviewPhasePageState((prev) => ({
      ...prev,
      sectionsExpanded: {
        ...prev.sectionsExpanded,
        [section]: isExpanded,
      },
    }));
  };

  const setSectionIsComplete = (section: ReviewSections, isComplete: boolean) => {
    setReviewPhasePageState((prev) => ({
      sectionsComplete: {
        ...prev.sectionsComplete,
        [section]: isComplete,
      },
      sectionsExpanded: {
        ...prev.sectionsExpanded,
        [section]: isComplete ? false : prev.sectionsExpanded[section],
      },
    }));
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
          <PoAndOgdSection
            sectionFormData={reviewPhaseFormData}
            setSectionFormData={(formData) =>
              setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
            }
            sectionIsComplete={reviewPhasePageState.sectionsComplete["PO and OGD"]}
            setSectionIsComplete={(isComplete) => {
              setSectionIsComplete("PO and OGD", isComplete);
            }}
            sectionIsExpanded={reviewPhasePageState.sectionsExpanded["PO and OGD"]}
            setSectionIsExpanded={(isExpanded) => setSectionIsExpanded("PO and OGD", isExpanded)}
          />
          <OmbAndOgcSection
            sectionFormData={reviewPhaseFormData}
            setSectionFormData={(formData) =>
              setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
            }
            sectionIsComplete={reviewPhasePageState.sectionsComplete["OMB and OGC"]}
            setSectionIsComplete={(isComplete) => {
              setSectionIsComplete("OMB and OGC", isComplete);
            }}
            sectionIsExpanded={reviewPhasePageState.sectionsExpanded["OMB and OGC"]}
            setSectionIsExpanded={(isExpanded) => setSectionIsExpanded("OMB and OGC", isExpanded)}
          />
          <Radio
            name="clearance-level"
            options={CLEARANCE_LEVELS}
            value={reviewPhaseFormData.clearanceLevel}
            onChange={(value) =>
              setReviewPhaseFormData((prev) => ({
                ...prev,
                clearanceLevel: value as ClearanceLevel,
              }))
            }
          />
          {reviewPhaseFormData.clearanceLevel === "COMMS" && (
            <CommsClearanceSection
              sectionFormData={reviewPhaseFormData}
              setSectionFormData={(formData) =>
                setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
              }
              sectionIsComplete={reviewPhasePageState.sectionsComplete["COMMs Clearance"]}
              setSectionIsComplete={(isComplete) => {
                setSectionIsComplete("COMMs Clearance", isComplete);
              }}
              sectionIsExpanded={reviewPhasePageState.sectionsExpanded["COMMs Clearance"]}
              setSectionIsExpanded={(isExpanded) =>
                setSectionIsExpanded("COMMs Clearance", isExpanded)
              }
            />
          )}
          {reviewPhaseFormData.clearanceLevel === "CMS (OSORA)" && (
            <CmsOsoraClearanceSection
              sectionFormData={reviewPhaseFormData}
              setSectionFormData={(formData) =>
                setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
              }
              sectionIsComplete={reviewPhasePageState.sectionsComplete["CMS (OSORA) Clearance"]}
              setSectionIsComplete={(isComplete) => {
                setSectionIsComplete("CMS (OSORA) Clearance", isComplete);
              }}
              sectionIsExpanded={reviewPhasePageState.sectionsExpanded["CMS (OSORA) Clearance"]}
              setSectionIsExpanded={(isExpanded) =>
                setSectionIsExpanded("CMS (OSORA) Clearance", isExpanded)
              }
            />
          )}
        </div>
        <div className="flex justify-end mt-2 gap-2">
          <SecondaryButton
            onClick={handleSaveForLater}
            size="large"
            name="review-save-for-later"
            disabled={!hasFormChanges(initialFormData, reviewPhaseFormData)}
          >
            Save For Later
          </SecondaryButton>
          <Button
            onClick={handleFinish}
            size="large"
            name="review-finish"
            disabled={
              !reviewPhasePageState.sectionsComplete["PO and OGD"] ||
              !reviewPhasePageState.sectionsComplete["OMB and OGC"] ||
              !(
                (reviewPhaseFormData.clearanceLevel === "COMMS" &&
                  reviewPhasePageState.sectionsComplete["COMMs Clearance"]) ||
                (reviewPhaseFormData.clearanceLevel === "CMS (OSORA)" &&
                  reviewPhasePageState.sectionsComplete["CMS (OSORA) Clearance"])
              )
            }
          >
            Finish
          </Button>
        </div>
      </section>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../../phase-status/phaseStatusQueries";
import { DateType, ApplicationDateInput, LocalDate, ClearanceLevel, NoteType } from "demos-server";
import { PoAndOgdSection } from "./poAndOgdSection";
import { OgcAndOmbSection } from "./ogcAndOmbSection";
import { CommsClearanceSection } from "./commsClearanceSection";
import { CmsOsoraClearanceSection } from "./cmsOsoraClearanceSection";
import { RadioGroup } from "components/radioGroup";
import { Option } from "components/input/select/Select";

export const REVIEW_PHASE_DATE_TYPES = [
  "OGD Approval to Share with SMEs",
  "Draft Approval Package to Prep",
  "DDME Approval Received",
  "State Concurrence",
  "BN PMT Approval to Send to OMB",
  "Draft Approval Package Shared",
  "Receive OMB Concurrence",
  "Receive OGC Legal Clearance",
  "Package Sent to COMMs Clearance",
  "COMMs Clearance Received",
  "Submit Approval Package to OSORA",
  "OSORA R1 Comments Due",
  "OSORA R2 Comments Due",
  "CMS (OSORA) Clearance End",
] as const satisfies DateType[];

const REVIEW_PHASE_NOTE_TYPES = [
  "PO and OGD",
  "OGC and OMB",
  "COMMs Clearance",
  "CMS (OSORA) Clearance",
] as const satisfies NoteType[];

const CLEARANCE_LEVEL_OPTIONS: Option[] = [
  {
    label: "COMMs Clearance Required",
    value: "COMMs" satisfies ClearanceLevel,
  },
  {
    label: "CMS (OSORA) Clearance Required",
    value: "CMS (OSORA)" satisfies ClearanceLevel,
  },
];

type ReviewSections = "PO and OGD" | "OMB and OGC" | "COMMs Clearance" | "CMS (OSORA) Clearance";
export type ReviewPhasePageState = {
  sectionsExpanded: Record<ReviewSections, boolean>;
  sectionsComplete: Record<ReviewSections, boolean>;
};

export type ReviewPhaseFormData = {
  dates: Partial<Record<(typeof REVIEW_PHASE_DATE_TYPES)[number], string>>;
  notes: Partial<Record<(typeof REVIEW_PHASE_NOTE_TYPES)[number], string>>;
  clearanceLevel: ClearanceLevel;
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
  if (originalFormData.clearanceLevel !== activeFormData.clearanceLevel) {
    return true;
  }
  return false;
}

const isPoAndOgdComplete = (formData: ReviewPhaseFormData): boolean => {
  return !!(
    formData.dates["OGD Approval to Share with SMEs"] &&
    formData.dates["Draft Approval Package to Prep"] &&
    formData.dates["DDME Approval Received"] &&
    formData.dates["State Concurrence"]
  );
};

const isOgcAndOmbComplete = (formData: ReviewPhaseFormData): boolean => {
  return !!(
    formData.dates["BN PMT Approval to Send to OMB"] &&
    formData.dates["Draft Approval Package Shared"] &&
    formData.dates["Receive OMB Concurrence"] &&
    formData.dates["Receive OGC Legal Clearance"]
  );
};

const isCommsClearanceComplete = (formData: ReviewPhaseFormData): boolean => {
  return !!(
    formData.dates["Package Sent to COMMs Clearance"] && formData.dates["COMMs Clearance Received"]
  );
};

const isCmsOsoraComplete = (formData: ReviewPhaseFormData): boolean => {
  return !!(
    formData.dates["Submit Approval Package to OSORA"] &&
    formData.dates["OSORA R1 Comments Due"] &&
    formData.dates["OSORA R2 Comments Due"] &&
    formData.dates["CMS (OSORA) Clearance End"]
  );
};

export const ReviewPhase = ({
  initialFormData,
  demonstrationId,
}: {
  initialFormData: ReviewPhaseFormData;
  demonstrationId: string;
}) => {
  const { showSuccess } = useToast();
  const { setApplicationDates } = useSetApplicationDates();
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

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

  useEffect(() => {
    const poAndOgdComplete = isPoAndOgdComplete(reviewPhaseFormData);
    const ogcAndOmbComplete = isOgcAndOmbComplete(reviewPhaseFormData);
    const commsClearanceComplete = isCommsClearanceComplete(reviewPhaseFormData);
    const cmsOsoraComplete = isCmsOsoraComplete(reviewPhaseFormData);

    setReviewPhasePageState((prev) => {
      // if change doesnt effect completion state, dont update page state (it was manually opened)
      if (
        prev.sectionsComplete["PO and OGD"] === poAndOgdComplete &&
        prev.sectionsComplete["OMB and OGC"] === ogcAndOmbComplete &&
        prev.sectionsComplete["COMMs Clearance"] === commsClearanceComplete &&
        prev.sectionsComplete["CMS (OSORA) Clearance"] === cmsOsoraComplete
      ) {
        return prev;
      }

      return {
        ...prev,
        sectionsComplete: {
          "PO and OGD": poAndOgdComplete,
          "OMB and OGC": ogcAndOmbComplete,
          "COMMs Clearance": commsClearanceComplete,
          "CMS (OSORA) Clearance": cmsOsoraComplete,
        },
        sectionsExpanded: {
          "PO and OGD": poAndOgdComplete ? false : prev.sectionsExpanded["PO and OGD"],
          "OMB and OGC": ogcAndOmbComplete ? false : prev.sectionsExpanded["OMB and OGC"],
          "COMMs Clearance": commsClearanceComplete
            ? false
            : prev.sectionsExpanded["COMMs Clearance"],
          "CMS (OSORA) Clearance": cmsOsoraComplete
            ? false
            : prev.sectionsExpanded["CMS (OSORA) Clearance"],
        },
      };
    });
  }, [reviewPhaseFormData]);

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">REVIEW</h3>
      <p className="text-sm text-text-placeholder mb-1">
        Gather input and address comments from the HHS - Office of General Council (OGC) and the
        White House - Office of Management and Budget (OMB)
      </p>

      <section className="bg-white pt-2 flex flex-col gap-2">
        <PoAndOgdSection
          sectionFormData={reviewPhaseFormData}
          setSectionFormData={(formData) =>
            setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
          }
          sectionIsComplete={reviewPhasePageState.sectionsComplete["PO and OGD"]}
          sectionIsExpanded={reviewPhasePageState.sectionsExpanded["PO and OGD"]}
          setSectionIsExpanded={(isExpanded) => setSectionIsExpanded("PO and OGD", isExpanded)}
        />
        <OgcAndOmbSection
          sectionFormData={reviewPhaseFormData}
          setSectionFormData={(formData) =>
            setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
          }
          sectionIsComplete={reviewPhasePageState.sectionsComplete["OMB and OGC"]}
          sectionIsExpanded={reviewPhasePageState.sectionsExpanded["OMB and OGC"]}
          setSectionIsExpanded={(isExpanded) => setSectionIsExpanded("OMB and OGC", isExpanded)}
        />
        <RadioGroup
          name="clearance-level"
          options={CLEARANCE_LEVEL_OPTIONS}
          value={reviewPhaseFormData.clearanceLevel}
          onChange={(value) =>
            setReviewPhaseFormData((prev) => ({
              ...prev,
              clearanceLevel: value as ClearanceLevel,
            }))
          }
          isInline
        />
        {reviewPhaseFormData.clearanceLevel === "COMMs" && (
          <CommsClearanceSection
            sectionFormData={reviewPhaseFormData}
            setSectionFormData={(formData) =>
              setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
            }
            sectionIsComplete={reviewPhasePageState.sectionsComplete["COMMs Clearance"]}
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
            sectionIsExpanded={reviewPhasePageState.sectionsExpanded["CMS (OSORA) Clearance"]}
            setSectionIsExpanded={(isExpanded) =>
              setSectionIsExpanded("CMS (OSORA) Clearance", isExpanded)
            }
          />
        )}
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
                (reviewPhaseFormData.clearanceLevel === "COMMs" &&
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

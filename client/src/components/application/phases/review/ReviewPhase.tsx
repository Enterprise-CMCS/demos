import React, { useEffect, useState } from "react";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../../phase-status/phaseStatusQueries";
import { ClearanceLevel } from "demos-server";
import { PoAndOgdSection } from "./poAndOgdSection";
import { OgcAndOmbSection } from "./ogcAndOmbSection";
import { CommsClearanceSection } from "./commsClearanceSection";
import { CmsOsoraClearanceSection } from "./cmsOsoraClearanceSection";
import { RadioGroup } from "components/radioGroup";
import { REVIEW_PHASE_DATE_TYPES, REVIEW_PHASE_NOTE_TYPES } from "demos-server-constants";
import { formatDataForSave, getPageStateFromFormData, hasFormChanges } from "./reviewPhaseData";

export type ReviewPhaseDateTypes = (typeof REVIEW_PHASE_DATE_TYPES)[number];
export type ReviewPhaseNoteTypes = (typeof REVIEW_PHASE_NOTE_TYPES)[number];

type ReviewSections = (typeof REVIEW_SECTIONS)[number];
export const REVIEW_SECTIONS = [
  "PO and OGD",
  "OGC and OMB",
  "COMMs Clearance",
  "CMS (OSORA) Clearance",
] as const;

export const PO_AND_OGD_DATE_TYPES = [
  "OGD Approval to Share with SMEs",
  "Draft Approval Package to Prep",
  "DDME Approval Received",
  "State Concurrence",
] as const satisfies ReviewPhaseDateTypes[];
export const PO_AND_OGD_NOTE_TYPES = ["PO and OGD"] as const satisfies ReviewPhaseNoteTypes[];

export const OGC_AND_OMB_DATE_TYPES = [
  "BN PMT Approval to Send to OMB",
  "Draft Approval Package Shared",
  "Receive OMB Concurrence",
  "Receive OGC Legal Clearance",
] as const satisfies ReviewPhaseDateTypes[];
export const OGC_AND_OMB_NOTE_TYPES = ["OGC and OMB"] as const satisfies ReviewPhaseNoteTypes[];

export const COMMS_CLEARANCE_DATE_TYPES = [
  "Package Sent to COMMs Clearance",
  "COMMs Clearance Received",
] as const satisfies ReviewPhaseDateTypes[];
export const COMMS_CLEARANCE_NOTE_TYPES = [
  "COMMs Clearance",
] as const satisfies ReviewPhaseNoteTypes[];

export const CMS_OSORA_DATE_TYPES = [
  "Submit Approval Package to OSORA",
  "OSORA R1 Comments Due",
  "OSORA R2 Comments Due",
  "CMS (OSORA) Clearance End",
] as const satisfies ReviewPhaseDateTypes[];
export const CMS_OSORA_NOTE_TYPES = [
  "CMS (OSORA) Clearance",
] as const satisfies ReviewPhaseNoteTypes[];

export type ReviewPhasePageState = {
  sectionsExpanded: Record<ReviewSections, boolean>;
  sectionsComplete: Record<ReviewSections, boolean>;
};

export type ReviewPhaseFormData = {
  dates: Partial<Record<ReviewPhaseDateTypes, string>>;
  notes: Partial<Record<ReviewPhaseNoteTypes, string>>;
  clearanceLevel: ClearanceLevel;
};

const getPhaseStateInitialization = () => {
  const state = {
    sectionsExpanded: {} as Record<ReviewSections, boolean>,
    sectionsComplete: {} as Record<ReviewSections, boolean>,
  };
  for (const section of REVIEW_SECTIONS) {
    state.sectionsExpanded[section] = true;
    state.sectionsComplete[section] = false;
  }
  return state;
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
  const [reviewPhasePageState, setReviewPhasePageState] = useState<ReviewPhasePageState>(
    getPhaseStateInitialization()
  );

  const saveFormData = async () => {
    const { dates, notes } = formatDataForSave(reviewPhaseFormData);

    if (dates.length > 0) {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: dates,
      });
    }

    if (notes.length > 0) {
      // TODO: Implement setting notes when backend supports it
      //  - integration - DEMOS-1266
      //  - backend support - DEMOS-1167
    }

    // TODO: Implement setting clearance level when backend supports it
    //  - integration - DEMOS-1224
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
    setReviewPhasePageState((prev) => getPageStateFromFormData(prev, reviewPhaseFormData));
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
          sectionIsComplete={reviewPhasePageState.sectionsComplete["OGC and OMB"]}
          sectionIsExpanded={reviewPhasePageState.sectionsExpanded["OGC and OMB"]}
          setSectionIsExpanded={(isExpanded) => setSectionIsExpanded("OGC and OMB", isExpanded)}
        />
        <RadioGroup
          name="clearance-level"
          options={[
            {
              label: "COMMs Clearance Required",
              value: "COMMs" satisfies ClearanceLevel,
            },
            {
              label: "CMS (OSORA) Clearance Required",
              value: "CMS (OSORA)" satisfies ClearanceLevel,
            },
          ]}
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
              !reviewPhasePageState.sectionsComplete["OGC and OMB"] ||
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

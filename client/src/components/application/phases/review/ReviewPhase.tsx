import React, { useEffect, useState } from "react";
import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDates } from "components/application/date/dateQueries";
import { useSetApplicationNotes } from "components/application/note/noteQueries";
import { useSetPhaseStatus } from "../../phase-status/phaseStatusQueries";
import { ClearanceLevel, ReviewPhaseDateTypes, ReviewPhaseNoteTypes } from "demos-server";
import { PoAndOgdSection } from "./poAndOgdSection";
import { OgcAndOmbSection } from "./ogcAndOmbSection";
import { CommsClearanceSection } from "./commsClearanceSection";
import { CmsOsoraClearanceSection } from "./cmsOsoraClearanceSection";
import { RadioGroup } from "components/radioGroup";
import { formatDataForSave, hasFormChanges } from "./reviewPhaseData";
import { gql, useMutation } from "@apollo/client";

const SET_APPLICATION_CLEARANCE_LEVEL = gql`
  mutation SetApplicationClearanceLevel($input: SetApplicationClearanceLevelInput!) {
    setApplicationClearanceLevel(input: $input) {
      ... on Demonstration {
        id
        clearanceLevel
      }
      ... on Amendment {
        id
        clearanceLevel
      }
      ... on Extension {
        id
        clearanceLevel
      }
    }
  }
`;

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

export type ReviewPhaseSectionsComplete = Record<ReviewSections, boolean>;

export type ReviewPhaseFormData = {
  dates: Partial<Record<ReviewPhaseDateTypes, string>>;
  notes: Partial<Record<ReviewPhaseNoteTypes, string>>;
  clearanceLevel: ClearanceLevel;
};

const getPhaseStateInitialization = () => {
  const sectionsComplete = {} as Record<ReviewSections, boolean>;
  for (const section of REVIEW_SECTIONS) {
    sectionsComplete[section] = false;
  }
  return sectionsComplete;
};

export const ReviewPhase = ({
  initialFormData,
  demonstrationId,
  isReadonly,
}: {
  initialFormData: ReviewPhaseFormData;
  demonstrationId: string;
  isReadonly: boolean;
}) => {
  const { showSuccess } = useToast();
  const { setApplicationDates } = useSetApplicationDates();
  const { setApplicationNotes } = useSetApplicationNotes();
  const [setApplicationClearanceLevel] = useMutation(SET_APPLICATION_CLEARANCE_LEVEL);
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

  const [reviewPhaseFormData, setReviewPhaseFormData] =
    useState<ReviewPhaseFormData>(initialFormData);
  const [reviewPhaseSectionsComplete, setReviewPhaseSectionsComplete] =
    useState<ReviewPhaseSectionsComplete>(getPhaseStateInitialization());

  const saveFormData = async () => {
    const { dates, notes } = formatDataForSave(reviewPhaseFormData);

    if (dates.length > 0) {
      await setApplicationDates({
        applicationId: demonstrationId,
        applicationDates: dates,
      });
    }

    if (notes.length > 0) {
      await setApplicationNotes({
        applicationId: demonstrationId,
        applicationNotes: notes,
      });
    }

    await setApplicationClearanceLevel({
      variables: {
        input: {
          applicationId: demonstrationId,
          clearanceLevel: reviewPhaseFormData.clearanceLevel,
        },
      },
    });
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

  useEffect(() => {
    setReviewPhaseSectionsComplete({
      "PO and OGD": PO_AND_OGD_DATE_TYPES.every(
        (dateType) => !!reviewPhaseFormData.dates[dateType]
      ),
      "OGC and OMB": OGC_AND_OMB_DATE_TYPES.every(
        (dateType) => !!reviewPhaseFormData.dates[dateType]
      ),
      "COMMs Clearance": COMMS_CLEARANCE_DATE_TYPES.every(
        (dateType) => !!reviewPhaseFormData.dates[dateType]
      ),
      "CMS (OSORA) Clearance": CMS_OSORA_DATE_TYPES.every(
        (dateType) => !!reviewPhaseFormData.dates[dateType]
      ),
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
          isComplete={reviewPhaseSectionsComplete["PO and OGD"]}
          isReadonly={isReadonly}
        />
        <OgcAndOmbSection
          sectionFormData={reviewPhaseFormData}
          setSectionFormData={(formData) =>
            setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
          }
          isComplete={reviewPhaseSectionsComplete["OGC and OMB"]}
          isReadonly={isReadonly}
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
          isDisabled={isReadonly}
        />
        {reviewPhaseFormData.clearanceLevel === "COMMs" && (
          <CommsClearanceSection
            sectionFormData={reviewPhaseFormData}
            setSectionFormData={(formData) =>
              setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
            }
            isComplete={reviewPhaseSectionsComplete["COMMs Clearance"]}
            isReadonly={isReadonly}
          />
        )}
        {reviewPhaseFormData.clearanceLevel === "CMS (OSORA)" && (
          <CmsOsoraClearanceSection
            sectionFormData={reviewPhaseFormData}
            setSectionFormData={(formData) =>
              setReviewPhaseFormData((prev) => ({ ...prev, ...formData }))
            }
            isComplete={reviewPhaseSectionsComplete["CMS (OSORA) Clearance"]}
            isReadonly={isReadonly}
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
              !reviewPhaseSectionsComplete["PO and OGD"] ||
              !reviewPhaseSectionsComplete["OGC and OMB"] ||
              !(
                (reviewPhaseFormData.clearanceLevel === "COMMs" &&
                  reviewPhaseSectionsComplete["COMMs Clearance"]) ||
                (reviewPhaseFormData.clearanceLevel === "CMS (OSORA)" &&
                  reviewPhaseSectionsComplete["CMS (OSORA) Clearance"])
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

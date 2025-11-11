import React, { useState } from "react";
import { tw } from "tags/tw";

import { Button, SecondaryButton } from "components/button";
import { useMutation } from "@apollo/client";
import { DateType, PhaseStatus } from "demos-server";
import { gql } from "graphql-tag";
import { PhaseName } from "../phase-selector/PhaseSelector";
import { useToast } from "components/toast";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

const PHASE_NAME: PhaseName = "SDG Preparation";
const NEXT_PHASE_NAME: PhaseName = "Approval Package";

export function getDateInputValue(isoString: string): string {
  const date = new TZDate(isoString, "America/New_York");
  return format(date, "yyyy-MM-dd");
}

export function toEstStartOfDay(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  const date = new TZDate(
    Number(year),
    Number(month) - 1,
    Number(day),
    0,
    0,
    0,
    0,
    "America/New_York"
  );
  return format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  title: tw`text-xl font-semibold mb-1`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  header: tw`min-h-[88px]`,
  actions: tw`flex justify-end mt-2 gap-2`,
};

export const SET_SDG_PREPARATION_PHASE_DATE_MUTATION = gql`
  mutation setSDGPreparationPhaseDate($input: SetApplicationDateInput) {
    setApplicationDate(input: $input) {
      ... on Demonstration {
        id
        phases {
          phaseName
          phaseDates {
            dateType
            dateValue
          }
        }
      }
    }
  }
`;

export const SET_SDG_PREPARATION_PHASE_STATUS_MUTATION = gql`
  mutation setSDGPreparationPhaseStatus($input: SetApplicationPhaseStatusInput!) {
    setApplicationPhaseStatus(input: $input) {
      ... on Demonstration {
        id
        phases {
          phaseName
          phaseStatus
        }
      }
    }
  }
`;

interface SdgPreparationPhaseFormData {
  expectedApprovalDate?: string;
  smeInitialReviewDate?: string;
  frtInitialMeetingDate?: string;
  bnpmtInitialMeetingDate?: string;
}

export const SdgPreparationPhase = ({
  demonstrationId,
  sdgPreparationPhase,
  setSelectedPhase,
}: {
  demonstrationId: string;
  sdgPreparationPhase: SimplePhase;
  setSelectedPhase: (phaseName: PhaseName) => void;
}) => {
  const [sdgPreparationPhaseFormData, setSdgPreparationPhaseFormData] =
    useState<SdgPreparationPhaseFormData>(getFormDataFromPhase);
  const [mutateApplicationDate] = useMutation<{ demonstration: ApplicationWorkflowDemonstration }>(
    SET_SDG_PREPARATION_PHASE_DATE_MUTATION
  );
  const [mutatePhaseStatus] = useMutation<{ demonstration: ApplicationWorkflowDemonstration }>(
    SET_SDG_PREPARATION_PHASE_STATUS_MUTATION
  );
  const { showSuccess, showError } = useToast();

  function getFormDataFromPhase() {
    const phaseDates = {
      expectedApprovalDate: sdgPreparationPhase.phaseDates.find(
        (date) => date.dateType === "Expected Approval Date"
      )?.dateValue,
      smeInitialReviewDate: sdgPreparationPhase.phaseDates.find(
        (date) => date.dateType === "SME Review Date"
      )?.dateValue,
      frtInitialMeetingDate: sdgPreparationPhase.phaseDates.find(
        (date) => date.dateType === "FRT Initial Meeting Date"
      )?.dateValue,
      bnpmtInitialMeetingDate: sdgPreparationPhase.phaseDates.find(
        (date) => date.dateType === "BNPMT Initial Meeting Date"
      )?.dateValue,
    };

    return {
      expectedApprovalDate: phaseDates.expectedApprovalDate
        ? getDateInputValue(phaseDates.expectedApprovalDate as unknown as string)
        : undefined,
      smeInitialReviewDate: phaseDates.smeInitialReviewDate
        ? getDateInputValue(phaseDates.smeInitialReviewDate as unknown as string)
        : undefined,
      frtInitialMeetingDate: phaseDates.frtInitialMeetingDate
        ? getDateInputValue(phaseDates.frtInitialMeetingDate as unknown as string)
        : undefined,
      bnpmtInitialMeetingDate: phaseDates.bnpmtInitialMeetingDate
        ? getDateInputValue(phaseDates.bnpmtInitialMeetingDate as unknown as string)
        : undefined,
    };
  }

  const isFormComplete =
    sdgPreparationPhaseFormData.expectedApprovalDate &&
    sdgPreparationPhaseFormData.smeInitialReviewDate &&
    sdgPreparationPhaseFormData.frtInitialMeetingDate &&
    sdgPreparationPhaseFormData.bnpmtInitialMeetingDate;

  const handleSave = async () => {
    if (sdgPreparationPhaseFormData.expectedApprovalDate) {
      await mutateApplicationDate({
        variables: {
          input: {
            applicationId: demonstrationId,
            dateType: "Expected Approval Date" satisfies DateType,
            dateValue: toEstStartOfDay(sdgPreparationPhaseFormData.expectedApprovalDate),
          },
        },
      });
    }

    if (sdgPreparationPhaseFormData.smeInitialReviewDate) {
      await mutateApplicationDate({
        variables: {
          input: {
            applicationId: demonstrationId,
            dateType: "SME Review Date" satisfies DateType,
            dateValue: toEstStartOfDay(sdgPreparationPhaseFormData.smeInitialReviewDate),
          },
        },
      });
    }

    if (sdgPreparationPhaseFormData.frtInitialMeetingDate) {
      await mutateApplicationDate({
        variables: {
          input: {
            applicationId: demonstrationId,
            dateType: "FRT Initial Meeting Date" satisfies DateType,
            dateValue: toEstStartOfDay(sdgPreparationPhaseFormData.frtInitialMeetingDate),
          },
        },
      });
    }

    if (sdgPreparationPhaseFormData.bnpmtInitialMeetingDate) {
      await mutateApplicationDate({
        variables: {
          input: {
            applicationId: demonstrationId,
            dateType: "BNPMT Initial Meeting Date" satisfies DateType,
            dateValue: toEstStartOfDay(sdgPreparationPhaseFormData.bnpmtInitialMeetingDate),
          },
        },
      });
    }
  };

  const handleSaveForLater = async () => {
    try {
      await handleSave();
    } catch {
      showError("Failed to save SDG Workplan for later.");
      return;
    }
    showSuccess("Successfully saved SDG Workplan for later.");
  };

  const handleFinish = async () => {
    try {
      await handleSave();
      await mutatePhaseStatus({
        variables: {
          input: {
            applicationId: demonstrationId,
            phaseName: PHASE_NAME,
            phaseStatus: "Completed" satisfies PhaseStatus,
          },
        },
      });
    } catch {
      showError("Failed to finish SDG Preparation phase.");
      return;
    }

    showSuccess("Successfully finished SDG Preparation phase.");
    setSelectedPhase(NEXT_PHASE_NAME);
  };

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">SDG PREPARATION</h3>
      <p className="text-sm text-text-placeholder mb-4">
        Plan and conduct internal and preparation tasks
      </p>

      <section className={STYLES.pane}>
        <div className={STYLES.grid}>
          <span aria-hidden className={STYLES.divider} />
          <div aria-labelledby="sdg-workplan-title">
            <div className={STYLES.header}>
              <h4 id="sdg-workplan-title" className={STYLES.title}>
                SDG WORKPLAN
              </h4>
              <p className={STYLES.helper}>
                Ensure the expected approval date is reasonable based on required reviews and the
                complexity of the application
              </p>
            </div>
            <div className="flex flex-col gap-8 mt-2 text-sm text-text-placeholder">
              <label className="block text-sm font-bold mb-1">
                <span className="text-text-warn mr-1">*</span>
                Expected Approval Date
              </label>
              <input
                type="date"
                name="expected-approval-date"
                data-testid="datepicker-expected-approval-date"
                className="w-full border border-border-fields px-1 py-1 text-sm rounded"
                aria-required={true}
                placeholder="Expected Approval Date"
                value={sdgPreparationPhaseFormData.expectedApprovalDate}
                onChange={(e) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    expectedApprovalDate: e.target.value,
                  });
                }}
              />
            </div>
          </div>{" "}
          <div aria-labelledby="sdg-reviews-title">
            <div className={STYLES.header}>
              <h4 id="sdg-reviews-title" className={STYLES.title}>
                INTERNAL REVIEWS
              </h4>
              <p className={STYLES.helper}>Record the occurrence of the key review meetings</p>
            </div>
            <div className="flex flex-col gap-8 mt-2 text-sm text-text-placeholder">
              <label className="block text-sm font-bold mb-1">
                <span className="text-text-warn mr-1">*</span>
                SME Initial Review Date
              </label>
              <input
                name="sme-initial-review-date"
                data-testid="datepicker-sme-initial-review-date"
                type="date"
                className="w-full border border-border-fields px-1 py-1 text-sm rounded"
                aria-required={true}
                placeholder="SME Initial Review Date"
                value={sdgPreparationPhaseFormData.smeInitialReviewDate}
                onChange={(e) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    smeInitialReviewDate: e.target.value,
                  });
                }}
              />
              <label className="block text-sm font-bold mb-1">
                <span className="text-text-warn mr-1">*</span>
                FRT Initial Meeting Date
              </label>
              <input
                name="frt-initial-meeting-date"
                data-testid="datepicker-frt-intial-meeting-date"
                type="date"
                className="w-full border border-border-fields px-1 py-1 text-sm rounded"
                aria-required={true}
                placeholder="FRT Initial Meeting Date"
                value={sdgPreparationPhaseFormData.frtInitialMeetingDate}
                onChange={(e) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    frtInitialMeetingDate: e.target.value,
                  });
                }}
              />
              <label className="block text-sm font-bold mb-1">
                <span className="text-text-warn mr-1">*</span>
                BNPMT Initial Meeting Date
              </label>
              <input
                name="bnpmt-intial-meeting-date"
                data-testid="datepicker-bnpmt-intial-meeting-date"
                type="date"
                className="w-full border border-border-fields px-1 py-1 text-sm rounded"
                aria-required={true}
                placeholder="BNPMT Initial Meeting Date"
                value={sdgPreparationPhaseFormData.bnpmtInitialMeetingDate}
                onChange={(e) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    bnpmtInitialMeetingDate: e.target.value,
                  });
                }}
              />
            </div>

            <div className={STYLES.actions}>
              <SecondaryButton onClick={handleSaveForLater} size="large" name="sdg-save-for-later">
                Save For Later
              </SecondaryButton>
              <Button
                onClick={handleFinish}
                size="large"
                name="sdg-finish"
                disabled={!isFormComplete}
              >
                Finish
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

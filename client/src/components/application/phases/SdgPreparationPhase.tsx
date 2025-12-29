import React, { useState } from "react";
import { tw } from "tags/tw";

import { Button, SecondaryButton } from "components/button";
import { useToast } from "components/toast";
import { SimplePhase } from "../ApplicationWorkflow";
import { formatDateForServer } from "util/formatDate";
import { DateType } from "demos-server";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import {
  FAILED_TO_SAVE_MESSAGE,
  getPhaseCompletedMessage,
  SAVE_FOR_LATER_MESSAGE,
} from "util/messages";
import { DatePicker } from "components/input/date/DatePicker";

const STYLES = {
  pane: tw`bg-white p-8`,
  grid: tw`relative grid grid-cols-2 gap-10`,
  divider: tw`pointer-events-none absolute left-1/2 top-0 h-full border-l border-border-subtle`,
  title: tw`text-xl font-semibold mb-1`,
  helper: tw`text-sm text-text-placeholder mb-1`,
  header: tw`min-h-[88px]`,
  actions: tw`flex justify-end mt-2 gap-2`,
};

function getFormDataFromPhase(sdgPreparationPhase: SimplePhase): SdgPreparationPhaseFormData {
  const getDateValue = (dateType: string) => {
    const dateValue = sdgPreparationPhase.phaseDates.find(
      (d) => d.dateType === dateType
    )?.dateValue;
    return dateValue ? formatDateForServer(dateValue) : undefined;
  };

  return {
    expectedApprovalDate: getDateValue("Expected Approval Date"),
    smeInitialReviewDate: getDateValue("SME Review Date"),
    frtInitialMeetingDate: getDateValue("FRT Initial Meeting Date"),
    bnpmtInitialMeetingDate: getDateValue("BNPMT Initial Meeting Date"),
  };
}

interface SdgPreparationPhaseFormData {
  expectedApprovalDate?: string;
  smeInitialReviewDate?: string;
  frtInitialMeetingDate?: string;
  bnpmtInitialMeetingDate?: string;
}

export const SdgPreparationPhase = ({
  demonstrationId,
  sdgPreparationPhase,
}: {
  demonstrationId: string;
  sdgPreparationPhase: SimplePhase;
}) => {
  const [sdgPreparationPhaseFormData, setSdgPreparationPhaseFormData] =
    useState<SdgPreparationPhaseFormData>(getFormDataFromPhase(sdgPreparationPhase));
  const { setApplicationDate } = useSetApplicationDate();
  const { setPhaseStatus: completeSdgPreparationPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Completeness",
    phaseStatus: "Completed",
  });
  const { showSuccess, showError } = useToast();

  const isFormComplete =
    sdgPreparationPhaseFormData.expectedApprovalDate &&
    sdgPreparationPhaseFormData.smeInitialReviewDate &&
    sdgPreparationPhaseFormData.frtInitialMeetingDate &&
    sdgPreparationPhaseFormData.bnpmtInitialMeetingDate;

  const handleSave = async () => {
    if (sdgPreparationPhaseFormData.expectedApprovalDate) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "Expected Approval Date" satisfies DateType,
        dateValue: formatDateForServer(sdgPreparationPhaseFormData.expectedApprovalDate),
      });
    }

    if (sdgPreparationPhaseFormData.smeInitialReviewDate) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "SME Review Date" satisfies DateType,
        dateValue: formatDateForServer(sdgPreparationPhaseFormData.smeInitialReviewDate),
      });
    }

    if (sdgPreparationPhaseFormData.frtInitialMeetingDate) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "FRT Initial Meeting Date" satisfies DateType,
        dateValue: formatDateForServer(sdgPreparationPhaseFormData.frtInitialMeetingDate),
      });
    }

    if (sdgPreparationPhaseFormData.bnpmtInitialMeetingDate) {
      await setApplicationDate({
        applicationId: demonstrationId,
        dateType: "BNPMT Initial Meeting Date" satisfies DateType,
        dateValue: formatDateForServer(sdgPreparationPhaseFormData.bnpmtInitialMeetingDate),
      });
    }
  };

  const handleSaveForLater = async () => {
    try {
      await handleSave();
    } catch {
      showError("Failed to save updates.");
      return;
    }
    showSuccess(SAVE_FOR_LATER_MESSAGE);
  };

  const handleFinish = async () => {
    try {
      await handleSave();
      await completeSdgPreparationPhase();
    } catch {
      showError(FAILED_TO_SAVE_MESSAGE);
      return;
    }

    showSuccess(getPhaseCompletedMessage("SDG Preparation"));
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
              <DatePicker
                name="datepicker-expected-approval-date"
                label="Expected Approval Date"
                value={sdgPreparationPhaseFormData.expectedApprovalDate}
                onChange={(newDate) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    expectedApprovalDate: newDate,
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
              </label>
              <DatePicker
                name="datepicker-sme-initial-review-date"
                label="SME Initial Review Date"
                isRequired={true}
                value={sdgPreparationPhaseFormData.smeInitialReviewDate}
                onChange={(newDate) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    smeInitialReviewDate: newDate,
                  });
                }}
              />
              <label className="block text-sm font-bold mb-1">
                <span className="text-text-warn mr-1">*</span>
                FRT Initial Meeting Date
              </label>
              <DatePicker
                name="datepicker-frt-initial-meeting-date"
                data-testid="datepicker-frt-initial-meeting-date"
                isRequired={true}
                label="FRT Initial Meeting Date"
                value={sdgPreparationPhaseFormData.frtInitialMeetingDate}
                onChange={(newDate) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    frtInitialMeetingDate: newDate,
                  });
                }}
              />
              <DatePicker
                name="datepicker-bnpmt-initial-meeting-date"
                label="BNPMT Initial Meeting Date"
                value={sdgPreparationPhaseFormData.bnpmtInitialMeetingDate}
                onChange={(newDate) => {
                  setSdgPreparationPhaseFormData({
                    ...sdgPreparationPhaseFormData,
                    bnpmtInitialMeetingDate: newDate,
                  });
                }}
                isRequired={true}
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

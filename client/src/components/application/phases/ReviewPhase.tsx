import React, { useState } from "react";
import { ChevronUpIcon, ChevronDownIcon } from "components/icons";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { formatDateForServer } from "util/formatDate";
import { Button, SecondaryButton } from "components/button";
import { DatePicker } from "components/input/date/DatePicker";
import { useToast } from "components/toast";
import { getPhaseCompletedMessage, SAVE_FOR_LATER_MESSAGE } from "util/messages";
import { useSetApplicationDate } from "components/application/date/dateQueries";
import { useSetPhaseStatus } from "../phase-status/phaseStatusQueries";
import { DateType } from "demos-server";

interface ReviewPhaseFormData {
  ogcApprovalToShareDate?: string;
  draftApprovalPackageToPrepDate?: string;
  ddmeApprovalReceivedDate?: string;
  stateConcurrenceDate?: string;
  bnPmtApprovalReceivedDate?: string;
  draftApprovalPackageSharedDate?: string;
  receiveOMBConcurrenceDate?: string;
  receiveOGCLegalClearanceDate?: string;
  poOGDNotes?: string; // Placeholder Value
  ogcOMBNotes?: string; // Placeholder Value
}

function getFormDataFromPhase(reviewPhase: SimplePhase): ReviewPhaseFormData {
  const getDateValue = (dateType: string) => {
    const dateValue = reviewPhase.phaseDates.find((d) => d.dateType === dateType)?.dateValue;
    if (!dateValue) return undefined;

    // Extract date part directly to avoid timezone issues
    const date = new Date(dateValue);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    ogcApprovalToShareDate: getDateValue("OGC Approval to Share with SMEs"),
    draftApprovalPackageToPrepDate: getDateValue("Draft Approval Package to Prep"),
    ddmeApprovalReceivedDate: getDateValue("DDME Approval Received"),
    stateConcurrenceDate: getDateValue("State Concurrence"),
    bnPmtApprovalReceivedDate: getDateValue("BN PMT Approval to Send to OMB"),
    draftApprovalPackageSharedDate: getDateValue("Draft Approval Package Shared"),
    receiveOMBConcurrenceDate: getDateValue("Receive OMB Concurrence"),
    receiveOGCLegalClearanceDate: getDateValue("Receive OGC Legal Clearance"),
    poOGDNotes: "",
    ogcOMBNotes: "",
  };
}

export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((p) => p.phaseName === "Review");
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
  const [originalFormData] = useState<ReviewPhaseFormData>(formData);
  const [isStep1Expanded, setIsStep1Expanded] = useState(true);
  const [isStep2Expanded, setIsStep2Expanded] = useState(true);

  const { setApplicationDate } = useSetApplicationDate();
  const { setPhaseStatus: completeReviewPhase } = useSetPhaseStatus({
    applicationId: demonstrationId,
    phaseName: "Review",
    phaseStatus: "Completed",
  });

  const isFormComplete = !!(
    reviewPhaseFormData.ogcApprovalToShareDate &&
    reviewPhaseFormData.draftApprovalPackageToPrepDate &&
    reviewPhaseFormData.ddmeApprovalReceivedDate &&
    reviewPhaseFormData.stateConcurrenceDate &&
    reviewPhaseFormData.bnPmtApprovalReceivedDate &&
    reviewPhaseFormData.draftApprovalPackageSharedDate &&
    reviewPhaseFormData.receiveOMBConcurrenceDate &&
    reviewPhaseFormData.receiveOGCLegalClearanceDate
  );

  const hasFormChanges = !!(
    reviewPhaseFormData.ogcApprovalToShareDate !== originalFormData.ogcApprovalToShareDate ||
    reviewPhaseFormData.draftApprovalPackageToPrepDate !==
      originalFormData.draftApprovalPackageToPrepDate ||
    reviewPhaseFormData.ddmeApprovalReceivedDate !== originalFormData.ddmeApprovalReceivedDate ||
    reviewPhaseFormData.stateConcurrenceDate !== originalFormData.stateConcurrenceDate ||
    reviewPhaseFormData.bnPmtApprovalReceivedDate !== originalFormData.bnPmtApprovalReceivedDate ||
    reviewPhaseFormData.draftApprovalPackageSharedDate !==
      originalFormData.draftApprovalPackageSharedDate ||
    reviewPhaseFormData.receiveOMBConcurrenceDate !== originalFormData.receiveOMBConcurrenceDate ||
    reviewPhaseFormData.receiveOGCLegalClearanceDate !==
      originalFormData.receiveOGCLegalClearanceDate ||
    reviewPhaseFormData.poOGDNotes !== originalFormData.poOGDNotes ||
    reviewPhaseFormData.ogcOMBNotes !== originalFormData.ogcOMBNotes
  );

  const saveFormData = async () => {
    const dateUpdates = [
      {
        dateType: "OGC Approval to Share with SMEs" as DateType,
        dateValue: reviewPhaseFormData.ogcApprovalToShareDate,
      },
      {
        dateType: "Draft Approval Package to Prep" as DateType,
        dateValue: reviewPhaseFormData.draftApprovalPackageToPrepDate,
      },
      {
        dateType: "DDME Approval Received" as DateType,
        dateValue: reviewPhaseFormData.ddmeApprovalReceivedDate,
      },
      {
        dateType: "State Concurrence" as DateType,
        dateValue: reviewPhaseFormData.stateConcurrenceDate,
      },
      {
        dateType: "BN PMT Approval to Send to OMB" as DateType,
        dateValue: reviewPhaseFormData.bnPmtApprovalReceivedDate,
      },
      {
        dateType: "Draft Approval Package Shared" as DateType,
        dateValue: reviewPhaseFormData.draftApprovalPackageSharedDate,
      },
      {
        dateType: "Receive OMB Concurrence" as DateType,
        dateValue: reviewPhaseFormData.receiveOMBConcurrenceDate,
      },
      {
        dateType: "Receive OGC Legal Clearance" as DateType,
        dateValue: reviewPhaseFormData.receiveOGCLegalClearanceDate,
      },
    ];

    for (const dateUpdate of dateUpdates) {
      if (dateUpdate.dateValue) {
        // Create date at noon UTC to avoid timezone issues when saving
        const [year, month, day] = dateUpdate.dateValue.split("-");
        const utcDate = new Date(
          Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0)
        );

        await setApplicationDate({
          applicationId: demonstrationId,
          dateType: dateUpdate.dateType,
          dateValue: formatDateForServer(utcDate),
        });
      }
    }
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

  return (
    <div>
      <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">REVIEW</h3>
      <p className="text-sm text-text-placeholder mb-1">
        Gather input and address comments from the HHS - Office of General Council (OGC) and the
        White House - Office of Management and Budget (OMB)
      </p>

      <section className="bg-white pt-2">
        <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
          <div className="col-span-4">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsStep1Expanded(!isStep1Expanded)}
            >
              <div>
                <h4 className="text-xl font-bold mb-1 text-black">STEP 1 - PO & OGD</h4>
                <p className="text-sm text-text-placeholder">
                  Record the Sign-Off for Internal Review
                </p>
              </div>
              {isStep1Expanded ? (
                <ChevronUpIcon className="h-2 w-2 text-brand" />
              ) : (
                <ChevronDownIcon className="h-2 w-2 text-brand" />
              )}
            </div>
          </div>

          {isStep1Expanded && (
            <>
              <div className="flex flex-col">
                <DatePicker
                  label="OGC Approval To Share with SMEs"
                  name="datepicker-ogc-approval-to-share-date"
                  value={reviewPhaseFormData.ogcApprovalToShareDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      ogcApprovalToShareDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="Draft Approval Package to Prep"
                  name="datepicker-draft-approval-package-to-prep-date"
                  value={reviewPhaseFormData.draftApprovalPackageToPrepDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      draftApprovalPackageToPrepDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="DDME Approval Received"
                  name="datepicker-ddme-approval-received-date"
                  value={reviewPhaseFormData.ddmeApprovalReceivedDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      ddmeApprovalReceivedDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="State Concurrence"
                  name="datepicker-state-concurrence-date"
                  value={reviewPhaseFormData.stateConcurrenceDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      stateConcurrenceDate: val,
                    })
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col">
                <label className="text-sm font-bold text-text-font mb-1">PO OGD Notes</label>
                <textarea
                  name="input-po-ogd-notes"
                  data-testid="input-po-ogd-notes"
                  placeholder="Enter notes..."
                  value={reviewPhaseFormData.poOGDNotes || ""}
                  onChange={(e) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      poOGDNotes: e.target.value,
                    })
                  }
                  className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={1}
                />
              </div>
            </>
          )}

          <div className="col-span-4 mt-1">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsStep2Expanded(!isStep2Expanded)}
            >
              <div>
                <h4 className="text-xl font-bold mb-1 text-black">STEP 2 - OGC & OMB</h4>
                <p className="text-sm text-text-placeholder">Record the OGC & OMB Review Process</p>
              </div>
              {isStep2Expanded ? (
                <ChevronUpIcon className="h-2 w-2 text-brand" />
              ) : (
                <ChevronDownIcon className="h-2 w-2 text-brand" />
              )}
            </div>
          </div>

          {isStep2Expanded && (
            <>
              <div className="flex flex-col">
                <DatePicker
                  label="BN PMT Approval Received"
                  name="datepicker-bn-pmt-approval-received-date"
                  value={reviewPhaseFormData.bnPmtApprovalReceivedDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      bnPmtApprovalReceivedDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="Draft Approval Package Shared"
                  name="datepicker-draft-approval-package-shared-date"
                  value={reviewPhaseFormData.draftApprovalPackageSharedDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      draftApprovalPackageSharedDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="Receive OMB Concurrence"
                  name="datepicker-receive-omb-concurrence-date"
                  value={reviewPhaseFormData.receiveOMBConcurrenceDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      receiveOMBConcurrenceDate: val,
                    })
                  }
                />
              </div>

              <div className="flex flex-col">
                <DatePicker
                  label="Receive OGC Legal Clearance"
                  name="datepicker-receive-ogc-legal-clearance-date"
                  value={reviewPhaseFormData.receiveOGCLegalClearanceDate}
                  isRequired
                  onChange={(val) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      receiveOGCLegalClearanceDate: val,
                    })
                  }
                />
              </div>

              <div className="col-span-2 flex flex-col">
                <label className="text-sm font-bold text-text-font mb-1">OGC OMB Notes</label>
                <textarea
                  name="input-ogc-omb-notes"
                  data-testid="input-ogc-omb-notes"
                  placeholder="Enter notes..."
                  value={reviewPhaseFormData.ogcOMBNotes || ""}
                  onChange={(e) =>
                    setReviewPhaseFormData({
                      ...reviewPhaseFormData,
                      ogcOMBNotes: e.target.value,
                    })
                  }
                  className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={1}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end mt-2 gap-2">
          <SecondaryButton
            onClick={handleSaveForLater}
            size="large"
            name="review-save-for-later"
            disabled={!hasFormChanges}
          >
            Save For Later
          </SecondaryButton>
          <Button
            onClick={handleFinish}
            size="large"
            name="review-finish"
            disabled={!isFormComplete}
          >
            Finish
          </Button>
        </div>
      </section>
    </div>
  );
};

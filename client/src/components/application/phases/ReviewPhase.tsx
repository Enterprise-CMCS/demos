import React, { useState } from "react";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { formatDateForServer } from "util/formatDate";
import { Button, SecondaryButton } from "components/button";

interface ReviewPhaseProps {
  formData: ReviewPhaseFormData;
}

interface ReviewPhaseFormData {
  ogcApprovalToShareDate?: string;
  draftApprovalPackageToPrepDate?: string;
  ddmeApprovalReceivedDate?: string;
  stateConcurrenceDate?: string;
  bnPmtApprovalReceivedDate?: string;
  draftApprovalPackageSharedDate?: string;
  receiveOMBConcurrenceDate?: string;
  receiveOGCLegalClearanceDate?: string;
  poOGDNotes?: string;
  ogcOMBNotes?: string;
}

function getFormDataFromPhase(reviewPhase: SimplePhase): ReviewPhaseFormData {
  const getDateValue = (dateType: string) => {
    const dateValue = reviewPhase.phaseDates.find(
      (d) => d.dateType === dateType
    )?.dateValue;
    return dateValue ? formatDateForServer(dateValue) : undefined;
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
    poOGDNotes: getDateValue("PO OGD Notes"),
    ogcOMBNotes: getDateValue("OGC OMB Notes"),
  };
}


export const getReviewPhaseComponentFromDemonstration = (
  demonstration: ApplicationWorkflowDemonstration
) => {
  const reviewPhase = demonstration.phases.find((p) => p.phaseName === "Review");
  if (!reviewPhase) return <div>Error: Review Phase not found.</div>;

  const reviewPhaseFormData = getFormDataFromPhase(reviewPhase);
  return <ReviewPhase formData={reviewPhaseFormData} />;
};

export const ReviewPhase = ({
  formData,
}: ReviewPhaseProps) => {
  const [reviewPhaseFormData, setReviewPhaseFormData] =
    useState<ReviewPhaseFormData>(formData);

  return <div>
    <h3 className="text-brand text-[22px] font-bold tracking-wide mb-1">REVIEW</h3>
    <p className="text-sm text-text-placeholder mb-1">
      Gather input and address comments from the HHS - Office of General Council (OGC) and the White House - Office of Management and Budget (OMB)
    </p>

    <section className="bg-white p-8">
      <div className="grid grid-cols-4 gap-10 text-sm text-text-placeholder">
        <div className="col-span-4">
          <h4 id="concept-verify-title" className="text-xl font-semibold mb-1">
            STEP 1 - PO & OGD
          </h4>
          <p className="text-sm text-text-placeholder">
            Record the Sign-Off for Internal Review
          </p>
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            OGC Approval To Share with SMEs
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-ogc-approval-to-share-date"
            value={reviewPhaseFormData.ogcApprovalToShareDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                ogcApprovalToShareDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Draft Approval Package to Prep
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-draft-approval-package-to-prep-date"
            value={reviewPhaseFormData.draftApprovalPackageToPrepDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                draftApprovalPackageToPrepDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            DDME Approval Received
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-ddme-approval-received-date"
            value={reviewPhaseFormData.ddmeApprovalReceivedDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                ddmeApprovalReceivedDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            State Concurrence
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-state-concurrence-date"
            value={reviewPhaseFormData.stateConcurrenceDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                stateConcurrenceDate: e.target.value,
              })
            }
          />
        </div>

        <div className="col-span-2 flex flex-col">
          <label className="font-bold mb-1">PO OGD Notes</label>
          <input
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="input-po-ogd-notes"
            value={reviewPhaseFormData.poOGDNotes || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                poOGDNotes: e.target.value,
              })
            }
          />
        </div>

        <div className="col-span-4 mt-1">
          <h4 id="concept-verify-title" className="text-xl font-semibold mb-1">
            STEP 2 - OGC & OMB
          </h4>
          <p className="text-sm text-text-placeholder">
            Record the OGC & OMB Review Process
          </p>
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            BN PMT Approval to Send to OMB
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-bn-pmt-approval-received-date"
            value={reviewPhaseFormData.bnPmtApprovalReceivedDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                bnPmtApprovalReceivedDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Draft Approval Package Shared
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-draft-approval-package-shared-date"
            value={reviewPhaseFormData.draftApprovalPackageSharedDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                draftApprovalPackageSharedDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Receive OMB Concurrence
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-receive-omb-concurrence-date"
            value={reviewPhaseFormData.receiveOMBConcurrenceDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                receiveOMBConcurrenceDate: e.target.value,
              })
            }
          />
        </div>

        <div className="flex flex-col">
          <label className="font-bold mb-1">
            <span className="text-text-warn mr-1">*</span>
            Receive OGC Legal Clearance
          </label>
          <input
            type="date"
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="datepicker-receive-ogc-legal-clearance-date"
            value={reviewPhaseFormData.receiveOGCLegalClearanceDate || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                receiveOGCLegalClearanceDate: e.target.value,
              })
            }
          />
        </div>

        <div className="col-span-2 flex flex-col">
          <label className="font-bold mb-1">OGC OMB Notes</label>
          <input
            className="border border-border-fields px-1 py-1 rounded"
            data-testid="input-ogc-omb-notes"
            value={reviewPhaseFormData.ogcOMBNotes || ""}
            onChange={(e) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                ogcOMBNotes: e.target.value,
              })
            }
          />
        </div>
      </div>

      <div className="flex justify-end mt-2 gap-2">
        <SecondaryButton onClick={() => {}} size="large" name="review-save-for-later">
          Save For Later
        </SecondaryButton>
        <Button
          onClick={() => {}}
          size="large"
          name="review-finish"
          disabled={false}
        >
          Finish
        </Button>
      </div>
    </section>
  </div>;
};

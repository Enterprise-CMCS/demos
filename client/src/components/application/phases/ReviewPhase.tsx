import React, { useState } from "react";
import { ApplicationWorkflowDemonstration, SimplePhase } from "../ApplicationWorkflow";
import { formatDateForServer } from "util/formatDate";
import { Button, SecondaryButton } from "components/button";
import { DatePicker } from "components/input/date/DatePicker";
import { TextInput } from "components/input";

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
  poOGDNotes?: string; // Placeholder Value
  ogcOMBNotes?: string;  // Placeholder Value
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
          <DatePicker
            label="OGC Approval To Share with SMEs"
            id="datepicker-ogc-approval-to-share-date"
            name="datepicker-ogc-approval-to-share-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.ogcApprovalToShareDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-draft-approval-package-to-prep-date"
            name="datepicker-draft-approval-package-to-prep-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.draftApprovalPackageToPrepDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-ddme-approval-received-date"
            name="datepicker-ddme-approval-received-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.ddmeApprovalReceivedDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-state-concurrence-date"
            name="datepicker-state-concurrence-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.stateConcurrenceDate || ""}
            required
            onValueChange={(val) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                stateConcurrenceDate: val,
              })
            }
          />
        </div>

        <div className="col-span-2 flex flex-col">
          <TextInput
            name="input-po-ogd-notes"
            label="PO OGD Notes"
            placeholder="Enter"
            value={reviewPhaseFormData.poOGDNotes}
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
          <DatePicker
            label="BN PMT Approval Received"
            id="datepicker-bn-pmt-approval-received-date"
            name="datepicker-bn-pmt-approval-received-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.bnPmtApprovalReceivedDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-draft-approval-package-shared-date"
            name="datepicker-draft-approval-package-shared-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.draftApprovalPackageSharedDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-receive-omb-concurrence-date"
            name="datepicker-receive-omb-concurrence-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.receiveOMBConcurrenceDate || ""}
            required
            onValueChange={(val) =>
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
            id="datepicker-receive-ogc-legal-clearance-date"
            name="datepicker-receive-ogc-legal-clearance-date"
            placeholder="mm/dd/yyyy"
            value={reviewPhaseFormData.receiveOGCLegalClearanceDate || ""}
            required
            onValueChange={(val) =>
              setReviewPhaseFormData({
                ...reviewPhaseFormData,
                receiveOGCLegalClearanceDate: val,
              })
            }
          />
        </div>

        <div className="col-span-2 flex flex-col">
          <TextInput
            name="input-ogc-omb-notes"
            label="OGC OMB Notes"
            placeholder="Enter"
            value={reviewPhaseFormData.ogcOMBNotes}
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

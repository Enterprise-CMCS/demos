import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type OmbAndOgcSectionFields = Pick<
  ReviewPhaseFormData,
  | "bnPmtApprovalReceivedDate"
  | "draftApprovalPackageSharedDate"
  | "receiveOMBConcurrenceDate"
  | "receiveOGCLegalClearanceDate"
  | "ogcOMBNotes"
>;

export const OmbAndOgcSectionFields = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  setPhaseComplete,
}: {
  reviewPhaseFormData: OmbAndOgcSectionFields;
  setReviewPhaseFormData: (data: OmbAndOgcSectionFields) => void;
  setPhaseComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: OmbAndOgcSectionFields) => {
    setReviewPhaseFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.bnPmtApprovalReceivedDate &&
      reviewPhaseFormData.draftApprovalPackageSharedDate &&
      reviewPhaseFormData.receiveOMBConcurrenceDate &&
      reviewPhaseFormData.receiveOGCLegalClearanceDate;
    setPhaseComplete(!!isComplete);
  };
  return (
    <>
      <p className="text-sm text-text-placeholder">Record the OGC & OMB Review Process</p>
      <div className="flex flex-col">
        <DatePicker
          label="BN PMT Approval to Send to OMB"
          name="datepicker-bn-pmt-approval-received-date"
          value={reviewPhaseFormData.bnPmtApprovalReceivedDate}
          isRequired
          onChange={(val) =>
            handleChange({
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
            handleChange({
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
            handleChange({
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
            handleChange({
              ...reviewPhaseFormData,
              receiveOGCLegalClearanceDate: val,
            })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col">
        <label className="text-sm font-bold text-text-font mb-1">Notes</label>
        <textarea
          name="input-ogc-omb-notes"
          data-testid="input-ogc-omb-notes"
          placeholder="Enter notes..."
          value={reviewPhaseFormData.ogcOMBNotes || ""}
          onChange={(e) =>
            handleChange({
              ...reviewPhaseFormData,
              ogcOMBNotes: e.target.value,
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </>
  );
};

import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type PoAndOgdFields = Pick<
  ReviewPhaseFormData,
  | "ogcApprovalToShareDate"
  | "draftApprovalPackageToPrepDate"
  | "ddmeApprovalReceivedDate"
  | "stateConcurrenceDate"
  | "poOGDNotes"
>;

export const PoAndOgdSectionFields = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  setPhaseComplete,
}: {
  reviewPhaseFormData: PoAndOgdFields;
  setReviewPhaseFormData: (data: PoAndOgdFields) => void;
  setPhaseComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: PoAndOgdFields) => {
    setReviewPhaseFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.ogcApprovalToShareDate &&
      reviewPhaseFormData.draftApprovalPackageToPrepDate &&
      reviewPhaseFormData.ddmeApprovalReceivedDate &&
      reviewPhaseFormData.stateConcurrenceDate;

    setPhaseComplete(!!isComplete);
  };

  return (
    <>
      <p className="text-sm text-text-placeholder">Record the Sign-Off for Internal Review</p>
      <div className="flex flex-col">
        <DatePicker
          label="OGC Approval To Share with SMEs"
          name="datepicker-ogc-approval-to-share-date"
          value={reviewPhaseFormData.ogcApprovalToShareDate}
          isRequired
          onChange={(val) =>
            handleChange({
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
            handleChange({
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
            handleChange({
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
            handleChange({
              ...reviewPhaseFormData,
              stateConcurrenceDate: val,
            })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col">
        <label className="text-sm font-bold text-text-font mb-1">Notes</label>
        <textarea
          name="input-po-ogd-notes"
          data-testid="input-po-ogd-notes"
          placeholder="Enter notes..."
          value={reviewPhaseFormData.poOGDNotes || ""}
          onChange={(e) =>
            handleChange({
              ...reviewPhaseFormData,
              poOGDNotes: e.target.value,
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </>
  );
};

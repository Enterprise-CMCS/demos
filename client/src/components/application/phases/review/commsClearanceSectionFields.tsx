import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type CommsClearanceSectionFields = Pick<
  ReviewPhaseFormData,
  "packageSentForCommsClearanceDate" | "commsClearanceReceivedDate" | "commsClearanceNotes"
>;

export const CommsClearanceSectionFields = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  setPhaseComplete,
}: {
  reviewPhaseFormData: CommsClearanceSectionFields;
  setReviewPhaseFormData: (data: CommsClearanceSectionFields) => void;
  setPhaseComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: CommsClearanceSectionFields) => {
    setReviewPhaseFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.packageSentForCommsClearanceDate &&
      reviewPhaseFormData.commsClearanceReceivedDate;
    setPhaseComplete(!!isComplete);
  };

  return (
    <>
      <div className="flex flex-col">
        <DatePicker
          label="Package Sent for COMMs Clearance"
          name="datepicker-package-sent-for-comms-clearance-date"
          value={reviewPhaseFormData.packageSentForCommsClearanceDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              packageSentForCommsClearanceDate: val,
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="COMMs Clearance Received"
          name="datepicker-comms-clearance-received-date"
          value={reviewPhaseFormData.commsClearanceReceivedDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              commsClearanceReceivedDate: val,
            })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col">
        <label className="text-sm font-bold text-text-font mb-1">Notes</label>
        <textarea
          name="input-comms-clearance-notes"
          data-testid="input-comms-clearance-notes"
          placeholder="Enter notes..."
          value={reviewPhaseFormData.commsClearanceNotes || ""}
          onChange={(e) =>
            handleChange({
              ...reviewPhaseFormData,
              commsClearanceNotes: e.target.value,
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </>
  );
};

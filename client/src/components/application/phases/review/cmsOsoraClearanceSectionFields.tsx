import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type CmsOsoraClearanceSectionFields = Pick<
  ReviewPhaseFormData,
  | "submitApprovalPackageToOsoraDate"
  | "osoraR1CommentsDueDate"
  | "osoraR2CommentsDueDate"
  | "cmsOsoraClearanceEndDate"
  | "cmsOsoraNotes"
>;

export const CmsOsoraClearanceSectionFields = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  setPhaseComplete,
}: {
  reviewPhaseFormData: CmsOsoraClearanceSectionFields;
  setReviewPhaseFormData: (data: CmsOsoraClearanceSectionFields) => void;
  setPhaseComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: CmsOsoraClearanceSectionFields) => {
    setReviewPhaseFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.submitApprovalPackageToOsoraDate &&
      reviewPhaseFormData.osoraR1CommentsDueDate &&
      reviewPhaseFormData.osoraR2CommentsDueDate &&
      reviewPhaseFormData.cmsOsoraClearanceEndDate;
    setPhaseComplete(!!isComplete);
  };

  return (
    <>
      <div className="flex flex-col">
        <DatePicker
          label="Submit Approval Package to OSORA"
          name="datepicker-submit-approval-package-to-osora"
          value={reviewPhaseFormData.submitApprovalPackageToOsoraDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              submitApprovalPackageToOsoraDate: val,
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="OSORA R1 Comments Due"
          name="datepicker-osora-r1-comments-due-date"
          value={reviewPhaseFormData.osoraR1CommentsDueDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              osoraR1CommentsDueDate: val,
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="OSORA R2 Comments Due"
          name="datepicker-osora-r2-comments-due-date"
          value={reviewPhaseFormData.osoraR2CommentsDueDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              osoraR2CommentsDueDate: val,
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="CMS (OSORA) Clearance End"
          name="datepicker-cms-osora-clearance-end-date"
          value={reviewPhaseFormData.cmsOsoraClearanceEndDate}
          isRequired
          onChange={(val) =>
            handleChange({
              ...reviewPhaseFormData,
              cmsOsoraClearanceEndDate: val,
            })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col">
        <label className="text-sm font-bold text-text-font mb-1">Notes</label>
        <textarea
          name="input-cms-osora-notes"
          data-testid="input-cms-osora-notes"
          placeholder="Enter notes..."
          value={reviewPhaseFormData.cmsOsoraNotes || ""}
          onChange={(e) =>
            handleChange({
              ...reviewPhaseFormData,
              cmsOsoraNotes: e.target.value,
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </>
  );
};

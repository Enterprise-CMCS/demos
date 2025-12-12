import React from "react";
import { ChevronUpIcon, ChevronDownIcon } from "components/icons";
import { DatePicker } from "components/input/date/DatePicker";
import { ReviewPhaseFormData } from "./reviewFunctions";

interface StepOneProps {
  reviewPhaseFormData: ReviewPhaseFormData;
  setReviewPhaseFormData: (data: ReviewPhaseFormData) => void;
  isStep1Expanded: boolean;
  setIsStep1Expanded: (expanded: boolean) => void;
}

export const StepOne: React.FC<StepOneProps> = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  isStep1Expanded,
  setIsStep1Expanded,
}) => {
  return (
    <>
      <div className="col-span-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsStep1Expanded(!isStep1Expanded)}
        >
          <div>
            <h4 className="text-xl font-bold mb-1 text-black">STEP 1 - PO & OGD</h4>
            <p className="text-sm text-text-placeholder">Record the Sign-Off for Internal Review</p>
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
            <label className="text-sm font-bold text-text-font mb-1">Notes</label>
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
    </>
  );
};

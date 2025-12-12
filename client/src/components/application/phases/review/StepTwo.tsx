import React from "react";
import { ChevronUpIcon, ChevronDownIcon } from "components/icons";
import { DatePicker } from "components/input/date/DatePicker";
import { ReviewPhaseFormData } from "./reviewFunctions";

interface StepTwoProps {
  reviewPhaseFormData: ReviewPhaseFormData;
  setReviewPhaseFormData: (data: ReviewPhaseFormData) => void;
  isStep2Expanded: boolean;
  setIsStep2Expanded: (expanded: boolean) => void;
}

export const StepTwo: React.FC<StepTwoProps> = ({
  reviewPhaseFormData,
  setReviewPhaseFormData,
  isStep2Expanded,
  setIsStep2Expanded,
}) => {
  return (
    <>
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
              label="BN PMT Approval to Send to OMB"
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
            <label className="text-sm font-bold text-text-font mb-1">Notes</label>
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
    </>
  );
};

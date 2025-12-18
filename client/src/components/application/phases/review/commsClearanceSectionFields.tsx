import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type CommsClearanceSectionFields = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    "Package Sent to COMMs Clearance" | "COMMs Clearance Received"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "COMMs Clearance Notes">;
};

export const CommsClearanceSectionFields = ({
  commsClearanceSectionFormData,
  setCommsClearanceSectionFormData,
  setCommsClearanceSectionComplete,
}: {
  commsClearanceSectionFormData: CommsClearanceSectionFields;
  setCommsClearanceSectionFormData: (data: CommsClearanceSectionFields) => void;
  setCommsClearanceSectionComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: CommsClearanceSectionFields) => {
    setCommsClearanceSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["Package Sent to COMMs Clearance"] &&
      reviewPhaseFormData.dates["COMMs Clearance Received"];
    setCommsClearanceSectionComplete(!!isComplete);
  };

  return (
    <>
      <div className="flex flex-col">
        <DatePicker
          label="Package Sent for COMMs Clearance"
          name="datepicker-package-sent-for-comms-clearance-date"
          value={commsClearanceSectionFormData.dates["Package Sent to COMMs Clearance"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...commsClearanceSectionFormData,
              dates: {
                ...commsClearanceSectionFormData.dates,
                "Package Sent to COMMs Clearance": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="COMMs Clearance Received"
          name="datepicker-comms-clearance-received-date"
          value={commsClearanceSectionFormData.dates["COMMs Clearance Received"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...commsClearanceSectionFormData,
              dates: {
                ...commsClearanceSectionFormData.dates,
                "COMMs Clearance Received": val,
              },
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
          value={commsClearanceSectionFormData.notes["COMMs Clearance Notes"] || ""}
          onChange={(e) =>
            handleChange({
              ...commsClearanceSectionFormData,
              notes: {
                ...commsClearanceSectionFormData.notes,
                "COMMs Clearance Notes": e.target.value,
              },
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </>
  );
};

import React from "react";
import { ReviewPhaseFormData } from "../../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type CommsClearanceSectionFormData = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    "Package Sent to COMMs Clearance" | "COMMs Clearance Received"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "COMMs Clearance">;
};

export const CommsClearanceSection = ({
  sectionFormData,
  setSectionFormData,
  sectionIsComplete,
  setSectionIsComplete,
  sectionIsExpanded,
  setSectionIsExpanded,
}: {
  sectionFormData: CommsClearanceSectionFormData;
  setSectionFormData: (data: CommsClearanceSectionFormData) => void;
  sectionIsComplete: boolean;
  setSectionIsComplete: (isComplete: boolean) => void;
  sectionIsExpanded: boolean;
  setSectionIsExpanded: (isExpanded: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: CommsClearanceSectionFormData) => {
    setSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["Package Sent to COMMs Clearance"] &&
      reviewPhaseFormData.dates["COMMs Clearance Received"];
    setSectionIsComplete(!!isComplete);
  };

  return (
    <CompletableSection
      title="Comms Clearance"
      isComplete={sectionIsComplete}
      isExpanded={sectionIsExpanded}
      setIsExpanded={setSectionIsExpanded}
    >
      <div className="flex flex-col">
        <DatePicker
          label="Package Sent for COMMs Clearance"
          name="datepicker-package-sent-for-comms-clearance-date"
          value={sectionFormData.dates["Package Sent to COMMs Clearance"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
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
          value={sectionFormData.dates["COMMs Clearance Received"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
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
          value={sectionFormData.notes["COMMs Clearance"] || ""}
          onChange={(e) =>
            handleChange({
              ...sectionFormData,
              notes: {
                ...sectionFormData.notes,
                "COMMs Clearance": e.target.value,
              },
            })
          }
          className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={1}
        />
      </div>
    </CompletableSection>
  );
};

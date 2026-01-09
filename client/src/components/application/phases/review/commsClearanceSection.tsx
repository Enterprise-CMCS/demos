import React from "react";
import { COMMS_CLEARANCE_DATE_TYPES, ReviewPhaseFormData } from "./ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type CommsClearanceSectionFormData = {
  dates: Pick<ReviewPhaseFormData["dates"], (typeof COMMS_CLEARANCE_DATE_TYPES)[number]>;
  notes: Pick<ReviewPhaseFormData["notes"], "COMMs Clearance">;
};

export const CommsClearanceSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isReadonly,
}: {
  sectionFormData: CommsClearanceSectionFormData;
  setSectionFormData: (data: CommsClearanceSectionFormData) => void;
  isComplete: boolean;
  isReadonly: boolean;
}) => {
  return (
    <CompletableSection title="Comms Clearance" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        OCD Signature and COMMs Clearance are minimal requirements for Demonstrations and
        Amendments.
      </p>
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <DatePicker
            label="Package Sent for COMMs Clearance"
            name="datepicker-package-sent-for-comms-clearance-date"
            value={sectionFormData.dates["Package Sent for COMMs Clearance"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "Package Sent for COMMs Clearance": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="COMMs Clearance Received"
            name="datepicker-comms-clearance-received-date"
            value={sectionFormData.dates["COMMs Clearance Received"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "COMMs Clearance Received": val,
                },
              })
            }
            isDisabled={isReadonly}
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
              setSectionFormData({
                ...sectionFormData,
                notes: {
                  ...sectionFormData.notes,
                  "COMMs Clearance": e.target.value,
                },
              })
            }
            className="border rounded p-1 min-h-[40px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isReadonly}
          />
        </div>
      </div>
    </CompletableSection>
  );
};

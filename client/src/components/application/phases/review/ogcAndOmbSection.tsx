import React from "react";
import { OGC_AND_OMB_DATE_TYPES, ReviewPhaseFormData } from "./ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type OmbAndOgcSectionFormData = {
  dates: Pick<ReviewPhaseFormData["dates"], (typeof OGC_AND_OMB_DATE_TYPES)[number]>;
  notes: Pick<ReviewPhaseFormData["notes"], "OGC and OMB">;
};

export const OgcAndOmbSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isReadonly,
}: {
  sectionFormData: OmbAndOgcSectionFormData;
  setSectionFormData: (data: OmbAndOgcSectionFormData) => void;
  isComplete: boolean;
  isReadonly: boolean;
}) => {
  return (
    <CompletableSection title="OGC & OMB" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        Record the OGC & OMB Review Process.
      </p>
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <DatePicker
            label="BN PMT Approval to Send to OMB"
            name="datepicker-bn-pmt-approval-received-date"
            value={sectionFormData.dates["BN PMT Approval to Send to OMB"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "BN PMT Approval to Send to OMB": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="Draft Approval Package Shared"
            name="datepicker-draft-approval-package-shared-date"
            value={sectionFormData.dates["Draft Approval Package Shared"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "Draft Approval Package Shared": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="Receive OMB Concurrence"
            name="datepicker-receive-omb-concurrence-date"
            value={sectionFormData.dates["Receive OMB Concurrence"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "Receive OMB Concurrence": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="Receive OGC Legal Clearance"
            name="datepicker-receive-ogc-legal-clearance-date"
            value={sectionFormData.dates["Receive OGC Legal Clearance"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "Receive OGC Legal Clearance": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="col-span-2 flex flex-col">
          <label className="text-sm font-bold text-text-font mb-1">Notes</label>
          <textarea
            name="input-ogc-omb-notes"
            data-testid="input-ogc-omb-notes"
            placeholder="Enter notes..."
            value={sectionFormData.notes["OGC and OMB"] || ""}
            onChange={(e) =>
              setSectionFormData({
                ...sectionFormData,
                notes: {
                  ...sectionFormData.notes,
                  "OGC and OMB": e.target.value,
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

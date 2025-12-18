import React from "react";
import { ReviewPhaseFormData } from "../../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type OmbAndOgcSectionFormData = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    | "BN PMT Approval to Send to OMB"
    | "Draft Approval Package Shared"
    | "Receive OMB Concurrence"
    | "Receive OGC Legal Clearance"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "OGC and OMB">;
};

export const OmbAndOgcSection = ({
  sectionFormData,
  setSectionFormData,
  sectionIsComplete,
  setSectionIsComplete,
  sectionIsExpanded,
  setSectionIsExpanded,
}: {
  sectionFormData: OmbAndOgcSectionFormData;
  setSectionFormData: (data: OmbAndOgcSectionFormData) => void;
  sectionIsComplete: boolean;
  setSectionIsComplete: (isComplete: boolean) => void;
  sectionIsExpanded: boolean;
  setSectionIsExpanded: (isExpanded: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: OmbAndOgcSectionFormData) => {
    setSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["BN PMT Approval to Send to OMB"] &&
      reviewPhaseFormData.dates["Draft Approval Package Shared"] &&
      reviewPhaseFormData.dates["Receive OMB Concurrence"] &&
      reviewPhaseFormData.dates["Receive OGC Legal Clearance"];
    setSectionIsComplete(!!isComplete);
  };
  return (
    <CompletableSection
      title="OGC & OMB"
      isComplete={sectionIsComplete}
      isExpanded={sectionIsExpanded}
      setIsExpanded={setSectionIsExpanded}
    >
      <p className="text-sm text-text-placeholder">Record the OGC & OMB Review Process</p>
      <div className="flex flex-col">
        <DatePicker
          label="BN PMT Approval to Send to OMB"
          name="datepicker-bn-pmt-approval-received-date"
          value={sectionFormData.dates["BN PMT Approval to Send to OMB"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "BN PMT Approval to Send to OMB": val,
              },
            })
          }
        />
      </div>
      <div className="flex flex-col">
        <DatePicker
          label="Draft Approval Package Shared"
          name="datepicker-draft-approval-package-shared-date"
          value={sectionFormData.dates["Draft Approval Package Shared"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "Draft Approval Package Shared": val,
              },
            })
          }
        />
      </div>
      <div className="flex flex-col">
        <DatePicker
          label="Receive OMB Concurrence"
          name="datepicker-receive-omb-concurrence-date"
          value={sectionFormData.dates["Receive OMB Concurrence"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "Receive OMB Concurrence": val,
              },
            })
          }
        />
      </div>
      <div className="flex flex-col">
        <DatePicker
          label="Receive OGC Legal Clearance"
          name="datepicker-receive-ogc-legal-clearance-date"
          value={sectionFormData.dates["Receive OGC Legal Clearance"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "Receive OGC Legal Clearance": val,
              },
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
          value={sectionFormData.notes["OGC and OMB"] || ""}
          onChange={(e) =>
            handleChange({
              ...sectionFormData,
              notes: {
                ...sectionFormData.notes,
                "OGC and OMB": e.target.value,
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

import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type OmbAndOgcSectionFields = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    | "BN PMT Approval to Send to OMB"
    | "Draft Approval Package Shared"
    | "Receive OMB Concurrence"
    | "Receive OGC Legal Clearance"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "OGC OMB Notes">;
};

export const OmbAndOgcSectionFields = ({
  ombAndOgcSectionFormData,
  setOmbAndOgcSectionFormData,
  setOmbAndOgcSectionComplete,
}: {
  ombAndOgcSectionFormData: OmbAndOgcSectionFields;
  setOmbAndOgcSectionFormData: (data: OmbAndOgcSectionFields) => void;
  setOmbAndOgcSectionComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: OmbAndOgcSectionFields) => {
    setOmbAndOgcSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["BN PMT Approval to Send to OMB"] &&
      reviewPhaseFormData.dates["Draft Approval Package Shared"] &&
      reviewPhaseFormData.dates["Receive OMB Concurrence"] &&
      reviewPhaseFormData.dates["Receive OGC Legal Clearance"];
    setOmbAndOgcSectionComplete(!!isComplete);
  };
  return (
    <>
      <p className="text-sm text-text-placeholder">Record the OGC & OMB Review Process</p>
      <div className="flex flex-col">
        <DatePicker
          label="BN PMT Approval to Send to OMB"
          name="datepicker-bn-pmt-approval-received-date"
          value={ombAndOgcSectionFormData.dates["BN PMT Approval to Send to OMB"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...ombAndOgcSectionFormData,
              dates: {
                ...ombAndOgcSectionFormData.dates,
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
          value={ombAndOgcSectionFormData.dates["Draft Approval Package Shared"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...ombAndOgcSectionFormData,
              dates: {
                ...ombAndOgcSectionFormData.dates,
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
          value={ombAndOgcSectionFormData.dates["Receive OMB Concurrence"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...ombAndOgcSectionFormData,
              dates: {
                ...ombAndOgcSectionFormData.dates,
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
          value={ombAndOgcSectionFormData.dates["Receive OGC Legal Clearance"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...ombAndOgcSectionFormData,
              dates: {
                ...ombAndOgcSectionFormData.dates,
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
          value={ombAndOgcSectionFormData.notes["OGC OMB Notes"] || ""}
          onChange={(e) =>
            handleChange({
              ...ombAndOgcSectionFormData,
              notes: {
                ...ombAndOgcSectionFormData.notes,
                "OGC OMB Notes": e.target.value,
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

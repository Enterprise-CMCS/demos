import React from "react";
import { ReviewPhaseFormData } from "../../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type PoAndOgdFormData = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    | "OGD Approval to Share with SMEs"
    | "Draft Approval Package to Prep"
    | "DDME Approval Received"
    | "State Concurrence"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "PO and OGD">;
};

export const PoAndOgdSection = ({
  sectionFormData,
  setSectionFormData,
  sectionIsComplete,
  setSectionIsComplete,
  sectionIsExpanded,
  setSectionIsExpanded,
}: {
  sectionFormData: PoAndOgdFormData;
  setSectionFormData: (data: PoAndOgdFormData) => void;
  sectionIsComplete: boolean;
  setSectionIsComplete: (isComplete: boolean) => void;
  sectionIsExpanded: boolean;
  setSectionIsExpanded: (isExpanded: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: PoAndOgdFormData) => {
    setSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["OGD Approval to Share with SMEs"] &&
      reviewPhaseFormData.dates["Draft Approval Package to Prep"] &&
      reviewPhaseFormData.dates["DDME Approval Received"] &&
      reviewPhaseFormData.dates["State Concurrence"];

    setSectionIsComplete(!!isComplete);
  };

  return (
    <CompletableSection
      title="PO & OGD"
      isComplete={sectionIsComplete}
      isExpanded={sectionIsExpanded}
      setIsExpanded={setSectionIsExpanded}
    >
      <p className="text-sm text-text-placeholder">Record the Sign-Off for Internal Review</p>
      <div className="flex flex-col">
        <DatePicker
          label="OGD Approval To Share with SMEs"
          name="datepicker-ogc-approval-to-share-date"
          value={sectionFormData.dates["OGD Approval to Share with SMEs"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "OGD Approval to Share with SMEs": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="Draft Approval Package to Prep"
          name="datepicker-draft-approval-package-to-prep-date"
          value={sectionFormData.dates["Draft Approval Package to Prep"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "Draft Approval Package to Prep": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="DDME Approval Received"
          name="datepicker-ddme-approval-received-date"
          value={sectionFormData.dates["DDME Approval Received"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "DDME Approval Received": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="State Concurrence"
          name="datepicker-state-concurrence-date"
          value={sectionFormData.dates["State Concurrence"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...sectionFormData,
              dates: {
                ...sectionFormData.dates,
                "State Concurrence": val,
              },
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
          value={sectionFormData.notes["PO and OGD"] || ""}
          onChange={(e) =>
            handleChange({
              ...sectionFormData,
              notes: {
                ...sectionFormData.notes,
                "PO and OGD": e.target.value,
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

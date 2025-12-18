import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type PoAndOgdFields = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    | "OGD Approval to Share with SMEs"
    | "Draft Approval Package to Prep"
    | "DDME Approval Received"
    | "State Concurrence"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "PO OGD Notes">;
};

export const PoAndOgdSectionFields = ({
  poAndOgdSectionFormData,
  setPoAndOgdSectionFormData,
  setPoAndOgdSectionComplete,
}: {
  poAndOgdSectionFormData: PoAndOgdFields;
  setPoAndOgdSectionFormData: (data: PoAndOgdFields) => void;
  setPoAndOgdSectionComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: PoAndOgdFields) => {
    setPoAndOgdSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["OGD Approval to Share with SMEs"] &&
      reviewPhaseFormData.dates["Draft Approval Package to Prep"] &&
      reviewPhaseFormData.dates["DDME Approval Received"] &&
      reviewPhaseFormData.dates["State Concurrence"];

    setPoAndOgdSectionComplete(!!isComplete);
  };

  return (
    <>
      <p className="text-sm text-text-placeholder">Record the Sign-Off for Internal Review</p>
      <div className="flex flex-col">
        <DatePicker
          label="OGD Approval To Share with SMEs"
          name="datepicker-ogc-approval-to-share-date"
          value={poAndOgdSectionFormData.dates["OGD Approval to Share with SMEs"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...poAndOgdSectionFormData,
              dates: {
                ...poAndOgdSectionFormData.dates,
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
          value={poAndOgdSectionFormData.dates["Draft Approval Package to Prep"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...poAndOgdSectionFormData,
              dates: {
                ...poAndOgdSectionFormData.dates,
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
          value={poAndOgdSectionFormData.dates["DDME Approval Received"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...poAndOgdSectionFormData,
              dates: {
                ...poAndOgdSectionFormData.dates,
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
          value={poAndOgdSectionFormData.dates["State Concurrence"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...poAndOgdSectionFormData,
              dates: {
                ...poAndOgdSectionFormData.dates,
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
          value={poAndOgdSectionFormData.notes["PO OGD Notes"] || ""}
          onChange={(e) =>
            handleChange({
              ...poAndOgdSectionFormData,
              notes: {
                ...poAndOgdSectionFormData.notes,
                "PO OGD Notes": e.target.value,
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

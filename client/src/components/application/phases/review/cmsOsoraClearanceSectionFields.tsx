import React from "react";
import { ReviewPhaseFormData } from "../ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";

type CmsOsoraClearanceSectionFields = {
  dates: Pick<
    ReviewPhaseFormData["dates"],
    | "Submit Approval Package to OSORA"
    | "OSORA R1 Comments Due"
    | "OSORA R2 Comments Due"
    | "CMS (OSORA) Clearance End"
  >;
  notes: Pick<ReviewPhaseFormData["notes"], "CMS (OSORA) Clearance">;
};

export const CmsOsoraClearanceSectionFields = ({
  cmsOsoraClearanceSectionFormData,
  setCmsOsoraClearanceSectionFormData,
  setCmsOsoraClearanceSectionComplete,
}: {
  cmsOsoraClearanceSectionFormData: CmsOsoraClearanceSectionFields;
  setCmsOsoraClearanceSectionFormData: (data: CmsOsoraClearanceSectionFields) => void;
  setCmsOsoraClearanceSectionComplete: (isComplete: boolean) => void;
}) => {
  const handleChange = (reviewPhaseFormData: CmsOsoraClearanceSectionFields) => {
    setCmsOsoraClearanceSectionFormData(reviewPhaseFormData);
    const isComplete =
      reviewPhaseFormData.dates["Submit Approval Package to OSORA"] &&
      reviewPhaseFormData.dates["OSORA R1 Comments Due"] &&
      reviewPhaseFormData.dates["OSORA R2 Comments Due"] &&
      reviewPhaseFormData.dates["CMS (OSORA) Clearance End"];
    setCmsOsoraClearanceSectionComplete(!!isComplete);
  };

  return (
    <>
      <div className="flex flex-col">
        <DatePicker
          label="Submit Approval Package to OSORA"
          name="datepicker-submit-approval-package-to-osora"
          value={cmsOsoraClearanceSectionFormData.dates["Submit Approval Package to OSORA"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...cmsOsoraClearanceSectionFormData,
              dates: {
                ...cmsOsoraClearanceSectionFormData.dates,
                "Submit Approval Package to OSORA": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="OSORA R1 Comments Due"
          name="datepicker-osora-r1-comments-due-date"
          value={cmsOsoraClearanceSectionFormData.dates["OSORA R1 Comments Due"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...cmsOsoraClearanceSectionFormData,
              dates: {
                ...cmsOsoraClearanceSectionFormData.dates,
                "OSORA R1 Comments Due": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="OSORA R2 Comments Due"
          name="datepicker-osora-r2-comments-due-date"
          value={cmsOsoraClearanceSectionFormData.dates["OSORA R2 Comments Due"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...cmsOsoraClearanceSectionFormData,
              dates: {
                ...cmsOsoraClearanceSectionFormData.dates,
                "OSORA R2 Comments Due": val,
              },
            })
          }
        />
      </div>

      <div className="flex flex-col">
        <DatePicker
          label="CMS (OSORA) Clearance End"
          name="datepicker-cms-osora-clearance-end-date"
          value={cmsOsoraClearanceSectionFormData.dates["CMS (OSORA) Clearance End"]}
          isRequired
          onChange={(val) =>
            handleChange({
              ...cmsOsoraClearanceSectionFormData,
              dates: {
                ...cmsOsoraClearanceSectionFormData.dates,
                "CMS (OSORA) Clearance End": val,
              },
            })
          }
        />
      </div>

      <div className="col-span-2 flex flex-col">
        <label className="text-sm font-bold text-text-font mb-1">Notes</label>
        <textarea
          name="input-cms-osora-notes"
          data-testid="input-cms-osora-notes"
          placeholder="Enter notes..."
          value={cmsOsoraClearanceSectionFormData.notes["CMS (OSORA) Clearance"] || ""}
          onChange={(e) =>
            handleChange({
              ...cmsOsoraClearanceSectionFormData,
              notes: {
                ...cmsOsoraClearanceSectionFormData.notes,
                "CMS (OSORA) Clearance": e.target.value,
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

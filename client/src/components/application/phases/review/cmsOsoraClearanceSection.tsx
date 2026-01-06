import React from "react";
import { ReviewPhaseFormData } from "./ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";
import { CMS_OSORA_DATE_TYPES } from "demos-server-constants";

type CmsOsoraClearanceSectionFormData = {
  dates: Pick<ReviewPhaseFormData["dates"], (typeof CMS_OSORA_DATE_TYPES)[number]>;
  notes: Pick<ReviewPhaseFormData["notes"], "CMS (OSORA) Clearance">;
};

export const CmsOsoraClearanceSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isReadonly,
}: {
  sectionFormData: CmsOsoraClearanceSectionFormData;
  setSectionFormData: (data: CmsOsoraClearanceSectionFormData) => void;
  isComplete: boolean;
  isReadonly: boolean;
}) => {
  return (
    <CompletableSection title="CMS (OSORA) Clearance" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        Demonstrations with the highest Scruteny require a signature from the Office of the
        Administrator for full federal clearance through OSORA.
      </p>
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <DatePicker
            label="Submit Approval Package to OSORA"
            name="datepicker-submit-approval-package-to-osora"
            value={sectionFormData.dates["Submit Approval Package to OSORA"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "Submit Approval Package to OSORA": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="OSORA R1 Comments Due"
            name="datepicker-osora-r1-comments-due-date"
            value={sectionFormData.dates["OSORA R1 Comments Due"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "OSORA R1 Comments Due": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="OSORA R2 Comments Due"
            name="datepicker-osora-r2-comments-due-date"
            value={sectionFormData.dates["OSORA R2 Comments Due"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "OSORA R2 Comments Due": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="flex flex-col">
          <DatePicker
            label="CMS (OSORA) Clearance End"
            name="datepicker-cms-osora-clearance-end-date"
            value={sectionFormData.dates["CMS (OSORA) Clearance End"]}
            isRequired
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "CMS (OSORA) Clearance End": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
        <div className="col-span-2 flex flex-col">
          <label className="text-sm font-bold text-text-font mb-1">Notes</label>
          <textarea
            name="input-cms-osora-notes"
            data-testid="input-cms-osora-notes"
            placeholder="Enter notes..."
            value={sectionFormData.notes["CMS (OSORA) Clearance"] || ""}
            onChange={(e) =>
              setSectionFormData({
                ...sectionFormData,
                notes: {
                  ...sectionFormData.notes,
                  "CMS (OSORA) Clearance": e.target.value,
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

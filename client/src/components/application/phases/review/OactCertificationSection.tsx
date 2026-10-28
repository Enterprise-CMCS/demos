import React from "react";
import { ReviewPhaseFormData } from "./ReviewPhase";
import { DatePicker } from "components/input/date/DatePicker";
import { CompletableSection } from "layout/completableSection";

type OactCertificationSectionFormData = {
  dates: Pick<ReviewPhaseFormData["dates"], "OACT Certification Date">;
};

export const OactCertificationSection = ({
  sectionFormData,
  setSectionFormData,
  isComplete,
  isRequired,
  isReadonly,
}: {
  sectionFormData: OactCertificationSectionFormData;
  setSectionFormData: (data: OactCertificationSectionFormData) => void;
  isComplete: boolean;
  isRequired: boolean;
  isReadonly: boolean;
}) => {
  return (
    <CompletableSection title="OACT Certification" isComplete={isComplete}>
      <p className="text-sm text-text-placeholder mt-1 mb-2">
        Record OACT Certification for applications approved 1/1/2027 or later.
      </p>
      <div className="grid grid-cols-4 gap-8 text-sm text-text-placeholder">
        <div className="flex flex-col">
          <DatePicker
            label="OACT Certification Date"
            name="datepicker-oact-certification-date"
            value={sectionFormData.dates["OACT Certification Date"]}
            isRequired={isRequired}
            onChange={(val) =>
              setSectionFormData({
                ...sectionFormData,
                dates: {
                  ...sectionFormData.dates,
                  "OACT Certification Date": val,
                },
              })
            }
            isDisabled={isReadonly}
          />
        </div>
      </div>
    </CompletableSection>
  );
};

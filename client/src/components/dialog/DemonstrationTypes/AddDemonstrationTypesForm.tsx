import React from "react";
import { DemonstrationType } from "./ApplyDemonstrationTypesDialog";
import { DatePicker } from "components/input/date/DatePicker";
import { SecondaryButton } from "components/button";
import { SelectDemonstrationTypeTag } from "components/input/select/SelectTag/SelectDemonstrationTypeTag";

const isValid = (formData: DemonstrationType) => {
  return formData.tag && formData.effectiveDate && formData.expirationDate;
};

export const AddDemonstrationTypesForm = ({
  existingTags,
  addDemonstrationType,
}: {
  existingTags: string[];
  addDemonstrationType: (demonstrationType: DemonstrationType) => void;
}) => {
  const [formData, setFormData] = React.useState<DemonstrationType>({
    tag: "",
    effectiveDate: "",
    expirationDate: "",
  });

  const handleAddType = () => {
    addDemonstrationType(formData);
    setFormData(
      (prev): DemonstrationType => ({
        ...prev,
        tag: "",
      })
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <SelectDemonstrationTypeTag
            filter={(tag) => !existingTags.includes(tag)}
            isRequired
            value={formData.tag}
            onSelect={(tag) => setFormData((prev): DemonstrationType => ({ ...prev, tag }))}
          />
        </div>
        <div className="flex-1 flex gap-2">
          <div className="flex-1">
            <DatePicker
              isRequired
              value={formData.effectiveDate}
              onChange={(date) =>
                setFormData((prev): DemonstrationType => ({ ...prev, effectiveDate: date }))
              }
              label="Effective Date"
              name="date-picker-effective-date"
            />
          </div>
          <div className="flex-1">
            <DatePicker
              isRequired
              value={formData.expirationDate}
              onChange={(date) =>
                setFormData((prev): DemonstrationType => ({ ...prev, expirationDate: date }))
              }
              label="Expiration Date"
              name="date-picker-expiration-date"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <SecondaryButton
          disabled={!isValid(formData)}
          name="button-add-demonstration-type"
          type="button"
          onClick={handleAddType}
        >
          + Add to List
        </SecondaryButton>
      </div>
    </div>
  );
};
